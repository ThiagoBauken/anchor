'use client'

import { useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { DatabaseAuthProvider } from '@/context/DatabaseAuthContext'
import { OfflineDataProvider } from '@/context/OfflineDataContext'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Return a simpler placeholder during SSR to avoid hydration mismatches
  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <SessionProvider>
      <DatabaseAuthProvider>
        <OfflineDataProvider>
          {children}
        </OfflineDataProvider>
      </DatabaseAuthProvider>
    </SessionProvider>
  )
}
