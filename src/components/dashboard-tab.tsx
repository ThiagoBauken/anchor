
"use client";

import { useOfflineData } from '@/context/OfflineDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Clock, FileWarning, CameraOff, Construction, FolderKanban } from 'lucide-react';
import { useMemo } from 'react';

function DashboardStats() {
  const { points, tests, projects, inspectionFlags, getTestsByPoint } = useOfflineData();

  const dashboardData = useMemo(() => {
    const testedPoints = points.filter(p => p.status !== 'Não Testado');
    const pointsWithFinishedPhoto = testedPoints.filter(p => {
      const test = getTestsByPoint(p.id)[0]; // Get latest test
      return !!test?.fotoPronto;
    });
    const pointsMissingFinishedPhoto = testedPoints.length - pointsWithFinishedPhoto.length;

    return {
      totalPoints: points.length,
      tested: testedPoints.length,
      notTested: points.length - testedPoints.length,
      needsMaintenance: inspectionFlags.length,
      finishedPhoto: pointsWithFinishedPhoto.length,
      missingFinishedPhoto: pointsMissingFinishedPhoto,
      totalProjects: projects.length,
    };
  }, [points, tests, projects, inspectionFlags, getTestsByPoint]);

  const stats = [
    { label: 'Total de Pontos (Projeto)', value: dashboardData.totalPoints, icon: Construction, color: 'text-primary' },
    { label: 'Pontos Testados', value: dashboardData.tested, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Não Testados', value: dashboardData.notTested, icon: Clock, color: 'text-yellow-500' },
    { label: 'Necessita Manutenção', value: dashboardData.needsMaintenance, icon: AlertCircle, color: 'text-orange-500' },
    { label: 'Ponto Pronto (c/ Foto)', value: dashboardData.finishedPhoto, icon: CheckCircle, color: 'text-blue-500' },
    { label: 'Falta Foto do Ponto Pronto', value: dashboardData.missingFinishedPhoto, icon: CameraOff, color: 'text-red-500' },
    { label: 'Total de Projetos (Geral)', value: dashboardData.totalProjects, icon: FolderKanban, color: 'text-indigo-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardTab() {
  const { currentProject } = useOfflineData();
  return (
      <div className="space-y-6 mt-4">
          <Card className="bg-card/90 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Dashboard do Projeto: {currentProject?.name}</CardTitle>
                <CardDescription>Visão geral do status de todos os pontos de ancoragem no projeto atual.</CardDescription>
            </CardHeader>
            <CardContent>
                <DashboardStats />
            </CardContent>
          </Card>
      </div>
  )
}
