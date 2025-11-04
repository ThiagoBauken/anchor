import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { companyName, phone, companyType } = await request.json()

    if (!companyName || !companyType) {
      return NextResponse.json({ error: 'Company name and type are required' }, { status: 400 })
    }

    // Create company and update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          subscriptionPlan: 'trial',
          subscriptionStatus: 'active',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          isTrialActive: true,
          daysRemainingInTrial: 14
        }
      })

      // Determine role based on company type
      const userRole = companyType === 'alpinista' ? 'team_admin' : 'company_admin'

      // Update user with company and role
      const user = await tx.user.update({
        where: { email: session.user.email! },
        data: {
          companyId: company.id,
          role: userRole,
          phone: phone || null
        }
      })

      return { company, user }
    })

    return NextResponse.json({
      success: true,
      message: 'Company setup completed',
      companyId: result.company.id,
      role: result.user.role
    })

  } catch (error) {
    console.error('Setup company error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to setup company' },
      { status: 500 }
    )
  }
}
