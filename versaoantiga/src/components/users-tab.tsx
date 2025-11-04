"use client";

import { useState } from 'react';
import { useAnchorData } from '@/context/AnchorDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, User, ShieldCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function UsersTab() {
  const { users, addUser, deleteUser, currentUser, setCurrentUser } = useAnchorData();
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const { toast } = useToast();

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      // The first user added is automatically an admin
      const roleToAssign = users.length === 0 ? 'admin' : newUserRole;
      addUser(newUserName.trim(), roleToAssign);
      setNewUserName('');
      setNewUserRole('user');
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

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <Card className="bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Adicionar Novo Usuário</CardTitle>
          <CardDescription>Crie um novo perfil de usuário para rastrear as modificações.</CardDescription>
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
                        onValueChange={(value) => setNewUserRole(value as 'admin' | 'user')}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="r-user" />
                        <Label htmlFor="r-user">Usuário</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="r-admin" />
                        <Label htmlFor="r-admin">Administrador</Label>
                        </div>
                    </RadioGroup>
                </div>
             )}
            <Button type="submit" className="w-full">
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Usuários Registrados</CardTitle>
          <CardDescription>Selecione um usuário para ver suas atividades ou gerenciar perfis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-md transition-colors group`}
                >
                  <div className="flex items-center gap-3 flex-grow cursor-pointer" onClick={() => setCurrentUser(user)}>
                     {user.role === 'admin' ? <ShieldCheck className="h-5 w-5 text-accent" /> : <User className="h-5 w-5 text-primary" />}
                    <span className={`font-medium transition-colors ${currentUser?.id === user.id ? 'text-primary' : ''}`}>{user.name}</span>
                    <span className="text-xs text-muted-foreground">({user.role})</span>
                  </div>
                  
                  {currentUser?.id === user.id && (
                    <div className="text-xs font-semibold text-primary py-1 px-2.5 rounded-full bg-primary/10 mr-2">
                      ATIVO
                    </div>
                  )}

                  {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário. A autoria de suas ações será mantida, mas o nome aparecerá como 'Excluído'.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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
  );
}
