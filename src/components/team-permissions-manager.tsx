'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useOfflineData } from '@/context/OfflineDataContext';
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext';
import { Building2, Plus, Trash2, Eye, Edit, Trash, Download, TestTube } from 'lucide-react';
import {
  getTeamProjectPermissions,
  grantTeamProjectPermission,
  revokeTeamProjectPermission,
  updateTeamProjectPermission
} from '@/app/actions/team-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface TeamPermissionsManagerProps {
  teamId: string;
  teamName: string;
  onUpdate: () => void;
}

export default function TeamPermissionsManager({ teamId, teamName, onUpdate }: TeamPermissionsManagerProps) {
  const { toast } = useToast();
  const { projects } = useOfflineData();
  const { user: currentUser } = useDatabaseAuthSafe();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [adding, setAdding] = useState(false);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await getTeamProjectPermissions(teamId);
      setPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [teamId]);

  const availableProjects = projects.filter(
    project => !permissions.some(p => p.projectId === project.id)
  );

  const handleAddPermission = async () => {
    if (!selectedProjectId) {
      toast({
        title: 'Selecione um projeto',
        variant: 'destructive'
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive'
      });
      return;
    }

    setAdding(true);
    try {
      const result = await grantTeamProjectPermission({
        teamId,
        projectId: selectedProjectId,
        grantedBy: currentUser.id,
        canView: true,
        canCreatePoints: true,
        canEditPoints: false,
        canDeletePoints: false,
        canExportReports: true,
        canTestPoints: true,
        canViewMap: true
      });

      if (result) {
        toast({
          title: 'Permissão concedida',
          description: 'A equipe agora tem acesso a este projeto.'
        });
        loadPermissions();
        onUpdate();
        setSelectedProjectId('');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível conceder a permissão.',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      const success = await revokeTeamProjectPermission(permissionId);
      if (success) {
        toast({
          title: 'Permissão revogada',
          description: 'A equipe não tem mais acesso a este projeto.'
        });
        loadPermissions();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível revogar a permissão.',
        variant: 'destructive'
      });
    }
  };

  const handleTogglePermission = async (
    permissionId: string,
    field: string,
    value: boolean
  ) => {
    try {
      const result = await updateTeamProjectPermission(permissionId, {
        [field]: value
      });

      if (result) {
        loadPermissions();
        toast({
          title: 'Permissão atualizada',
          description: 'As permissões foram alteradas.'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a permissão.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Permission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Conceder Acesso a Projeto
          </CardTitle>
          <CardDescription>
            Permita que a equipe acesse e trabalhe em projetos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um projeto..." />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    Todos os projetos já têm permissões configuradas
                  </div>
                ) : (
                  availableProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddPermission}
              disabled={!selectedProjectId || adding}
            >
              <Plus className="w-4 h-4 mr-2" />
              Conceder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos com Acesso ({permissions.length})</CardTitle>
          <CardDescription>
            Configure permissões granulares para cada projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma permissão configurada ainda.</p>
              <p className="text-sm mt-1">A equipe {teamName} não tem acesso a nenhum projeto.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {permissions.map(permission => (
                <Card key={permission.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-violet-600" />
                          {permission.project?.name || 'Projeto Desconhecido'}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Concedido em: {new Date(permission.grantedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* Remove Permission */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Revogar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar Acesso</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja revogar o acesso da equipe {teamName} ao projeto {permission.project?.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemovePermission(permission.id)}>
                              Revogar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* View Permission */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`view-${permission.id}`}
                          checked={permission.canView}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.id, 'canView', checked)
                          }
                        />
                        <Label
                          htmlFor={`view-${permission.id}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Visualizar</span>
                        </Label>
                      </div>

                      {/* Edit Permission */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`edit-${permission.id}`}
                          checked={permission.canEditPoints}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.id, 'canEditPoints', checked)
                          }
                        />
                        <Label
                          htmlFor={`edit-${permission.id}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </Label>
                      </div>

                      {/* Delete Permission */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`delete-${permission.id}`}
                          checked={permission.canDeletePoints}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.id, 'canDeletePoints', checked)
                          }
                        />
                        <Label
                          htmlFor={`delete-${permission.id}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                          <span>Excluir</span>
                        </Label>
                      </div>

                      {/* Export Permission */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`export-${permission.id}`}
                          checked={permission.canExportReports}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.id, 'canExportReports', checked)
                          }
                        />
                        <Label
                          htmlFor={`export-${permission.id}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Exportar</span>
                        </Label>
                      </div>

                      {/* Manage Tests Permission */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`tests-${permission.id}`}
                          checked={permission.canTestPoints}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.id, 'canTestPoints', checked)
                          }
                        />
                        <Label
                          htmlFor={`tests-${permission.id}`}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <TestTube className="w-4 h-4" />
                          <span>Testes</span>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Descrição das Permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Visualizar:</strong> Ver pontos, testes e relatórios
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Edit className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Editar:</strong> Modificar informações de pontos
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Trash className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Excluir:</strong> Arquivar ou deletar pontos
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Download className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Exportar:</strong> Gerar relatórios PDF/Excel
              </div>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <TestTube className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Gerenciar Testes:</strong> Criar e executar testes de carga
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
