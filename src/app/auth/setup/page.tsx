'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users2, Loader2 } from 'lucide-react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function SetupPage() {
  const sessionData = useSession()
  const router = useRouter()
  const [step, setStep] = useState<'type-selection' | 'form'>('type-selection')
  const [companyType, setCompanyType] = useState<'administradora' | 'alpinista' | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle undefined session during SSR
  if (!sessionData) {
    return null
  }

  const { data: session, status, update } = sessionData

  useEffect(() => {
    // Redirect if already has company setup
    if (status === 'authenticated' && session?.user?.companyId) {
      router.push('/app')
    }
  }, [status, session, router])

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!companyType) {
      setError('Selecione o tipo de empresa')
      return
    }

    setLoading(true)

    try {
      // Create company for Google OAuth user
      const response = await fetch('/api/auth/setup-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          phone: formData.phone || undefined,
          companyType: companyType
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update session with company data
        await update({
          companyId: result.companyId,
          role: result.role
        })
        router.push('/app')
      } else {
        setError(result.message || 'Erro ao configurar empresa')
      }
    } catch (err) {
      setError('Erro ao configurar empresa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleTypeSelection(type: 'administradora' | 'alpinista') {
    setCompanyType(type)
    setStep('form')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 to-blue-50">
      <div className="w-full max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Bem-vindo, {session?.user?.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Complete seu cadastro configurando sua empresa
            </p>
          </div>

          {step === 'type-selection' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-6">Selecione o tipo de empresa</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <Card
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                  onClick={() => handleTypeSelection('administradora')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-center mb-2">
                      <Building2 className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-center">Administradora / Síndico</CardTitle>
                    <CardDescription className="text-center">
                      Gerencio prédios, condomínios ou propriedades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ Visualização de mapas e relatórios</li>
                      <li>✓ Gerenciamento de equipes</li>
                      <li>✓ Acesso a histórico de inspeções</li>
                      <li>✓ Contratação de empresas de alpinismo</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                  onClick={() => handleTypeSelection('alpinista')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-center mb-2">
                      <Users2 className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-center">Empresa de Alpinismo</CardTitle>
                    <CardDescription className="text-center">
                      Realizo serviços de trabalho em altura
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ Criação e edição de projetos</li>
                      <li>✓ Edição de mapas e pontos</li>
                      <li>✓ Gerenciamento de equipe técnica</li>
                      <li>✓ Execução de testes e inspeções</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 'form' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setStep('type-selection')}
                    disabled={loading}
                  >
                    ← Voltar
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {companyType === 'administradora' ? '🏢 Administradora' : '🧗 Empresa de Alpinismo'}
                  </div>
                </div>
                <CardTitle>Configurar Empresa</CardTitle>
                <CardDescription>
                  Preencha os dados da sua empresa para começar
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Minha Empresa Ltda"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      'Completar Cadastro'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
