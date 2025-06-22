// client_side/src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle expired tokens
    if (error.response && error.response.status === 401) {
      // If there's a specific message about token expiration
      if (
        error.response.data &&
        error.response.data.message &&
        error.response.data.message.includes("expired")
      ) {
        // Clear local storage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("studentUser");
        localStorage.removeItem("professorUser");

        // If we're in the browser, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/students/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors consistently
const handleApiError = (error) => {
  console.error("API Error:", error);

  // Create a standardized error object
  const errorResponse = {
    message: "An unexpected error occurred",
    status: 500,
    details: null,
  };

  // Extract information from the error if available
  if (error.response) {
    // The server responded with an error status
    errorResponse.status = error.response.status;
    errorResponse.message =
      error.response.data?.message || `Error: ${error.response.status}`;
    errorResponse.details = error.response.data;
  } else if (error.request) {
    // The request was made but no response was received
    errorResponse.message =
      "No response from server. Please check your connection.";
    errorResponse.status = 0;
  } else {
    // Something else caused the error
    errorResponse.message = error.message;
  }

  return Promise.reject(errorResponse);
};

// Export the individual services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  registerStudent: async (data) => {
    try {
      const response = await api.post("/auth/register/student", data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  registerProfessor: async (data) => {
    try {
      const response = await api.post("/auth/register/professor", data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await api.post("/auth/verify-token", { token });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const studentService = {
  getProfile: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateProfile: async (studentId, data) => {
    try {
      const response = await api.put(`/students/${studentId}/profile`, data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getKnowledge: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}/knowledge`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getGuidance: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}/guidance`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getQuizzes: async (studentId, moduleId = null) => {
    try {
      const url = moduleId
        ? `/students/${studentId}/quizzes?module_id=${moduleId}`
        : `/students/${studentId}/quizzes`;
      const response = await api.get(url);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getAvailableQuizzes: async (moduleId = null) => {
    try {
      const url = moduleId
        ? `/quizzes/available?module_id=${moduleId}`
        : `/quizzes/available`;
      const response = await api.get(url);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getModules: async () => {
    try {
      const response = await api.get("/modules/available");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const professorService = {
  getProfile: async (professorId) => {
    try {
      const response = await api.get(`/professors/${professorId}`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateProfile: async (professorId, data) => {
    try {
      const response = await api.put(
        `/professors/${professorId}/profile`,
        data
      );
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDashboardData: async () => {
    try {
      const response = await api.get("/professors/dashboard");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getAllStudents: async () => {
    try {
      const response = await api.get("/students");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getStudentDetails: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  generateQuiz: async (studentId, title, numQuestions = 15) => {
    try {
      const response = await api.post("/quizzes/generate", {
        student_id: studentId,
        title,
        num_questions: numQuestions,
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const quizService = {
  getQuizzes: async () => {
    try {
      const response = await api.get("/quizzes");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getQuiz: async (quizId) => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  startQuiz: async (quizId) => {
    try {
      const response = await api.post(`/quizzes/${quizId}/start`);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  submitQuiz: async (quizId, answers) => {
    try {
      const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Export a default object with all services
export default {
  auth: authService,
  student: studentService,
  professor: professorService,
  quiz: quizService,
};
