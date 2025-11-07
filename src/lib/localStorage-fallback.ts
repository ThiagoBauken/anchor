// Fallback usando localStorage quando o banco não está disponível
import { Project, User, Location, UserRole } from '@prisma/client';
import type { MarkerShape } from '@/types';

// Simulação de tipos para localStorage
interface LocalStorageProject extends Omit<Project, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface LocalStorageUser extends User {}
interface LocalStorageLocation extends Location {}

// Helper para gerar IDs únicos
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper para verificar se localStorage está disponível
const isLocalStorageAvailable = () => {
  if (typeof window === 'undefined') return false;
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch {
    return false;
  }
};

// === PROJETOS ===
export const localStorageProjects = {
  getAll: (companyId: string): Project[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const projects = JSON.parse(localStorage.getItem('anchor-projects') || '[]') as LocalStorageProject[];
    return projects
      .filter(p => p.companyId === companyId && !p.deleted)
      .map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  add: (projectData: Omit<Project, 'id' | 'deleted' | 'createdAt' | 'updatedAt'>): Project => {
    if (!isLocalStorageAvailable()) {
      // No servidor, criar um projeto temporário que será salvo no cliente
      const now = new Date();
      return {
        ...projectData,
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        deleted: false,
        createdAt: now,
        updatedAt: now
      };
    }

    const projects = JSON.parse(localStorage.getItem('anchor-projects') || '[]') as LocalStorageProject[];
    const now = new Date();
    const newProject: LocalStorageProject = {
      ...projectData,
      id: generateId(),
      deleted: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    projects.push(newProject);
    localStorage.setItem('anchor-projects', JSON.stringify(projects));

    return {
      ...newProject,
      createdAt: now,
      updatedAt: now
    };
  },

  update: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project | null => {
    if (!isLocalStorageAvailable()) return null;

    const projects = JSON.parse(localStorage.getItem('anchor-projects') || '[]') as LocalStorageProject[];
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    const now = new Date();
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: now.toISOString()
    };

    localStorage.setItem('anchor-projects', JSON.stringify(projects));

    return {
      ...projects[index],
      createdAt: new Date(projects[index].createdAt),
      updatedAt: now
    };
  },

  delete: (id: string): boolean => {
    if (!isLocalStorageAvailable()) return false;
    
    const projects = JSON.parse(localStorage.getItem('anchor-projects') || '[]') as LocalStorageProject[];
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    projects[index].deleted = true;
    projects[index].updatedAt = new Date().toISOString();
    localStorage.setItem('anchor-projects', JSON.stringify(projects));
    return true;
  }
};

// === USUÁRIOS ===
export const localStorageUsers = {
  getAll: (companyId: string): User[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const users = JSON.parse(localStorage.getItem('anchor-users') || '[]') as LocalStorageUser[];
    return users
      .filter(u => u.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  add: (name: string, role: UserRole, companyId: string): User => {
    if (!isLocalStorageAvailable()) {
      // No servidor, criar um usuário temporário que será salvo no cliente
      const now = new Date();
      return {
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        name,
        email: null,
        password: '',
        role,
        active: true,
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
        phone: null,
        companyId,
        image: null,
        emailVerified: null
      };
    }

    const users = JSON.parse(localStorage.getItem('anchor-users') || '[]') as LocalStorageUser[];
    const now = new Date();
    const newUser: LocalStorageUser = {
      id: generateId(),
      name,
      email: null,
      password: '',
      role,
      active: true,
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
      phone: null,
      companyId,
      image: null,
      emailVerified: null
    };

    users.push(newUser);
    localStorage.setItem('anchor-users', JSON.stringify(users));
    return newUser;
  },

  delete: (id: string): boolean => {
    if (!isLocalStorageAvailable()) return false;
    
    const users = JSON.parse(localStorage.getItem('anchor-users') || '[]') as LocalStorageUser[];
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    users.splice(index, 1);
    localStorage.setItem('anchor-users', JSON.stringify(users));
    return true;
  }
};

// === LOCALIZAÇÕES ===
export const localStorageLocations = {
  getAll: (companyId: string): Location[] => {
    if (!isLocalStorageAvailable()) return [];
    
    const locations = JSON.parse(localStorage.getItem('anchor-locations') || '[]') as LocalStorageLocation[];
    return locations
      .filter(l => l.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  add: (name: string, companyId: string): Location => {
    if (!isLocalStorageAvailable()) {
      // No servidor, criar uma localização temporária que será salva no cliente
      return {
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        name,
        markerShape: 'circle',
        markerColor: null,
        companyId,
        projectId: null
      };
    }
    
    const locations = JSON.parse(localStorage.getItem('anchor-locations') || '[]') as LocalStorageLocation[];
    const newLocation: LocalStorageLocation = {
      id: generateId(),
      name,
      markerShape: 'circle',
      markerColor: null,
      companyId,
      projectId: null
    };

    locations.push(newLocation);
    localStorage.setItem('anchor-locations', JSON.stringify(locations));
    return newLocation;
  },

  updateShape: (id: string, shape: MarkerShape): boolean => {
    if (!isLocalStorageAvailable()) return false;
    
    const locations = JSON.parse(localStorage.getItem('anchor-locations') || '[]') as LocalStorageLocation[];
    const index = locations.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    locations[index].markerShape = shape;
    localStorage.setItem('anchor-locations', JSON.stringify(locations));
    return true;
  },

  delete: (id: string): boolean => {
    if (!isLocalStorageAvailable()) return false;
    
    const locations = JSON.parse(localStorage.getItem('anchor-locations') || '[]') as LocalStorageLocation[];
    const index = locations.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    locations.splice(index, 1);
    localStorage.setItem('anchor-locations', JSON.stringify(locations));
    return true;
  }
};