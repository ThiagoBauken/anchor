const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    console.log('Creating superadmin user...')

    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    })

    if (existingSuperAdmin) {
      console.log('❌ Superadmin already exists:', existingSuperAdmin.email)
      return
    }

    // Create superadmin company
    const company = await prisma.company.create({
      data: {
        name: 'AnchorView System',
        email: 'admin@anchorview.com',
        isActive: true,
        isTrialActive: false, // No trial for system company
        daysRemainingInTrial: 0,
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active'
      }
    })

    console.log('✓ Company created:', company.name)

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create superadmin user
    const superadmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@anchorview.com',
        password: hashedPassword,
        role: 'superadmin',
        companyId: company.id,
        active: true
      }
    })

    console.log('✓ Superadmin created!')
    console.log('')
    console.log('📋 Login credentials:')
    console.log('   Email: admin@anchorview.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('⚠️  IMPORTANT: Change the password after first login!')

  } catch (error) {
    console.error('Error creating superadmin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()
