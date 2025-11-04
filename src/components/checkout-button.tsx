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
    // Check if online for payments
    if (!navigator.onLine) {
      toast({
        variant: 'destructive',
        title: 'Conexão Necessária',
        description: 'Pagamentos requerem conexão com internet.',
      })
      return
    }

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