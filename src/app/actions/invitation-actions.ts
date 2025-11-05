'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'

/**
 * Envia convite de projeto para uma empresa
 * company_admin convida empresa de alpinismo para trabalhar em um projeto
 */
export async function inviteCompanyToProject(data: {
  projectId: string
  projectName: string
  targetCompanyId: string
  invitedBy: string // userId do company_admin
  message?: string
}) {
  try {
    if (!prisma) {
      return { success: false, message: 'Database not available' }
    }

    const { projectId, projectName, targetCompanyId, invitedBy, message } = data

    // Get all team_admin users from target company
    const targetUsers = await prisma.user.findMany({
      where: {
        companyId: targetCompanyId,
        role: 'team_admin',
        active: true
      }
    })

    if (targetUsers.length === 0) {
      return {
        success: false,
        message: 'Nenhum responsável encontrado nesta empresa'
      }
    }

    // Get inviter info
    const inviter = await prisma.user.findUnique({
      where: { id: invitedBy },
      include: { company: true }
    })

    if (!inviter) {
      return { success: false, message: 'Usuário não encontrado' }
    }

    // Create notification for each team_admin
    const notifications = await Promise.all(
      targetUsers.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: '🤝 Novo Convite de Projeto',
            message: `${inviter.company?.name} convidou você para trabalhar no projeto "${projectName}"`,
            type: 'project_invitation',
            data: {
              projectId,
              projectName,
              invitedBy,
              inviterName: inviter.name,
              inviterCompany: inviter.company?.name,
              targetCompanyId,
              message: message || '',
              createdAt: new Date().toISOString()
            }
          }
        })
      )
    )

    return {
      success: true,
      message: `Convite enviado para ${targetUsers.length} responsável(is)`,
      notificationIds: notifications.map(n => n.id)
    }
  } catch (error) {
    console.error('Error sending project invitation:', error)
    return {
      success: false,
      message: 'Erro ao enviar convite'
    }
  }
}

/**
 * Aceita convite de projeto
 * Cria ProjectTeamPermission e TeamMember automaticamente
 */
export async function acceptProjectInvitation(notificationId: string, userId: string) {
  try {
    if (!prisma) {
      return { success: false, message: 'Database not available' }
    }

    // Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification || notification.userId !== userId) {
      return { success: false, message: 'Convite não encontrado' }
    }

    if (notification.type !== 'project_invitation') {
      return { success: false, message: 'Tipo de notificação inválido' }
    }

    const invitationData = notification.data as any
    const { projectId, targetCompanyId } = invitationData

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (!user || user.companyId !== targetCompanyId) {
      return { success: false, message: 'Usuário não autorizado' }
    }

    // Check if team already exists for this company
    let team = await prisma.team.findFirst({
      where: {
        companyId: targetCompanyId,
        active: true
      }
    })

    // If no team exists, create one
    if (!team) {
      team = await prisma.team.create({
        data: {
          name: user.company?.name || 'Equipe Principal',
          companyId: targetCompanyId,
          active: true
        }
      })
    }

    // Add user to team if not already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: team.id,
        userId: userId
      }
    })

    if (!existingMember) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: userId,
          role: 'leader',  // TeamMemberRole: leader | member | observer
          active: true
        }
      })
    }

    // Check if permission already exists
    const existingPermission = await prisma.projectTeamPermission.findFirst({
      where: {
        projectId,
        teamId: team.id
      }
    })

    if (existingPermission) {
      // Mark notification as read
      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() }
      })

      return {
        success: true,
        message: 'Você já tem acesso a este projeto',
        alreadyExists: true
      }
    }

    // Create ProjectTeamPermission
    await prisma.projectTeamPermission.create({
      data: {
        projectId,
        teamId: team.id,
        canView: true,
        canCreatePoints: true,
        canEditPoints: true,
        canDeletePoints: false,
        canTestPoints: true,
        canExportReports: true,
        canViewMap: true,
        grantedBy: invitationData.invitedBy,
        grantedAt: new Date()
      }
    })

    // Mark notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    })

    return {
      success: true,
      message: 'Convite aceito! Você agora tem acesso ao projeto.',
      teamId: team.id,
      projectId
    }
  } catch (error) {
    console.error('Error accepting project invitation:', error)
    return {
      success: false,
      message: 'Erro ao aceitar convite'
    }
  }
}

/**
 * Rejeita convite de projeto
 */
export async function rejectProjectInvitation(notificationId: string, userId: string) {
  try {
    if (!prisma) {
      return { success: false, message: 'Database not available' }
    }

    // Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification || notification.userId !== userId) {
      return { success: false, message: 'Convite não encontrado' }
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    })

    return {
      success: true,
      message: 'Convite recusado'
    }
  } catch (error) {
    console.error('Error rejecting project invitation:', error)
    return {
      success: false,
      message: 'Erro ao recusar convite'
    }
  }
}

/**
 * Lista convites pendentes de projeto para um usuário
 */
export async function getProjectInvitations(userId: string) {
  try {
    if (!prisma) {
      return []
    }

    const invitations = await prisma.notification.findMany({
      where: {
        userId,
        type: 'project_invitation',
        readAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return invitations.map(inv => ({
      id: inv.id,
      title: inv.title,
      message: inv.message,
      data: inv.data,
      createdAt: inv.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching project invitations:', error)
    return []
  }
}

/**
 * Cria convite de usuário para uma empresa
 */
export async function createInvitation(data: {
  email: string
  role: string
  companyId: string
  invitedBy: string
}) {
  try {
    if (!prisma) {
      return {
        success: false,
        message: 'Database not available'
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Já existe um usuário com este email'
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email: data.email,
        companyId: data.companyId,
        acceptedAt: null,
        expiresAt: {
          gte: new Date()
        }
      }
    })

    if (existingInvitation) {
      return {
        success: false,
        message: 'Já existe um convite pendente para este email'
      }
    }

    // Generate unique token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.userInvitation.create({
      data: {
        email: data.email,
        role: data.role as any,
        companyId: data.companyId,
        invitedBy: data.invitedBy,
        token,
        expiresAt
      }
    })

    // Generate invite URL - automatically detect production URL
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')

    // Use detected host or fallback to env variable
    const baseUrl = host
      ? `${protocol}://${host}`
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002')

    const inviteUrl = `${baseUrl}/auth/register/${token}`

    return {
      success: true,
      message: 'Convite criado com sucesso! Link copiado para a área de transferência.',
      inviteUrl,
      token
    }
  } catch (error) {
    console.error('Error creating invitation:', error)
    return {
      success: false,
      message: 'Erro ao criar convite'
    }
  }
}

/**
 * Lista convites de usuário pendentes para uma empresa
 */
export async function getPendingInvitations(companyId: string) {
  try {
    if (!prisma) {
      return []
    }

    const invitations = await prisma.userInvitation.findMany({
      where: {
        companyId,
        acceptedAt: null,
        expiresAt: {
          gte: new Date() // Only non-expired invitations
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Error fetching pending invitations:', error)
    return []
  }
}

/**
 * Verifica se um token de convite de usuário é válido
 */
export async function verifyInvitation(token: string) {
  try {
    if (!prisma) {
      return {
        valid: false,
        message: 'Database not available'
      }
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: { company: true }
    })

    if (!invitation) {
      return {
        valid: false,
        message: 'Convite não encontrado'
      }
    }

    if (invitation.acceptedAt) {
      return {
        valid: false,
        message: 'Este convite já foi utilizado'
      }
    }

    if (invitation.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'Este convite expirou'
      }
    }

    return {
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.company.name,
        companyId: invitation.companyId
      }
    }
  } catch (error) {
    console.error('Error verifying invitation:', error)
    return {
      valid: false,
      message: 'Erro ao verificar convite'
    }
  }
}

/**
 * Aceita convite de usuário e cria conta
 */
export async function acceptInvitation(
  token: string,
  userData: { name: string; password: string; phone?: string }
) {
  try {
    if (!prisma) {
      return {
        success: false,
        message: 'Database not available'
      }
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token }
    })

    if (!invitation) {
      return {
        success: false,
        message: 'Convite não encontrado'
      }
    }

    if (invitation.acceptedAt) {
      return {
        success: false,
        message: 'Este convite já foi utilizado'
      }
    }

    if (invitation.expiresAt < new Date()) {
      return {
        success: false,
        message: 'Este convite expirou'
      }
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Já existe um usuário com este email'
      }
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: invitation.email,
        password: hashedPassword,
        phone: userData.phone,
        role: invitation.role,
        companyId: invitation.companyId,
        active: true
      }
    })

    // Mark invitation as accepted
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    })

    return {
      success: true,
      message: 'Conta criada com sucesso',
      userId: user.id
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return {
      success: false,
      message: 'Erro ao criar conta'
    }
  }
}
