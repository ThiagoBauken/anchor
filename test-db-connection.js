const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('🔍 Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET')
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    // Test basic connection
    console.log('📡 Attempting to connect to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Test a simple query
    console.log('🔍 Testing simple query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query executed successfully:', result)

    // Check if tables exist
    console.log('🏗️  Checking if tables exist...')
    const companies = await prisma.company.count()
    console.log(`✅ Company table exists with ${companies} records`)

    const users = await prisma.user.count()
    console.log(`✅ User table exists with ${users} records`)

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Load environment variables
require('dotenv').config()
testConnection()