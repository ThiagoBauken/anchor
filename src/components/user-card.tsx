"use client";

import { Button } from '@/components/ui/button';
import { ShieldCheck, User, Trash2, KeyRound } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import type { User as UserType } from '@/types';

interface UserCardProps {
  user: UserType;
  isCurrentUser: boolean;
  canManage: boolean;
  onDelete: (userId: string) => void;
  onResetPassword: (userId: string, userName: string) => void;
}

export function UserCard({
  user,
  isCurrentUser,
  canManage,
  onDelete,
  onResetPassword
}: UserCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md transition-colors group">
      <div className="flex items-center gap-3 flex-grow">
        {user.role === 'superadmin' || user.role === 'company_admin' ? (
          <ShieldCheck className="h-5 w-5 text-accent" />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
        <span className={`font-medium transition-colors ${isCurrentUser ? 'text-primary' : ''}`}>
          {user.name}
        </span>
        <span className="text-xs text-muted-foreground">({user.role})</span>
        {isCurrentUser && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
            Atual
          </span>
        )}
      </div>

      {isCurrentUser && (
        <div className="text-xs font-semibold text-primary py-1 px-2.5 rounded-full bg-primary/10 mr-2">
          ATIVO
        </div>
      )}

      {canManage && !isCurrentUser && (
        <div className="flex items-center gap-1">
          {/* Reset Password Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Resetar Senha">
                <KeyRound className="h-4 w-4 text-blue-600" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar Senha do Usuário</AlertDialogTitle>
                <AlertDialogDescription>
                  Será gerado um link de recuperação para <strong>{user.name}</strong>.
                  <br /><br />
                  O link será enviado por email e também copiado para sua área de transferência.
                  O link expira em 24 horas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onResetPassword(user.id, user.name)}>
                  Gerar Link
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete User Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Excluir Usuário">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(user.id)}>
                  Continuar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
