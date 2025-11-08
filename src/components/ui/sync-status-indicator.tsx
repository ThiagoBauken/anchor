"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import { hybridDataManager } from '@/lib/hybrid-data-manager';

interface SyncStatusIndicatorProps {
  onManualSync?: () => void;
  showSyncButton?: boolean;
  compact?: boolean;
}

export function SyncStatusIndicator({
  onManualSync,
  showSyncButton = true,
  compact = false
}: SyncStatusIndicatorProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingItems, setPendingItems] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    // Monitora conectividade
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Carrega status inicial
    updateStatus();
    
    // Atualiza status periodicamente
    const interval = setInterval(updateStatus, 30000); // A cada 30 segundos
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = () => {
    const pending = hybridDataManager.getPendingItems();
    setPendingItems(pending.total);
    
    const lastSync = localStorage.getItem('lastSyncTime');
    setLastSyncTime(lastSync);
  };

  const handleSync = async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);

    try {
      if (onManualSync) {
        await onManualSync();
      } else {
        await hybridDataManager.manualSync();
      }

      updateStatus();

      // Reload page after short delay to refresh data from server
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncInProgress(false);
    }
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (syncInProgress) return 'bg-blue-500';
    if (pendingItems > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncInProgress) return 'Sincronizando...';
    if (pendingItems > 0) return `${pendingItems} pendente${pendingItems > 1 ? 's' : ''}`;
    return 'Sincronizado';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (pendingItems > 0) return <Clock className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Badge clicável quando há pendentes */}
        {pendingItems > 0 ? (
          <button
            onClick={() => router.push('/sync')}
            className="transition-transform hover:scale-105"
            title="Clique para ver detalhes dos itens pendentes"
          >
            <Badge variant="secondary" className={`${getStatusColor()} text-white cursor-pointer`}>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className="text-xs">{getStatusText()}</span>
              </div>
            </Badge>
          </button>
        ) : (
          <Badge variant="secondary" className={`${getStatusColor()} text-white`}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </div>
          </Badge>
        )}

        {showSyncButton && isOnline && pendingItems > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncInProgress}
            className="h-6 px-2"
            title="Sincronizar agora"
          >
            <RefreshCw className={`h-3 w-3 ${syncInProgress ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-background border rounded-lg">
      {/* Status Principal - Clicável quando há pendentes */}
      {pendingItems > 0 ? (
        <button
          onClick={() => router.push('/sync')}
          className="transition-transform hover:scale-105"
          title="Clique para ver detalhes dos itens pendentes"
        >
          <Badge variant="secondary" className={`${getStatusColor()} text-white cursor-pointer`}>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </Badge>
        </button>
      ) : (
        <Badge variant="secondary" className={`${getStatusColor()} text-white`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </Badge>
      )}

      {/* Indicador de Conexão */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Última Sincronização */}
      {lastSyncTime && (
        <div className="text-sm text-muted-foreground">
          Sync: {formatLastSync(lastSyncTime)}
        </div>
      )}

      {/* Indicador Offline */}
      {!isOnline && (
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-600">Modo Campo</span>
        </div>
      )}

      {/* Botão de Sincronização */}
      {showSyncButton && isOnline && pendingItems > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncInProgress}
          className="ml-auto"
        >
          {syncInProgress ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Hook para usar em outros componentes
export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingItems, setPendingItems] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      const pending = hybridDataManager.getPendingItems();
      setPendingItems(pending.total);
      
      const lastSync = localStorage.getItem('lastSyncTime');
      setLastSyncTime(lastSync);
    };

    updateStatus();
    
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(updateStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    pendingItems,
    lastSyncTime,
    hasConnection: isOnline,
    needsSync: pendingItems > 0,
    isOfflineMode: !isOnline
  };
}