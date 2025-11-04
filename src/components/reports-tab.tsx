
"use client";

import { useOfflineData } from '@/context/OfflineDataContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, Bot, FileText } from 'lucide-react';
import { exportToExcel, exportToCSV, exportToJSON, exportToWord, generatePdfReport } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { flagPointsForInspectionAction } from '@/app/actions';
import { useState } from 'react';
import { MapTab } from './map-tab';

function ReportSummary() {
  const { points, tests, currentProject, projects } = useOfflineData();

  // Get all points from all projects for the global stats
  const allPoints = points;
  
  // Points filtered by current project
  const projectPoints = points;
  const projectTests = tests.filter(t => projectPoints.some(p => p.id === t.pontoId));
  
  const totalTestedInProject = projectTests.length;
  const totalApprovedInProject = projectTests.filter(t => t.resultado === 'Aprovado').length;
  const totalRejectedInProject = totalTestedInProject - totalApprovedInProject;
  const approvalRateInProject = totalTestedInProject > 0 ? ((totalApprovedInProject / totalTestedInProject) * 100).toFixed(1) : '0';


  const equipmentGroups = projectPoints.reduce((acc, point) => {
    const key = point.tipoEquipamento || 'Não especificado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Projeto</CardTitle>
          <CardDescription>{currentProject?.name}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Total de Pontos: {projectPoints.length}</p>
          <p>Pontos Testados: {totalTestedInProject}</p>
          <p>Aprovados: {totalApprovedInProject}</p>
          <p>Reprovados: {totalRejectedInProject}</p>
          <p>Taxa de Aprovação: {approvalRateInProject}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Por Equipamento (no Projeto)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {Object.keys(equipmentGroups).length > 0 ? Object.entries(equipmentGroups).map(([equip, count]) => (
            <p key={equip}>{equip}: {count} unidades</p>
          )) : <p className='text-muted-foreground'>Nenhum ponto neste projeto.</p>}
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
           <CardDescription>Todos os projetos</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
           <p>Total de Projetos: {projects.length}</p>
           <p>Total de Pontos: {allPoints.length}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsTab() {
  const { points, tests, currentProject, users } = useOfflineData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  
  // Use a state to get the active floor plan, defaulting to the first one
  const [activeFloorPlan, setActiveFloorPlan] = useState(currentProject?.floorPlanImages?.[0] || '');

  const handleRunInspectionCheck = async () => {
    setIsLoading(true);
    toast({ title: 'Verificando pontos...', description: 'A IA está analisando os dados de inspeção.' });
    
    // Get all tests from context
    const allTests = tests;

    const aiInput = points.map(p => {
        const latestTest = allTests
            .filter((t: any) => t.pontoId === p.id)
            .sort((a: any, b: any) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())[0];

        return {
            id: p.id,
            type: p.tipoEquipamento || 'N/A',
            installationDate: p.dataInstalacao || new Date().toISOString().split('T')[0],
            inspectionFrequencyMonths: p.frequenciaInspecaoMeses || 12,
            lastInspectionDate: latestTest?.dataHora ? new Date(latestTest.dataHora).toISOString().split('T')[0] : undefined
        };
    });

    try {
        const result = await flagPointsForInspectionAction({ anchorPoints: aiInput });
        if (result.pointsNeedingInspection) {
            if (result.pointsNeedingInspection.length > 0) {
              toast({ title: 'Verificação Concluída', description: `${result.pointsNeedingInspection.length} pontos precisam de inspeção.` });
            } else {
              toast({ title: 'Verificação Concluída', description: 'Nenhum ponto precisa de inspeção no momento.' });
            }
        } else {
             toast({ title: 'Erro', description: 'A verificação da IA não retornou um resultado válido.', variant: 'destructive' });
        }
    } catch (error) {
        console.error(error);
        toast({ title: 'Erro na verificação', description: 'Ocorreu um erro ao consultar a IA.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    if(!currentProject || points.length === 0) {
        toast({ title: 'Nada para exportar', description: 'Este projeto não possui pontos cadastrados.', variant: 'destructive'});
        return;
    }

    const exportName = `relatorio_${currentProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`

    switch(format) {
        case 'excel':
            exportToExcel(points, tests, exportName);
            break;
        case 'csv':
            exportToCSV(points, tests, exportName);
            break;
        case 'json':
            exportToJSON(points, tests, exportName);
            break;
    }
  }
  
  const handleGenerateWord = async () => {
     if (!currentProject) {
         toast({ title: 'Nenhum projeto selecionado', description: 'Selecione um projeto para gerar o relatório.', variant: 'destructive' });
        return;
    };
    setIsGeneratingWord(true);
    toast({ title: 'Gerando DOCX...', description: 'Isso pode levar alguns instantes.' });
    try {
      const exportName = `relatorio_${currentProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      // Pass the active floor plan to the export function
      await exportToWord(currentProject, points, tests, users, null, exportName, activeFloorPlan);
      toast({ title: 'DOCX Gerado!', description: 'O download do seu relatório começará em breve.' });
    } catch(err) {
      console.error("DOCX Generation Error: ", err);
      toast({ title: 'Erro ao gerar DOCX', description: 'Não foi possível gerar o relatório.', variant: 'destructive' });
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!currentProject) {
         toast({ title: 'Nenhum projeto selecionado', description: 'Selecione um projeto para gerar o relatório.', variant: 'destructive' });
        return;
    };
    setIsGeneratingPdf(true);
    toast({ title: 'Gerando PDF...', description: 'Isso pode levar alguns instantes.' });
    try {
      // Pass the active floor plan to the export function
      await generatePdfReport(currentProject, points, tests, users, null, activeFloorPlan);
      toast({ title: 'PDF Gerado!', description: 'O download do seu relatório começará em breve.' });
    } catch(err) {
      console.error("PDF Generation Error: ", err);
      toast({ title: 'Erro ao gerar PDF', description: 'Não foi possível gerar o relatório.', variant: 'destructive' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <>
      <Card className="mt-4 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>📊 Exportação e Relatórios</CardTitle>
          <CardDescription>Gere relatórios completos com todos os dados coletados para o projeto <strong>{currentProject?.name}</strong>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ReportSummary />
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verificação Inteligente</CardTitle>
                <CardDescription>Use IA para verificar quais pontos no projeto atual precisam de inspeção.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRunInspectionCheck} disabled={isLoading || points.length === 0}>
                  <Bot className="mr-2 h-4 w-4" /> 
                  {isLoading ? 'Analisando...' : 'Verificar Pontos com IA'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados Brutos</CardTitle>
                <CardDescription>Baixe os dados do projeto atual.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={() => handleExport('excel')}>
                  <Download className="mr-2 h-4 w-4" /> Excel (XLSX)
                </Button>
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('json')}>
                  <Download className="mr-2 h-4 w-4" /> JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Relatórios Técnicos Completos</CardTitle>
                  <CardDescription>Gere relatórios em PDF ou Word, incluindo mapa, tabela de dados e fotos, para o projeto <strong>{currentProject?.name}</strong>.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                  <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf || points.length === 0}>
                      <FileText className="mr-2 h-4 w-4" />
                      {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
                  </Button>
                  <Button onClick={handleGenerateWord} disabled={isGeneratingWord || points.length === 0}>
                      <FileText className="mr-2 h-4 w-4" />
                      {isGeneratingWord ? 'Gerando Word...' : 'Gerar Relatório Word'}
                  </Button>
              </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      {/* 
        Render a hidden MapTab. This is a pragmatic way to ensure the map 
        component is mounted and available for html-to-image to capture, 
        even if the user hasn't visited the "Mapa" tab yet.
      */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <MapTab onActiveFloorPlanChange={setActiveFloorPlan}/>
      </div>
    </>
  );
}
