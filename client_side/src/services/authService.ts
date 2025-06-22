import axios from "axios";

const API_URL = "http://localhost:5000/api";

interface StudentRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  intakeNo: string;
  academicYear: string;
}

interface ProfessorRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  honorifics: string,
  faculty: string,
}

interface AuthResponse {
  token: string;
  user: string;
  success?: boolean;
}

// Configure axios with interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication services
export const loginStudent = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("studentUser", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error: unknown) {
    console.error("Login error:", error);
    throw new Error("Login failed");
  }
};

export const loginProfessor = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("professorUser", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Login failed");
  }
};

export const registerStudent = async (
  studentData: StudentRegistrationData
): Promise<boolean> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/auth/register/student`,
      studentData
    );

    if (response.data.success) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error("Registration failed");
  }
};

export const registerProfessor = async (
  professorData: ProfessorRegistrationData
): Promise<boolean> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/auth/register/professor`,
      professorData
    );

    if (response.data.success) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error("Registration failed");
  }
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("studentUser");
  localStorage.removeItem("professorUser");
};

export const getCurrentUser = (): string | null => {
  return JSON.parse(
    localStorage.getItem("studentUser") ||
      localStorage.getItem("professorUser") ||
      "null"
  );
};

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem("token");
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};
