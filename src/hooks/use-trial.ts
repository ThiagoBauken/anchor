import { useState, useEffect } from 'react'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import type { Company } from '@/types'

interface TrialInfo {
  isTrialActive: boolean
  daysRemaining: number
  hoursRemaining: number
  minutesRemaining: number
  isExpired: boolean
  canUseApp: boolean
  trialEndDate: Date | null
}

export function useTrial(): TrialInfo {
  const { currentCompany } = useOfflineAuthSafe()
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isTrialActive: false,
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    isExpired: false,
    canUseApp: false,
    trialEndDate: null
  })

  useEffect(() => {
    const calculateTrialInfo = () => {
      if (!currentCompany) {
        setTrialInfo({
          isTrialActive: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isExpired: true,
          canUseApp: false,
          trialEndDate: null
        })
        return
      }

      const company = currentCompany as Company

      // Check if company has active subscription (not trial)
      if (company.subscriptionPlan !== 'trial' && company.subscriptionStatus === 'active') {
        setTrialInfo({
          isTrialActive: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isExpired: false,
          canUseApp: true,
          trialEndDate: null
        })
        return
      }

      // For trial companies
      const now = new Date()
      const trialEndDate = company.trialEndDate ? new Date(company.trialEndDate) : null

      if (!trialEndDate) {
        // No trial end date - treat as expired
        setTrialInfo({
          isTrialActive: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isExpired: true,
          canUseApp: false,
          trialEndDate: null
        })
        return
      }

      const timeDiff = trialEndDate.getTime() - now.getTime()
      const isExpired = timeDiff <= 0

      if (isExpired) {
        setTrialInfo({
          isTrialActive: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          isExpired: true,
          canUseApp: false,
          trialEndDate
        })
        return
      }

      // Calculate remaining time
      const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      setTrialInfo({
        isTrialActive: true,
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
        isExpired: false,
        canUseApp: true,
        trialEndDate
      })
    }

    // Calculate immediately
    calculateTrialInfo()

    // Update every minute
    const interval = setInterval(calculateTrialInfo, 60000)

    return () => clearInterval(interval)
  }, [currentCompany])

  return trialInfo
}