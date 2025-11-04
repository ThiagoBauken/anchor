'use client';

/**
 * Analytics Dashboard Component
 *
 * Dashboard administrativo com estatísticas do sistema:
 * - Métricas gerais (empresas, usuários, projetos, pontos)
 * - Receita (mensal e anual)
 * - Assinaturas ativas/trials/expiradas
 * - Uso de storage
 * - Atividades recentes
 * - Gráficos e tendências
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SystemStats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalPoints: number;
  totalTests: number;
  storageUsed: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  avgPointsPerProject: number;
  avgTestsPerPoint: number;
  topCompanyByUsage: string;
  systemUptime: number;
  lastBackupDate: string;
}

interface AdminActivity {
  id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetName: string;
  description: string;
  timestamp: string;
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/activities?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [statsData, activitiesData] = await Promise.all([
        statsRes.json(),
        activitiesRes.json()
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Never') return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return '➕';
    if (action.includes('updated')) return '✏️';
    if (action.includes('deleted') || action.includes('deactivated')) return '🗑️';
    if (action.includes('suspended')) return '⏸️';
    if (action.includes('payment')) return '💳';
    return '📝';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Erro ao carregar estatísticas</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Administrativo</h2>
          <p className="text-sm text-gray-500 mt-1">
            Visão geral do sistema • Atualizado automaticamente
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          🔄 Atualizar
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Companies */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Empresas</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</div>
          <div className="flex gap-3 mt-3 text-xs">
            <span className="text-green-600">
              ✓ {stats.activeCompanies} ativas
            </span>
            <span className="text-orange-600">
              ⏱ {stats.trialCompanies} trial
            </span>
            <span className="text-red-600">
              ⏸ {stats.suspendedCompanies} suspensas
            </span>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Usuários</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
          <div className="flex gap-3 mt-3 text-xs">
            <span className="text-green-600">
              ✓ {stats.activeUsers} ativos
            </span>
            <span className="text-gray-400">
              {stats.totalUsers - stats.activeUsers} inativos
            </span>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Projetos</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalProjects}</div>
          <div className="mt-3 text-xs text-gray-500">
            Média de {stats.avgPointsPerProject.toFixed(1)} pontos/projeto
          </div>
        </div>

        {/* Points & Tests */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Pontos & Testes</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPoints}</div>
          <div className="mt-3 text-xs text-gray-500">
            {stats.totalTests} testes realizados
          </div>
        </div>
      </div>

      {/* Revenue & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-1">Receita</div>
          <div className="text-3xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
          <div className="mt-3 text-sm opacity-90">
            Este mês • {formatCurrency(stats.yearlyRevenue)} este ano
          </div>
        </div>

        {/* Subscriptions */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-4">Assinaturas</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeSubscriptions}
              </div>
              <div className="text-xs text-gray-500 mt-1">Ativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.trialSubscriptions}
              </div>
              <div className="text-xs text-gray-500 mt-1">Trial</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {stats.expiredSubscriptions}
              </div>
              <div className="text-xs text-gray-500 mt-1">Expiradas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & System Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Usage */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Storage Total</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.storageUsed.toFixed(2)} GB
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Maior uso: {stats.topCompanyByUsage}
          </div>
        </div>

        {/* System Uptime */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Sistema Online</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.systemUptime} dias
          </div>
          <div className="mt-3 text-xs text-green-600">
            ✓ Operacional
          </div>
        </div>

        {/* Last Backup */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Último Backup</div>
          <div className="text-lg font-medium text-gray-900">
            {formatDate(stats.lastBackupDate)}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Backups automáticos ativos
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Atividades Recentes</h3>
          <p className="text-sm text-gray-500 mt-1">Últimas 10 ações administrativas</p>
        </div>
        <div className="divide-y">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhuma atividade registrada
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getActionIcon(activity.action)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          por {activity.adminName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas de Uso</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pontos por projeto</span>
              <span className="font-medium">{stats.avgPointsPerProject.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Testes por ponto</span>
              <span className="font-medium">{stats.avgTestsPerPoint.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Usuários por empresa</span>
              <span className="font-medium">
                {stats.totalCompanies > 0 ? (stats.totalUsers / stats.totalCompanies).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Taxa de Conversão</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trial → Pago</span>
              <span className="font-medium text-green-600">
                {stats.trialCompanies > 0
                  ? ((stats.activeSubscriptions / stats.trialCompanies) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Empresas ativas</span>
              <span className="font-medium text-green-600">
                {stats.totalCompanies > 0
                  ? ((stats.activeCompanies / stats.totalCompanies) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Usuários ativos</span>
              <span className="font-medium text-green-600">
                {stats.totalUsers > 0
                  ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
