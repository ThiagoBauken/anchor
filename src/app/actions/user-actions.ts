
'use server';

import { User, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { localStorageUsers } from '@/lib/localStorage-fallback';
import { requireAuthentication, requireCompanyMatch, requireRole, logAction } from '@/lib/auth-helpers';
import { canInviteUsers, canManageTeams } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function getUsersForCompany(companyId: string): Promise<User[]> {
  console.log('[DEBUG] getUsersForCompany server action called:', { companyId });

  // Autenticação e validação
  const user = await requireAuthentication();
  await requireCompanyMatch(user.id, companyId);

  try {
    if (!prisma) {
      console.warn('Database not available, using localStorage fallback');
      return localStorageUsers.getAll(companyId);
    }
    
    return await prisma.user.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.warn('Database error, using localStorage fallback:', error);
    return localStorageUsers.getAll(companyId);
  }
}

export async function addUser(
  name: string,
  role: UserRole,
  companyId: string,
  email?: string,
  password?: string
): Promise<User | null> {
    console.log('[DEBUG] addUser server action called:', { name, role, companyId, email });

    // Autenticação e validação
    const user = await requireAuthentication();
    await requireCompanyMatch(user.id, companyId);

    // Verificar permissão para convidar usuários com o role especificado
    if (!canInviteUsers({ user }, role)) {
      throw new Error(`Permission denied: Cannot invite users with role ${role}`);
    }

    // Log de auditoria
    logAction('CREATE_USER', user.id, {
      userName: name,
      userRole: role,
      companyId
    });

    try {
        if (!prisma) {
            console.warn('Database not available, using localStorage fallback');
            return localStorageUsers.add(name, role, companyId);
        }

        // Generate default email and password if not provided
        const defaultEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@anchorview.local`;

        // Generate secure random password if not provided
        const plainPassword = password || crypto.randomBytes(16).toString('hex');

        // Hash password with bcrypt (salt rounds = 10)
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email: defaultEmail,
                password: hashedPassword,
                role,
                companyId,
            },
        });

        console.log('[DEBUG] User created successfully in database:', newUser.id);
        console.log('[INFO] Generated password for user (store this securely):', plainPassword);

        return newUser;
    } catch(e) {
        console.error("Error creating user, using localStorage fallback:", e);
        return localStorageUsers.add(name, role, companyId);
    }
}

export async function deleteUser(id: string): Promise<boolean> {
  console.log('[DEBUG] deleteUser server action called:', { id });

  // Autenticação
  const user = await requireAuthentication();

  // Buscar usuário alvo para validar companyId
  const targetUser = await prisma?.user.findUnique({
    where: { id },
    select: { companyId: true, role: true }
  });

  if (!targetUser) {
    throw new Error('User not found');
  }

  // Validar acesso à company
  await requireCompanyMatch(user.id, targetUser.companyId);

  // Verificar permissão para gerenciar usuários
  // Usar canManageTeams como proxy para gerenciar usuários (superadmin e company_admin)
  if (!canManageTeams({ user })) {
    throw new Error('Permission denied: Cannot delete users');
  }

  // Impedir auto-deleção
  if (user.id === id) {
    throw new Error('Cannot delete yourself');
  }

  // Log de auditoria
  logAction('DELETE_USER', user.id, {
    targetUserId: id,
    targetUserRole: targetUser.role
  });

  try {
    if (!prisma) {
      console.warn('Database not available, using localStorage fallback');
      return localStorageUsers.delete(id);
    }

    // Note: In a real app, you might want to handle what happens to records
    // created by this user. Here we just delete the user.
    await prisma.user.delete({
      where: { id },
    });
    console.log('[DEBUG] User deleted successfully from database');
    return true;
  } catch (error) {
    console.error(`Failed to delete user ${id}, trying localStorage fallback:`, error);
    return localStorageUsers.delete(id);
  }
}

    