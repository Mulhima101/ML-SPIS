// client_side/src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Configure axios with interceptor for authentication
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Authentication services
export const loginStudent = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { 
      email, 
      password 
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('studentUser', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

export const loginProfessor = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { 
      email, 
      password 
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('professorUser', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

export const registerStudent = async (studentData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register/student`, studentData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('studentUser', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

export const registerProfessor = async (professorData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register/professor`, professorData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('professorUser', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('studentUser');
  localStorage.removeItem('professorUser');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('studentUser') || localStorage.getItem('professorUser') || 'null');
};

export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

export const getToken = () => {
  return localStorage.getItem('token');
};