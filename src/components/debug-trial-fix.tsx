'use client'

import { useState } from 'react'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import { Button } from '@/components/ui/button'
import { offlineDB } from '@/lib/indexeddb'
import type { Company } from '@/types'

export function DebugTrialFix() {
  const { currentCompany, logout } = useOfflineAuthSafe()
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<string>('')

  const fixTrialData = async () => {
    if (!currentCompany) return

    setIsFixing(true)
    try {
      console.log('🔧 Debug: Starting trial fix for company:', currentCompany)

      // Get current company from IndexedDB
      const company = await offlineDB.get('companies', currentCompany.id) as Company
      if (!company) {
        setResult('Company not found in IndexedDB')
        return
      }

      console.log('🔧 Current company data:', company)

      // Force set trial dates
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialStartDate.getDate() + 14)

      const updatedCompany: Company = {
        ...company,
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        isTrialActive: true,
        daysRemainingInTrial: 14
      }

      console.log('🔧 Updated company data:', updatedCompany)

      // Update in IndexedDB
      await offlineDB.put('companies', updatedCompany)
      
      // Clear localStorage trial cache
      localStorage.removeItem('trialInfo')
      
      setResult(`Fixed! New trial end date: ${trialEndDate.toLocaleDateString()}`)
      
      // Force page reload to refresh context
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('Failed to fix trial:', error)
      setResult(`Error: ${error}`)
    } finally {
      setIsFixing(false)
    }
  }

  if (!currentCompany) return null

  return (
    <div className="fixed top-4 left-4 z-50 bg-red-100 p-4 rounded-lg border-2 border-red-300">
      <h3 className="font-bold text-red-800">DEBUG: Trial Fix</h3>
      <p className="text-sm text-red-600">Company: {currentCompany.name}</p>
      <p className="text-sm text-red-600">Trial End: {currentCompany.trialEndDate || 'NOT SET'}</p>
      <div className="mt-2 space-y-2">
        <Button 
          onClick={fixTrialData}
          disabled={isFixing}
          size="sm"
          variant="destructive"
        >
          {isFixing ? 'Fixing...' : 'Fix Trial Data'}
        </Button>
        {result && (
          <p className="text-xs text-red-800">{result}</p>
        )}
      </div>
    </div>
  )
}