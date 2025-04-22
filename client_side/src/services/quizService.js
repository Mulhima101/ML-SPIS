// client_side/src/services/quizService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get all quizzes for the current user
export const getAllQuizzes = async () => {
  try {
    const response = await axios.get(`${API_URL}/quizzes`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to get quizzes');
  }
};

// Get a specific quiz with questions
export const getQuiz = async (quizId) => {
  try {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to get quiz');
  }
};

// Start a quiz (creates a student quiz record)
export const startQuiz = async (quizId) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/start`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to start quiz');
  }
};

// Submit quiz answers
export const submitQuiz = async (quizId, answers) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, { answers });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to submit quiz');
  }
};

// For professors - generate a quiz for a student
export const generateQuiz = async (studentId, title, numQuestions = 15) => {
  try {
    const response = await axios.post(`${API_URL}/quizzes/generate`, {
      student_id: studentId,
      title,
      num_questions: numQuestions
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to generate quiz');
  }
};

// Mock data for development
export const getMockQuizzes = () => {
  return {
    quizzes: [
      {
        id: 'q1',
        title: 'What is OOP?',
        description: 'Programming Fundamentals',
        status: 'uncompleted',
        score: null,
        startTime: '07:00pm',
        endTime: '08:00pm',
        duration: '20:00'
      },
      {
        id: 'q2',
        title: 'Black-Box And White-Box Testing.',
        description: 'Software Engineering',
        status: 'completed',
        score: 85,
        startTime: '07:00pm',
        endTime: '08:00pm',
        duration: '30:00'
      },
      {
        id: 'q3',
        title: 'Supervised And Unsupervised Learning',
        description: 'Artificial Intelligence',
        status: 'uncompleted',
        score: null,
        startTime: '04:00pm',
        endTime: '05:00pm',
        duration: '15:00'
      }
    ]
  };
};

export const getMockQuiz = (quizId) => {
  return {
    quiz: {
      id: quizId,
      title: 'What is OOP?',
      description: 'Programming Fundamentals',
      duration_minutes: 20,
      questions: [
        {
          id: 1,
          text: 'Which of the following is a core principle of OOP?',
          options: [
            'Procedural Programming',
            'Encapsulation',
            'Functional Decomposition',
            'Linear Sequencing'
          ]
        },
        {
          id: 2,
          text: 'What does the "O" in SOLID principles stand for?',
          options: [
            'Object Orientation',
            'Open/Closed Principle',
            'Output Optimization',
            'Operational Efficiency'
          ]
        },
        {
          id: 3,
          text: 'What is inheritance in OOP?',
          options: [
            'Creating multiple instances of a class',
            'Hiding implementation details',
            'A mechanism where one class acquires properties of another class',
            'Converting objects to primitive data types'
          ]
        }
      ]
    }
  };
};