"use client";

import { useEffect } from 'react';

export function ErrorSuppressor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Suppress clipboard errors and other non-critical console errors
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args) => {
        const message = args.join(' ');
        
        // Suppress specific error patterns
        if (
          message.includes('clipboard') ||
          message.includes('Copy to clipboard is not supported') ||
          message.includes('Sync failed') ||
          message.includes('404')
        ) {
          return; // Suppress these errors
        }
        
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        const message = args.join(' ');
        
        // Suppress specific warning patterns
        if (
          message.includes('clipboard') ||
          message.includes('allowedDevOrigins')
        ) {
          return; // Suppress these warnings
        }
        
        originalWarn.apply(console, args);
      };

      // Cleanup on unmount
      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);

  return null; // This component doesn't render anything
}