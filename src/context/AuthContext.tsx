
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Mock User type 
interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASS = "admin123";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is "logged in" from session storage on initial load
    const storedUser = sessionStorage.getItem('anchor-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  const login = (email: string, password: string) => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
          const adminUser: User = {
              uid: 'admin-user-01',
              email: ADMIN_EMAIL,
              displayName: 'Admin'
          };
          sessionStorage.setItem('anchor-user', JSON.stringify(adminUser));
          setUser(adminUser);
          router.push('/');
      } else {
          throw new Error("Credenciais inválidas.");
      }
  }

  const logout = () => {
      sessionStorage.removeItem('anchor-user');
      setUser(null);
      router.push('/auth/login');
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
