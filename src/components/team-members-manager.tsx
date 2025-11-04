'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseAuthSafe } from '@/context/DatabaseAuthContext';
import { Plus, Trash2, UserPlus, Crown, Eye, User } from 'lucide-react';
import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole
} from '@/app/actions/team-actions';
import { getUsersForCompany } from '@/app/actions/user-actions';
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

interface TeamMembersManagerProps {
  teamId: string;
  onUpdate: () => void;
}

export default function TeamMembersManager({ teamId, onUpdate }: TeamMembersManagerProps) {
  const { toast } = useToast();
  const { company } = useDatabaseAuthSafe();
  const [members, setMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adding, setAdding] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembers(teamId);
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!company?.id) return;
    try {
      const data = await getUsersForCompany(company.id);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    loadMembers();
    loadUsers();
  }, [teamId, company?.id]);

  const availableUsers = users.filter(
    user => !members.some(m => m.userId === user.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Selecione um usuário',
        variant: 'destructive'
      });
      return;
    }

    setAdding(true);
    try {
      const result = await addTeamMember(teamId, selectedUserId, 'member');
      if (result) {
        toast({
          title: 'Membro adicionado',
          description: 'O usuário foi adicionado à equipe.'
        });
        loadMembers();
        onUpdate();
        setSelectedUserId('');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o membro.',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const success = await removeTeamMember(memberId);
      if (success) {
        toast({
          title: 'Membro removido',
          description: 'O usuário foi removido da equipe.'
        });
        loadMembers();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive'
      });
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'leader' | 'member' | 'observer') => {
    try {
      const result = await updateTeamMemberRole(memberId, newRole);
      if (result) {
        toast({
          title: 'Cargo atualizado',
          description: 'O cargo do membro foi alterado.'
        });
        loadMembers();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o cargo.',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'observer':
        return <Eye className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'leader':
        return 'Líder';
      case 'observer':
        return 'Observador';
      default:
        return 'Membro';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Adicionar Membro
          </CardTitle>
          <CardDescription>
            Adicione usuários da sua empresa a esta equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    Todos os usuários já são membros
                  </div>
                ) : (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || adding}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe ({members.length})</CardTitle>
          <CardDescription>
            Gerencie os membros e seus cargos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum membro na equipe ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {member.user?.name || member.user?.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.user?.email}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {getRoleLabel(member.role)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Change Role */}
                    <Select
                      value={member.role}
                      onValueChange={(value: any) => handleChangeRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">Líder</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="observer">Observador</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Remove */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {member.user?.name || member.user?.email} da equipe?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Descrição dos Cargos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <strong>Líder:</strong> Pode gerenciar membros e tem acesso total aos projetos permitidos
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-gray-600 mt-0.5" />
            <div>
              <strong>Membro:</strong> Acesso padrão de acordo com as permissões do projeto
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <strong>Observador:</strong> Apenas visualização, sem permissão de edição
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
