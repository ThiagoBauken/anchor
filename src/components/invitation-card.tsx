"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { UserRole } from '@/types';

interface Invitation {
  id: string;
  email?: string;
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

interface InvitationCardProps {
  invitation: Invitation;
  onCopyUrl: (url: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    case 'accepted':
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Aceito</Badge>;
    case 'expired':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return 'Super Admin';
    case 'company_admin':
      return 'Admin da Empresa';
    case 'team_admin':
      return 'Admin de Equipe';
    case 'technician':
      return 'Técnico';
    default:
      return role;
  }
};

export function InvitationCard({ invitation, onCopyUrl }: InvitationCardProps) {
  const defaultDescription = `Convite para ${
    invitation.role === 'company_admin' || invitation.role === 'superadmin'
      ? 'administrador'
      : invitation.role === 'team_admin'
      ? 'admin de equipe'
      : 'técnico'
  }`;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{invitation.description || defaultDescription}</span>
          {getStatusBadge(invitation.status)}
        </div>
        <div className="text-sm text-muted-foreground">
          <span>Permissão: {getRoleLabel(invitation.role)}</span>
          <span className="mx-2">•</span>
          <span>Enviado por: {invitation.invited_by}</span>
          <span className="mx-2">•</span>
          <span>Expira: {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}</span>
          {invitation.max_uses && (
            <>
              <span className="mx-2">•</span>
              <span>Usos: {invitation.current_uses || 0}/{invitation.max_uses}</span>
            </>
          )}
        </div>
      </div>

      {invitation.status === 'pending' && invitation.invite_url && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyUrl(invitation.invite_url!)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(invitation.invite_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
