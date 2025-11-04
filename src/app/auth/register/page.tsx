'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users2 } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useDatabaseAuthSafe()
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
      const result = await register({
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        companyType: companyType
      })

      if (!result.success) {
        setError(result.message)
      }
      // If success, DatabaseAuthContext will handle navigation to /app
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
          {loading ? 'Criando conta...' : 'Criar conta'}
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
