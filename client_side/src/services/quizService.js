// client_side/src/services/quizService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Get all quizzes for the current user
export const getAllQuizzes = async () => {
  try {
    const response = await axios.get(`${API_URL}/quizzes`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get quizzes");
  }
};

// Get a specific quiz with questions
export const getQuiz = async (quizId) => {
  try {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get quiz");
  }
};

// Start a quiz (creates a student quiz record)
export const startQuiz = async (quizId) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/start`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to start quiz");
  }
};

// Submit quiz answers
export const submitQuiz = async (quizId, answers) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, {
      answers,
    });
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to submit quiz");
  }
};

// For professors - generate a quiz for a student
export const generateQuiz = async (studentId, title, numQuestions = 15) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/generate`, {
      student_id: studentId,
      title,
      num_questions: numQuestions,
    });
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to generate quiz");
  }
};

// Save quiz to database (basic quiz data only)
export const saveQuiz = async (quizData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/professors/quizzes`,
      quizData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to save quiz");
  }
};

// Update quiz availability settings (separate request)
export const updateQuizAvailability = async (quizId, availabilitySettings) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    console.log(
      `Updating availability for quiz ${quizId}:`,
      availabilitySettings
    );

    const response = await axios.put(
      `${API_URL}/professors/quizzes/${quizId}/availability`,
      availabilitySettings,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Quiz availability updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating quiz availability:", error);

    // Provide more specific error messages
    if (error.response?.status === 404) {
      throw new Error("Quiz not found");
    } else if (error.response?.status === 403) {
      throw new Error("You don't have permission to update this quiz");
    } else if (error.response?.status === 401) {
      throw new Error("Authentication required");
    }

    throw (
      error.response?.data || new Error("Failed to update quiz availability")
    );
  }
};

// Get quiz availability data
export const getQuizAvailability = async (quizId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      `${API_URL}/professors/quizzes/${quizId}/availability`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Quiz availability data:", response.data);

    return {
      availability: response.data.availability || null,
      assigned_students: response.data.assigned_students || [],
      status: response.data.status || "inactive",
      ...response.data,
    };
  } catch (error) {
    console.error("Error fetching quiz availability:", error);

    // Return null if availability doesn't exist (404)
    if (error.response?.status === 404) {
      return {
        availability: null,
        assigned_students: [],
        status: "inactive",
      };
    }

    throw error.response
      ? error.response.data
      : new Error("Failed to get quiz availability");
  }
};

// Get professor's quizzes
export const getProfessorQuizzes = async (moduleId = null) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const url = moduleId
      ? `${API_URL}/professors/quizzes?module_id=${moduleId}`
      : `${API_URL}/professors/quizzes`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching professor quizzes:", error);
    throw error.response
      ? error.response.data
      : new Error("Failed to get quizzes");
  }
};

// Get quizzes for a specific module
export const getModuleQuizzes = async (moduleId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      `${API_URL}/professors/modules/${moduleId}/quizzes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching quizzes for module ${moduleId}:`, error);
    throw error.response
      ? error.response.data
      : new Error("Failed to get module quizzes");
  }
};

// Get quizzes for students with module filtering
export const getStudentQuizzes = async (moduleId = null) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const url = moduleId
      ? `${API_URL}/students/quizzes?module_id=${moduleId}`
      : `${API_URL}/students/quizzes`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Quizzes: ', response);

    // Ensure we return properly formatted data
    return {
      quizzes: response.data.quizzes || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error("Error fetching student quizzes:", error);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Re-throw authentication errors
    if (error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }

    // Re-throw network errors
    if (!error.response) {
      throw new Error("Network error. Please check your connection.");
    }

    // Re-throw server errors
    if (error.response?.status >= 500) {
      throw new Error("Server error. Please try again later.");
    }

    throw error.response?.data || new Error("Failed to get student quizzes");
  }
};

// Get available modules for quiz filtering
export const getAvailableModules = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    console.log(
      "Fetching available modules from:",
      `${API_URL}/modules/available`
    );

    const response = await axios.get(`${API_URL}/modules/available`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("API Response for available modules:", response.data);

    return {
      modules: response.data.modules || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error("Error fetching available modules:", error);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Re-throw to let calling component handle the error
    throw error.response?.data || new Error("Failed to get available modules");
  }
};

// Get quizzes filtered by specific module
export const getQuizzesByModule = async (moduleId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      `${API_URL}/students/quizzes?module_id=${moduleId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      quizzes: response.data.quizzes || [],
      module: response.data.module || null,
    };
  } catch (error) {
    console.error(`Error fetching quizzes for module ${moduleId}:`, error);
    throw error.response
      ? error.response.data
      : new Error("Failed to get module quizzes");
  }
};

// Get all students for quiz assignment
export const getStudentsForQuizAssignment = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`${API_URL}/students/quiz-participants`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Fetched students for quiz assignment:", response.data);

    return {
      students: response.data.students || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    console.error("Error fetching students for quiz assignment:", error);
    throw error.response
      ? error.response.data
      : new Error("Failed to get students");
  }
};

// Delete quiz
export const deleteQuiz = async (quizId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(
      `${API_URL}/professors/quizzes/${quizId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to delete quiz");
  }
};

// Update an existing quiz
export const updateQuiz = async (quizId, quizData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.put(
      `${API_URL}/professors/quizzes/${quizId}`,
      quizData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to update quiz");
  }
};

// Get quiz questions for editing
export const getQuizQuestions = async (quizId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`${API_URL}/quizzes/${quizId}/questions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Ensure we always return a proper structure
    return {
      questions: response.data.questions || [],
      quiz_id: quizId,
      ...response.data,
    };
  } catch (error) {
    console.error(`Error fetching questions for quiz ${quizId}:`, error);

    // Return empty structure instead of throwing
    if (error.response?.status === 404) {
      return {
        questions: [],
        quiz_id: quizId,
      };
    }

    throw error.response
      ? error.response.data
      : new Error("Failed to get quiz questions");
  }
};
