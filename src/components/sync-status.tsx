"use client";

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getSyncManager } from '@/lib/sync-manager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingItems, setPendingItems] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    const updateStatus = async () => {
      const syncManager = getSyncManager();
      const status = await syncManager.getSyncStatus();

      setIsOnline(status.isOnline);
      setPendingItems(status.pendingOperations);
      setLastSync(status.lastSync ? new Date(status.lastSync) : undefined);
    };

    // Atualiza status inicial
    updateStatus();

    // Atualiza a cada 5 segundos
    const interval = setInterval(updateStatus, 5000);

    // Listeners para mudanças de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🟢 Conexão Restaurada",
        description: "Sincronizando dados com o servidor...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "🔴 Modo Offline",
        description: "Os dados serão salvos localmente e sincronizados quando a conexão voltar.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const syncManager = getSyncManager();
      await syncManager.forceSync();
      
      toast({
        title: "✅ Sincronização Completa",
        description: "Todos os dados foram sincronizados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro na Sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days} dias atrás`;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Indicador de Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <Cloud className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">Offline</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">
              {isOnline ? 'Conectado ao servidor' : 'Trabalhando offline'}
            </p>
            <p className="text-xs text-muted-foreground">
              Última sync: {formatLastSync()}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Contador de Pendentes */}
        {pendingItems > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {pendingItems}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{pendingItems} {pendingItems === 1 ? 'item' : 'itens'} pendente(s)</p>
              <p className="text-xs text-muted-foreground">
                Será sincronizado quando online
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Botão de Sincronização Manual */}
        {isOnline && pendingItems > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleForceSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sincronizar agora</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Indicador de Sincronização Completa */}
        {isOnline && pendingItems === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Check className="h-4 w-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Tudo sincronizado!</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}