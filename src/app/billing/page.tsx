'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, CreditCard, Calendar, Users, AlertTriangle } from 'lucide-react'
import { CheckoutButton } from '@/components/checkout-button'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular dados da assinatura
    setTimeout(() => {
      setSubscription({
        plan: {
          name: 'Professional',
          price: 45,
          billing_cycle: 'monthly'
        },
        status: 'trialing',
        trial_end: '2025-02-01',
        current_period_end: '2025-02-01',
        usage: {
          users: 3,
          max_users: 10,
          projects: 2,
          max_projects: 20,
          points: 45,
          max_points: 500
        }
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-lg">Carregando informações da assinatura...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cobrança & Assinatura</h1>
          <p className="text-gray-600 mt-2">Gerencie sua assinatura e forma de pagamento</p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Plano Atual: {subscription.plan.name}
                </CardTitle>
                <CardDescription>
                  R$ {subscription.plan.price}/{subscription.plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                </CardDescription>
              </div>
              <Badge 
                variant={subscription.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {subscription.status === 'trialing' ? 'Período de Teste' : subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Trial Info */}
            {subscription.status === 'trialing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Teste Gratuito até {new Date(subscription.trial_end).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-blue-700">
                      Seu primeiro pagamento será processado automaticamente após o período de teste.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Payment */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Próximo pagamento</span>
              </div>
              <span className="font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-medium">Usuários</span>
                </div>
                <div className="text-2xl font-bold">
                  {subscription.usage.users}
                  <span className="text-sm text-gray-500 font-normal">
                    /{subscription.usage.max_users === -1 ? '∞' : subscription.usage.max_users}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-medium">Projetos</span>
                </div>
                <div className="text-2xl font-bold">
                  {subscription.usage.projects}
                  <span className="text-sm text-gray-500 font-normal">
                    /{subscription.usage.max_projects === -1 ? '∞' : subscription.usage.max_projects}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-medium">Pontos</span>
                </div>
                <div className="text-2xl font-bold">
                  {subscription.usage.points}
                  <span className="text-sm text-gray-500 font-normal">
                    /{subscription.usage.max_points === -1 ? '∞' : subscription.usage.max_points}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline">
                Alterar Plano
              </Button>
              <Button variant="outline">
                Baixar Faturas
              </Button>
              <Button variant="destructive" className="ml-auto">
                Cancelar Assinatura
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Outros Planos Disponíveis</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Starter */}
            <Card className="border-2 hover:border-violet-300 transition-colors">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Para pequenas empresas</CardDescription>
                <div className="text-3xl font-bold">R$ 15<span className="text-sm font-normal text-gray-500">/mês</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Até 3 usuários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">5 projetos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">100 pontos</span>
                  </li>
                </ul>
                <CheckoutButton planId="plan_starter" className="w-full" billingCycle="monthly">
                  Mudar para Starter
                </CheckoutButton>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-2 border-violet-500 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-violet-500">Atual</Badge>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <CardDescription>Para empresas em crescimento</CardDescription>
                <div className="text-3xl font-bold">R$ 45<span className="text-sm font-normal text-gray-500">/mês</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Até 10 usuários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">20 projetos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">500 pontos</span>
                  </li>
                </ul>
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-2 hover:border-violet-300 transition-colors">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Para grandes empresas</CardDescription>
                <div className="text-3xl font-bold">R$ 100<span className="text-sm font-normal text-gray-500">/mês</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Usuários ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Projetos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Pontos ilimitados</span>
                  </li>
                </ul>
                <CheckoutButton planId="plan_enterprise" className="w-full" billingCycle="monthly">
                  Fazer Upgrade
                </CheckoutButton>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Últimas transações e faturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">Período de Teste</p>
                  <p className="text-sm text-gray-500">01/01/2025 - 15/01/2025</p>
                </div>
                <Badge variant="secondary">Gratuito</Badge>
              </div>
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum pagamento processado ainda</p>
                <p className="text-sm">Seu primeiro pagamento será em {new Date(subscription.trial_end).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}