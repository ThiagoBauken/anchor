/**
 * Get the base URL for the application
 * Works in both server and client environments
 * Automatically detects production/staging/development
 */
export function getBaseUrl(): string {
  // 1. Server-side: Use NEXT_PUBLIC_APP_URL if explicitly set
  if (typeof window === 'undefined') {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }

    // 2. Server-side: Try to get from request headers (Next.js 15+)
    // This requires being called in a server action/component with headers available
    try {
      const headers = require('next/headers').headers
      const headersList = headers()
      const host = headersList.get('host')
      const protocol = headersList.get('x-forwarded-proto') || 'http'

      if (host) {
        return `${protocol}://${host}`
      }
    } catch (error) {
      // Headers not available, continue to fallback
    }

    // 3. Fallback to localhost for development
    return 'http://localhost:9002'
  }

  // Client-side: Use window.location
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:9002'
}

/**
 * Get base URL synchronously from environment variable
 * Use this when you can't use async headers()
 */
export function getBaseUrlFromEnv(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'
}
