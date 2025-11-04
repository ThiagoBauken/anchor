"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Building2, Activity, Target, TestTube, 
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Clock, Database, HardDrive,
  Wifi, Shield, BarChart3
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalCompanies: number;
    activeCompanies: number;
    trialCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalPoints: number;
    totalTests: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    avgPointsPerProject: number;
    avgTestsPerPoint: number;
    topCompanyByUsage: string;
    systemUptime: number;
    lastBackupDate: string | null;
  };
  recentCompanies: any[];
  recentActivity: any[];
  chartData: any[];
  systemHealth: {
    status: string;
    timestamp: string;
    services: {
      database: string;
      storage: string;
      sync: string;
      backup: string;
    };
    metrics: {
      responseTime: number;
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      activeConnections: number;
      queueLength: number;
    };
    alerts: string[];
  } | null;
  subscriptionStats: any[];
  planStats: any[];
}

export default function DashboardMetrics() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/admin/dashboard', { method: 'POST' });
      await loadDashboard();
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        Erro ao carregar dados do dashboard
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
      case 'active':
      case 'current':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'slow':
      case 'overloaded':
      case 'outdated':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'critical':
      case 'inactive':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatUptime = (days: number) => {
    if (days < 1) return '< 1 dia';
    if (days < 30) return `${days} dias`;
    if (days < 365) return `${Math.floor(days / 30)} meses`;
    return `${Math.floor(days / 365)} anos`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Sistema</h1>
          <p className="text-muted-foreground">
            Visão geral e métricas do AnchorView
          </p>
        </div>
        <Button 
          onClick={refreshMetrics} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* System Health Alert */}
      {data.systemHealth && data.systemHealth.status !== 'healthy' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-800">
                Sistema em estado: {data.systemHealth.status}
              </span>
            </div>
            {data.systemHealth.alerts.length > 0 && (
              <ul className="mt-2 space-y-1">
                {data.systemHealth.alerts.map((alert, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {alert}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.activeCompanies} ativas, {data.stats.suspendedCompanies} suspensas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.activeUsers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos de Ancoragem</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.avgPointsPerProject} por projeto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Realizados</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalTests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.avgTestsPerPoint} por ponto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.systemHealth ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Status Geral</span>
                  <Badge variant={data.systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                    {data.systemHealth.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="text-sm">Banco de Dados</span>
                    </div>
                    {getStatusIcon(data.systemHealth.services.database)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-sm">Armazenamento</span>
                    </div>
                    {getStatusIcon(data.systemHealth.services.storage)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm">Sincronização</span>
                    </div>
                    {getStatusIcon(data.systemHealth.services.sync)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Backup</span>
                    </div>
                    {getStatusIcon(data.systemHealth.services.backup)}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Dados de saúde não disponíveis</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.systemHealth ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU</span>
                    <span>{data.systemHealth.metrics.cpuUsage}%</span>
                  </div>
                  <Progress value={data.systemHealth.metrics.cpuUsage} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memória</span>
                    <span>{data.systemHealth.metrics.memoryUsage}%</span>
                  </div>
                  <Progress value={data.systemHealth.metrics.memoryUsage} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disco</span>
                    <span>{data.systemHealth.metrics.diskUsage}%</span>
                  </div>
                  <Progress value={data.systemHealth.metrics.diskUsage} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Conexões Ativas</p>
                    <p className="font-medium">{data.systemHealth.metrics.activeConnections}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tempo de Resposta</p>
                    <p className="font-medium">{data.systemHealth.metrics.responseTime}ms</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Dados de performance não disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.subscriptionStats.map((stat) => (
                <div key={stat.status} className="flex justify-between">
                  <span className="capitalize">{stat.status}</span>
                  <span className="font-medium">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.planStats.map((stat) => (
                <div key={stat.plan} className="flex justify-between">
                  <span className="capitalize">{stat.plan}</span>
                  <span className="font-medium">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Uptime do Sistema</p>
              <p className="font-medium">{formatUptime(data.stats.systemUptime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Último Backup</p>
              <p className="font-medium">
                {data.stats.lastBackupDate 
                  ? new Date(data.stats.lastBackupDate).toLocaleDateString()
                  : 'Nunca'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Empresa Top</p>
              <p className="font-medium">{data.stats.topCompanyByUsage}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empresas Recentes</CardTitle>
            <CardDescription>Últimas empresas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentCompanies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {company.usersCount} usuários • {company.projectsCount} projetos
                    </p>
                  </div>
                  <Badge variant={company.isTrialActive ? 'secondary' : 'default'}>
                    {company.subscriptionPlan || 'trial'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="text-sm">
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-muted-foreground">
                    {activity.companyName} • {activity.userName} • {' '}
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}