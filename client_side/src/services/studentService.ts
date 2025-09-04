// client_side/src/services/studentService.js
import axios from "axios";

// Type definitions
export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
}

export interface KnowledgeLevel {
  overall: {
    score: number;
    level: string;
  };
  topics: Array<{
    id: number;
    topic: string;
    score: number;
    level: string;
  }>;
}

export interface Guidance {
  topicGuidance: Array<{
    topic: string;
    score: number;
    status: string;
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      link: string;
    }>;
  }>;
  learningPath: {
    level: string;
    description: string;
    milestones: Array<{
      title: string;
      description: string;
      isCompleted: boolean;
    }>;
  };
}

export interface Quiz {
  id: string;
  title: string;
}

export interface ModulePerformance {
  modules: Array<{
    id: string;
    name: string;
    total_quizzes: number;
    completed_quizzes: number;
    average_score: number;
    quiz_percentage: number;
    quiz_details: unknown[];
  }>;
  total_modules: number;
  student_id: string;
  student_name: string;
}

// API raw module shape
export interface ApiModule {
  module_id: string;
  module_name: string;
  total_quizzes: number;
  completed_quizzes: number;
  average_percentage: number;
  completion_rate: number;
  quiz_details?: unknown[];
  [key: string]: unknown;
}

const API_URL = "http://localhost:5000/api";

// Student profile management
export const getStudentProfile = async (
  studentId: string
): Promise<StudentProfile> => {
  try {
    const response = await axios.get(`${API_URL}/students/${studentId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

export const updateStudentProfile = async (
  studentId: string,
  profileData: Record<string, unknown>
): Promise<StudentProfile> => {
  try {
    const response = await axios.put(
      `${API_URL}/students/${studentId}/profile`,
      profileData
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Knowledge level and guidance
export const getKnowledgeLevels = async (
  studentId: string
): Promise<KnowledgeLevel> => {
  try {
    const response = await axios.get(
      `${API_URL}/students/${studentId}/knowledge`
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

export const getPersonalizedGuidance = async (
  studentId: string
): Promise<Guidance> => {
  try {
    const response = await axios.get(
      `${API_URL}/students/${studentId}/guidance`
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Quiz history
export const getStudentQuizzes = async (studentId: string): Promise<Quiz[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/students/${studentId}/quizzes`
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error(error.message);
    }
    throw new Error(String(error));
  }
};

// Get student module performance
export const getStudentModulePerformance =
  async (): Promise<ModulePerformance> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(
        `${API_URL}/students/module-performance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Transform API response to match frontend interface
      const transformedData: ModulePerformance = {
        modules:
          response.data.modules?.map((module: ApiModule) => ({
            id: module.module_id,
            name: module.module_name,
            total_quizzes: module.total_quizzes,
            completed_quizzes: module.completed_quizzes,
            average_score: module.average_percentage,
            quiz_percentage: module.completion_rate,
            quiz_details: module.quiz_details || [],
          })) || [],
        total_modules: response.data.total_modules,
        student_id: response.data.student_id,
        student_name: response.data.student_name,
      };

      return transformedData;
    } catch (error: unknown) {
      console.error("Error fetching module performance:", error);
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? new Error(error.message);
      }
      throw new Error(String(error));
    }
  };

// Mock data functions for development (will remove in production)
export const getMockKnowledgeLevels = (): KnowledgeLevel => {
  return {
    overall: {
      score: 0.72,
      level: "Normal",
    },
    topics: [
      { id: 1, topic: "SDLC", score: 0.8, level: "High" },
      { id: 2, topic: "Agile", score: 0.6, level: "Normal" },
      { id: 3, topic: "OSI Model", score: 0.75, level: "Normal" },
      { id: 4, topic: "Software Engineering", score: 0.9, level: "High" },
      { id: 5, topic: "Network Engineering", score: 0.45, level: "Low" },
    ],
  };
};

export const getMockGuidance = (): Guidance => {
  return {
    topicGuidance: [
      {
        topic: "Network Engineering",
        score: 0.45,
        status: "weak",
        recommendations: [
          {
            type: "resource",
            title: "Fundamentals",
            description:
              "Review the basic concepts of Network Engineering to build a solid foundation.",
            link: "/resources/fundamentals",
          },
          {
            type: "practice",
            title: "Basic Practice",
            description:
              "Complete basic exercises to reinforce your understanding of Network Engineering.",
            link: "/practice/basic",
          },
        ],
      },
      {
        topic: "Agile",
        score: 0.6,
        status: "moderate",
        recommendations: [
          {
            type: "resource",
            title: "Advanced Concepts",
            description:
              "Explore more advanced concepts in Agile to deepen your knowledge.",
            link: "/resources/advanced",
          },
        ],
      },
      {
        topic: "SDLC",
        score: 0.8,
        status: "strong",
        recommendations: [
          {
            type: "goal",
            title: "Knowledge Sharing",
            description:
              "Consider sharing your knowledge of SDLC with peers or in online forums.",
            link: "/community",
          },
        ],
      },
    ],
    learningPath: {
      level: "Normal",
      description:
        "Your current knowledge level is Normal. This personalized learning path will help you strengthen your weak areas and advance to a High knowledge level.",
      milestones: [
        {
          title: "Strengthen Knowledge",
          description:
            "Aim to improve your scores in all topics to at least 70%.",
          isCompleted: false,
        },
        {
          title: "Apply Concepts",
          description:
            "Work on applying theoretical knowledge to practical problems.",
          isCompleted: false,
        },
        {
          title: "Advanced Topics",
          description: "Begin exploring more advanced topics and concepts.",
          isCompleted: false,
        },
      ],
    },
  };
};
