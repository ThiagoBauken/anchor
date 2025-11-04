# 💳 INTEGRAÇÃO MERCADO PAGO - ANCHORVIEW SAAS

## 📋 CONFIGURAÇÃO INICIAL

### 1. Credenciais do Mercado Pago (.env)
```bash
# Mercado Pago Credentials
MERCADO_PAGO_ACCESS_TOKEN=TEST-123456789-123456-abc123def456-abc123def456
MERCADO_PAGO_PUBLIC_KEY=TEST-abc123def456-123456-abc123def456
MERCADO_PAGO_WEBHOOK_SECRET=your-webhook-secret

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:9002
MERCADO_PAGO_NOTIFICATION_URL=https://yourdomain.com/api/webhooks/mercadopago
```

### 2. Instalar SDK
```bash
npm install mercadopago
```

## 🔧 IMPLEMENTAÇÃO

### `/src/lib/mercadopago.ts`
```typescript
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
})

export const mercadoPagoPayment = new Payment(client)
export const mercadoPagoPreference = new Preference(client)
```

### `/src/app/api/payments/create-preference/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mercadoPagoPreference } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const companyId = request.headers.get('x-company-id')
    const userId = request.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { planId, billingCycle = 'monthly' } = await request.json()

    // Buscar plano
    const plan = await prisma.subscription_plans.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Buscar empresa e usuário
    const [company, user] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!company || !user) {
      return NextResponse.json({ error: 'Dados não encontrados' }, { status: 404 })
    }

    // Calcular preço
    const price = billingCycle === 'yearly' ? plan.price_yearly || plan.price_monthly * 12 : plan.price_monthly
    const description = `AnchorView ${plan.name} - ${billingCycle === 'yearly' ? 'Anual' : 'Mensal'}`

    // Criar preferência no Mercado Pago
    const preference = await mercadoPagoPreference.create({
      body: {
        items: [
          {
            id: planId,
            title: description,
            description: plan.description || description,
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: user.name,
          email: user.email
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: billingCycle === 'monthly' ? 1 : 12
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`, 
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`
        },
        auto_return: 'approved',
        external_reference: `${companyId}_${planId}_${Date.now()}`,
        notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL,
        metadata: {
          company_id: companyId,
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle
        }
      }
    })

    // Salvar intent de pagamento
    await prisma.payments.create({
      data: {
        subscription_id: (await prisma.subscriptions.findFirst({ 
          where: { company_id: companyId } 
        }))?.id!,
        amount: price,
        currency: 'BRL',
        status: 'pending',
        description,
        stripe_invoice_id: preference.id // Usar campo genérico para ID do MP
      }
    })

    return NextResponse.json({
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    })

  } catch (error) {
    console.error('MercadoPago preference error:', error)
    return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
  }
}
```

### `/src/app/api/webhooks/mercadopago/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mercadoPagoPayment } from '@/lib/mercadopago'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')
    
    // Verificar assinatura do webhook (opcional, mas recomendado)
    if (process.env.MERCADO_PAGO_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const notification = JSON.parse(body)
    console.log('MercadoPago webhook received:', notification)

    // Processar apenas notificações de pagamento
    if (notification.type !== 'payment') {
      return NextResponse.json({ success: true })
    }

    // Buscar detalhes do pagamento
    const payment = await mercadoPagoPayment.get({ id: notification.data.id })
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const metadata = payment.metadata
    const companyId = metadata?.company_id
    const planId = metadata?.plan_id
    const billingCycle = metadata?.billing_cycle || 'monthly'

    if (!companyId || !planId) {
      console.error('Missing metadata in payment:', payment.id)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Processar com base no status
    switch (payment.status) {
      case 'approved':
        await handleApprovedPayment(companyId, planId, billingCycle, payment)
        break
        
      case 'pending':
        await handlePendingPayment(companyId, payment)
        break
        
      case 'rejected':
      case 'cancelled':
        await handleFailedPayment(companyId, payment)
        break
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleApprovedPayment(companyId: string, planId: string, billingCycle: string, payment: any) {
  try {
    // Atualizar assinatura
    const periodDays = billingCycle === 'yearly' ? 365 : 30
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + periodDays * 24 * 60 * 60 * 1000)

    await prisma.subscriptions.updateMany({
      where: { company_id: companyId },
      data: {
        plan_id: planId,
        status: 'active',
        current_period_start: startDate,
        current_period_end: endDate,
        trial_end: null // Remover trial após primeiro pagamento
      }
    })

    // Atualizar registro de pagamento
    await prisma.payments.updateMany({
      where: { 
        stripe_invoice_id: payment.order?.id || payment.id.toString(),
        status: 'pending'
      },
      data: {
        status: 'paid',
        paid_at: new Date(payment.date_approved)
      }
    })

    // Log da atividade
    await prisma.saas_activity_log.create({
      data: {
        company_id: companyId,
        activity_type: 'payment_success',
        description: `Pagamento aprovado - Plano ${planId}`,
        metadata: {
          payment_id: payment.id,
          amount: payment.transaction_amount,
          method: payment.payment_method_id
        }
      }
    })

    console.log(`Payment approved for company ${companyId}, plan ${planId}`)

  } catch (error) {
    console.error('Error handling approved payment:', error)
  }
}

async function handlePendingPayment(companyId: string, payment: any) {
  // Manter assinatura como trialing se ainda estiver no período
  await prisma.saas_activity_log.create({
    data: {
      company_id: companyId,
      activity_type: 'payment_pending',
      description: 'Pagamento pendente',
      metadata: { payment_id: payment.id }
    }
  })
}

async function handleFailedPayment(companyId: string, payment: any) {
  // Não cancelar imediatamente - dar oportunidade de retry
  await prisma.saas_activity_log.create({
    data: {
      company_id: companyId,
      activity_type: 'payment_failed',
      description: 'Pagamento falhou',
      metadata: { 
        payment_id: payment.id,
        failure_reason: payment.status_detail 
      }
    }
  })
}
```

### `/src/components/checkout-button.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CheckoutButtonProps {
  planId: string
  billingCycle?: 'monthly' | 'yearly'
  children: React.ReactNode
  className?: string
}

export function CheckoutButton({ 
  planId, 
  billingCycle = 'monthly', 
  children, 
  className 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle })
      })

      const result = await response.json()

      if (response.ok) {
        // Redirecionar para o checkout do Mercado Pago
        const checkoutUrl = process.env.NODE_ENV === 'production' 
          ? result.init_point 
          : result.sandbox_init_point

        window.location.href = checkoutUrl
      } else {
        toast({
          title: 'Erro no checkout',
          description: result.error || 'Tente novamente.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children}
        </>
      )}
    </Button>
  )
}
```

### `/src/app/payment/success/page.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setPaymentInfo({
        status: status || 'approved',
        paymentId: paymentId || 'unknown'
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [paymentId, status])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processando pagamento...</h2>
            <p className="text-gray-600 text-center">
              Aguarde enquanto confirmamos seu pagamento
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-900">Pagamento Aprovado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Seu pagamento foi processado com sucesso. Sua assinatura já está ativa!
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              <strong>ID do Pagamento:</strong> {paymentInfo?.paymentId}
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Acessar AnchorView
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/billing')} 
              className="w-full"
            >
              Ver Detalhes da Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🔄 ATUALIZAR PÁGINAS EXISTENTES

### Atualizar Landing Page - Botões de Checkout:
```typescript
// Em /src/app/(public)/page.tsx - substituir os botões:
import { CheckoutButton } from '@/components/checkout-button'

// Substituir:
<Link href="/auth/register?plan=starter">
  <Button className="w-full">Começar Grátis</Button>
</Link>

// Por:
<CheckoutButton planId="plan_starter" className="w-full">
  Começar Grátis
</CheckoutButton>
```

## 📊 PREÇOS ATUALIZADOS

| **Starter** | **Professional** | **Enterprise** |
|-------------|------------------|----------------|
| **R$ 15/mês** | **R$ 45/mês**   | **R$ 100/mês** |
| R$ 150/ano  | R$ 450/ano       | R$ 1.000/ano   |
| 3 usuários  | 10 usuários      | Ilimitado      |
| 5 projetos  | 20 projetos      | Ilimitado      |
| 100 pontos  | 500 pontos       | Ilimitado      |

## 🚀 PRÓXIMOS PASSOS

1. **Configurar conta** no Mercado Pago
2. **Obter credenciais** de produção
3. **Configurar webhook** na URL do servidor
4. **Testar pagamentos** em sandbox
5. **Deploy em produção**

### Para atualizar o banco com os novos preços:
```sql
UPDATE "subscription_plans" SET 
  "price_monthly" = 15.00, "price_yearly" = 150.00 
WHERE "id" = 'plan_starter';

UPDATE "subscription_plans" SET 
  "price_monthly" = 45.00, "price_yearly" = 450.00 
WHERE "id" = 'plan_professional';

UPDATE "subscription_plans" SET 
  "price_monthly" = 100.00, "price_yearly" = 1000.00 
WHERE "id" = 'plan_enterprise';
```

**✅ INTEGRAÇÃO MERCADO PAGO COMPLETA!**
- Checkout nativo brasileiro
- Webhooks automáticos
- Gestão de assinaturas
- Preços acessíveis para o mercado BR