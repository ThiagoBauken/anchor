"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, Upload, Settings, Clock, HardDrive, 
  FileText, AlertTriangle, CheckCircle, Play, 
  RotateCcw, Trash2, Calendar, Database
} from 'lucide-react';

interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
  size: number;
  duration: number;
  tablesCount: number;
  filesCount: number;
  error?: string;
}

interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeFiles: boolean;
  lastBackup?: string;
  nextBackup?: string;
  backupSize?: number;
}

export default function BackupManagement() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    enabled: true,
    frequency: 'daily',
    retentionDays: 30,
    includeFiles: true
  });
  const [loading, setLoading] = useState(true);
  const [executingBackup, setExecutingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de backups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeManualBackup = async () => {
    setExecutingBackup(true);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeFiles: config.includeFiles,
          compress: true,
          encrypt: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Backup Executado',
          description: `Backup criado com ${result.result.size}MB em ${result.result.duration}s`
        });
        await loadBackups();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Erro ao executar backup:', error);
      toast({
        title: 'Erro no Backup',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setExecutingBackup(false);
    }
  };

  const updateConfig = async (newConfig: Partial<BackupConfig>) => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      if (response.ok) {
        const result = await response.json();
        setConfig(result.config);
        toast({
          title: 'Configuração Atualizada',
          description: 'Configurações de backup foram salvas'
        });
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar configuração',
        variant: 'destructive'
      });
    }
  };

  const restoreBackup = async (backupId: string) => {
    setRestoringId(backupId);
    try {
      const response = await fetch(`/api/admin/backup/${backupId}/restore`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: 'Restauração Concluída',
          description: 'Backup restaurado com sucesso'
        });
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: 'Erro na Restauração',
        description: error instanceof Error ? error.message : 'Erro ao restaurar backup',
        variant: 'destructive'
      });
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1024) {
      return `${sizeInMB} MB`;
    }
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Backup</h2>
          <p className="text-muted-foreground">
            Configure e gerencie backups automáticos do sistema
          </p>
        </div>
        <Button 
          onClick={executeManualBackup} 
          disabled={executingBackup}
          size="lg"
        >
          <Download className={`h-4 w-4 mr-2 ${executingBackup ? 'animate-spin' : ''}`} />
          {executingBackup ? 'Executando...' : 'Backup Manual'}
        </Button>
      </div>

      {/* Status Atual */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Backup</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config.enabled ? 'Ativo' : 'Inativo'}
            </div>
            <p className="text-xs text-muted-foreground">
              Frequência: {config.frequency}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config.lastBackup 
                ? new Date(config.lastBackup).toLocaleDateString()
                : 'Nunca'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {config.backupSize ? formatFileSize(config.backupSize) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config.nextBackup 
                ? new Date(config.nextBackup).toLocaleDateString()
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Automático
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Backup
          </CardTitle>
          <CardDescription>
            Configure como e quando os backups são executados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Backup Automático</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => updateConfig({ enabled })}
                />
                <span className="text-sm text-muted-foreground">
                  {config.enabled ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select
                value={config.frequency}
                onValueChange={(frequency: 'daily' | 'weekly' | 'monthly') => 
                  updateConfig({ frequency })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retenção (dias)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="365"
                value={config.retentionDays}
                onChange={(e) => updateConfig({ retentionDays: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Incluir Arquivos</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.includeFiles}
                  onCheckedChange={(includeFiles) => updateConfig({ includeFiles })}
                />
                <span className="text-sm text-muted-foreground">
                  Fotos e documentos
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Backups
          </CardTitle>
          <CardDescription>
            Últimos backups executados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum backup encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="font-medium">
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(backup.size)} • {formatDuration(backup.duration)} • {' '}
                        {backup.tablesCount} tabelas • {backup.filesCount} arquivos
                      </div>
                      {backup.error && (
                        <div className="text-sm text-red-600">
                          Erro: {backup.error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={backup.type === 'manual' ? 'default' : 'secondary'}>
                      {backup.type === 'manual' ? 'Manual' : 'Automático'}
                    </Badge>
                    
                    {backup.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                        disabled={restoringId === backup.id}
                      >
                        <RotateCcw className={`h-4 w-4 mr-1 ${
                          restoringId === backup.id ? 'animate-spin' : ''
                        }`} />
                        {restoringId === backup.id ? 'Restaurando...' : 'Restaurar'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}