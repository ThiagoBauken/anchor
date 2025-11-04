'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users2, Loader2 } from 'lucide-react'
import { registerUser } from '@/app/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'type-selection' | 'form'>('type-selection')
  const [companyType, setCompanyType] = useState<'administradora' | 'alpinista' | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (!companyType) {
      setError('Selecione o tipo de empresa')
      return
    }

    setLoading(true)

    try {
      const result = await registerUser({
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        companyType: companyType
      })

      if (result.success) {
        // Auto login with NextAuth
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })
        router.push('/app')
        router.refresh()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleTypeSelection(type: 'administradora' | 'alpinista') {
    setCompanyType(type)
    setStep('form')
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/auth/setup' })
    } catch (err) {
      setError('Erro ao conectar com Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Criar Conta</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Comece seu período de teste gratuito de 14 dias
        </p>
      </div>

      {step === 'type-selection' && (
        <div className="space-y-4">
          {/* Google Signup Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou selecione o tipo de empresa
              </span>
            </div>
          </div>

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

          <div className="text-center text-sm pt-4">
            <span className="text-gray-500 dark:text-gray-400">
              Já tem uma conta?{' '}
            </span>
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Faça login
            </Link>
          </div>
        </div>
      )}

      {step === 'form' && (
        <>
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
          <Label htmlFor="name">Seu Nome *</Label>
          <Input
            id="name"
            type="text"
            placeholder="João Silva"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
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

        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mínimo de 6 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
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
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

          <div className="text-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Já tem uma conta?{' '}
            </span>
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Faça login
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
