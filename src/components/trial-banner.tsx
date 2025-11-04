"use client";

import { useTrial } from '@/hooks/use-trial'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, CreditCard, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function TrialBanner() {
  const { currentCompany } = useOfflineAuthSafe()
  const { isTrialActive, daysRemaining, hoursRemaining, minutesRemaining, isExpired, canUseApp } = useTrial()

  // Don't show banner if user has paid subscription
  if (!currentCompany || (currentCompany.subscriptionPlan !== 'trial' && currentCompany.subscriptionStatus === 'active')) {
    return null
  }

  // Trial expired - show blocking message
  if (isExpired || !canUseApp) {
    return (
      <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-950">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium text-red-800 dark:text-red-200">
              Seu teste gratuito expirou!
            </span>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Para continuar usando o AnchorView, escolha um plano que melhor atende suas necessidades.
            </p>
          </div>
          <Button asChild className="ml-4 bg-red-600 hover:bg-red-700">
            <Link href="/billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Ver Planos
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Trial active - show countdown
  if (isTrialActive) {
    const urgencyLevel = daysRemaining <= 3 ? 'urgent' : daysRemaining <= 7 ? 'warning' : 'info'
    
    const colorClasses = {
      urgent: 'border-red-500 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200',
      warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
      info: 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200'
    }

    const iconColor = {
      urgent: 'text-red-600',
      warning: 'text-yellow-600', 
      info: 'text-blue-600'
    }

    return (
      <Alert className={`mb-4 ${colorClasses[urgencyLevel]}`}>
        <Clock className={`h-4 w-4 ${iconColor[urgencyLevel]}`} />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium">
              Teste gratuito: {daysRemaining > 0 ? `${daysRemaining} dias` : `${hoursRemaining}h ${minutesRemaining}m`} restantes
            </span>
            <p className="text-sm mt-1 opacity-80">
              Aproveite todos os recursos do AnchorView sem limitações.
            </p>
          </div>
          <Button asChild variant="outline" className="ml-4">
            <Link href="/billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Escolher Plano
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}