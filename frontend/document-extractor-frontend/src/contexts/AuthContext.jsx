import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      // SimpleJWT returns { access, refresh }
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      // Optionally store refresh token if needed
      // localStorage.setItem('refresh', refresh);
      setUser({ email: credentials.username });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Mock login for development (remove when backend auth is ready)
  const mockLogin = (email, password) => {
    const mockUser = {
      id: 1,
      email: email,
      name: email.split('@')[0],
    };
    
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    setUser(mockUser);
    setIsAuthenticated(true);
    
    return { success: true };
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    mockLogin, // Remove this when backend auth is ready
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

