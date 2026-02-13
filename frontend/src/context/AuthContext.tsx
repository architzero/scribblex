import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  profileCompleted: boolean;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ requiresVerification: boolean; email?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.success && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };
    
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.message);
    
    localStorage.setItem('accessToken', data.token);
    
    const userResponse = await api.get('/auth/me');
    if (userResponse.data.success) {
      localStorage.setItem('user', JSON.stringify(userResponse.data.user));
      setUser(userResponse.data.user);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    const { data } = await api.post('/auth/signup', { email, password, name: name || email.split('@')[0] });
    
    if (data.success && !data.token) {
      return { requiresVerification: true, email: data.email };
    }
    
    if (data.token) {
      localStorage.setItem('accessToken', data.token);
      const userResponse = await api.get('/auth/me');
      if (userResponse.data.success) {
        localStorage.setItem('user', JSON.stringify(userResponse.data.user));
        setUser(userResponse.data.user);
      }
    }
    
    return { requiresVerification: !data.token };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
