import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Check if we're in build phase (skip DB connection during build)
// Next.js sets NEXT_PHASE during builds, and we also check for common CI/build indicators
const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-development-build' ||
  process.env.CI === 'true' ||
  process.env.VERCEL_ENV === 'preview'

// Modo de fallback quando o banco não está disponível
const createPrismaClient = () => {
  try {
    // Skip Prisma Client creation during build phase
    if (isBuildPhase) {
      console.log('⏭️  Skipping Prisma Client initialization during build phase')
      return null
    }

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      // Only log error in server runtime (not client-side, not build)
      if (typeof window === 'undefined') {
        console.error('❌ DATABASE_URL is not set in environment variables')
        console.error('Please configure DATABASE_URL in your .env file or deployment environment')
      }
      return null
    }

    console.log('🔌 Initializing Prisma Client...')
    console.log('📍 DATABASE_URL format:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'))

    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Test connection immediately (async IIFE)
    ;(async () => {
      try {
        console.log('🔄 Testing database connection...')
        await client.$connect()
        await client.$queryRaw`SELECT 1`
        console.log('✅ Database connection successful')
        console.log('✅ Database query test passed')
      } catch (error: any) {
        console.error('❌ Database connection failed:', error.message)
        console.error('📍 Connection string:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))

        if (error.message.includes('authentication failed') || error.message.includes('password authentication failed')) {
          console.error('💡 Authentication failed - Check your database credentials')
          console.error('   - Username: Check POSTGRES_USER or DATABASE_URL username')
          console.error('   - Password: Check POSTGRES_PASSWORD or DATABASE_URL password')
        }
        if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
          console.error('💡 Connection refused - Check if PostgreSQL is running')
          console.error('   - Host: Verify the database host is accessible')
          console.error('   - Port: Verify the port is correct (default: 5432)')
        }
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          console.error('💡 Connection timeout - Network issue')
          console.error('   - Check firewall rules')
          console.error('   - Verify host/port are correct')
          console.error('   - Check if the database server is online')
        }
        if (error.message.includes('getaddrinfo ENOTFOUND') || error.message.includes('ENOTFOUND')) {
          console.error('💡 Host not found - DNS resolution failed')
          console.error('   - Check if the hostname is correct')
          console.error('   - Try using an IP address instead')
        }

        console.error('⚠️  Application will run in localStorage fallback mode')
        console.error('⚠️  Authentication features will not work without database connection')
      }
    })()

    return client
  } catch (error: any) {
    console.error('❌ Failed to create Prisma Client:', error.message)
    console.warn('⚠️  Using localStorage fallback mode')
    return null
  }
}

export const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) {
  global.prisma = prisma
}

// Helper para verificar se o banco está disponível
export const isDatabaseAvailable = async (): Promise<boolean> => {
  if (!prisma) return false
  
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

// Função utilitária para retry em operações do banco
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Se for erro de conexão (código 10054), fazer retry
      if (lastError.message.includes('10054') || lastError.message.includes('ConnectionReset')) {
        if (attempt < maxRetries) {
          console.log(`Database connection failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
          continue
        }
      }
      
      // Para outros erros, não fazer retry
      throw lastError
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}