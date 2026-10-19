import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hirelens_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hirelens_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
      localStorage.setItem('hirelens_user', JSON.stringify(u));
    } catch {
      // If error occurs, leave user state as is or clear if unauthorized
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hirelens_access_token');
      if (storedToken) {
        try {
          const u = await api.auth.me();
          setUser(u);
          localStorage.setItem('hirelens_user', JSON.stringify(u));
        } catch {
          localStorage.removeItem('hirelens_access_token');
          localStorage.removeItem('hirelens_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleExternalLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('hirelens_logout', handleExternalLogout);
    return () => window.removeEventListener('hirelens_logout', handleExternalLogout);
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      localStorage.setItem('hirelens_access_token', res.access_token);
      localStorage.setItem('hirelens_refresh_token', res.refresh_token);
      localStorage.setItem('hirelens_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      localStorage.setItem('hirelens_access_token', res.access_token);
      localStorage.setItem('hirelens_refresh_token', res.refresh_token);
      localStorage.setItem('hirelens_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Proceed with local logout regardless of network error
    } finally {
      localStorage.removeItem('hirelens_access_token');
      localStorage.removeItem('hirelens_refresh_token');
      localStorage.removeItem('hirelens_user');
      setUser(null);
      setToken(null);
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
