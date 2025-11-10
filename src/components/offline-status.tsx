'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Upload,
  Download
} from 'lucide-react'
import { syncManager } from '@/lib/sync-manager'
import { offlineDB } from '@/lib/indexeddb'

interface OfflineStatusProps {
  className?: string
  compact?: boolean
}

export function OfflineStatus({ className = '', compact = false }: OfflineStatusProps) {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [stats, setStats] = useState({
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0
  })
  const [dbStats, setDbStats] = useState<Record<string, number>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update stats periodically
  useEffect(() => {
    const updateStats = async () => {
      try {
        const syncStats = await syncManager.getSyncStats()
        setStats(syncStats)

        const dbStats = await offlineDB.getStats()
        setDbStats(dbStats)

        // Update last sync time
        const lastSyncTime = localStorage.getItem('lastSyncTime')
        setLastSync(lastSyncTime)
      } catch (error) {
        console.error('Failed to get stats:', error)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setSyncStatus('syncing')
    try {
      await syncManager.syncNow()
      setSyncStatus('idle')
      const now = new Date().toISOString()
      setLastSync(now)
      localStorage.setItem('lastSyncTime', now)
    } catch (error) {
      console.error('Manual sync failed:', error)
      setSyncStatus('error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'idle':
      default:
        return lastSync ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...'
      case 'error':
        return 'Erro na sincronização'
      case 'idle':
      default:
        return lastSync ? 'Sincronizado' : 'Aguardando'
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Online/Offline indicator */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-gray-600">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Sync status */}
        <div className="flex items-center gap-1">
          {getSyncStatusIcon()}
          <span className="text-xs text-gray-600">
            {getSyncStatusText()}
          </span>
        </div>

        {/* Pending items - Clicável */}
        {stats.pending > 0 && (
          <button
            onClick={() => router.push('/sync')}
            className="transition-transform hover:scale-105"
            title="Clique para ver detalhes dos itens pendentes"
          >
            <Badge variant="secondary" className="text-xs cursor-pointer">
              {stats.pending} pendente{stats.pending > 1 ? 's' : ''}
            </Badge>
          </button>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Status do Sistema</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || !isOnline}
              className="h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Modo Offline'}
              </span>
            </div>
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {isOnline ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>

          {/* Sync Status */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              {getSyncStatusIcon()}
              <span className="text-sm font-medium">Sincronização</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{getSyncStatusText()}</div>
              {lastSync && (
                <div className="text-xs text-gray-500">
                  Última: {new Date(lastSync).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Sync Queue Stats */}
          {(stats.pending > 0 || stats.failed > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {stats.pending > 0 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <Upload className="w-4 h-4 text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">
                      {stats.pending} Pendentes
                    </div>
                    <div className="text-xs text-yellow-600">
                      Aguardando sync
                    </div>
                  </div>
                </div>
              )}
              
              {stats.failed > 0 && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      {stats.failed} Falhas
                    </div>
                    <div className="text-xs text-red-600">
                      Erro no sync
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="w-4 h-4" />
              Dados Locais
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(dbStats).map(([table, count]) => (
                <div key={table} className="flex justify-between p-1 bg-gray-50 rounded">
                  <span className="capitalize">{table.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PWA Status */}
          <div className="text-xs text-gray-500 text-center">
            {isOnline 
              ? '🔄 Sincronização automática ativa' 
              : '📱 Funcionando offline - dados serão sincronizados quando conectar'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}