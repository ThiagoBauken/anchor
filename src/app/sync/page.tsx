"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Upload,
  Database,
  Smartphone
} from 'lucide-react';
import { hybridDataManager } from '@/lib/hybrid-data-manager';

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic';

export default function SyncPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingItems, setPendingItems] = useState({ points: 0, tests: 0, total: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<any>(null);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Monitora conectividade
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Carrega dados iniciais
    loadSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSyncStatus = () => {
    const pending = hybridDataManager.getPendingItems();
    setPendingItems(pending);
    
    const lastSync = localStorage.getItem('lastSyncTime');
    setLastSyncTime(lastSync);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Sem conexão com a internet!');
      return;
    }

    setSyncInProgress(true);
    setSyncResults(null);
    
    try {
      const results = await hybridDataManager.manualSync();
      setSyncResults(results);
      
      if (results.success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('lastSyncTime', now);
        loadSyncStatus(); // Atualiza contadores
      }
    } catch (error) {
      setSyncResults({ 
        success: false, 
        synced: 0, 
        errors: [`Erro na sincronização: ${error}`] 
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const exportData = () => {
    const data = hybridDataManager.exportOfflineData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchorview_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Status de Sincronização</h1>
        <p className="text-muted-foreground">
          Monitore e gerencie a sincronização entre dados offline e servidor
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Connection Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conexão</CardTitle>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'Conectado ao servidor' : 'Trabalhando offline'}
            </p>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems.total}</div>
            <p className="text-xs text-muted-foreground">
              {pendingItems.points} pontos, {pendingItems.tests} testes
            </p>
          </CardContent>
        </Card>

        {/* Last Sync */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastSyncTime ? formatLastSync(lastSyncTime) : 'Nunca'}
            </div>
            <p className="text-xs text-muted-foreground">
              Sincronização mais recente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Manual Sync */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sincronização Manual
            </CardTitle>
            <CardDescription>
              Force a sincronização dos dados pendentes com o servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingItems.total > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Existem {pendingItems.total} itens aguardando sincronização.
                  </AlertDescription>
                </Alert>
              )}
              
              {syncInProgress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Sincronizando...</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}
              
              <Button 
                onClick={handleManualSync}
                disabled={!isOnline || syncInProgress || pendingItems.total === 0}
                className="w-full"
              >
                {syncInProgress ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciamento de Dados
            </CardTitle>
            <CardDescription>
              Faça backup e gerencie seus dados offline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dados Locais</div>
                  <div className="text-sm text-muted-foreground">
                    {pendingItems.points + pendingItems.tests} itens armazenados
                  </div>
                </div>
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
              
              <Button 
                onClick={exportData}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Results */}
      {syncResults && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={syncResults.success ? "default" : "destructive"}>
                  {syncResults.success ? 'Sucesso' : 'Erro'}
                </Badge>
                <span className="text-sm">
                  {syncResults.synced} itens sincronizados
                </span>
              </div>
              
              {syncResults.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-red-600">Erros:</div>
                  {syncResults.errors.map((error: string, index: number) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Armazenamento</CardTitle>
          <CardDescription>
            Detalhes sobre o uso de armazenamento local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Pontos de Ancoragem</div>
              <div className="text-2xl font-bold">{pendingItems.points}</div>
              <div className="text-xs text-muted-foreground">
                Salvos localmente
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Testes Realizados</div>
              <div className="text-2xl font-bold">{pendingItems.tests}</div>
              <div className="text-xs text-muted-foreground">
                Salvos localmente
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}