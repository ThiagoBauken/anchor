import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Modo de fallback quando o banco não está disponível
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  } catch (error) {
    console.warn('Database connection failed, using localStorage fallback')
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