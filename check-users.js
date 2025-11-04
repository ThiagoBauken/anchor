// Check users in database
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function checkUsers() {
  const prisma = new PrismaClient()

  try {
    console.log('\n👥 Checking users in database...\n')

    const users = await prisma.user.findMany({
      include: {
        company: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found in database!')
      return
    }

    console.log(`✅ Found ${users.length} user(s):\n`)

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Active: ${user.active}`)
      console.log(`  Company: ${user.company?.name || 'N/A'}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log(`  Last Login: ${user.lastLogin || 'Never'}`)
      console.log()
    })

    // Check for superadmin
    const superadmin = users.find(u => u.role === 'superadmin')
    if (superadmin) {
      console.log('✅ Superadmin found!')
      console.log(`   Email: ${superadmin.email}`)
      console.log(`   Name: ${superadmin.name}`)
    } else {
      console.log('⚠️  No superadmin found!')
      console.log('   Run "node create-superadmin.js" to create one')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
