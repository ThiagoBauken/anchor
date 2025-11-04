import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    role?: string
    companyId?: string
    company?: any
  }

  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role?: string
      companyId?: string
      company?: any
      needsCompanySetup?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    companyId?: string
    company?: any
    needsCompanySetup?: boolean
  }
}
