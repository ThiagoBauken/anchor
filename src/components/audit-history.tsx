'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Activity, Search, Filter, Download } from 'lucide-react';
import { hybridStorage } from '@/lib/hybrid-storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE';
  oldValues?: any;
  newValues: any;
  changes?: any;
  userId?: string;
  companyId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

interface AuditHistoryProps {
  companyId: string;
  entityType?: string;
  entityId?: string;
}

export default function AuditHistory({ companyId, entityType, entityId }: AuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [companyId, entityType, entityId]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, typeFilter]);

  const loadAuditLogs = () => {
    const auditLogs = hybridStorage.getAuditLogs(companyId, entityType, entityId);
    setLogs(auditLogs);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.includes(searchTerm)
      );
    }

    // Filtro por ação
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.entityType === typeFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'ARCHIVE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'ARCHIVE': return '📦';
      default: return '❓';
    }
  };

  const exportAuditLog = () => {
    const csvContent = [
      ['Data/Hora', 'Ação', 'Tipo', 'ID Entidade', 'Usuário', 'Alterações'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
        log.action,
        log.entityType,
        log.entityId,
        log.userId || 'Sistema',
        log.changes ? Object.keys(log.changes).join('; ') : 'N/A'
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const renderChanges = (changes: any) => {
    if (!changes) return null;

    return (
      <div className="mt-2 text-xs">
        <p className="font-medium text-gray-600 mb-1">Alterações:</p>
        {Object.entries(changes).map(([field, change]: [string, any]) => (
          <div key={field} className="mb-1">
            <span className="font-medium">{field}:</span>
            <span className="text-red-600 mx-1">{String(change.from)}</span>
            →
            <span className="text-green-600 mx-1">{String(change.to)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Histórico de Auditoria
          </CardTitle>
          <Button onClick={exportAuditLog} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CREATE">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
              <SelectItem value="ARCHIVE">Arquivo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Project">Projetos</SelectItem>
              <SelectItem value="AnchorPoint">Pontos</SelectItem>
              <SelectItem value="AnchorTest">Testes</SelectItem>
              <SelectItem value="User">Usuários</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum log de auditoria encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <span className="font-medium">{log.entityType}</span>
                          <span className="text-gray-500 text-sm">#{log.entityId.slice(-8)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </div>
                          
                          {log.userId && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.userId}
                            </div>
                          )}
                        </div>
                        
                        {renderChanges(log.changes)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Estatísticas */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">{logs.filter(l => l.action === 'CREATE').length}</div>
              <div className="text-gray-500">Criações</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">{logs.filter(l => l.action === 'UPDATE').length}</div>
              <div className="text-gray-500">Atualizações</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">{logs.filter(l => l.action === 'DELETE').length}</div>
              <div className="text-gray-500">Exclusões</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">{logs.filter(l => l.action === 'ARCHIVE').length}</div>
              <div className="text-gray-500">Arquivos</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}