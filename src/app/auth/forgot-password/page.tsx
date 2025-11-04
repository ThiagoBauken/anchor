'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions/password-reset'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resetUrl, setResetUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setResetUrl(null)
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)

      if (result.success) {
        setSuccess(true)
        // In development, show the reset URL
        if ('resetUrl' in result && result.resetUrl) {
          setResetUrl(result.resetUrl)
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-800 dark:text-green-200">
                Email Enviado!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-green-700 dark:text-green-300">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
            </CardDescription>

            <div className="space-y-2">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Verifique sua caixa de entrada
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ O link expira em 1 hora
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Não recebeu? Verifique a pasta de spam
              </p>
            </div>

            {/* Development Only - Show reset URL */}
            {resetUrl && process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🔧 Modo Desenvolvimento
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                  Link de reset gerado:
                </p>
                <a
                  href={resetUrl}
                  className="text-xs text-blue-600 dark:text-blue-400 underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resetUrl}
                </a>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full" variant="outline">
                Voltar para Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Mail className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Esqueceu sua senha?</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Digite seu email para receber um link de recuperação
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enviaremos um link de recuperação para este email
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
        </Button>
      </form>

      <div className="text-center text-sm space-y-2">
        <Link
          href="/auth/login"
          className="text-primary hover:underline font-medium block"
        >
          Voltar para Login
        </Link>
        <div className="text-gray-500 dark:text-gray-400">
          Não tem uma conta?{' '}
          <Link
            href="/auth/register"
            className="text-primary hover:underline font-medium"
          >
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  )
}
