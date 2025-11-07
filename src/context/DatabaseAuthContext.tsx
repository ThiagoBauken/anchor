'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser, loginUser, logoutUser, getCurrentUser } from '@/app/actions/auth'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name: string
  role: string
  companyId: string
}

interface Company {
  id: string
  name: string
  subscriptionPlan: string
}

interface DatabaseAuthContextType {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  companyName: string
  name: string
  email: string
  password: string
  phone?: string
  companyType?: 'administradora' | 'alpinista'
}

const DatabaseAuthContext = createContext<DatabaseAuthContextType | null>(null)

export function DatabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const currentUser = await getCurrentUser()

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role,
          companyId: currentUser.companyId
        })
        setCompany(currentUser.company)
      } else {
        setUser(null)
        setCompany(null)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
      setCompany(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load user on mount
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const result = await loginUser(email, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        setCompany(result.company)
        
        // Store in sessionStorage for PWA offline fallback
        sessionStorage.setItem('anchor-user', JSON.stringify(result.user))
        if (result.company) {
          sessionStorage.setItem('anchor-company', JSON.stringify(result.company))
        }
        
        router.push('/app')
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'Erro ao fazer login'
      }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const result = await registerUser(data)
      
      if (result.success && result.user) {
        setUser(result.user)
        setCompany(result.company)
        
        // Store in sessionStorage for PWA offline fallback
        sessionStorage.setItem('anchor-user', JSON.stringify(result.user))
        if (result.company) {
          sessionStorage.setItem('anchor-company', JSON.stringify(result.company))
        }
        
        router.push('/app')
      }
      
      return result
    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        message: 'Erro ao criar conta'
      }
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
      setUser(null)
      setCompany(null)
      
      // Clear sessionStorage
      sessionStorage.removeItem('anchor-user')
      sessionStorage.removeItem('anchor-company')
      
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer logout',
        description: 'Tente novamente'
      })
    }
  }

  return (
    <DatabaseAuthContext.Provider 
      value={{
        user,
        company,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </DatabaseAuthContext.Provider>
  )
}

export function useDatabaseAuth() {
  const context = useContext(DatabaseAuthContext)
  if (!context) {
    throw new Error('useDatabaseAuth must be used within DatabaseAuthProvider')
  }
  return context
}

// Safe hook that won't throw if provider is not present
export function useDatabaseAuthSafe() {
  const context = useContext(DatabaseAuthContext)
  return context || {
    user: null,
    company: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => ({ success: false, message: 'Auth not initialized' }),
    register: async () => ({ success: false, message: 'Auth not initialized' }),
    logout: async () => {},
    refreshUser: async () => {}
  }
}