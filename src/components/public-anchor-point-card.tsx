'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Calendar, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PublicAnchorPointCardProps {
  point: any;
  showTestHistory: boolean;
  showPhotos: boolean;
}

export default function PublicAnchorPointCard({ point, showTestHistory, showPhotos }: PublicAnchorPointCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [tests, setTests] = useState<any[]>([]);

  // Load tests for this point
  useMemo(() => {
    if (typeof window !== 'undefined' && showTestHistory) {
      try {
        const stored = localStorage.getItem('anchor-tests');
        if (stored) {
          const allTests = JSON.parse(stored);
          const pointTests = allTests
            .filter((t: any) => t.pontoId === point.id)
            .sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
          setTests(pointTests);
        }
      } catch (error) {
        console.error('Error loading tests:', error);
      }
    }
  }, [point.id, showTestHistory]);

  // Status styling
  const statusConfig = {
    'Aprovado': {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300'
    },
    'Reprovado': {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300'
    },
    'Não Testado': {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300'
    }
  };

  const config = statusConfig[point.status as keyof typeof statusConfig] || statusConfig['Não Testado'];
  const StatusIcon = config.icon;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <Card className={`border-l-4 ${config.borderColor} hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
                Ponto {point.numeroPonto}
              </CardTitle>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <strong>Localização:</strong> {point.localizacao}
                </p>
                {point.numeroLacre && (
                  <p className="text-sm text-gray-600">
                    <strong>Lacre:</strong> {point.numeroLacre}
                  </p>
                )}
                {point.dataInstalacao && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Instalado em: {formatDate(point.dataInstalacao)}
                  </p>
                )}
              </div>
            </div>

            <Badge className={`${config.bgColor} ${config.color} border-0`}>
              {point.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Show point photo if enabled */}
          {showPhotos && point.foto && (
            <div className="mb-3">
              <img
                src={point.foto}
                alt={`Ponto ${point.numeroPonto}`}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto(point.foto)}
              />
            </div>
          )}

          {/* Basic Info */}
          {point.tipoEquipamento && (
            <p className="text-sm text-gray-600 mb-2">
              <strong>Equipamento:</strong> {point.tipoEquipamento}
            </p>
          )}

          {/* Expand/Collapse for more details */}
          {(showTestHistory && tests.length > 0) && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between"
              >
                <span>
                  {expanded ? 'Ocultar' : 'Ver'} Histórico de Testes ({tests.length})
                </span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {expanded && (
                <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded-lg">
                  {tests.map((test, index) => (
                    <div key={test.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={test.resultado === 'Aprovado' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {test.resultado}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(test.dataHora)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Carga: <strong>{test.carga}</strong></p>
                          <p className="text-gray-600">Tempo: <strong>{test.tempo}</strong></p>
                        </div>
                        <div>
                          <p className="text-gray-600">Técnico: <strong>{test.tecnico}</strong></p>
                        </div>
                      </div>

                      {test.observacoes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{test.observacoes}"
                        </p>
                      )}

                      {/* Test photos */}
                      {showPhotos && (test.fotoTeste || test.fotoPronto) && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {test.fotoTeste && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Foto do Teste</p>
                              <img
                                src={test.fotoTeste}
                                alt="Foto do teste"
                                className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                                onClick={() => setSelectedPhoto(test.fotoTeste)}
                              />
                            </div>
                          )}
                          {test.fotoPronto && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Foto Final</p>
                              <img
                                src={test.fotoPronto}
                                alt="Foto final"
                                className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                                onClick={() => setSelectedPhoto(test.fotoPronto)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No tests message */}
          {showTestHistory && tests.length === 0 && (
            <p className="text-sm text-gray-500 italic mt-2">
              Nenhum teste registrado ainda.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Foto - Ponto {point.numeroPonto}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
