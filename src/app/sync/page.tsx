"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Smartphone,
  Trash2,
  MapPin,
  TestTube,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { hybridDataManager } from '@/lib/hybrid-data-manager';
import { useOfflineData } from '@/context/OfflineDataContext';

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic';

interface PendingItem {
  id: string;
  type: 'point' | 'test';
  numeroPonto?: string;
  projectId?: string;
  pontoId?: string;
  resultado?: string;
  syncStatus: string;
  lastModified: string;
}

export default function SyncPage() {
  const router = useRouter();
  const { refreshData } = useOfflineData();
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingItems, setPendingItems] = useState({ points: 0, tests: 0, total: 0 });
  const [pendingDetails, setPendingDetails] = useState<PendingItem[]>([]);
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

    // Atualiza status quando a página se torna visível novamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSyncStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadSyncStatus = () => {
    const pending = hybridDataManager.getPendingItems();
    setPendingItems(pending);

    // Load detailed list of pending items
    const points = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
    const tests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');

    const pendingPoints: PendingItem[] = points
      .filter((p: any) => !p.syncStatus || p.syncStatus === 'pending')
      .map((p: any) => ({
        id: p.id,
        type: 'point' as const,
        numeroPonto: p.numeroPonto,
        projectId: p.projectId,
        syncStatus: p.syncStatus,
        lastModified: p.lastModified || p.dataHora
      }));

    const pendingTests: PendingItem[] = tests
      .filter((t: any) => !t.syncStatus || t.syncStatus === 'pending')
      .map((t: any) => ({
        id: t.id,
        type: 'test' as const,
        pontoId: t.pontoId,
        resultado: t.resultado,
        syncStatus: t.syncStatus,
        lastModified: t.lastModified || t.dataHora
      }));

    setPendingDetails([...pendingPoints, ...pendingTests].sort((a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    ));

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

        // Refresh data from server to get updated state
        console.log('🔄 Refreshing data from server after sync...');
        await refreshData();

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

  const handleClearPending = () => {
    if (!confirm(`Deseja realmente LIMPAR todos os ${pendingItems.total} itens pendentes?\n\nEsta ação remove os itens do localStorage e NÃO pode ser desfeita!\n\nOs dados serão perdidos se não foram sincronizados com o servidor.`)) {
      return;
    }

    try {
      // Remove all pending items from localStorage
      const points = JSON.parse(localStorage.getItem('anchorViewPoints') || '[]');
      const tests = JSON.parse(localStorage.getItem('anchorViewTests') || '[]');

      const cleanedPoints = points.filter((p: any) => p.syncStatus && p.syncStatus !== 'pending');
      const cleanedTests = tests.filter((t: any) => t.syncStatus && t.syncStatus !== 'pending');

      localStorage.setItem('anchorViewPoints', JSON.stringify(cleanedPoints));
      localStorage.setItem('anchorViewTests', JSON.stringify(cleanedTests));

      alert(`✅ ${pendingItems.total} itens pendentes foram removidos.`);
      loadSyncStatus();
    } catch (error) {
      alert(`❌ Erro ao limpar pendentes: ${error}`);
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

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/app')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Menu
          </Button>
        </div>
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

      {/* Pending Items Detail List */}
      {pendingDetails.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Lista de Itens Pendentes ({pendingDetails.length})
            </CardTitle>
            <CardDescription>
              Todos os itens aguardando sincronização com o servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingDetails.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    {item.type === 'point' ? (
                      <MapPin className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <TestTube className="h-4 w-4 text-yellow-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {item.type === 'point' ? (
                          <>Ponto: {item.numeroPonto}</>
                        ) : (
                          <>Teste: {item.resultado}</>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {item.id.substring(0, 20)}... • Modificado: {formatDateTime(item.lastModified)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pendente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                size="lg"
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

              {pendingItems.total > 0 && (
                <>
                  <Separator />
                  <Button
                    onClick={handleClearPending}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Todos Pendentes
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Atenção: Esta ação remove os itens e não pode ser desfeita!
                  </p>
                </>
              )}
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
                  <div className="font-medium text-red-600 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Erros na Sincronização:
                  </div>
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
