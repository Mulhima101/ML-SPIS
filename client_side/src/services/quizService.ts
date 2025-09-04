// client_side/src/services/quizService.js
import axios from "axios";

export interface Quiz {
  id: string;
  title: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  text: string;
  options?: string[];
}

export interface AvailabilitySettings {
  start_date?: string;
  end_date?: string;
  assigned_students?: string[];
}

export interface Module {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
}

const API_URL = "http://localhost:5000/api";

// Get all quizzes for the current user
export const getAllQuizzes = async (): Promise<Quiz[]> => {
  try {
    const response = await axios.get(`${API_URL}/quizzes`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get a specific quiz with questions
export const getQuiz = async (quizId: string): Promise<Quiz> => {
  try {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Start a quiz (creates a student quiz record)
export const startQuiz = async (quizId: string): Promise<unknown> => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/start`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Submit quiz answers
export const submitQuiz = async (
  quizId: string,
  answers: Record<string, string | null>
): Promise<Record<string, unknown>> => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, {
      answers,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// For professors - generate a quiz for a student
export const generateQuiz = async (
  studentId: string,
  title: string,
  numQuestions: number = 15
): Promise<Quiz> => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/generate`, {
      student_id: studentId,
      title,
      num_questions: numQuestions,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Save quiz to database (basic quiz data only)
export const saveQuiz = async (
  quizData: Record<string, unknown>
): Promise<unknown> => {
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
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Update quiz availability settings (separate request)
export const updateQuizAvailability = async (
  quizId: string,
  availabilitySettings: AvailabilitySettings
): Promise<unknown> => {
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
  } catch (error: unknown) {
    console.error("Error updating quiz availability:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) throw new Error("Quiz not found");
      if (status === 403)
        throw new Error("You don't have permission to update this quiz");
      if (status === 401) throw new Error("Authentication required");
      throw error.response?.data ?? new Error(error.message);
    }

    throw new Error(String(error));
  }
};

// Get quiz availability data
export const getQuizAvailability = async (
  quizId: string
): Promise<{
  availability: unknown;
  assigned_students: string[];
  status: string;
  [key: string]: unknown;
}> => {
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
  } catch (error: unknown) {
    console.error("Error fetching quiz availability:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          availability: null,
          assigned_students: [],
          status: "inactive",
        };
      }
      throw error.response?.data ?? new Error(error.message);
    }

    throw new Error(String(error));
  }
};

// Get professor's quizzes
export const getProfessorQuizzes = async (
  moduleId: string | null = null
): Promise<Quiz[]> => {
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
  } catch (error: unknown) {
    console.error("Error fetching professor quizzes:", error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get quizzes for a specific module
export const getModuleQuizzes = async (moduleId: string): Promise<Quiz[]> => {
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
  } catch (error: unknown) {
    console.error(`Error fetching quizzes for module ${moduleId}:`, error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get quizzes for students with module filtering
export const getStudentQuizzes = async (
  moduleId: string | null = null
): Promise<{ quizzes: Quiz[]; total: number }> => {
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

    console.log("Quizzes: ", response);

    // Ensure we return properly formatted data
    return {
      quizzes: response.data.quizzes || [],
      total: response.data.total || 0,
    };
  } catch (error: unknown) {
    console.error("Error fetching student quizzes:", error);
    if (axios.isAxiosError(error)) {
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      }

      if (!error.response) {
        throw new Error("Network error. Please check your connection.");
      }

      if (error.response?.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }

      throw error.response?.data ?? new Error(error.message);
    }

    throw new Error(String(error));
  }
};

// Get available modules for quiz filtering
export const getAvailableModules = async (): Promise<{
  modules: Module[];
  total: number;
}> => {
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
  } catch (error: unknown) {
    console.error("Error fetching available modules:", error);
    if (axios.isAxiosError(error)) {
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get quizzes filtered by specific module
export const getQuizzesByModule = async (
  moduleId: string
): Promise<{ quizzes: Quiz[]; module: Module | null }> => {
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
  } catch (error: unknown) {
    console.error(`Error fetching quizzes for module ${moduleId}:`, error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get all students for quiz assignment
export const getStudentsForQuizAssignment = async (): Promise<{
  students: Student[];
  total: number;
}> => {
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
  } catch (error: unknown) {
    console.error("Error fetching students for quiz assignment:", error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Delete quiz
export const deleteQuiz = async (quizId: string): Promise<unknown> => {
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
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Update an existing quiz
export const updateQuiz = async (
  quizId: string,
  quizData: Record<string, unknown>
): Promise<unknown> => {
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
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get quiz questions for editing
export const getQuizQuestions = async (
  quizId: string
): Promise<{
  questions: Question[];
  quiz_id: string;
  [key: string]: unknown;
}> => {
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
  } catch (error: unknown) {
    console.error(`Error fetching questions for quiz ${quizId}:`, error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          questions: [],
          quiz_id: quizId,
        };
      }
      throw error.response?.data ?? new Error(error.message);
    }

    throw new Error(String(error));
  }
};
