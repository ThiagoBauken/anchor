import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check if Prisma is available
        if (!prisma) {
          console.error('❌ Prisma client is null - database not available')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { company: true }
          })

          if (!user || !user.active || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            companyId: user.companyId,
            company: user.company
          }
        } catch (error) {
          console.error('❌ Database error in authorize:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth
      if (account?.provider === 'google' && profile?.email) {
        // Check if Prisma is available
        if (!prisma) {
          console.error('❌ Prisma client is null in signIn callback')
          return false
        }

        try {
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
            include: { company: true }
          })

          if (existingUser) {
            // Update image and emailVerified
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                image: (profile as any).picture || (profile as any).image || null,
                emailVerified: new Date(),
                lastLogin: new Date()
              }
            })
            return true
          } else {
            // User doesn't exist - need to complete registration
            // We'll handle this in the session callback
            return true
          }
        } catch (error) {
          console.error('❌ Database error in signIn callback:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.companyId = user.companyId
        token.company = user.company
      }

      // For Google OAuth users who need to complete setup
      if (account?.provider === 'google' && token.email) {
        // Check if Prisma is available
        if (!prisma) {
          console.error('❌ Prisma client is null in jwt callback')
          token.needsCompanySetup = true
        } else {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              include: { company: true }
            })

            if (!dbUser) {
              token.needsCompanySetup = true
            } else {
              token.role = dbUser.role
              token.companyId = dbUser.companyId
              token.company = dbUser.company
              token.needsCompanySetup = false
            }
          } catch (error) {
            console.error('❌ Database error in jwt callback:', error)
            token.needsCompanySetup = true
          }
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.role = session.role
        token.companyId = session.companyId
        token.company = session.company
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
        session.user.company = token.company as any
        session.user.needsCompanySetup = token.needsCompanySetup as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/setup' // Redirect new Google users here
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
