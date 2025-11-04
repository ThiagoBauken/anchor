
"use client";

import { useOfflineData } from "@/context/OfflineDataContext";
import { useOfflineAuthSafe } from "@/context/OfflineAuthContext";
import { Mountain, ClipboardList, Map, TestTubeDiagonal, Users, FolderKanban, LayoutDashboard, ExternalLink, LogOut, MapPin, Shield, UsersRound, CloudUpload, Building2, Store } from "lucide-react";
import { ThemeToggle } from "./ui/theme-toggle";
import { LoadingOverlay } from "./ui/loading-spinner";
import { ResponsiveContainer, ResponsiveStack } from "./ui/responsive-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointsTab } from "./points-tab";
import { TestsTab } from "./tests-tab";
import { MapTab } from "./map-tab";
import { FacadesTab } from "./facades-tab";
import { ReportsTab } from "./reports-tab";
import { UsersTab } from "./users-tab";
import { ProjectsTab } from "./projects-tab";
import { TeamsTab } from "./teams-tab";
import { MarketplaceTab } from "./marketplace-tab";
import PhotoSyncManager from "./photo-sync-manager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DashboardTab } from "./dashboard-tab";
import { Button } from "./ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { InteractiveMap } from "./interactive-map";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { InspectionRemindersPopover } from "./inspection-reminders-popover";
import { ProjectInvitationsPopover } from "./project-invitations-popover";
import { SyncStatusIndicator } from "./sync-status-indicator";
import { TrialBanner } from "./trial-banner";
import { TrialExpiredOverlay } from "./trial-expired-overlay";

function UserProfile() {
  const { currentUser, logout, isOnline } = useOfflineAuthSafe();
  const router = useRouter();
  
  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'superadmin';

  const handleAdminDashboard = () => {
    router.push('/admin');
  };

  return (
    <ResponsiveStack direction={{ xs: 'col', sm: 'row' }} align="center" gap={3}>
       <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        <AvatarImage src={undefined} />
        <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-left hidden sm:block">
        <p className="text-sm font-medium text-foreground">{currentUser.name || currentUser.email}</p>
        <p className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'} 
          {isSuperAdmin && <span className="ml-1 text-yellow-600 dark:text-yellow-400">• Super Admin</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isSuperAdmin && (
          <Button variant="ghost" size="icon" onClick={handleAdminDashboard} title="Dashboard Admin">
            <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </ResponsiveStack>
  )
}

function CurrentProjectSelector() {
  const { projects, currentProject, setCurrentProject } = useOfflineData();

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
  const { currentProject, setActiveTab, activeTab, isLoading, currentUser } = useOfflineData();

  const navItems = [
      { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !currentProject },
      { value: 'projects', label: 'Projetos', icon: FolderKanban, disabled: false },
      { value: 'map', label: 'Mapa', icon: Map, disabled: !currentProject },
      { value: 'facades', label: 'Fachadas', icon: Building2, disabled: !currentProject },
      { value: 'points', label: 'Pontos', icon: Mountain, disabled: !currentProject },
      { value: 'tests', label: 'Testes', icon: TestTubeDiagonal, disabled: !currentProject },
      { value: 'reports', label: 'Relatórios', icon: ClipboardList, disabled: !currentProject },
      { value: 'teams', label: 'Equipes', icon: UsersRound, disabled: false },
      { value: 'marketplace', label: 'Marketplace', icon: Store, disabled: false, visible: currentUser?.role === 'company_admin' || currentUser?.role === 'superadmin' },
      { value: 'sync', label: 'Sync', icon: CloudUpload, disabled: false },
      { value: 'users', label: 'Usuários', icon: Users, disabled: false }, // Will be adapted for tenants
  ];

  return (
    <ResponsiveContainer className="p-4 md:p-8 relative">
      <LoadingOverlay isLoading={isLoading} text="Carregando dados...">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mountain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                AnchorView
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Gerenciamento de Pontos de Ancoragem
              </p>
            </div>
          </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
            <SyncStatusIndicator />
            <InspectionRemindersPopover />
            <ProjectInvitationsPopover />
            <div className="hidden sm:block">
              <UserProfile />
            </div>
            <div className="sm:hidden">
                <MobileNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </div>
      </header>
      
      <div className="mb-6 space-y-4">
        <TrialBanner />
        <CurrentProjectSelector />
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <div className="hidden md:block overflow-x-auto pb-2">
            <TabsList
              className="grid grid-flow-col auto-cols-fr w-full bg-primary/10 backdrop-blur-sm border-white/10"
              role="tablist"
              aria-label="Navegação principal"
            >
              {navItems.filter(item => item.visible !== false).map(item => (
                 <TabsTrigger
                   value={item.value}
                   disabled={item.disabled}
                   key={item.value}
                   role="tab"
                   aria-selected={activeTab === item.value}
                   aria-label={`${item.label}${item.disabled ? ' (desabilitado)' : ''}`}
                 >
                    <item.icon className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span>{item.label}</span>
                 </TabsTrigger>
              ))}
            </TabsList>
        </div>

        <TabsContent value="dashboard" role="tabpanel" aria-labelledby="dashboard-tab">
          {currentProject ? <DashboardTab /> : <ProjectNotSelected isDashboard={true} />}
        </TabsContent>
        <TabsContent value="projects" role="tabpanel" aria-labelledby="projects-tab">
          <ProjectsTab />
        </TabsContent>
        <TabsContent value="map" role="tabpanel" aria-labelledby="map-tab">
          {currentProject ? <MapTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="facades" role="tabpanel" aria-labelledby="facades-tab">
          {currentProject ? <FacadesTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="points" role="tabpanel" aria-labelledby="points-tab">
          {currentProject ? <PointsTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="tests" role="tabpanel" aria-labelledby="tests-tab">
          {currentProject ? <TestsTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="reports" role="tabpanel" aria-labelledby="reports-tab">
          {currentProject ? <ReportsTab /> : <ProjectNotSelected />}
        </TabsContent>
        <TabsContent value="teams" role="tabpanel" aria-labelledby="teams-tab">
          <TeamsTab />
        </TabsContent>
        <TabsContent value="marketplace" role="tabpanel" aria-labelledby="marketplace-tab">
          <MarketplaceTab />
        </TabsContent>
        <TabsContent value="sync" role="tabpanel" aria-labelledby="sync-tab">
          <PhotoSyncManager />
        </TabsContent>
        <TabsContent value="users" role="tabpanel" aria-labelledby="users-tab">
          <UsersTab />
        </TabsContent>
      </Tabs>
      </LoadingOverlay>
    </ResponsiveContainer>
  );
}

function ProjectNotSelected({ isDashboard = false }) {
    const { setActiveTab } = useOfflineData();
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
    <>
      <AnchorViewContent />
      <TrialExpiredOverlay />
    </>
  );
}
