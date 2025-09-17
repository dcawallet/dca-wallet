
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  login: (accessToken: string, tokenType: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  const login = (accessToken: string, tokenType: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('token_type', tokenType);
    setToken(accessToken);
    console.log('User logged in, token:', accessToken); // Placeholder for actual login logic
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    setToken(null);
    console.log('User logged out'); // Placeholder for actual logout logic
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
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
