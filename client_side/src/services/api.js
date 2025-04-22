// client_side/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Export the individual services
export const studentService = {
  getGuidance: (studentId) => api.get(`/students/${studentId}/guidance`),
  getKnowledgeLevels: (studentId) => api.get(`/students/${studentId}/knowledge`),
  getQuizzes: (studentId) => api.get(`/students/${studentId}/quizzes`)
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerStudent: (data) => api.post('/auth/register/student', data),
  registerProfessor: (data) => api.post('/auth/register/professor', data)
};

export const quizService = {
  getQuizzes: () => api.get('/quizzes'),
  getQuiz: (quizId) => api.get(`/quizzes/${quizId}`),
  startQuiz: (quizId) => api.post(`/quizzes/${quizId}/start`),
  submitQuiz: (quizId, answers) => api.post(`/quizzes/${quizId}/submit`, { answers })
};