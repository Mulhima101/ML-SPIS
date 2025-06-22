import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api';

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
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor for authentication
/*api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});*/

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
            const response = await api.post('/auth/verify-token', { token: storedToken });

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
            // If backend is not available, try to use stored user data
            console.log('Token verification failed, using stored user data');
            const storedStudentUser = localStorage.getItem('studentUser');
            const storedProfessorUser = localStorage.getItem('professorUser');

            if (storedStudentUser) {
              const parsedUser = JSON.parse(storedStudentUser);
              setUser({ ...parsedUser, userType: 'student' });
              setIsAuthenticated(true);
            } else if (storedProfessorUser) {
              const parsedUser = JSON.parse(storedProfessorUser);
              setUser({ ...parsedUser, userType: 'professor' });
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
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
      const response = await api.post('/auth/login', { email, password });

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
      // Try to extract error message from response if available
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register student function
  const registerStudent = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register/student', data);

      const { token, user } = response.data;

      // Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('studentUser', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register professor function
  const registerProfessor = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register/professor', data);

      const { token, user } = response.data;

      // Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('professorUser', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentUser');
    localStorage.removeItem('professorUser');
    localStorage.removeItem('professorModules'); // Clear cached data
    setUser(null);
    setIsAuthenticated(false);

    // Redirect to student login
    if (typeof window !== 'undefined') {
      window.location.href = '/students/login';
    }
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