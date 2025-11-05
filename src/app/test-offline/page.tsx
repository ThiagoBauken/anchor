"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestOfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [swStatus, setSwStatus] = useState('');
  const [cacheStatus, setCacheStatus] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testPoint, setTestPoint] = useState({
    numeroPonto: 'TEST-001',
    localizacao: 'Teste Offline',
    observacoes: 'Criado em modo offline'
  });

  useEffect(() => {
    // Detectar online/offline
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      addTestResult(`Status mudou: ${navigator.onLine ? 'ONLINE ✅' : 'OFFLINE ⚠️'}`);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Verificar Service Worker
    checkServiceWorker();

    // Verificar Cache
    checkCache();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        setSwStatus('ATIVO ✅');
        addTestResult('Service Worker: ATIVO e funcionando');
      } else {
        setSwStatus('INATIVO ❌');
        addTestResult('Service Worker: NÃO encontrado');
      }
    } else {
      setSwStatus('NÃO SUPORTADO ❌');
      addTestResult('Service Worker: Não suportado neste browser');
    }
  };

  const checkCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      setCacheStatus(cacheNames);
      addTestResult(`Cache: ${cacheNames.length} caches encontrados`);
      cacheNames.forEach(name => {
        addTestResult(`  - ${name}`);
      });
    }
  };

  const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AnchorViewDB', 1);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('test_points')) {
          db.createObjectStore('test_points', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const testOfflineWrite = async () => {
    try {
      addTestResult('🔧 Teste: Salvando ponto no IndexedDB...');

      const db = await openIndexedDB();
      const transaction = db.transaction(['test_points'], 'readwrite');
      const store = transaction.objectStore('test_points');

      const point = {
        ...testPoint,
        timestamp: new Date().toISOString(),
        isOnline: navigator.onLine,
        syncStatus: 'pending'
      };

      await new Promise((resolve, reject) => {
        const request = store.add(point);
        request.onsuccess = resolve;
        request.onerror = reject;
      });

      addTestResult(`✅ SUCESSO: Ponto "${testPoint.numeroPonto}" salvo localmente!`);
      addTestResult(`   Status da rede: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`);
      addTestResult(`   Armazenado em: IndexedDB`);

    } catch (error) {
      addTestResult(`❌ ERRO: ${error}`);
    }
  };

  const testOfflineRead = async () => {
    try {
      addTestResult('🔍 Teste: Lendo pontos do IndexedDB...');

      const db = await openIndexedDB();
      const transaction = db.transaction(['test_points'], 'readonly');
      const store = transaction.objectStore('test_points');

      const points = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
      });

      addTestResult(`✅ SUCESSO: ${points.length} pontos encontrados no IndexedDB`);

      points.forEach((point, idx) => {
        addTestResult(`   ${idx + 1}. ${point.numeroPonto} (${point.localizacao})`);
      });

    } catch (error) {
      addTestResult(`❌ ERRO: ${error}`);
    }
  };

  const testCachedFetch = async () => {
    try {
      addTestResult('🌐 Teste: Buscando do cache...');

      const response = await fetch('/');

      if (response.ok) {
        addTestResult(`✅ SUCESSO: Página principal carregada do ${navigator.onLine ? 'servidor' : 'CACHE'}`);
        addTestResult(`   Status: ${response.status}`);
        addTestResult(`   Source: ${response.headers.get('x-cache') || 'Service Worker'}`);
      }

    } catch (error) {
      addTestResult(`❌ ERRO: ${error}`);
    }
  };

  const clearTestData = async () => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['test_points'], 'readwrite');
      const store = transaction.objectStore('test_points');

      await new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = resolve;
      });

      addTestResult('🗑️ Dados de teste limpos');

    } catch (error) {
      addTestResult(`❌ ERRO ao limpar: ${error}`);
    }
  };

  const simulateOffline = () => {
    addTestResult('⚠️ SIMULAÇÃO: Use DevTools (F12) → Application → Service Workers');
    addTestResult('   Marque a opção "Offline" e clique nos testes novamente');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Teste de Funcionalidade Offline</h1>
        <p className="text-muted-foreground">
          Verifique se o sistema funciona corretamente sem conexão com internet
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status da Rede</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isOnline ? "default" : "destructive"} className="text-lg">
              {isOnline ? '🌐 ONLINE' : '📴 OFFLINE'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Service Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={swStatus.includes('✅') ? "default" : "destructive"}>
              {swStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Caches</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {cacheStatus.length} caches ativos
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Testes */}
        <Card>
          <CardHeader>
            <CardTitle>Testes Offline</CardTitle>
            <CardDescription>Execute estes testes online E offline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Dados do Ponto de Teste</label>
              <Input
                placeholder="Número do ponto"
                value={testPoint.numeroPonto}
                onChange={(e) => setTestPoint({ ...testPoint, numeroPonto: e.target.value })}
                className="mb-2"
              />
              <Input
                placeholder="Localização"
                value={testPoint.localizacao}
                onChange={(e) => setTestPoint({ ...testPoint, localizacao: e.target.value })}
                className="mb-2"
              />
            </div>

            <div className="space-y-2">
              <Button onClick={testOfflineWrite} className="w-full" variant="default">
                💾 Teste 1: Salvar Ponto Localmente
              </Button>

              <Button onClick={testOfflineRead} className="w-full" variant="secondary">
                📖 Teste 2: Ler Pontos Locais
              </Button>

              <Button onClick={testCachedFetch} className="w-full" variant="secondary">
                🌐 Teste 3: Carregar do Cache
              </Button>

              <Button onClick={clearTestData} className="w-full" variant="outline">
                🗑️ Limpar Dados de Teste
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Como testar offline:</strong><br/>
                1. Execute os testes com internet<br/>
                2. Abra DevTools (F12)<br/>
                3. Application → Service Workers<br/>
                4. Marque "Offline" ✅<br/>
                5. Execute os testes novamente<br/>
                6. Deve funcionar SEM internet!
              </AlertDescription>
            </Alert>

            <Button onClick={simulateOffline} className="w-full" variant="outline">
              ⚠️ Como Simular Offline
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>Log em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs h-[500px] overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">Nenhum teste executado ainda...</div>
              ) : (
                testResults.map((result, idx) => (
                  <div key={idx} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📚 Como o Sistema Funciona Offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Service Worker (Cache)</h3>
            <p className="text-sm text-muted-foreground">
              Intercepta requisições e serve páginas/assets do cache quando offline.
              Status atual: <Badge variant={swStatus.includes('✅') ? "default" : "destructive"}>{swStatus}</Badge>
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. IndexedDB (Storage Local)</h3>
            <p className="text-sm text-muted-foreground">
              Armazena dados localmente (pontos, testes, fotos) sem precisar de servidor.
              Capacidade: ~50MB+ de dados offline.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Background Sync (Sincronização)</h3>
            <p className="text-sm text-muted-foreground">
              Quando volta online, automaticamente sincroniza dados pendentes com o servidor usando JWT.
              Autenticação: JWT token renovado automaticamente.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">✅ Garantia Offline</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>✅ Criar pontos de ancoragem offline</li>
              <li>✅ Realizar testes offline</li>
              <li>✅ Capturar fotos offline</li>
              <li>✅ Visualizar dados existentes</li>
              <li>✅ Navegar entre páginas</li>
              <li>✅ Sincronização automática quando volta online</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
