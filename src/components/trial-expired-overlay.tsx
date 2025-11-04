"use client";

import { useState, useEffect } from 'react'
import { useTrial } from '@/hooks/use-trial'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CreditCard, LogOut } from 'lucide-react'
import Link from 'next/link'

function TrialExpiredContent() {
  const { currentCompany, logout } = useOfflineAuthSafe()
  const { isExpired, canUseApp } = useTrial()

  // Don't show overlay if user can use app or has paid subscription
  if (!currentCompany || canUseApp || (currentCompany.subscriptionPlan !== 'trial' && currentCompany.subscriptionStatus === 'active')) {
    return null
  }

  // Only show when trial is expired
  if (!isExpired) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Teste Gratuito Expirado</CardTitle>
          <CardDescription>
            Seu período de teste gratuito de 14 dias chegou ao fim.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Para continuar usando o AnchorView com todos os recursos, escolha um plano que melhor atende suas necessidades.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                ✅ Pontos de ancoragem ilimitados<br/>
                ✅ Projetos ilimitados<br/>
                ✅ Relatórios personalizados<br/>
                ✅ Suporte técnico<br/>
                ✅ Backup automático
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/billing">
                <CreditCard className="w-4 h-4 mr-2" />
                Ver Planos e Preços
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={logout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Dúvidas? Entre em contato conosco pelo email: 
              <a href="mailto:suporte@anchorview.com" className="text-primary hover:underline ml-1">
                suporte@anchorview.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TrialExpiredOverlay() {
  // Use a state to track if providers are available
  const [providersReady, setProvidersReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure providers are mounted
    const timer = setTimeout(() => {
      setProvidersReady(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  if (!providersReady) {
    return null
  }

  return <TrialExpiredContent />
}