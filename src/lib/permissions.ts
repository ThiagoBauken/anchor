/**
 * Sistema de Permissões Granulares
 *
 * Define e verifica permissões baseadas em roles de usuário
 */

import { User, UserRole } from '@/types';

export interface PermissionContext {
  user: User;
  projectId?: string;
  teamId?: string;
}

/**
 * Verifica se o usuário pode editar mapas
 * - superadmin: pode editar todos os mapas
 * - company_admin: PODE editar (TEMPORÁRIO até implementar Teams)
 * - team_admin: pode editar mapas dos projetos atribuídos à sua equipe
 * - technician: não pode editar mapas
 */
export function canEditMap(context: PermissionContext): boolean {
  const { user, projectId } = context;

  if (user.role === 'superadmin') {
    return true;
  }

  if (user.role === 'company_admin') {
    // TODO: Após implementar Teams, restringir a view-only
    // Por enquanto, permite edição para não bloquear fluxo atual
    return true;
  }

  if (user.role === 'team_admin') {
    // TODO: Verificar se o team_admin tem permissão no projeto específico
    // Por enquanto, retorna true se projectId for fornecido
    return projectId !== undefined;
  }

  return false; // technician não pode editar
}

/**
 * Verifica se o usuário pode criar pontos de ancoragem
 * - superadmin: pode criar pontos
 * - company_admin: PODE criar (TEMPORÁRIO até implementar Teams)
 * - team_admin: pode criar pontos nos projetos atribuídos
 * - technician: NÃO pode criar pontos (só realiza testes)
 */
export function canCreatePoints(context: PermissionContext): boolean {
  const { user, projectId } = context;

  if (user.role === 'superadmin') {
    return true;
  }

  if (user.role === 'company_admin') {
    // TODO: Após implementar Teams, restringir a view-only
    // Por enquanto, permite criação para não bloquear fluxo atual
    return true;
  }

  if (user.role === 'team_admin') {
    // TODO: Verificar se tem permissão no projeto específico
    return projectId !== undefined;
  }

  return false; // technician NÃO pode criar pontos
}

/**
 * Verifica se o usuário pode realizar testes
 * - Todos os roles podem realizar testes
 */
export function canPerformTests(context: PermissionContext): boolean {
  // Todos podem realizar testes
  return true;
}

/**
 * Verifica se o usuário pode convidar outros usuários
 * - superadmin: pode convidar todos os roles
 * - company_admin: pode convidar team_admin e technician
 * - team_admin: pode convidar apenas technician
 * - technician: não pode convidar ninguém
 */
export function canInviteUsers(context: PermissionContext, roleToInvite?: UserRole): boolean {
  const { user } = context;

  if (user.role === 'superadmin') {
    return true; // Pode convidar qualquer role
  }

  if (user.role === 'company_admin') {
    // Pode convidar team_admin e technician
    if (!roleToInvite) return true;
    return roleToInvite === 'team_admin' || roleToInvite === 'technician';
  }

  if (user.role === 'team_admin') {
    // Pode convidar apenas technician
    if (!roleToInvite) return true;
    return roleToInvite === 'technician';
  }

  return false; // technician não pode convidar
}

/**
 * Verifica se o usuário pode gerenciar equipes
 * - superadmin: pode gerenciar todas as equipes
 * - company_admin: pode gerenciar equipes da empresa
 * - team_admin: não pode gerenciar equipes (só é membro)
 * - technician: não pode gerenciar equipes
 */
export function canManageTeams(context: PermissionContext): boolean {
  const { user } = context;

  return user.role === 'superadmin' || user.role === 'company_admin';
}

/**
 * Verifica se o usuário pode visualizar projetos
 * - Todos podem visualizar projetos (com restrições por company/team)
 */
export function canViewProjects(context: PermissionContext): boolean {
  return true; // Todos podem visualizar (filtrados por contexto)
}

/**
 * Verifica se o usuário pode criar projetos
 * - superadmin: pode criar projetos em qualquer empresa
 * - company_admin: pode criar projetos na sua empresa
 * - team_admin: pode criar projetos na sua empresa (modelo B2B duplo)
 * - technician: não pode criar projetos
 */
export function canCreateProjects(context: PermissionContext): boolean {
  const { user } = context;

  return user.role === 'superadmin' || user.role === 'company_admin' || user.role === 'team_admin';
}

/**
 * Verifica se o usuário pode deletar pontos
 * - superadmin: pode deletar
 * - company_admin: pode deletar
 * - team_admin: não pode deletar
 * - technician: não pode deletar
 */
export function canDeletePoints(context: PermissionContext): boolean {
  const { user } = context;

  return user.role === 'superadmin' || user.role === 'company_admin';
}

/**
 * Verifica se o usuário pode deletar projetos
 * - superadmin: pode deletar
 * - company_admin: pode deletar
 * - team_admin: não pode deletar
 * - technician: não pode deletar
 */
export function canDeleteProjects(context: PermissionContext): boolean {
  const { user } = context;

  return user.role === 'superadmin' || user.role === 'company_admin';
}

/**
 * Verifica se o usuário pode editar configurações de visualização pública
 * - superadmin: pode editar
 * - company_admin: pode editar
 * - team_admin: não pode editar
 * - technician: não pode editar
 */
export function canManagePublicSettings(context: PermissionContext): boolean {
  const { user } = context;

  return user.role === 'superadmin' || user.role === 'company_admin';
}

/**
 * Retorna lista de roles que o usuário pode convidar
 */
export function getInvitableRoles(user: User): UserRole[] {
  if (user.role === 'superadmin') {
    return ['superadmin', 'company_admin', 'team_admin', 'technician'];
  }

  if (user.role === 'company_admin') {
    return ['team_admin', 'technician'];
  }

  if (user.role === 'team_admin') {
    return ['technician'];
  }

  return [];
}

/**
 * Retorna descrição amigável do role
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    superadmin: 'Super Administrador',
    company_admin: 'Administrador da Empresa',
    team_admin: 'Líder de Equipe',
    technician: 'Técnico de Campo',
  };

  return labels[role];
}

/**
 * Retorna descrição detalhada das permissões do role
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    superadmin: 'Acesso total ao sistema. Gerencia todas as empresas e configurações.',
    company_admin: 'Gerencia projetos, equipes e visualiza mapas. Não pode editar mapas.',
    team_admin: 'Líder de equipe de alpinismo. Cria e edita projetos próprios, edita mapas dos projetos atribuídos e convida técnicos.',
    technician: 'Técnico de campo. Realiza testes em pontos já existentes.',
  };

  return descriptions[role];
}
