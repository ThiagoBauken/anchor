'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  children: React.ReactNode
}

export function LoadingOverlay({ isLoading, text = 'Carregando...', children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-2 p-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-medium">{text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function LoadingButton({ 
  isLoading, 
  children, 
  className,
  ...props 
}: {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <button 
      className={cn('flex items-center gap-2', className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}