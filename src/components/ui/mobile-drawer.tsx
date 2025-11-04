'use client'

import { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { FocusTrap } from './focus-trap'

interface MobileDrawerProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MobileDrawer({
  children,
  trigger,
  title,
  description,
  side = 'left',
  className,
  open: controlledOpen,
  onOpenChange
}: MobileDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, setOpen])

  const sideClasses = {
    left: 'left-0 top-0 h-full w-full max-w-sm translate-x-[-100%] data-[state=open]:translate-x-0',
    right: 'right-0 top-0 h-full w-full max-w-sm translate-x-[100%] data-[state=open]:translate-x-0',
    top: 'top-0 left-0 w-full h-full max-h-[50vh] translate-y-[-100%] data-[state=open]:translate-y-0',
    bottom: 'bottom-0 left-0 w-full h-full max-h-[50vh] translate-y-[100%] data-[state=open]:translate-y-0'
  }

  return (
    <>
      {trigger && (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed z-50 bg-background border shadow-lg transition-transform duration-300 ease-in-out',
          sideClasses[side],
          open && 'data-[state=open]',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        aria-describedby={description ? 'drawer-description' : undefined}
      >
        <FocusTrap enabled={open}>
          <div className="flex h-full flex-col">
            {/* Header */}
            {(title || description) && (
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  {title && (
                    <h2 id="drawer-title" className="text-lg font-semibold">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="drawer-description" className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar drawer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </FocusTrap>
      </div>
    </>
  )
}

// Quick mobile menu component
export function MobileMenu({ children }: { children: React.ReactNode }) {
  return (
    <MobileDrawer
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      }
      title="Menu"
      side="left"
    >
      {children}
    </MobileDrawer>
  )
}