import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { usersApi } from '../api/users.api';
import { authApi } from '../api/auth.api';
import { LS_ACCESS_TOKEN, QK } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem(LS_ACCESS_TOKEN));

  // Listen to custom logout event from axios interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      setToken(null);
      queryClient.clear();
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [queryClient]);

  const { data: user, isLoading } = useQuery({
    queryKey: QK.ME,
    queryFn: usersApi.getMe,
    enabled: !!token,
    retry: false, // Don't retry on 401, axios interceptor handles it
  });

  const login = (newToken: string) => {
    localStorage.setItem(LS_ACCESS_TOKEN, newToken);
    setToken(newToken);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem(LS_ACCESS_TOKEN);
      setToken(null);
      queryClient.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading: isLoading && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
