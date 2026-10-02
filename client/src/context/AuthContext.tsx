'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  branch: string;
  batchYear: string;
  score: number;
  role: string;
  isVerified?: boolean;
  solvedChallenges?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    branch: string,
    batchYear: string
  ) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifies the session by querying /api/auth/me with the HttpOnly cookie
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>('/api/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  // Bootstrap session on initial mount
  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        const res = await api.get<{ user: User }>('/api/auth/me');
        if (!cancelled) setUser(res.data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User }>('/api/auth/login', { email, password });
    setUser(res.data.user);
    router.push('/dashboard');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    branch: string,
    batchYear: string
  ) => {
    const res = await api.post<{ user: User }>('/api/auth/register', {
      name,
      email,
      password,
      branch,
      batchYear,
    });
    setUser(res.data.user);
    router.push('/dashboard');
  };

  const googleLogin = async (credential: string) => {
    const res = await api.post<{ user: User }>('/api/auth/google', { credential });
    setUser(res.data.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors on logout to allow clean client-side exit
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}