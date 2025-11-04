'use client'

import { WifiOff, RefreshCw, Camera, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OfflinePage() {
  return (
    <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-orange-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Você está offline</h1>
            <p className="text-gray-600 mt-2">
              Não conseguimos conectar à internet no momento
            </p>
          </div>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Não se preocupe! Você ainda pode usar o AnchorView offline. 
            Seus dados serão sincronizados automaticamente quando a conexão retornar.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Recursos Disponíveis Offline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Capturar fotos de inspeção</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Inserir números de lacre</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Visualizar dados salvos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Criar pontos de ancoragem</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="w-full"
          >
            Voltar
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Quando a conexão retornar, seus dados serão sincronizados automaticamente em segundo plano
          </p>
        </div>
      </div>
    </div>
  )
}