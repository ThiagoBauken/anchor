'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Shield, Building2 } from 'lucide-react';
import { getTeamsForCompany } from '@/app/actions/team-actions';
import TeamsList from './teams-list';
import CreateTeamDialog from './create-team-dialog';
import TeamDetailsDialog from './team-details-dialog';

export function TeamsTab() {
  const { user: currentUser, company } = useDatabaseAuthSafe();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const loadTeams = async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      const data = await getTeamsForCompany(company.id);
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: 'Erro ao carregar equipes',
        description: 'Não foi possível carregar as equipes.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [company?.id]);

  const handleTeamCreated = () => {
    loadTeams();
    setShowCreateDialog(false);
    toast({
      title: 'Equipe criada!',
      description: 'A equipe foi criada com sucesso.'
    });
  };

  const handleTeamUpdated = () => {
    loadTeams();
    setShowDetailsDialog(false);
    toast({
      title: 'Equipe atualizada!',
      description: 'As alterações foram salvas com sucesso.'
    });
  };

  const handleTeamDeleted = () => {
    loadTeams();
    setShowDetailsDialog(false);
    toast({
      title: 'Equipe desativada',
      description: 'A equipe foi desativada com sucesso.'
    });
  };

  const handleViewTeam = (team: any) => {
    setSelectedTeam(team);
    setShowDetailsDialog(true);
  };

  // Only company admins and superadmins can manage teams
  if (!currentUser || (currentUser.role !== 'company_admin' && currentUser.role !== 'superadmin')) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-semibold mb-2">Acesso Restrito</p>
              <p>Apenas administradores de empresa podem gerenciar equipes.</p>
              {currentUser && (
                <p className="text-sm mt-2 text-gray-400">
                  Seu perfil atual: <span className="font-semibold">{currentUser.role}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-violet-600" />
            Gestão de Equipes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie equipes de alpinismo e suas permissões de acesso aos projetos
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Equipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">
              {teams.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Projetos com Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {teams.reduce((acc, team) => acc + (team._count?.projectPermissions || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>Equipes Cadastradas</CardTitle>
          <CardDescription>
            Clique em uma equipe para ver detalhes, gerenciar membros e permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamsList
            teams={teams}
            loading={loading}
            onViewTeam={handleViewTeam}
            onRefresh={loadTeams}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleTeamCreated}
        companyId={currentUser?.companyId || ''}
      />

      {selectedTeam && (
        <TeamDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          team={selectedTeam}
          onUpdate={handleTeamUpdated}
          onDelete={handleTeamDeleted}
        />
      )}
    </div>
  );
}
