
"use client";

import { AnchorDataProvider, useAnchorData } from "@/context/AnchorDataContext";
import { Mountain, ClipboardList, Map, TestTubeDiagonal, Users, FolderKanban, LayoutDashboard, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointsTab } from "./points-tab";
import { TestsTab } from "./tests-tab";
import { MapTab } from "./map-tab";
import { ReportsTab } from "./reports-tab";
import { UsersTab } from "./users-tab";
import { ProjectsTab } from "./projects-tab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DashboardTab } from "./dashboard-tab";
import { Button } from "./ui/button";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";
import { InteractiveMap } from "./interactive-map";

function CurrentUserSelector() {
  const { users, currentUser, setCurrentUser } = useAnchorData();

  if (users.length === 0) return null;

  const handleUserChange = (userId: string) => {
    const user = users.find(u => u.id === userId) || null;
    setCurrentUser(user);
  };

  return (
    <Select onValueChange={handleUserChange} value={currentUser?.id || ''}>
      <SelectTrigger className="w-full md:w-56 bg-background/80 backdrop-blur-sm border-white/20">
        <SelectValue placeholder="Selecionar Usuário..." />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.name} ({user.role})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CurrentProjectSelector() {
  const { projects, currentProject, setCurrentProject } = useAnchorData();

  if (projects.length === 0) return null;

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || null;
    setCurrentProject(project);
  };

  return (
    <Select onValueChange={handleProjectChange} value={currentProject?.id || ''}>
      <SelectTrigger className="w-full md:w-56 bg-background/80 backdrop-blur-sm border-white/20">
        <SelectValue placeholder="Selecionar Projeto..." />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AnchorViewContent() {
  const { currentProject, setActiveTab, activeTab } = useAnchorData();
  
  const navItems = [
      { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !currentProject },
      { value: 'projects', label: 'Projetos', icon: FolderKanban, disabled: false },
      { value: 'map', label: 'Mapa', icon: Map, disabled: !currentProject },
      { value: 'points', label: 'Pontos', icon: Mountain, disabled: !currentProject },
      { value: 'tests', label: 'Testes', icon: TestTubeDiagonal, disabled: !currentProject },
      { value: 'reports', label: 'Relatórios', icon: ClipboardList, disabled: !currentProject },
      { value: 'users', label: 'Usuários', icon: Users, disabled: false },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mountain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  AnchorView
                </h1>
                <p className="text-white/60 mt-1 text-sm md:text-base">
                  Sistema de Gerenciamento de Pontos de Ancoragem
                </p>
              </div>
            </div>
            <div className="md:hidden">
              <MobileNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <CurrentUserSelector />
          <CurrentProjectSelector />
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <div className="hidden md:block overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-7 bg-primary/10 backdrop-blur-sm border-white/10">
              {navItems.map(item => (
                 <TabsTrigger value={item.value} disabled={item.disabled} key={item.value}>
                    <item.icon className="w-4 h-4 mr-2" /> {item.label}
                 </TabsTrigger>
              ))}
            </TabsList>
        </div>

        <TabsContent value="dashboard">
          {currentProject ? <DashboardTab /> : <ProjectNotSelected isDashboard={true} />}
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsTab />
        </TabsContent>
        <TabsContent value="map">
          {currentProject ? <MapTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="points">
          {currentProject ? <PointsTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="tests">
          {currentProject ? <TestsTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="reports">
          {currentProject ? <ReportsTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
       {/* 
        The hidden map container is now inside the MapTab component 
        to better control its lifecycle and ensure it's available when needed.
       */}
    </div>
  );
}

function ProjectNotSelected({ isDashboard = false }) {
    const { setActiveTab } = useAnchorData();
    return (
        <Card className="mt-4 bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <h3 className="text-lg font-semibold">{isDashboard ? "Bem-vindo ao AnchorView" : "Nenhum projeto selecionado"}</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                   {isDashboard ? "Para começar, crie um novo projeto ou selecione um existente na aba 'Projetos'." : "Por favor, selecione um projeto no menu do canto superior direito ou crie um novo para visualizar esta aba."}
                </p>
                <Button onClick={() => setActiveTab('projects')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ir para Projetos
                </Button>
            </CardContent>
        </Card>
    )
}

export function AnchorView() {
  return (
    <AnchorDataProvider>
      <AnchorViewContent />
    </AnchorDataProvider>
  );
}
