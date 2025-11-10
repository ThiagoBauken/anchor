
"use client";

import { useState, useEffect } from 'react';
import { useOfflineData } from '@/context/OfflineDataContext';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Send, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCard } from './user-card';
import { InvitationCard } from './invitation-card';

interface Invitation {
  id: string;
  email?: string; // Optional since users enter email when accessing link
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  invite_url?: string;
  max_uses?: number;
  current_uses?: number;
  description?: string;
}

export function UsersTab() {
  const { users, addUser, deleteUser, currentUser } = useOfflineData();
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('technician');

  // Invite states
  const [inviteDescription, setInviteDescription] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('technician');
  const [maxUses, setMaxUses] = useState(1);
  const [isReusable, setIsReusable] = useState(false);
  const [description, setDescription] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  
  const { toast } = useToast();

  // Load invitations on mount (offline-first)
  useEffect(() => {
    if (currentUser?.role === 'company_admin' || currentUser?.role === 'superadmin') {
      loadInvitations();
    }
  }, [currentUser]);

  const loadInvitations = async () => {
    if (!currentUser?.companyId) return;

    setIsLoadingInvitations(true);
    try {
      // Use server action instead of API
      const { getPendingInvitations } = await import('@/app/actions/invitation-actions');
      const data = await getPendingInvitations(currentUser.companyId);

      setInvitations(data as any[]);

      // Cache for offline
      localStorage.setItem(`invitations_${currentUser.companyId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error loading invitations:', error);

      // Try to load from cache
      const cachedInvitations = localStorage.getItem(`invitations_${currentUser.companyId}`);
      if (cachedInvitations) {
        setInvitations(JSON.parse(cachedInvitations));
      }

      toast({
        title: 'Erro ao carregar convites',
        description: 'Não foi possível carregar os convites pendentes.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const [inviteEmail, setInviteEmail] = useState('');

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!inviteEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email obrigatório',
        description: 'Digite o email do usuário que deseja convidar.',
      });
      return;
    }

    // Check if currentUser exists
    if (!currentUser || !currentUser.companyId || !currentUser.id) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Usuário não está logado. Faça login novamente.',
      });
      return;
    }

    setIsInviting(true);
    try {
      // Use server action
      const { createInvitation } = await import('@/app/actions/invitation-actions');

      const result = await createInvitation({
        email: inviteEmail.trim(),
        role: inviteRole,
        companyId: currentUser.companyId,
        invitedBy: currentUser.id
      });

      if (result.success) {
        toast({
          title: 'Convite criado!',
          description: result.message,
        });

        // Copy invite URL to clipboard
        if (result.inviteUrl) {
          await navigator.clipboard.writeText(result.inviteUrl);
          toast({
            title: 'Link copiado!',
            description: 'O link de convite foi copiado para a área de transferência.',
          });
        }

        // Reset form
        setInviteEmail('');
        setInviteRole('technician');
        setInviteDescription('');

        // Reload invitations
        loadInvitations();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar convite',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Invite error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar convite',
        description: error.message || 'Erro desconhecido',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteUrl = async (inviteUrl: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: 'Link copiado!',
        description: 'O link de convite foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link.',
      });
    }
  };


  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      // The first user added is automatically a company admin
      const roleToAssign: UserRole = users.length === 0 ? 'company_admin' : newUserRole;
      addUser(newUserName.trim(), roleToAssign);
      setNewUserName('');
      setNewUserRole('technician');
      toast({
        title: 'Usuário Adicionado',
        description: `O usuário ${newUserName.trim()} foi criado com sucesso.`,
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    toast({ title: 'Usuário Excluído', description: 'O usuário foi removido.' });
  }

  const handleResetPassword = async (userId: string, userName: string) => {
    try {
      const { adminResetUserPassword } = await import('@/app/actions/password-reset');

      if (!currentUser?.id) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado.',
          variant: 'destructive'
        });
        return;
      }

      const result = await adminResetUserPassword(userId, currentUser.id);

      if (result.success) {
        toast({
          title: 'Senha Resetada!',
          description: result.message,
        });

        // Copy reset URL to clipboard if available
        if (result.resetUrl) {
          await navigator.clipboard.writeText(result.resetUrl);
          toast({
            title: 'Link Copiado',
            description: 'O link de recuperação foi copiado para a área de transferência.',
          });
        }
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao resetar senha. Tente novamente.',
        variant: 'destructive'
      });
    }
  }

  return (
    <div className="mt-4">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
          {(currentUser?.role === 'company_admin' || currentUser?.role === 'superadmin') && (
            <>
              <TabsTrigger value="invite">Convidar Usuário</TabsTrigger>
              <TabsTrigger value="invitations">Convites Enviados</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Adicionar Usuário Local</CardTitle>
                <CardDescription>Crie um perfil local para rastrear modificações (apenas offline).</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-user">Nome do Usuário</Label>
                    <Input
                      id="new-user"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  {users.length > 0 && (
                    <div className="space-y-2">
                      <Label>Permissão</Label>
                      <RadioGroup
                        value={newUserRole}
                        onValueChange={(value) => setNewUserRole(value as UserRole)}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="technician" id="r-technician" />
                          <Label htmlFor="r-technician">Técnico</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="team_admin" id="r-team-admin" />
                          <Label htmlFor="r-team-admin">Admin de Equipe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="company_admin" id="r-company-admin" />
                          <Label htmlFor="r-company-admin">Admin da Empresa</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={!newUserName.trim()}>
                    <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário Local
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Usuários Registrados</CardTitle>
                <CardDescription>Usuários ativos no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isCurrentUser={currentUser?.id === user.id}
                        canManage={
                          (currentUser?.role === 'company_admin' || currentUser?.role === 'superadmin') &&
                          currentUser?.id !== user.id
                        }
                        onDelete={handleDeleteUser}
                        onResetPassword={handleResetPassword}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum usuário registrado.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {(currentUser?.role === 'company_admin' || currentUser?.role === 'superadmin') && (
          <>
            <TabsContent value="invite" className="mt-6">
              <Card className="bg-card/90 backdrop-blur-sm max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Enviar Convite por Email</CardTitle>
                  <CardDescription>Envie um convite para um novo usuário. Ele receberá um link único válido por 7 dias.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email do Convidado *</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="usuario@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Um convite será enviado para este email
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Permissão</Label>
                      <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)} disabled={isInviting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technician">Técnico</SelectItem>
                          <SelectItem value="team_admin">Admin de Equipe</SelectItem>
                          <SelectItem value="company_admin">Admin da Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-uses">Máximo de Usos do Link</Label>
                      <Select value={maxUses.toString()} onValueChange={(value) => setMaxUses(parseInt(value))} disabled={isInviting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 uso (padrão)</SelectItem>
                          <SelectItem value="5">5 usos</SelectItem>
                          <SelectItem value="10">10 usos</SelectItem>
                          <SelectItem value="999">Ilimitado</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Quantas vezes o link de convite pode ser usado antes de expirar.
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isInviting}>
                      {isInviting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Gerando link...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Gerar Link de Convite
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations" className="mt-6">
              <Card className="bg-card/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Convites Enviados</CardTitle>
                  <CardDescription>Gerencie os convites pendentes e visualize o histórico.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingInvitations ? (
                    <div className="flex items-center justify-center py-8">
                      <Clock className="h-6 w-6 animate-spin mr-2" />
                      Carregando convites...
                    </div>
                  ) : invitations.length > 0 ? (
                    <div className="space-y-4">
                      {invitations.map((invitation) => (
                        <InvitationCard
                          key={invitation.id}
                          invitation={invitation}
                          onCopyUrl={copyInviteUrl}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum convite enviado ainda.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

    
