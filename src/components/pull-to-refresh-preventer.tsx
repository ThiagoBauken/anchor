'use client'

import { useEffect } from 'react'

export function PullToRefreshPreventer() {
  useEffect(() => {
    let startY = 0
    let preventPullToRefresh = false

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      startY = e.touches[0].clientY
      preventPullToRefresh = window.scrollY === 0
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!preventPullToRefresh) return
      
      const y = e.touches[0].clientY
      const deltaY = y - startY
      
      // Se está tentando puxar para baixo quando já está no topo
      if (deltaY > 0 && window.scrollY === 0) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      preventPullToRefresh = false
    }

    // Adicionar listeners apenas em dispositivos touch
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false })
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })

      // Prevenir pull-to-refresh via CSS também
      document.body.style.overscrollBehavior = 'contain'
    }

    // Interceptar F5 e Ctrl+R
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 ou Ctrl+R
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
        
        // Em vez de recarregar, mostrar mensagem
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          // Forçar uso do cache do service worker
          window.location.href = window.location.href + '?offline-refresh=' + Date.now()
        } else {
          alert('App está em modo offline. Use os controles internos para atualizar dados.')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      if ('ontouchstart' in window) {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.body.style.overscrollBehavior = 'auto'
      }
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null // Componente invisível
}