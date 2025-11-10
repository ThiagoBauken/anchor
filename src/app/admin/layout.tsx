"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useDatabaseAuthSafe()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'superadmin') {
      // Redirect non-superadmin users
      router.push('/')
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}