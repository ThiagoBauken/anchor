'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function registerUser(data: {
  companyName: string
  name: string
  email: string
  password: string
  phone?: string
  companyType?: 'administradora' | 'alpinista' // New field to determine role
}) {
  try {
    // Check if Prisma is available
    if (!prisma) {
      console.log('Database not available, using localStorage fallback')
      return {
        success: false,
        message: 'Banco de dados indisponível. Use o modo offline.'
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    }).catch(() => null)

    if (existingUser) {
      return {
        success: false,
        message: 'Email já cadastrado'
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company with explicit data
      const companyData = {
        name: data.companyName,
        subscriptionPlan: 'trial' as string,
        subscriptionStatus: 'active' as string,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        isTrialActive: true,
        daysRemainingInTrial: 14
      }

      const company = await tx.company.create({
        data: companyData
      })

      // Determine role based on company type
      // administradora → company_admin (property manager, read-only maps)
      // alpinista → team_admin (climbing company, can edit maps and create projects)
      const userRole = data.companyType === 'alpinista' ? 'team_admin' : 'company_admin'

      // Create user
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: userRole,
          companyId: company.id,
          active: true
        },
        include: {
          company: true
        }
      })

      return { user, company }
    }).catch((error) => {
      console.error('Transaction error:', error)
      return null
    })

    // Check if transaction succeeded
    if (!result || !result.user || !result.company) {
      return {
        success: false,
        message: 'Erro ao criar conta. Banco de dados indisponível.'
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        companyId: result.company.id,
        role: result.user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.company.id
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        subscriptionPlan: result.company.subscriptionPlan
      }
    }
  } catch (error) {
    console.error('Register error:', error)
    return {
      success: false,
      message: 'Erro ao criar conta. Tente novamente.'
    }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    // Check if Prisma is available
    if (!prisma) {
      console.log('Database not available, using localStorage fallback')
      return {
        success: false,
        message: 'Banco de dados indisponível. Use o modo offline.'
      }
    }

    // Find user with company
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    }).catch((error) => {
      console.error('Database query error:', error)
      return null
    })

    if (!user) {
      return {
        success: false,
        message: 'Email ou senha incorretos'
      }
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password).catch(() => false)

    if (!validPassword) {
      return {
        success: false,
        message: 'Email ou senha incorretos'
      }
    }

    // Check if user is active
    if (!user.active) {
      return {
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.'
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        subscriptionPlan: user.company.subscriptionPlan
      } : null
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      message: 'Erro ao fazer login. Banco de dados indisponível.'
    }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
    
    return {
      success: true,
      message: 'Logout realizado com sucesso'
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: 'Erro ao fazer logout'
    }
  }
}

export async function getCurrentUser() {
  try {
    // Check if Prisma is available
    if (!prisma) {
      console.log('Database not available, using localStorage fallback')
      return null
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token.value, JWT_SECRET)
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError)
      return null
    }

    if (!decoded || !decoded.id) {
      return null
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { company: true }
    }).catch((error) => {
      console.error('Database query error:', error)
      return null
    })

    if (!user || !user.active) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        subscriptionPlan: user.company.subscriptionPlan
      } : null
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}