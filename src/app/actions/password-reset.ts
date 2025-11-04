'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Request password reset - sends email with reset link
 */
export async function requestPasswordReset(email: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    })

    if (!user) {
      // Don't reveal if user exists for security
      return {
        success: true,
        message: 'Se o email existir, um link de recuperação será enviado.'
      }
    }

    if (!user.active) {
      return {
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.'
      }
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing unused tokens for this user
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        usedAt: null
      }
    })

    // Create new reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    })

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/auth/reset-password/${token}`

    // TODO: Send email
    // For now, just log to console
    console.log('\n==========================================')
    console.log('📧 PASSWORD RESET EMAIL')
    console.log('==========================================')
    console.log(`Para: ${user.email}`)
    console.log(`Nome: ${user.name}`)
    console.log(`Empresa: ${user.company.name}`)
    console.log(`\nLink de recuperação:\n${resetUrl}`)
    console.log(`\nExpira em: ${expiresAt.toLocaleString('pt-BR')}`)
    console.log('==========================================\n')

    // In production, use a proper email service like:
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Recuperação de Senha - AnchorView',
    //   html: `
    //     <h1>Olá, ${user.name}!</h1>
    //     <p>Recebemos uma solicitação para redefinir sua senha.</p>
    //     <p>Clique no link abaixo para criar uma nova senha:</p>
    //     <a href="${resetUrl}">Redefinir Senha</a>
    //     <p>Este link expira em 1 hora.</p>
    //     <p>Se você não solicitou isso, ignore este email.</p>
    //   `
    // })

    return {
      success: true,
      message: 'Link de recuperação enviado! Verifique seu email.',
      // In development, return the URL for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    }

  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      success: false,
      message: 'Erro ao processar solicitação. Tente novamente.'
    }
  }
}

/**
 * Verify reset token validity
 */
export async function verifyResetToken(token: string) {
  try {
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            company: true
          }
        }
      }
    })

    if (!resetRecord) {
      return {
        valid: false,
        message: 'Link inválido ou expirado.'
      }
    }

    if (resetRecord.usedAt) {
      return {
        valid: false,
        message: 'Este link já foi utilizado.'
      }
    }

    if (new Date() > resetRecord.expiresAt) {
      return {
        valid: false,
        message: 'Este link expirou. Solicite um novo.'
      }
    }

    return {
      valid: true,
      user: {
        id: resetRecord.user.id,
        name: resetRecord.user.name,
        email: resetRecord.user.email,
        companyName: resetRecord.user.company.name
      }
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return {
      valid: false,
      message: 'Erro ao verificar token.'
    }
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    // Verify token first
    const verification = await verifyResetToken(token)

    if (!verification.valid) {
      return {
        success: false,
        message: verification.message
      }
    }

    // Get reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token }
    })

    if (!resetRecord) {
      return {
        success: false,
        message: 'Token inválido.'
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      })
    ])

    console.log(`✅ Password reset successful for user: ${verification.user?.email}`)

    return {
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.'
    }

  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      message: 'Erro ao redefinir senha. Tente novamente.'
    }
  }
}

/**
 * Admin function - Force reset password for any user
 * Generates a token and returns the reset URL
 */
export async function adminResetUserPassword(userId: string, adminUserId: string) {
  try {
    // Verify admin permissions
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId }
    })

    if (!admin || (admin.role !== 'company_admin' && admin.role !== 'superadmin')) {
      return {
        success: false,
        message: 'Sem permissão para executar esta ação.'
      }
    }

    // Get target user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado.'
      }
    }

    // Company admins can only reset passwords in their own company
    if (admin.role === 'company_admin' && admin.companyId !== user.companyId) {
      return {
        success: false,
        message: 'Você só pode resetar senhas de usuários da sua empresa.'
      }
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for admin resets

    // Delete existing unused tokens
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        usedAt: null
      }
    })

    // Create new reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    })

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/auth/reset-password/${token}`

    // Log admin action
    console.log(`\n🔐 ADMIN PASSWORD RESET`)
    console.log(`Admin: ${admin.name} (${admin.email})`)
    console.log(`Target User: ${user.name} (${user.email})`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`Expires: ${expiresAt.toLocaleString('pt-BR')}\n`)

    // TODO: Send email to user
    console.log('\n==========================================')
    console.log('📧 EMAIL ENVIADO PARA USUÁRIO')
    console.log('==========================================')
    console.log(`Para: ${user.email}`)
    console.log(`Assunto: Senha Redefinida pelo Administrador`)
    console.log(`\nOlá ${user.name},`)
    console.log(`\nO administrador ${admin.name} resetou sua senha.`)
    console.log(`Use o link abaixo para criar uma nova senha:`)
    console.log(`\n${resetUrl}`)
    console.log(`\nEste link expira em 24 horas.`)
    console.log('==========================================\n')

    return {
      success: true,
      message: `Link de recuperação gerado para ${user.name}.`,
      resetUrl,
      expiresAt: expiresAt.toISOString()
    }

  } catch (error) {
    console.error('Admin password reset error:', error)
    return {
      success: false,
      message: 'Erro ao resetar senha.'
    }
  }
}
