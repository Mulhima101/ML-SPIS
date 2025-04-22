import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// Define types
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'student' | 'professor';
  [key: string]: any; // For additional properties
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  registerStudent: (data: any) => Promise<void>;
  registerProfessor: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      try {
        // Try to get user from localStorage
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          // Verify the token with the backend
          try {
            const response = await authService.verifyToken(storedToken);
            
            if (response.data.valid) {
              setUser(response.data.user);
              setIsAuthenticated(true);
            } else {
              // Token is invalid, remove it
              localStorage.removeItem('token');
              localStorage.removeItem('studentUser');
              localStorage.removeItem('professorUser');
              setIsAuthenticated(false);
            }
          } catch (error) {
            // Token verification failed
            localStorage.removeItem('token');
            localStorage.removeItem('studentUser');
            localStorage.removeItem('professorUser');
            setIsAuthenticated(false);
          }
        } else {
          // No token found
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({ email, password });
      
      const { token, user } = response.data;
      
      // Save token and user info
      localStorage.setItem('token', token);
      
      if (user.userType === 'student') {
        localStorage.setItem('studentUser', JSON.stringify(user));
      } else {
        localStorage.setItem('professorUser', JSON.stringify(user));
      }
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register student function
  const registerStudent = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.registerStudent(data);
      
      const { token, user } = response.data;
      
      // Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('studentUser', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register professor function
  const registerProfessor = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.registerProfessor(data);
      
      const { token, user } = response.data;
      
      // Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('professorUser', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentUser');
    localStorage.removeItem('professorUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    registerStudent,
    registerProfessor,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};