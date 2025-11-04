'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { offlineDB } from '@/lib/indexeddb'
import { syncManager } from '@/lib/sync-manager'
import type { User, Company } from '@/types'

interface OfflineAuthContextType {
  // Authentication state
  isAuthenticated: boolean
  currentUser: User | null
  currentCompany: Company | null
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>
  registerWithGoogle: () => Promise<{ success: boolean; message: string }>
  
  // Offline status
  isOnline: boolean
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed'
  lastSync: Date | null
  
  // Manual sync
  syncNow: () => Promise<void>
  
  // Loading states
  isLoading: boolean
}

interface RegisterData {
  companyName: string
  name: string
  email: string
  password: string
  phone?: string
}

const OfflineAuthContext = createContext<OfflineAuthContextType | null>(null)

export function OfflineAuthProvider({ children }: { children: ReactNode }) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  
  // Offline/sync state  
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)

  // Initialize on mount
  useEffect(() => {
    // Set initial online status after mount
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }
    
    initializeAuth()
    setupNetworkListeners()
    loadSyncStatus()
    
    // Start automatic sync when authenticated
    if (isAuthenticated && navigator.onLine) {
      syncManager.startAutoSync(5) // Sync every 5 minutes
    }
  }, [])

  // Start auto-sync when authentication changes
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      syncManager.startAutoSync(5) // Sync every 5 minutes
    } else {
      syncManager.stopAutoSync()
    }
  }, [isAuthenticated, isOnline])

  // Ensure demo data exists for 100% offline functionality
  const ensureDemoDataExists = async () => {
    try {
      // Check if demo company exists
      const demoCompany = await offlineDB.get('companies', 'demo-company')
      
      if (!demoCompany) {
        console.log('🏭 Creating demo company for offline functionality...')
        
        // Create demo company with trial
        const trialStartDate = new Date()
        const trialEndDate = new Date()
        trialEndDate.setDate(trialStartDate.getDate() + 14)
        
        const newDemoCompany: Company = {
          id: 'demo-company',
          name: 'Empresa Demo (Offline)',
          subscriptionPlan: 'trial',
          subscriptionStatus: 'active',
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          isTrialActive: true,
          daysRemainingInTrial: 14
        }
        
        await offlineDB.put('companies', newDemoCompany)
        console.log('✅ Demo company created')
      }
      
      // Check if demo admin user exists
      const adminExists = await offlineDB.authenticateUser('admin@admin.com', 'admin123')
      
      if (!adminExists) {
        console.log('👤 Creating demo admin user for offline functionality...')
        
        const adminUser: User = {
          id: 'demo-admin',
          name: 'Administrador Demo',
          email: 'admin@admin.com',
          role: 'company_admin',
          companyId: 'demo-company',
          active: true
        }
        
        // Create user with password for offline auth
        await offlineDB.createUser({ ...adminUser, password: 'admin123' })
        console.log('✅ Demo admin user created')
      }
      
      // Check if super admin user exists for testing
      const superAdminExists = await offlineDB.authenticateUser('superadmin@admin.com', 'super123')
      
      if (!superAdminExists) {
        console.log('👤 Creating demo super admin user for testing...')
        
        const superAdminUser: User = {
          id: 'demo-super-admin',
          name: 'Super Administrador',
          email: 'superadmin@admin.com',
          role: 'superadmin',
          companyId: 'demo-company',
          active: true
        }
        
        // Create super admin user with password for offline auth
        await offlineDB.createUser({ ...superAdminUser, password: 'super123' })
        console.log('✅ Demo super admin user created')
      }
      
      // Create demo projects and locations for complete offline experience
      await createDemoProjectsAndLocations()
      
      console.log('✅ Demo data initialization complete')
      
    } catch (error) {
      console.error('❌ Error creating demo data:', error)
    }
  }

  // Create demo projects and locations for complete offline experience
  const createDemoProjectsAndLocations = async () => {
    try {
      // Check if demo projects already exist
      const existingProjects = await offlineDB.getAll('projects')
      const demoProjects = existingProjects.filter((p: any) => p.companyId === 'demo-company')
      
      if (demoProjects.length === 0) {
        console.log('📁 Creating demo projects...')
        
        // Sample floor plan as base64 (simple rectangle)
        const sampleFloorPlan = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjlmYSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIyMDAiIHk9IjE1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNjY2Ij5QbGFudGEgQmFpeGEgRGVtbzwvdGV4dD48L3N2Zz4="
        
        const demoProject = {
          id: 'demo-project-1',
          name: 'Edifício Demo - Escritórios',
          companyId: 'demo-company',
          floorPlanImages: [sampleFloorPlan],
          obraAddress: 'Rua das Flores, 123, Centro, São Paulo - SP',
          obraCEP: '01234-567',
          obraCNPJ: '12.345.678/0001-90',
          contratanteName: 'Construtora Demo Ltda',
          contratanteAddress: 'Av. Principal, 456, Vila Nova, São Paulo - SP',
          contratanteCEP: '05678-123',
          cnpjContratado: '98.765.432/0001-10',
          contato: '(11) 99999-9999',
          valorContrato: '75000,00',
          dataInicio: '2024-01-15',
          dataTermino: '2024-12-15',
          responsavelTecnico: 'Eng. João Silva',
          registroCREA: '123456-7-SP',
          tituloProfissional: 'Engenheiro Civil',
          numeroART: 'ART-2024-001',
          rnp: '1234567890',
          cargaDeTestePadrao: '1500',
          tempoDeTestePadrao: '3',
          engenheiroResponsavelPadrao: 'Eng. João Silva',
          dispositivoDeAncoragemPadrao: 'Placa de Aço Inox',
          scalePixelsPerMeter: 50,
          dwgRealWidth: 25.0,
          dwgRealHeight: 18.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await offlineDB.put('projects', demoProject)
        console.log('✅ Demo project created')
      }
      
      // Check if demo locations already exist
      const existingLocations = await offlineDB.getAll('locations')
      const demoLocations = existingLocations.filter((l: any) => l.companyId === 'demo-company')
      
      if (demoLocations.length === 0) {
        console.log('📍 Creating demo locations...')
        
        const locations = [
          { id: 'loc-1', name: 'Telhado', markerShape: 'circle', companyId: 'demo-company', projectId: 'proj-demo-1' },
          { id: 'loc-2', name: 'Fachada', markerShape: 'square', companyId: 'demo-company', projectId: 'proj-demo-1' },
          { id: 'loc-3', name: 'Estrutura', markerShape: 'x', companyId: 'demo-company', projectId: 'proj-demo-1' },
          { id: 'loc-4', name: 'Sacada', markerShape: '+', companyId: 'demo-company', projectId: 'proj-demo-1' },
        ]

        for (const location of locations) {
          await offlineDB.put('locations', location as any)
        }
        
        console.log('✅ Demo locations created')
      }
      
    } catch (error) {
      console.error('❌ Error creating demo projects/locations:', error)
    }
  }

  const initializeAuth = async () => {
    try {
      // First, ensure demo data exists for offline functionality
      await ensureDemoDataExists()
      
      // Check for stored session
      const storedUserId = localStorage.getItem('currentUserId')
      const storedCompanyId = localStorage.getItem('currentCompanyId')

      if (storedUserId && storedCompanyId) {
        // Try to load user and company from IndexedDB
        const user = await offlineDB.get('users', storedUserId)
        const company = await offlineDB.get('companies', storedCompanyId)

        if (user && company) {
          let currentCompany = company as Company

          // Ensure trial companies have proper trialEndDate
          if (!currentCompany.trialEndDate && (!currentCompany.subscriptionPlan || currentCompany.subscriptionPlan === 'trial')) {
            console.log('⚡ Fixing company without trialEndDate:', currentCompany.id)
            
            const trialStartDate = currentCompany.trialStartDate ? new Date(currentCompany.trialStartDate) : new Date()
            const trialEndDate = new Date(trialStartDate)
            trialEndDate.setDate(trialStartDate.getDate() + 14)
            
            const updatedCompany: Company = {
              ...currentCompany,
              subscriptionPlan: 'trial',
              subscriptionStatus: 'active',
              trialStartDate: trialStartDate.toISOString(),
              trialEndDate: trialEndDate.toISOString(),
              isTrialActive: true,
              daysRemainingInTrial: Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            }
            
            // Update in IndexedDB
            await offlineDB.put('companies', updatedCompany)
            currentCompany = updatedCompany
            
            console.log('✅ Company trial fixed:', {
              id: currentCompany.id,
              trialEndDate: currentCompany.trialEndDate,
              daysRemaining: currentCompany.daysRemainingInTrial
            })
          }

          setCurrentUser(user as User)
          setCurrentCompany(currentCompany)
          setIsAuthenticated(true)
          
          console.log('✅ Restored offline session:', user.name)
          
          // Try to sync in background
          if (navigator.onLine) {
            setTimeout(() => syncNow(), 1000)
          }
        } else {
          // Session invalid, clear storage
          await logout()
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      await logout()
    } finally {
      setIsLoading(false)
    }
  }

  const setupNetworkListeners = () => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      console.log('📶 Back online')
      if (isAuthenticated) {
        syncNow()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📴 Gone offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  const loadSyncStatus = () => {
    const lastSyncStr = localStorage.getItem('lastSync')
    if (lastSyncStr) {
      setLastSync(new Date(lastSyncStr))
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    
    try {
      // 1. Try offline authentication first
      const user = await offlineDB.authenticateUser(email, password)
      
      if (user) {
        // Get user's company
        const company = await offlineDB.get('companies', user.companyId)
        
        if (company) {
          // Set authentication state
          setCurrentUser(user)
          setCurrentCompany(company as Company)
          setIsAuthenticated(true)
          
          // Store session
          localStorage.setItem('currentUserId', user.id)
          localStorage.setItem('currentCompanyId', user.companyId)
          
          console.log('✅ Offline login successful:', user.name)
          
          // Try to sync with server if online
          if (isOnline) {
            setTimeout(() => syncNow(), 500)
          }
          
          return { success: true, message: 'Login realizado com sucesso!' }
        } else {
          return { success: false, message: 'Empresa não encontrada.' }
        }
      } else {
        // 2. If offline fails and we're online, try server authentication
        if (isOnline) {
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            })

            if (response.ok) {
              const { user, company } = await response.json()
              
              // Store in IndexedDB for offline access
              await offlineDB.createUser({ ...user, password })
              await offlineDB.put('companies', company, false)
              
              // Set authentication state
              setCurrentUser(user)
              setCurrentCompany(company)
              setIsAuthenticated(true)
              
              // Store session
              localStorage.setItem('currentUserId', user.id)
              localStorage.setItem('currentCompanyId', company.id)
              
              console.log('✅ Online login successful, cached offline:', user.name)
              
              return { success: true, message: 'Login realizado com sucesso!' }
            } else {
              const error = await response.json()
              return { success: false, message: error.message || 'Credenciais inválidas.' }
            }
          } catch (serverError) {
            console.error('Server login failed:', serverError)
            return { success: false, message: 'Erro de conexão com o servidor.' }
          }
        } else {
          return { success: false, message: 'Credenciais inválidas (offline).' }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Erro interno no login.' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    
    try {
      // Generate IDs for offline-first creation
      const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create company with 14-day trial
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialStartDate.getDate() + 14)
      
      const company: Company = {
        id: companyId,
        name: userData.companyName,
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        isTrialActive: true,
        daysRemainingInTrial: 14
      }
      
      // Create user
      const user: User = {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: 'company_admin',
        companyId: companyId,
        active: true
      }
      
      // Save to IndexedDB (offline-first)
      await offlineDB.createCompany(company)
      await offlineDB.createUser({ ...user, password: userData.password })
      
      // Set authentication state immediately
      setCurrentUser(user)
      setCurrentCompany(company)
      setIsAuthenticated(true)
      
      // Store session
      localStorage.setItem('currentUserId', user.id)
      localStorage.setItem('currentCompanyId', company.id)
      
      console.log('✅ Offline registration successful:', user.name)
      
      // Try to sync with server if online
      if (isOnline) {
        setTimeout(() => syncNow(), 1000)
      }
      
      return { success: true, message: 'Conta criada com sucesso! (funcionando offline)' }
      
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Erro ao criar conta.' }
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    
    try {
      // Para demo/fallback, vamos simular login com Google
      // Em produção, aqui seria a integração real com Firebase Auth ou Google Auth
      console.log('🔄 Simulando login com Google...')
      
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Criar usuário demo com dados do Google
      const googleUser: User = {
        id: `google_${Date.now()}`,
        name: 'Usuário Google',
        email: 'usuario@gmail.com',
        role: 'company_admin',
        companyId: 'demo-company',
        active: true
      }
      
      // Create demo company with 14-day trial
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialStartDate.getDate() + 14)
      
      const demoCompany: Company = {
        id: 'demo-company',
        name: 'Empresa Demo (Google)',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        isTrialActive: true,
        daysRemainingInTrial: 14
      }
      
      // Salvar no IndexedDB
      await offlineDB.createCompany(demoCompany)
      await offlineDB.createUser({ ...googleUser, password: 'google-auth' })
      
      // Set authentication state
      setCurrentUser(googleUser)
      setCurrentCompany(demoCompany)
      setIsAuthenticated(true)
      
      // Store session
      localStorage.setItem('currentUserId', googleUser.id)
      localStorage.setItem('currentCompanyId', demoCompany.id)
      
      console.log('✅ Google login successful (demo):', googleUser.name)
      
      return { success: true, message: 'Login com Google realizado com sucesso!' }
      
    } catch (error) {
      console.error('Google login error:', error)
      return { success: false, message: 'Erro no login com Google. Tente novamente.' }
    } finally {
      setIsLoading(false)
    }
  }

  const registerWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    // Para registro, usar a mesma lógica do login
    return await loginWithGoogle()
  }

  const logout = async (): Promise<void> => {
    try {
      // Clear authentication state
      setCurrentUser(null)
      setCurrentCompany(null)
      setIsAuthenticated(false)
      
      // Clear stored session
      localStorage.removeItem('currentUserId')
      localStorage.removeItem('currentCompanyId')
      
      // Optionally clear all offline data (or keep for multi-user device)
      // await offlineDB.clearAllData()
      
      console.log('✅ Logout successful')
      
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const syncNow = async (): Promise<void> => {
    if (!isOnline || !isAuthenticated) return
    
    setSyncStatus('syncing')
    
    try {
      const result = await syncManager.syncNow()
      
      if (result.success) {
        setSyncStatus('synced')
        setLastSync(new Date())
        localStorage.setItem('lastSync', new Date().toISOString())
        console.log(`✅ ${result.message}`)
      } else {
        setSyncStatus('failed')
        console.warn(`⚠️ Sync failed: ${result.message}`)
      }
    } catch (error) {
      setSyncStatus('failed')
      console.error('❌ Sync error:', error)
    }
    
    // Reset to idle after 3 seconds
    setTimeout(() => setSyncStatus('idle'), 3000)
  }

  const contextValue: OfflineAuthContextType = {
    // Authentication state
    isAuthenticated,
    currentUser,
    currentCompany,
    
    // Auth actions
    login,
    loginWithGoogle,
    logout,
    register,
    registerWithGoogle,
    
    // Offline status
    isOnline,
    syncStatus,
    lastSync,
    
    // Manual sync
    syncNow,
    
    // Loading states
    isLoading
  }

  return (
    <OfflineAuthContext.Provider value={contextValue}>
      {children}
    </OfflineAuthContext.Provider>
  )
}

export function useOfflineAuth() {
  const context = useContext(OfflineAuthContext)
  if (!context) {
    throw new Error('useOfflineAuth must be used within an OfflineAuthProvider')
  }
  return context
}

// Safe version that doesn't throw, for use during hydration
export function useOfflineAuthSafe() {
  const context = useContext(OfflineAuthContext)
  if (!context) {
    return {
      isAuthenticated: false,
      currentUser: null,
      currentCompany: null,
      login: async () => ({ success: false, message: 'Context not ready' }),
      loginWithGoogle: async () => ({ success: false, message: 'Context not ready' }),
      logout: async () => {},
      register: async () => ({ success: false, message: 'Context not ready' }),
      registerWithGoogle: async () => ({ success: false, message: 'Context not ready' }),
      isOnline: true,
      syncStatus: 'idle' as const,
      lastSync: null,
      syncNow: async () => {},
      isLoading: false
    }
  }
  return context
}

export default OfflineAuthContext