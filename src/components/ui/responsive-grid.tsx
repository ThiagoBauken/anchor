'use client'

import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4 
}: ResponsiveGridProps) {
  const gridClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    `gap-${gap}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', gridClasses, className)}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: {
    xs?: 'row' | 'col'
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export function ResponsiveStack({
  children,
  className,
  direction = { xs: 'col', md: 'row' },
  gap = 4,
  align = 'start',
  justify = 'start'
}: ResponsiveStackProps) {
  const flexClasses = [
    'flex',
    direction.xs === 'col' ? 'flex-col' : 'flex-row',
    direction.sm && (direction.sm === 'col' ? 'sm:flex-col' : 'sm:flex-row'),
    direction.md && (direction.md === 'col' ? 'md:flex-col' : 'md:flex-row'),
    direction.lg && (direction.lg === 'col' ? 'lg:flex-col' : 'lg:flex-row'),
    `gap-${gap}`,
    `items-${align}`,
    justify === 'start' ? 'justify-start' :
    justify === 'center' ? 'justify-center' :
    justify === 'end' ? 'justify-end' :
    justify === 'between' ? 'justify-between' :
    justify === 'around' ? 'justify-around' :
    'justify-evenly'
  ].filter(Boolean).join(' ')

  return (
    <div className={cn(flexClasses, className)}>
      {children}
    </div>
  )
}

// Mobile-first container with proper breakpoints
export function ResponsiveContainer({ 
  children, 
  className,
  size = 'default'
}: { 
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
}) {
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    default: 'max-w-screen-lg',
    lg: 'max-w-screen-xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'mx-auto w-full px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}