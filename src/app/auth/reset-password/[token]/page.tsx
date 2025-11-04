'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyResetToken, resetPassword } from '@/app/actions/password-reset'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Eye, EyeOff, Key, Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export default function ResetPasswordPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const token = resolvedParams.token

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [valid, setValid] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Verify token on mount
  useEffect(() => {
    async function verify() {
      setLoading(true)
      const result = await verifyResetToken(token)

      if (result.valid) {
        setValid(true)
        setUser(result.user)
      } else {
        setValid(false)
        setError(result.message || 'Token inválido')
      }

      setLoading(false)
    }

    verify()
  }, [token])

  // Validate passwords match
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
    } else {
      setPasswordError('')
    }
  }, [newPassword, confirmPassword])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setError('')

    // Validations
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    setSubmitting(true)

    try {
      const result = await resetPassword(token, newPassword)

      if (result.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Verificando link de recuperação...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token
  if (!valid) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-800 dark:text-red-200">
                Link Inválido
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">
              {error}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-red-600 dark:text-red-400">
              <li>• O link pode ter expirado (válido por 1 hora)</li>
              <li>• O link já foi utilizado</li>
              <li>• O link pode estar incorreto</li>
            </ul>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Link href="/auth/forgot-password" className="flex-1">
              <Button className="w-full" variant="outline">
                Solicitar Novo Link
              </Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">
                Ir para Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-800 dark:text-green-200">
                Senha Redefinida!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Sua senha foi redefinida com sucesso!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Redirecionando para a página de login...
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">
                Ir para Login Agora
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Key className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Redefinir Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Olá, <strong>{user?.name}</strong>!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {user?.email} • {user?.companyName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nova Senha *</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={submitting}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mínimo de 6 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Digite novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={submitting}
              minLength={6}
              className={passwordError ? 'border-red-500' : ''}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {passwordError}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !newPassword || !confirmPassword || !!passwordError}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redefinindo...
            </>
          ) : (
            'Redefinir Senha'
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link
          href="/auth/login"
          className="text-primary hover:underline font-medium"
        >
          Voltar para Login
        </Link>
      </div>
    </div>
  )
}
