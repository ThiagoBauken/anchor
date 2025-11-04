import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Modo de fallback quando o banco não está disponível
const createPrismaClient = () => {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set in environment variables')
      console.error('Please configure DATABASE_URL in your .env file or deployment environment')
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
        await client.$connect()
        console.log('✅ Database connection successful')
      } catch (error: any) {
        console.error('❌ Database connection failed:', error.message)
        if (error.message.includes('authentication failed')) {
          console.error('💡 Check your database credentials (username/password)')
        }
        if (error.message.includes('Connection refused')) {
          console.error('💡 Check if PostgreSQL is running and accessible')
        }
        if (error.message.includes('timeout')) {
          console.error('💡 Check database host and network connectivity')
        }
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