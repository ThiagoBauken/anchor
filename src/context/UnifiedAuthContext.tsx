'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser, loginUser, logoutUser, getCurrentUser } from '@/app/actions/auth'
import { offlineDB } from '@/lib/indexeddb'
import { syncManager } from '@/lib/sync-manager'
import type { User, Company } from '@/types'

/**
 * UnifiedAuthContext
 *
 * Consolidates all authentication functionality from:
 * - AuthContext.tsx (basic mock auth)
 * - DatabaseAuthContext.tsx (server actions with JWT)
 * - OfflineAuthContext.tsx (offline-first with IndexedDB)
 *
 * Features:
 * - Server-side authentication with JWT tokens (httpOnly cookies)
 * - Client-side JWT token for PWA/Service Worker access
 * - Online/offline status detection
 * - Automatic sync when connection returns
 * - IndexedDB fallback for offline operation
 * - Trial management and subscription tracking
 */

interface UnifiedAuthContextType {
  // User state
  user: User | null
  company: Company | null
  loading: boolean
  isAuthenticated: boolean

  // Online/Offline
  isOnline: boolean

  // Authentication methods
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>

  // JWT for PWA/Service Worker
  jwtToken: string | null
  refreshToken: () => Promise<string | null>

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncAt: string | null
  syncNow: () => Promise<void>
}

interface RegisterData {
  companyName: string
  name: string
  email: string
  password: string
  phone?: string
  companyType?: 'administradora' | 'alpinista'
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | null>(null)

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Online/offline state
  const [isOnline, setIsOnline] = useState(true)

  // JWT token for PWA (non-httpOnly)
  const [jwtToken, setJwtToken] = useState<string | null>(null)

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const router = useRouter()

  // Initialize on mount
  useEffect(() => {
    initializeAuth()
    setupNetworkListeners()
    loadLastSyncTime()

    // Cleanup network listeners
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Start auto-sync when authenticated and online
  useEffect(() => {
    if (user && isOnline) {
      syncManager.startAutoSync(5) // Sync every 5 minutes
    } else {
      syncManager.stopAutoSync()
    }

    return () => {
      syncManager.stopAutoSync()
    }
  }, [user, isOnline])

  /**
   * Initialize authentication on mount
   * Tries to load user from server (via JWT cookie)
   * Falls back to IndexedDB for offline mode
   */
  const initializeAuth = async () => {
    try {
      setLoading(true)

      // Check online status
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine)
      }

      // Try to get current user from server (via JWT cookie)
      if (navigator.onLine) {
        try {
          const currentUser = await getCurrentUser()

          if (currentUser) {
            const userData: User = {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name,
              role: currentUser.role,
              companyId: currentUser.companyId,
              active: true
            }

            setUser(userData)
            setCompany(currentUser.company as Company)

            // Cache in IndexedDB for offline access
            await offlineDB.put('users', userData)

            if (currentUser.company) {
              await offlineDB.put('companies', currentUser.company)
            }

            // Get JWT token for PWA
            await refreshToken()

            console.log('✅ Authenticated from server:', currentUser.name)

            setLoading(false)
            return
          }
        } catch (serverError) {
          console.warn('Server auth failed, trying offline fallback:', serverError)
        }
      }

      // Fallback: Try to restore session from IndexedDB (offline mode)
      const storedUserId = localStorage.getItem('currentUserId')
      const storedCompanyId = localStorage.getItem('currentCompanyId')

      if (storedUserId && storedCompanyId) {
        const offlineUser = await offlineDB.get('users', storedUserId)
        const offlineCompany = await offlineDB.get('companies', storedCompanyId)

        if (offlineUser && offlineCompany) {
          setUser(offlineUser as User)
          setCompany(offlineCompany as Company)

          console.log('✅ Restored from offline storage:', offlineUser.name)

          // Try to sync when back online
          if (navigator.onLine) {
            setTimeout(() => syncNow(), 1000)
          }
        } else {
          // Session invalid, clear storage
          await clearSession()
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      await clearSession()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Setup network event listeners for online/offline detection
   */
  const setupNetworkListeners = () => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  const handleOnline = () => {
    setIsOnline(true)
    console.log('📶 Back online')

    // Trigger sync when back online
    if (user) {
      setTimeout(() => syncNow(), 1000)
    }
  }

  const handleOffline = () => {
    setIsOnline(false)
    console.log('📴 Gone offline')
  }

  /**
   * Load last sync timestamp from localStorage
   */
  const loadLastSyncTime = () => {
    const lastSync = localStorage.getItem('lastSyncAt')
    if (lastSync) {
      setLastSyncAt(lastSync)
    }
  }

  /**
   * Login with email and password
   * Tries server authentication first, falls back to offline
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true)

      // 1. Try server authentication first
      if (isOnline) {
        const result = await loginUser(email, password)

        if (result.success && result.user) {
          const userData: User = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            companyId: result.user.companyId,
            active: true
          }

          setUser(userData)
          setCompany(result.company || null)

          // Cache in IndexedDB for offline access
          await offlineDB.createUser({ ...userData, password } as any)
          if (result.company) {
            await offlineDB.put('companies', result.company)
          }

          // Store session identifiers
          localStorage.setItem('currentUserId', userData.id)
          localStorage.setItem('currentCompanyId', userData.companyId)

          // Get JWT token for PWA
          await refreshToken()

          console.log('✅ Server login successful:', result.user.name)

          router.push('/app')

          return result
        }

        return result
      }

      // 2. Offline mode: Try IndexedDB authentication
      const offlineUser = await offlineDB.authenticateUser(email, password)

      if (offlineUser) {
        const offlineCompany = await offlineDB.get('companies', offlineUser.companyId)

        if (offlineCompany) {
          setUser(offlineUser)
          setCompany(offlineCompany as Company)

          // Store session identifiers
          localStorage.setItem('currentUserId', offlineUser.id)
          localStorage.setItem('currentCompanyId', offlineUser.companyId)

          console.log('✅ Offline login successful:', offlineUser.name)

          router.push('/app')

          return { success: true, message: 'Login realizado com sucesso (offline)!' }
        }
      }

      return { success: false, message: 'Email ou senha incorretos' }

    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Erro ao fazer login' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Register new user and company
   */
  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true)

      // Try server registration
      if (isOnline) {
        const result = await registerUser(data)

        if (result.success && result.user) {
          const userData: User = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            companyId: result.user.companyId,
            active: true
          }

          setUser(userData)
          setCompany(result.company || null)

          // Cache in IndexedDB for offline access
          await offlineDB.createUser({ ...userData, password: data.password } as any)
          if (result.company) {
            await offlineDB.put('companies', result.company)
          }

          // Store session identifiers
          localStorage.setItem('currentUserId', userData.id)
          localStorage.setItem('currentCompanyId', userData.companyId)

          // Get JWT token for PWA
          await refreshToken()

          console.log('✅ Registration successful:', result.user.name)

          router.push('/app')

          return result
        }

        return result
      }

      // Offline mode: Create in IndexedDB only
      const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create company with 14-day trial
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialStartDate.getDate() + 14)

      const newCompany: Company = {
        id: companyId,
        name: data.companyName,
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        isTrialActive: true,
        daysRemainingInTrial: 14
      }

      // Determine role based on company type
      const userRole = data.companyType === 'alpinista' ? 'team_admin' : 'company_admin'

      const newUser: User = {
        id: userId,
        name: data.name,
        email: data.email,
        role: userRole,
        companyId: companyId,
        active: true
      }

      // Save to IndexedDB
      await offlineDB.createCompany(newCompany)
      await offlineDB.createUser({ ...newUser, password: data.password })

      setUser(newUser)
      setCompany(newCompany)

      // Store session identifiers
      localStorage.setItem('currentUserId', userId)
      localStorage.setItem('currentCompanyId', companyId)

      console.log('✅ Offline registration successful:', newUser.name)

      router.push('/app')

      return { success: true, message: 'Conta criada com sucesso (offline)!' }

    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Erro ao criar conta' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout user
   * Clears server session and local storage
   */
  const logout = async (): Promise<void> => {
    try {
      // Logout from server
      if (isOnline) {
        await logoutUser()
      }

      // Clear local state
      await clearSession()

      console.log('✅ Logout successful')

      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)

      // Clear local state anyway
      await clearSession()
      router.push('/auth/login')
    }
  }

  /**
   * Clear local session data
   */
  const clearSession = async () => {
    setUser(null)
    setCompany(null)
    setJwtToken(null)

    localStorage.removeItem('currentUserId')
    localStorage.removeItem('currentCompanyId')
    localStorage.removeItem('pwa-jwt-token')

    // Note: Not clearing all IndexedDB data to preserve offline data
    // for multi-user devices or re-login scenarios
  }

  /**
   * Refresh user data from server
   */
  const refreshUser = async (): Promise<void> => {
    if (!isOnline) {
      console.log('⚠️ Offline, cannot refresh user')
      return
    }

    try {
      const currentUser = await getCurrentUser()

      if (currentUser) {
        const userData: User = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role,
          companyId: currentUser.companyId,
          active: true
        }

        setUser(userData)
        setCompany(currentUser.company as Company)

        // Update cache
        await offlineDB.put('users', userData)

        if (currentUser.company) {
          await offlineDB.put('companies', currentUser.company)
        }

        console.log('✅ User refreshed:', currentUser.name)
      } else {
        // No valid session, logout
        await logout()
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  /**
   * Get JWT token for PWA/Service Worker
   * This token is NOT httpOnly and can be accessed by JavaScript
   */
  const refreshToken = async (): Promise<string | null> => {
    if (!isOnline || !user) {
      const cachedToken = localStorage.getItem('pwa-jwt-token')
      return cachedToken
    }

    try {
      const response = await fetch('/api/auth/sync-token', {
        method: 'POST',
        credentials: 'include' // Send httpOnly cookie
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.token

        setJwtToken(token)
        localStorage.setItem('pwa-jwt-token', token)

        console.log('✅ PWA JWT token refreshed')

        return token
      }

      console.warn('⚠️ Failed to get PWA JWT token')
      return null
    } catch (error) {
      console.error('Error refreshing token:', error)
      return null
    }
  }

  /**
   * Sync data with server
   */
  const syncNow = async (): Promise<void> => {
    if (!isOnline || !user) {
      console.log('⚠️ Cannot sync: offline or not authenticated')
      return
    }

    setSyncStatus('syncing')

    try {
      const result = await syncManager.syncNow()

      if (result.success) {
        setSyncStatus('synced')
        const now = new Date().toISOString()
        setLastSyncAt(now)
        localStorage.setItem('lastSyncAt', now)

        console.log(`✅ ${result.message}`)

        // Reset to idle after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000)
      } else {
        setSyncStatus('error')
        console.warn(`⚠️ Sync failed: ${result.message}`)

        // Reset to idle after 5 seconds
        setTimeout(() => setSyncStatus('idle'), 5000)
      }
    } catch (error) {
      setSyncStatus('error')
      console.error('❌ Sync error:', error)

      // Reset to idle after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000)
    }
  }

  const contextValue: UnifiedAuthContextType = {
    // User state
    user,
    company,
    loading,
    isAuthenticated: !!user,

    // Online/Offline
    isOnline,

    // Authentication methods
    login,
    register,
    logout,
    refreshUser,

    // JWT for PWA
    jwtToken,
    refreshToken,

    // Sync status
    syncStatus,
    lastSyncAt,
    syncNow
  }

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  )
}

/**
 * Hook to use UnifiedAuthContext
 * Throws error if used outside provider
 */
export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext)
  if (!context) {
    throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider')
  }
  return context
}

/**
 * Safe hook that doesn't throw if provider is not present
 * Useful during hydration or in components that may render before provider
 */
export function useUnifiedAuthSafe() {
  const context = useContext(UnifiedAuthContext)

  if (!context) {
    return {
      user: null,
      company: null,
      loading: false,
      isAuthenticated: false,
      isOnline: true,
      login: async () => ({ success: false, message: 'Auth not initialized' }),
      register: async () => ({ success: false, message: 'Auth not initialized' }),
      logout: async () => {},
      refreshUser: async () => {},
      jwtToken: null,
      refreshToken: async () => null,
      syncStatus: 'idle' as const,
      lastSyncAt: null,
      syncNow: async () => {}
    }
  }

  return context
}

export default UnifiedAuthContext
