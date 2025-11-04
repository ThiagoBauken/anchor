
'use server';

import { User, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { localStorageUsers } from '@/lib/localStorage-fallback';

export async function getUsersForCompany(companyId: string): Promise<User[]> {
  console.log('[DEBUG] getUsersForCompany server action called:', { companyId });
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
    try {
        if (!prisma) {
            console.warn('Database not available, using localStorage fallback');
            return localStorageUsers.add(name, role, companyId);
        }

        // Generate default email and password if not provided
        const defaultEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@anchorview.local`;
        const defaultPassword = password || 'changeme123'; // In production, should hash this

        const newUser = await prisma.user.create({
            data: {
                name,
                email: defaultEmail,
                password: defaultPassword, // In production, should use bcrypt to hash
                role,
                companyId,
            },
        });
        console.log('[DEBUG] User created successfully in database:', newUser.id);
        return newUser;
    } catch(e) {
        console.error("Error creating user, using localStorage fallback:", e);
        return localStorageUsers.add(name, role, companyId);
    }
}

export async function deleteUser(id: string): Promise<boolean> {
  console.log('[DEBUG] deleteUser server action called:', { id });
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

    