// client_side/src/services/professorService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Professor profile management
export const getProfessorProfile = async (professorId) => {
  try {
    const response = await axios.get(`${API_URL}/professors/${professorId}`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get profile");
  }
};

export const updateProfessorProfile = async (professorId, profileData) => {
  try {
    const response = await axios.put(
      `${API_URL}/professors/${professorId}/profile`,
      profileData
    );
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to update profile");
  }
};

// Student management
export const getAllStudents = async () => {
  try {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get students");
  }
};

export const getStudentDetails = async (studentId) => {
  try {
    const response = await axios.get(`${API_URL}/students/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get student details");
  }
};

export const getStudentKnowledge = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/students/${studentId}/knowledge`
    );
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get student knowledge");
  }
};

export const getStudentQuizzes = async (studentId) => {
  try {
    const response = await axios.get(
      `${API_URL}/students/${studentId}/quizzes`
    );
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get student quizzes");
  }
};

// Dashboard data
export const getDashboardData = async () => {
  try {
    const response = await axios.get(`${API_URL}/professors/dashboard`);
    return response.data;
  } catch (error) {
    throw error.response
      ? error.response.data
      : new Error("Failed to get dashboard data");
  }
};

// Get analytics data (new)
export const getAnalyticsData = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      `${API_URL}/professors/analytics/students`,
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
      : new Error("Failed to get analytics data");
  }
};

// Mock data for development
export const getMockStudents = () => {
  return {
    students: [
      {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        studentId: "ITBIN-2110-1001",
        faculty: "Information Technology",
        intakeNo: "6",
        academicYear: "2024",
        quizzes: { total: 8, completed: 6 },
      },
      {
        id: 2,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        studentId: "ITBIN-2110-1002",
        faculty: "Information Technology",
        intakeNo: "6",
        academicYear: "2024",
        quizzes: { total: 5, completed: 3 },
      },
      {
        id: 3,
        firstName: "Michael",
        lastName: "Johnson",
        email: "michael@example.com",
        studentId: "ITBIN-2110-1003",
        faculty: "Information Technology",
        intakeNo: "7",
        academicYear: "2023",
        quizzes: { total: 10, completed: 9 },
      },
    ],
  };
};

export const getMockStudentDetails = (studentId) => {
  return {
    student: {
      id: studentId,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      studentId: "ITBIN-2110-1001",
      faculty: "Information Technology",
      intakeNo: "6",
      academicYear: "2024",
    },
    knowledge: {
      overall: { score: 0.72, level: "Normal" },
      topics: [
        { id: 1, topic: "SDLC", score: 0.8, level: "High" },
        { id: 2, topic: "Agile", score: 0.6, level: "Normal" },
        { id: 3, topic: "OSI Model", score: 0.45, level: "Low" },
      ],
    },
    quizzes: [
      {
        id: 1,
        title: "Software Engineering Basics",
        status: "completed",
        score: 85,
        start_time: "2024-10-15T14:00:00",
        end_time: "2024-10-15T14:30:00",
      },
      {
        id: 2,
        title: "Network Engineering Fundamentals",
        status: "completed",
        score: 72,
        start_time: "2024-10-18T10:00:00",
        end_time: "2024-10-18T10:30:00",
      },
    ],
  };
};

export const getMockDashboardData = () => {
  return {
    students_count: 28,
    quizzes_count: 14,
    completed_quizzes: 98,
    knowledge_levels: {
      high: 8,
      normal: 12,
      low: 8,
    },
  };
};
