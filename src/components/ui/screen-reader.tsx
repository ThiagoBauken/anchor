'use client'

import { cn } from '@/lib/utils'

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn(
      'sr-only absolute left-[-10000px] top-auto w-1 h-1 overflow-hidden',
      className
    )}>
      {children}
    </span>
  )
}

interface AnnouncementProps {
  message: string
  priority?: 'polite' | 'assertive'
  id?: string
}

export function LiveAnnouncement({ message, priority = 'polite', id }: AnnouncementProps) {
  return (
    <div
      id={id}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

// Hook for programmatic announcements
export function useAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return { announce }
}