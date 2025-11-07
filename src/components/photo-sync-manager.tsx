'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
  Trash2
} from 'lucide-react';
import {
  PhotoMetadata,
  getAllPhotoMetadata,
  syncAllPhotos,
  deletePhotoMetadata,
  isCapacitorAvailable
} from '@/lib/gallery-photo-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface PhotoSyncManagerProps {
  serverEndpoint?: string;
}

export default function PhotoSyncManager({
  serverEndpoint = '/api/sync/photos'
}: PhotoSyncManagerProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isNative = isCapacitorAvailable();

  useEffect(() => {
    loadPhotos();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const allPhotos = await getAllPhotoMetadata();
      setPhotos(allPhotos);
      console.log(`[PhotoSyncManager] Loaded ${allPhotos.length} photos from IndexedDB`);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as fotos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast({
        title: 'Sem conexão',
        description: 'Você precisa estar online para sincronizar.',
        variant: 'destructive'
      });
      return;
    }

    const pendingPhotos = photos.filter(p => !p.uploaded);

    if (pendingPhotos.length === 0) {
      toast({
        title: 'Nenhuma foto pendente',
        description: 'Todas as fotos já foram sincronizadas.'
      });
      return;
    }

    setSyncing(true);
    setSyncProgress(0);

    try {
      const successCount = await syncAllPhotos(
        pendingPhotos,
        serverEndpoint,
        (current, total) => {
          setSyncProgress((current / total) * 100);
        }
      );

      if (successCount === pendingPhotos.length) {
        toast({
          title: 'Sincronização completa',
          description: `${successCount} foto(s) enviada(s) com sucesso.`
        });
      } else {
        toast({
          title: 'Sincronização parcial',
          description: `${successCount} de ${pendingPhotos.length} foto(s) enviada(s).`,
          variant: 'destructive'
        });
      }

      // Reload photos to update status
      await loadPhotos();
    } catch (error) {
      console.error('Error syncing photos:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Ocorreu um erro ao enviar as fotos.',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const success = await deletePhotoMetadata(photoId);

      if (success) {
        toast({
          title: 'Foto removida',
          description: 'Os metadados da foto foram removidos com sucesso.'
        });
        // Recarregar lista de fotos
        await loadPhotos();
      } else {
        throw new Error('Failed to delete photo metadata');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a foto.',
        variant: 'destructive'
      });
    }
  };

  const pendingCount = photos.filter(p => !p.uploaded).length;
  const uploadedCount = photos.filter(p => p.uploaded).length;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ponto':
        return 'Ponto';
      case 'teste':
        return 'Teste';
      case 'teste-final':
        return 'Teste Final';
      default:
        return type;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Fotos</p>
                <p className="text-2xl font-bold">{photos.length}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <CloudOff className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sincronizadas</p>
                <p className="text-2xl font-bold text-green-600">{uploadedCount}</p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conexão</p>
                <p className="text-sm font-medium">
                  {isOnline ? (
                    <span className="text-green-600">Online</span>
                  ) : (
                    <span className="text-red-600">Offline</span>
                  )}
                </p>
              </div>
              {isOnline ? (
                <Cloud className="w-8 h-8 text-green-600" />
              ) : (
                <CloudOff className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sincronização de Fotos</CardTitle>
              <CardDescription>
                {isNative
                  ? 'Fotos salvas na galeria do celular'
                  : 'Modo web - funcionalidade limitada'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPhotos}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={handleSyncAll}
                disabled={!isOnline || syncing || pendingCount === 0}
                size="sm"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sincronizar Todas ({pendingCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {syncing && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando fotos...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Photos List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fotos ({photos.length})</CardTitle>
          <CardDescription>
            Gerencie as fotos capturadas e seus status de sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-violet-600" />
              <p className="text-gray-600">Carregando fotos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">Nenhuma foto capturada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-violet-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {photo.pontoNumero}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(photo.type)}
                        </Badge>
                        <Badge
                          variant={photo.uploaded ? 'default' : 'secondary'}
                          className={photo.uploaded ? 'bg-green-600' : 'bg-orange-600'}
                        >
                          {photo.uploaded ? 'Enviada' : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate" title={photo.fileName}>
                        {photo.fileName}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{photo.projectName}</span>
                        <span>•</span>
                        <span>{formatDate(photo.capturedAt)}</span>
                        {photo.fileSize && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(photo.fileSize)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {photo.uploaded ? (
                      <div className="text-green-600">
                        <Check className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="text-orange-600">
                        <CloudOff className="w-5 h-5" />
                      </div>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Foto</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover os metadados desta foto?
                            A foto permanecerá na galeria do celular.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePhoto(photo.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      {isNative && (
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-violet-600 mt-0.5" />
              <div className="text-sm text-violet-900">
                <strong>Armazenamento na Galeria:</strong> As fotos são salvas
                diretamente na galeria do seu celular com nomes estruturados.
                Apenas os metadados (~500 bytes) são armazenados localmente para
                sincronização. Você pode fazer backup das fotos via Google Photos
                ou iCloud normalmente.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
