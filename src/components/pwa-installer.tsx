"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Wifi, WifiOff, RotateCw } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed'>('idle');

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('🚀 Service Worker registrado:', registration.scope);
          
          // Escutar mensagens do Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'sync-completed') {
              setSyncStatus('completed');
              setTimeout(() => setSyncStatus('idle'), 3000);
            }
          });

          // Aguardar Service Worker ficar ativo
          let serviceWorker;
          if (registration.installing) {
            serviceWorker = registration.installing;
          } else if (registration.waiting) {
            serviceWorker = registration.waiting;
          } else if (registration.active) {
            serviceWorker = registration.active;
          }

          if (serviceWorker) {
            if (serviceWorker.state === 'activated') {
              // SW já está ativo, pode registrar sync
              if ('sync' in window.ServiceWorkerRegistration.prototype) {
                (registration as any).sync?.register('background-sync-data').catch((error: any) => {
                  console.warn('⚠️ Não foi possível registrar background sync:', error);
                });
              }
            } else {
              // Aguardar SW ficar ativo
              serviceWorker.addEventListener('statechange', () => {
                if (serviceWorker.state === 'activated') {
                  if ('sync' in window.ServiceWorkerRegistration.prototype) {
                    (registration as any).sync?.register('background-sync-data').catch((error: any) => {
                      console.warn('⚠️ Não foi possível registrar background sync:', error);
                    });
                  }
                }
              });
            }
          }
        })
        .catch((error) => console.error('❌ Erro no Service Worker:', error));
    }

    // Detectar se pode ser instalado
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Detectar se já foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Monitorar status online/offline
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger manual sync quando voltar online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({ type: 'sync-request' });
          setSyncStatus('syncing');
        } catch (error) {
          console.warn('⚠️ Erro ao enviar mensagem para Service Worker:', error);
        }
      }
    };

    const handleOffline = () => setIsOnline(false);

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    // Verificar se já está instalado (heurística)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notificações habilitadas');
      }
    }
  };

  // Só mostrar se for instalável e não estiver instalado
  if (!isInstallable || isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Status de sincronização */}
        {syncStatus === 'syncing' && (
          <Card className="mb-2 border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <RotateCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sincronizando dados...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {syncStatus === 'completed' && (
          <Card className="mb-2 border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-green-700">
                <RotateCw className="h-4 w-4" />
                <span className="text-sm">Dados sincronizados!</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status online/offline */}
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-900">
            <Smartphone className="h-5 w-5" />
            Instalar AnchorView
          </CardTitle>
          <CardDescription className="text-violet-700">
            Instale como aplicativo para uso offline completo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm text-violet-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Funciona 100% offline
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Dados salvos no dispositivo
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Sincronização automática
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleInstall}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
            <Button 
              variant="outline"
              onClick={requestNotificationPermission}
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              🔔
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
