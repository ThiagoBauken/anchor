'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, Check, Wifi, WifiOff, Clock, RefreshCw as Sync } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { pwaIntegration } from '@/lib/pwa-integration'
import { indexedDBStorage } from '@/lib/indexeddb-storage'

interface PhotoData {
  id: string
  photo: string // base64
  lacreNumber: string
  timestamp: number
  location?: { lat: number; lng: number }
  synced: boolean
  retryCount: number
}

export function OfflinePhotoCapture({ anchorPointId }: { anchorPointId: string }) {
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [lacreNumber, setLacreNumber] = useState('')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isCapturing, setIsCapturing] = useState(false)
  const [syncStatus, setSyncStatus] = useState({ pendingPhotos: 0, pendingItems: 0 })
  const [isSyncing, setIsSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Monitor online status and PWA events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    const handlePWAEvent = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      if (type === 'sync-completed') {
        setIsSyncing(false)
        updateSyncStatus()
        toast({
          title: "Sincronização completa",
          description: `${data.type} sincronizado com sucesso`
        })
      } else if (type === 'sync-failed') {
        setIsSyncing(false)
        toast({
          title: "Falha na sincronização",
          description: "Tentaremos novamente automaticamente",
          variant: "destructive"
        })
      }
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('pwa-event', handlePWAEvent as EventListener)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('pwa-event', handlePWAEvent as EventListener)
    }
  }, [toast])

  // Load existing photos from IndexedDB on mount
  useEffect(() => {
    loadPhotos()
    updateSyncStatus()
  }, [anchorPointId])

  const loadPhotos = async () => {
    try {
      await indexedDBStorage.init()
      const savedPhotos = await indexedDBStorage.getPhotos(anchorPointId)
      setPhotos(savedPhotos)
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
      // Fallback to localStorage
      const saved = localStorage.getItem(`photos_${anchorPointId}`)
      if (saved) {
        setPhotos(JSON.parse(saved))
      }
    }
  }

  const updateSyncStatus = async () => {
    try {
      const status = await pwaIntegration.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Erro ao obter status de sync:', error)
    }
  }

  const savePhotoData = useCallback(async (newPhoto: PhotoData) => {
    try {
      // Save to IndexedDB via PWA integration
      await pwaIntegration.queuePhotoForSync({
        ...newPhoto,
        anchorPointId
      })
      
      // Update local state
      const updatedPhotos = [...photos, newPhoto]
      setPhotos(updatedPhotos)
      
      // Fallback to localStorage
      localStorage.setItem(`photos_${anchorPointId}`, JSON.stringify(updatedPhotos))
      
      // Update sync status
      updateSyncStatus()
      
    } catch (error) {
      console.error('Erro ao salvar foto:', error)
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }, [anchorPointId, photos, toast])

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        const maxSize = 1200
        let { width, height } = img
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: true }
      )
    })
  }

  const handleFileSelect = useCallback(async (file: File) => {
    if (!lacreNumber.trim()) {
      toast({
        title: "Número do lacre obrigatório",
        description: "Digite o número do lacre antes de capturar a foto",
        variant: "destructive"
      })
      return
    }

    setIsCapturing(true)
    
    try {
      const compressedImage = await compressImage(file)
      const location = await getCurrentLocation()
      
      const newPhoto: PhotoData = {
        id: crypto.randomUUID(),
        photo: compressedImage,
        lacreNumber: lacreNumber.trim(),
        timestamp: Date.now(),
        location,
        synced: false,
        retryCount: 0
      }
      
      await savePhotoData(newPhoto)
      setLacreNumber('')
      
      toast({
        title: "Foto capturada",
        description: isOnline ? "Sincronizando..." : "Salva para sincronização posterior"
      })
    } catch (error) {
      toast({
        title: "Erro ao processar foto",
        description: "Tente novamente",
        variant: "destructive"
      })
    } finally {
      setIsCapturing(false)
    }
  }, [lacreNumber, isOnline, compressImage, savePhotoData, toast])

  const syncPhoto = async (photo: PhotoData) => {
    try {
      const response = await fetch('/api/sync/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          anchorPointId,
          photo: photo.photo,
          lacreNumber: photo.lacreNumber,
          timestamp: photo.timestamp,
          location: photo.location
        })
      })
      
      if (response.ok) {
        const updatedPhotos = photos.map(p => 
          p.id === photo.id ? { ...p, synced: true } : p
        )
        setPhotos(updatedPhotos)
        localStorage.setItem(`photos_${anchorPointId}`, JSON.stringify(updatedPhotos))
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const pendingCount = photos.filter(p => !p.synced).length

  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Conecte-se à internet para sincronizar",
        variant: "destructive"
      })
      return
    }

    setIsSyncing(true)
    try {
      await pwaIntegration.manualSync()
      toast({
        title: "Sincronização iniciada",
        description: "Aguarde..."
      })
    } catch (error) {
      setIsSyncing(false)
      toast({
        title: "Erro na sincronização",
        description: "Tente novamente",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Captura de Fotos</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="w-3 h-3" />
                Offline
              </Badge>
            )}
            {(pendingCount > 0 || syncStatus.pendingItems > 0) && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {pendingCount + syncStatus.pendingItems} pendentes
              </Badge>
            )}
            {isSyncing && (
              <Badge variant="secondary" className="gap-1 animate-pulse">
                <Sync className="w-3 h-3 animate-spin" />
                Sincronizando
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lacre">Número do Lacre</Label>
          <Input
            id="lacre"
            type="text"
            placeholder="Digite o número do lacre"
            value={lacreNumber}
            onChange={(e) => setLacreNumber(e.target.value)}
            disabled={isCapturing}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={openCamera}
            disabled={!lacreNumber.trim() || isCapturing}
            className="gap-2"
          >
            <Camera className="w-4 h-4" />
            {isCapturing ? 'Processando...' : 'Câmera'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!lacreNumber.trim() || isCapturing}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Galeria
          </Button>

          <Button 
            variant="secondary"
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing || (pendingCount + syncStatus.pendingItems) === 0}
            className="gap-2"
          >
            <Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />
        
        {photos.length > 0 && (
          <div className="space-y-2">
            <Label>Fotos Capturadas ({photos.length})</Label>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(-6).map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={photo.photo}
                    alt={`Lacre ${photo.lacreNumber}`}
                    className="w-full h-full object-cover rounded border"
                  />
                  {photo.synced && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b">
                    {photo.lacreNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!isOnline && (
          <div className="text-sm text-muted-foreground text-center p-3 bg-orange-50 rounded">
            📱 Modo offline ativo. As fotos serão sincronizadas automaticamente quando a conexão retornar.
          </div>
        )}
      </CardContent>
    </Card>
  )
}