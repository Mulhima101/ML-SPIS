import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StHeader from '../../components/students/stHeader';
import axios from 'axios';

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions: Question[];
}

interface Question {
  id: number;
  text: string;
  options: string[];
}

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingQuiz, setStartingQuiz] = useState(false);
  
  useEffect(() => {
    // Fetch quiz data
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!quizId) {
          setError('Quiz ID is missing');
          setLoading(false);
          return;
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token is missing. Please log in again.');
          setLoading(false);
          return;
        }
        
        try {
          const response = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setQuiz(response.data.quiz);
        } catch (apiError: any) {
          console.error('API Error:', apiError);
          
          // Use mock data as fallback for development
          setQuiz({
            id: quizId || '1',
            title: 'Sample Quiz',
            description: 'This is a sample quiz for development',
            duration_minutes: 20,
            questions: [
              {
                id: 1,
                text: 'What is SDLC?',
                options: [
                  'Software Development Life Cycle',
                  'System Design Lifecycle Course',
                  'Software Design Learning Center',
                  'System Development Leadership Council'
                ]
              },
              {
                id: 2,
                text: 'Which of the following is a core principle of OOP?',
                options: [
                  'Encapsulation',
                  'Procedural Programming',
                  'Linear Programming',
                  'Structured Programming'
                ]
              },
              {
                id: 3,
                text: 'What layer does TCP work on in the OSI model?',
                options: [
                  'Transport Layer',
                  'Application Layer',
                  'Network Layer',
                  'Physical Layer'
                ]
              }
            ]
          });
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching quiz:', error);
        setError(error.message || 'Failed to load quiz');
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId]);
  
  const handleStartQuiz = async () => {
    try {
      setStartingQuiz(true);
      
      if (!quizId) {
        setError('Quiz ID is missing');
        setStartingQuiz(false);
        return;
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token is missing. Please log in again.');
        setStartingQuiz(false);
        return;
      }
      
      try {
        // Start the quiz
        const response = await axios.post(`http://localhost:5000/api/quizzes/${quizId}/start`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Redirect to the first question
        if (response.data.student_quiz_id) {
          navigate(`/students/quiz/${quizId}/question/1`);
        } else {
          throw new Error('Failed to start quiz');
        }
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        
        // For development, just redirect to first question
        navigate(`/students/quiz/${quizId}/question/1`);
      }
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      setError(error.message || 'Failed to start quiz');
      setStartingQuiz(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faeec9]">
        <StHeader />
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
          <div className="loading">Loading quiz information...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#faeec9]">
        <StHeader />
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
          <div className="error-message">
            {error}
            <div className="mt-4">
              <button 
                onClick={() => navigate('/students/quizzes')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#faeec9]">
        <StHeader />
        <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
          <div className="error-message">Quiz not found</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#faeec9]">
      <StHeader />
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-8 shadow-md">
          <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
          <p className="text-gray-600 mb-6">{quiz.description}</p>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Quiz Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Number of Questions</p>
                  <p className="font-medium">{quiz.questions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Limit</p>
                  <p className="font-medium">{quiz.duration_minutes} minutes</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-2">Instructions</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Read each question carefully before answering.</li>
              <li>You have {quiz.duration_minutes} minutes to complete the quiz.</li>
              <li>You can navigate between questions using the navigation panel.</li>
              <li>Submit all answers at the end of the quiz.</li>
              <li>Your progress will be saved automatically as you navigate.</li>
            </ul>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleStartQuiz}
              disabled={startingQuiz}
              className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              {startingQuiz ? 'Starting Quiz...' : 'Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;