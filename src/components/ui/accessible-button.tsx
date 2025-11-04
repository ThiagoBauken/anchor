'use client'

import { forwardRef } from 'react'
import { Button, ButtonProps } from './button'
import { cn } from '@/lib/utils'

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  isPressed?: boolean
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  controls?: string
  expanded?: boolean
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    ariaLabel, 
    ariaDescribedBy, 
    isPressed, 
    hasPopup,
    controls,
    expanded,
    className,
    children,
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Focus styles for better accessibility
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:outline-none',
          className
        )}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-pressed={isPressed}
        aria-haspopup={hasPopup}
        aria-controls={controls}
        aria-expanded={expanded}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'