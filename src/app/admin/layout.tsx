"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, isAuthenticated, isLoading } = useOfflineAuthSafe()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser?.role !== 'superadmin') {
      // Redirect non-superadmin users
      router.push('/')
    }
  }, [isAuthenticated, currentUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    )
  }

  if (!isAuthenticated || currentUser?.role !== 'superadmin') {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}