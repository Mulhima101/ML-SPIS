import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Save module to database with enhanced error handling
export const saveModule = async (moduleData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Validate required fields
    if (!moduleData.name || !moduleData.name.trim()) {
      throw new Error("Module name is required");
    }

    // Prepare data for API
    const preparedData = {
      name: moduleData.name.trim(),
      description:
        moduleData.description || `Module for ${moduleData.name.trim()}`,
      status: moduleData.status || "active",
      created_at: moduleData.created_at || new Date().toISOString(),
    };

    const response = await axios.post(
      `${API_URL}/professors/modules`,
      preparedData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please check your connection");
    }
    throw error.response
      ? error.response.data
      : new Error(`Failed to save module: ${error.message}`);
  }
};

// Get professor's modules
export const getProfessorModules = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`${API_URL}/professors/modules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    // Transform the response to ensure proper structure
    const modules = response.data.modules || response.data || [];

    // Keep original structure but ensure quizzes array exists
    const modulesWithQuizzes = modules.map((module) => ({
      ...module,
      quizzes: module.quizzes || [], // Keep existing quizzes if they exist
      quiz_count:
        module.quiz_count || (module.quizzes ? module.quizzes.length : 0),
    }));

    return { modules: modulesWithQuizzes };
  } catch (error) {
    console.error("API Error in getProfessorModules:", error);

    // Fallback to localStorage with proper structure
    const savedModules = localStorage.getItem("professorModules");
    if (savedModules) {
      try {
        const modules = JSON.parse(savedModules);
        const formattedModules = modules.map((module) => ({
          ...module,
          quizzes: module.quizzes || [],
          quiz_count:
            module.quiz_count || (module.quizzes ? module.quizzes.length : 0),
        }));
        return { modules: formattedModules };
      } catch (parseError) {
        console.error("Error parsing saved modules:", parseError);
      }
    }

    throw error.response
      ? error.response.data
      : new Error("Failed to get modules");
  }
};

// Get a specific module by ID
export const getModuleById = async (moduleId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(
      `${API_URL}/professors/modules/${moduleId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please check your connection");
    }
    throw error.response
      ? error.response.data
      : new Error(`Failed to get module: ${error.message}`);
  }
};

// Update module - enhanced with better validation
export const updateModule = async (moduleId, moduleData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Validate required fields
    if (!moduleData.name || !moduleData.name.trim()) {
      throw new Error("Module name is required");
    }

    // Prepare data for API
    const preparedData = {
      name: moduleData.name.trim(),
      description:
        moduleData.description || `Module for ${moduleData.name.trim()}`,
      status: moduleData.status || "active",
    };

    const response = await axios.put(
      `${API_URL}/professors/modules/${moduleId}`,
      preparedData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please check your connection");
    }
    throw error.response
      ? error.response.data
      : new Error(`Failed to update module: ${error.message}`);
  }
};

// Delete module - enhanced with better error handling
export const deleteModule = async (moduleId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.delete(
      `${API_URL}/professors/modules/${moduleId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please check your connection");
    }
    throw error.response
      ? error.response.data
      : new Error(`Failed to delete module: ${error.message}`);
  }
};
