"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea-shadcn';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit, 
  Trash2, 
  Key, 
  LogOut, 
  Eye, 
  UserX, 
  UserCheck,
  ShieldAlert,
  Clock,
  Activity,
  AlertTriangle,
  Copy,
  RefreshCw
} from 'lucide-react';
import type { User, UserRole } from '@/types';

interface UserManagementEnhancedProps {
  users: User[];
  onRefresh: () => void;
}

export function UserManagementEnhanced({ users, onRefresh }: UserManagementEnhancedProps) {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para edição
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'technician' as UserRole,
    active: true,
    companyId: ''
  });

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setLoading(true);
    
    try {
      // Busca detalhes do usuário
      const userResponse = await fetch(`/api/admin/users/${user.id}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserDetails(userData);
      }

      // Busca sessões ativas
      const sessionsResponse = await fetch(`/api/admin/users/${user.id}/force-logout`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setActiveSessions(sessionsData.activeSessions || []);
      }

      setIsViewDetailsOpen(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar detalhes do usuário.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email || '',
      role: user.role,
      active: user.active,
      companyId: user.companyId
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso.',
        });
        setIsEditOpen(false);
        onRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${user.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Usuário deletado com sucesso.',
        });
        onRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar usuário.',
        variant: 'destructive'
      });
    }
  };

  const handleResetPassword = async (generateRandom = true) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: generateRandom ? undefined : newPassword,
          generateRandom,
          sendEmail: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.showPassword) {
          // Mostra a nova senha gerada
          navigator.clipboard.writeText(result.newPassword);
          toast({
            title: 'Senha Resetada!',
            description: `Nova senha: ${result.newPassword} (copiada para clipboard)`,
            duration: 10000
          });
        } else {
          toast({
            title: 'Sucesso',
            description: result.message,
          });
        }
        
        setIsResetPasswordOpen(false);
        setNewPassword('');
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao resetar senha.',
        variant: 'destructive'
      });
    }
  };

  const handleForceLogout = async (user: User) => {
    if (!confirm(`Forçar logout de ${user.name}? Todas as sessões ativas serão terminadas.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/force-logout`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Logout Forçado',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao forçar logout.',
        variant: 'destructive'
      });
    }
  };

  const toggleUserStatus = async (user: User) => {
    const newStatus = !user.active;
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          active: newStatus
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gerenciar Usuários - Controle Total</span>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <CardDescription>
            Visualize, edite, delete e controle todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.company?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      user.role === 'superadmin' ? 'default' :
                      user.role === 'company_admin' ? 'default' :
                      user.role === 'team_admin' ? 'secondary' :
                      'outline'
                    }>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'destructive'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* Ver Detalhes */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        title="Editar usuário"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Reset Senha */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsResetPasswordOpen(true);
                        }}
                        title="Reset senha"
                      >
                        <Key className="h-4 w-4" />
                      </Button>

                      {/* Ativar/Desativar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(user)}
                        title={user.active ? 'Desativar' : 'Ativar'}
                      >
                        {user.active ? (
                          <UserX className="h-4 w-4 text-red-500" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        )}
                      </Button>

                      {/* Forçar Logout */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleForceLogout(user)}
                        title="Forçar logout"
                      >
                        <LogOut className="h-4 w-4 text-orange-500" />
                      </Button>

                      {/* Deletar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        title="Deletar usuário"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Ver Detalhes */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas e sessões ativas
            </DialogDescription>
          </DialogHeader>
          
          {userDetails && (
            <div className="grid gap-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p className="text-sm">{userDetails.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{userDetails.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Empresa</Label>
                  <p className="text-sm">{userDetails.company?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge variant={
                    userDetails.role === 'superadmin' ? 'default' :
                    userDetails.role === 'company_admin' ? 'default' :
                    userDetails.role === 'team_admin' ? 'secondary' :
                    'outline'
                  }>
                    {userDetails.role}
                  </Badge>
                </div>
              </div>

              {/* Estatísticas */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Estatísticas</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{userDetails._count?.createdProjects || 0}</div>
                      <p className="text-sm text-muted-foreground">Projetos Criados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{userDetails._count?.createdAnchorPoints || 0}</div>
                      <p className="text-sm text-muted-foreground">Pontos Criados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{activeSessions.length}</div>
                      <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sessões Ativas */}
              {activeSessions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Sessões Ativas</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Criada em</TableHead>
                        <TableHead>Expira em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.ipAddress}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {session.userAgent}
                          </TableCell>
                          <TableCell>
                            {new Date(session.createdAt).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {new Date(session.expiresAt).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Usuário */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={editForm.role} onValueChange={(value: UserRole) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Técnico</SelectItem>
                  <SelectItem value="team_admin">Administrador de Equipe</SelectItem>
                  <SelectItem value="company_admin">Administrador da Empresa</SelectItem>
                  <SelectItem value="superadmin">Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
              />
              <Label htmlFor="active">Usuário ativo</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reset Senha */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Opções de Reset</Label>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleResetPassword(true)}
                  className="w-full"
                  variant="default"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Senha Aleatória (Recomendado)
                </Button>
                
                <div className="text-sm text-muted-foreground text-center">ou</div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Senha Personalizada</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                  <Button 
                    onClick={() => handleResetPassword(false)}
                    disabled={!newPassword}
                    variant="outline"
                    className="w-full"
                  >
                    Definir Senha Personalizada
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Importante:</p>
                  <p>A nova senha será copiada automaticamente. Repasse-a para o usuário de forma segura.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}