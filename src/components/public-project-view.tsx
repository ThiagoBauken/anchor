'use client';

import { useState, useMemo } from 'react';
import { Project, ProjectPublicSettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, AlertTriangle, CheckCircle, XCircle, MapPin, Calendar, Eye } from 'lucide-react';
import PublicAnchorPointCard from '@/components/public-anchor-point-card';
import PublicProblemReportForm from '@/components/public-problem-report-form';

interface PublicProjectViewProps {
  project: Project & { company?: any };
  settings: ProjectPublicSettings;
}

export default function PublicProjectView({ project, settings }: PublicProjectViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aprovado' | 'Reprovado' | 'Não Testado'>('all');
  const [showReportForm, setShowReportForm] = useState(false);

  // Get anchor points from localStorage (client-side only)
  const [anchorPoints, setAnchorPoints] = useState<any[]>([]);

  // Load anchor points on client side
  useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('anchor-points');
        if (stored) {
          const allPoints = JSON.parse(stored);
          const projectPoints = allPoints.filter(
            (p: any) => p.projectId === project.id && !p.archived
          );
          setAnchorPoints(projectPoints);
        }
      } catch (error) {
        console.error('Error loading anchor points:', error);
      }
    }
  }, [project.id]);

  // Filter anchor points
  const filteredPoints = useMemo(() => {
    return anchorPoints.filter(point => {
      // Status filter
      if (statusFilter !== 'all' && point.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          point.numeroPonto?.toLowerCase().includes(query) ||
          point.localizacao?.toLowerCase().includes(query) ||
          point.numeroLacre?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [anchorPoints, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = anchorPoints.length;
    const aprovados = anchorPoints.filter(p => p.status === 'Aprovado').length;
    const reprovados = anchorPoints.filter(p => p.status === 'Reprovado').length;
    const naoTestados = anchorPoints.filter(p => p.status === 'Não Testado').length;

    return { total, aprovados, reprovados, naoTestados };
  }, [anchorPoints]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.obraAddress && (
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {project.obraAddress}
                </p>
              )}
              {project.company?.name && (
                <p className="text-sm text-gray-500 mt-1">
                  Gerenciado por: {project.company.name}
                </p>
              )}
            </div>
          </div>

          {/* Welcome Message */}
          {settings.welcomeMessage && (
            <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <p className="text-sm text-gray-700">{settings.welcomeMessage}</p>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-600 mt-1">Total de Pontos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div className="text-3xl font-bold text-green-600">{stats.aprovados}</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Aprovados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div className="text-3xl font-bold text-red-600">{stats.reprovados}</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Reprovados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  <div className="text-3xl font-bold text-yellow-600">{stats.naoTestados}</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Não Testados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por número do ponto, localização ou lacre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Todos ({stats.total})
                </Button>
                <Button
                  variant={statusFilter === 'Aprovado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Aprovado')}
                >
                  Aprovados ({stats.aprovados})
                </Button>
                <Button
                  variant={statusFilter === 'Reprovado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Reprovado')}
                >
                  Reprovados ({stats.reprovados})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anchor Points List */}
        <div className="space-y-4 mb-8">
          {filteredPoints.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <p>Nenhum ponto de ancoragem encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPoints.map(point => (
              <PublicAnchorPointCard
                key={point.id}
                point={point}
                showTestHistory={settings.showTestHistory}
                showPhotos={settings.showPhotos}
              />
            ))
          )}
        </div>

        {/* Report Problem Button */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Encontrou algum problema?
            </CardTitle>
            <CardDescription>
              Se você identificou alguma irregularidade ou problema de segurança, por favor, nos informe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showReportForm ? (
              <PublicProblemReportForm
                projectId={project.id}
                onSuccess={() => setShowReportForm(false)}
                onCancel={() => setShowReportForm(false)}
              />
            ) : (
              <Button onClick={() => setShowReportForm(true)} variant="default">
                Reportar Problema
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sistema de Gerenciamento de Ancoragens - AnchorView</p>
          <p className="mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </main>
    </div>
  );
}
