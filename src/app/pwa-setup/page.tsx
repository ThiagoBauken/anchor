'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Bell,
  Camera,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

// Lazy load client-only components
const OfflinePhotoCapture = dynamic(() => import('@/components/offline-photo-capture').then(mod => ({ default: mod.OfflinePhotoCapture })), {
  ssr: false,
  loading: () => <p>Loading camera...</p>
})

// Client-only component wrapper to prevent SSR/SSG
function PWASetupPageClient() {
  const [isMounted, setIsMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [swStatus, setSWStatus] = useState<'not-supported' | 'not-registered' | 'registered' | 'error'>('not-supported')
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [syncStatus, setSyncStatus] = useState({ pendingPhotos: 0, pendingItems: 0, isOnline: false, lastSync: null })
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Mount check to prevent SSR/SSG issues
  useEffect(() => {
    setIsMounted(true)
    setIsOnline(navigator.onLine)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    // Check initial states
    checkServiceWorkerStatus()
    checkInstallationStatus()
    checkNotificationPermission()
    updateSyncStatus()

    // Listen for events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isMounted])

  const checkServiceWorkerStatus = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        setSWStatus(registration ? 'registered' : 'not-registered')
      } catch (error) {
        setSWStatus('error')
      }
    } else {
      setSWStatus('not-supported')
    }
  }

  const checkInstallationStatus = () => {
    const installed = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone ||
                     document.referrer.includes('android-app://')
    setIsInstalled(installed)
  }

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  const updateSyncStatus = async () => {
    try {
      const { pwaIntegration } = await import('@/lib/pwa-integration')
      const status = await pwaIntegration.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Erro ao obter status:', error)
    }
  }

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('Install outcome:', outcome)
      setDeferredPrompt(null)
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
    }
  }

  const handleRequestNotifications = async () => {
    const { pwaIntegration } = await import('@/lib/pwa-integration')
    const granted = await pwaIntegration.requestNotificationPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
  }

  const handleManualSync = async () => {
    try {
      const { pwaIntegration } = await import('@/lib/pwa-integration')
      await pwaIntegration.manualSync()
      await updateSyncStatus()
    } catch (error) {
      console.error('Erro na sincronização:', error)
    }
  }

  const handleRegisterSW = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js')
      setSWStatus('registered')
    } catch (error) {
      setSWStatus('error')
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
  )

  // Only render after mount to prevent SSR/SSG issues
  if (!isMounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Loading PWA Setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">PWA Setup & Test</h1>
        <p className="text-muted-foreground">
          Configure e teste os recursos do Progressive Web App
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Status do Sistema PWA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>Conexão</span>
              </div>
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <StatusIcon status={swStatus === 'registered'} />
                <span>Service Worker</span>
              </div>
              <Badge variant={swStatus === 'registered' ? "default" : "destructive"}>
                {swStatus === 'registered' ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <StatusIcon status={isInstalled} />
                <span>App Instalado</span>
              </div>
              <Badge variant={isInstalled ? "default" : "secondary"}>
                {isInstalled ? "Sim" : "Não"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                <StatusIcon status={notificationPermission === 'granted'} />
                <span>Notificações</span>
              </div>
              <Badge variant={notificationPermission === 'granted' ? "default" : "secondary"}>
                {notificationPermission === 'granted' ? "Ativadas" : "Desativadas"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Install PWA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Instalar App
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isInstalled ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  App já está instalado
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Instale o AnchorView como app nativo
                </p>
                <Button 
                  onClick={handleInstallPWA}
                  disabled={!deferredPrompt}
                  className="w-full"
                >
                  Instalar PWA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Worker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Service Worker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {swStatus === 'registered' ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Service Worker ativo
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ativar cache offline e sync
                </p>
                <Button 
                  onClick={handleRegisterSW}
                  disabled={swStatus === 'not-supported'}
                  className="w-full"
                >
                  {swStatus === 'not-supported' ? 'Não Suportado' : 'Ativar SW'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notificationPermission === 'granted' ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Notificações ativadas
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Receba alertas de sincronização
                </p>
                <Button 
                  onClick={handleRequestNotifications}
                  disabled={notificationPermission === 'denied'}
                  className="w-full"
                >
                  {notificationPermission === 'denied' ? 'Bloqueadas' : 'Ativar'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Status de Sincronização
            <Button 
              variant="outline" 
              size="sm" 
              onClick={updateSyncStatus}
              className="ml-auto"
            >
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{syncStatus.pendingPhotos}</div>
              <div className="text-sm text-muted-foreground">Fotos Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{syncStatus.pendingItems}</div>
              <div className="text-sm text-muted-foreground">Itens na Fila</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {syncStatus.isOnline ? '✓' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">Status Rede</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {syncStatus.lastSync ? '✓' : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Último Sync</div>
            </div>
          </div>
          
          {syncStatus.lastSync && (
            <p className="text-sm text-muted-foreground text-center">
              Último sync: {new Date(syncStatus.lastSync).toLocaleString()}
            </p>
          )}
          
          <Button 
            onClick={handleManualSync}
            disabled={!isOnline || (syncStatus.pendingPhotos + syncStatus.pendingItems) === 0}
            className="w-full mt-4"
          >
            Sincronizar Agora
          </Button>
        </CardContent>
      </Card>

      {/* Photo Capture Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Teste de Captura Offline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Teste a captura de fotos offline com sincronização automática
          </p>
          <OfflinePhotoCapture anchorPointId="test-anchor-point" />
        </CardContent>
      </Card>
    </div>
  )
}

// Export default with client-only rendering
export default function PWASetupPage() {
  return <PWASetupPageClient />
}