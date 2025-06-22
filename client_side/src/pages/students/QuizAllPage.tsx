// src/pages/students/QuizAllPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import StHeader from '../../components/students/stHeader';
import { getStudentQuizzes, getAvailableModules } from '../../services/quizService';
import { formatTimeIST, formatDateTimeIST, getCurrentTimeIST, isWithinTimeWindow, toIST } from '../../utils/dateUtils';

interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'uncompleted' | 'upcoming';
  result?: 'Pass' | 'Fail';
  score?: string;
  startTime: string;
  endTime: string;
  startDate: string; // Add start date
  endDate: string; // Add end date
  duration: string; // e.g., "20:00", "30:00"
  module_name?: string;
  module_id?: string;
  can_start?: boolean;
  can_continue?: boolean;
  created_at?: string;
  duration_minutes?: number;
  start_time?: string;
  end_time?: string;
}

const QuizAllPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModule, setSelectedModule] = useState<string>('all'); // Add module filter
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('studentUser');
    if (!user) {
      navigate('/students/login');
      return;
    }

    // Fetch real quizzes data with module information from API
    const fetchQuizzes = async () => {
      try {
        setLoading(true);

        // Fetch quizzes and available modules from API
        const [quizzesResponse, modulesResponse] = await Promise.all([
          getStudentQuizzes(), // This will now include module_name from your API
          getAvailableModules()
        ]);

        // Transform API response to match frontend interface
        const transformedQuizzes = quizzesResponse.quizzes?.map(quiz => {
          const currentDateIST = getCurrentTimeIST();

          // Only use quiz_start_time and quiz_end_time for timing
          const startDate = quiz.quiz_start_time ? toIST(quiz.quiz_start_time) : null;
          const endDate = quiz.quiz_end_time ? toIST(quiz.quiz_end_time) :
            (startDate ? new Date(startDate.getTime() + (quiz.duration_minutes || 60) * 60 * 1000) : null);

          // Determine status based on available fields using IST
          let status: 'completed' | 'uncompleted' | 'upcoming' = 'uncompleted';

          if (quiz.is_completed) {
            status = 'completed';
          } else if (startDate && quiz.can_start === false && quiz.can_continue === false) {
            // Quiz might be scheduled for future or ended
            if (startDate > currentDateIST) {
              status = 'upcoming';
            } else {
              status = 'uncompleted';
            }
          } else if (quiz.can_start || quiz.can_continue) {
            status = 'uncompleted';
          }

          return {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description || 'No description',
            status,
            result: quiz.is_completed ? (quiz.score >= 70 ? 'Pass' : 'Fail') : undefined,
            score: quiz.score ? `${quiz.score}/100` : '0/100',
            startTime: startDate ? formatTimeIST(startDate) : 'Not scheduled',
            startDate: startDate ? startDate.toISOString().split('T')[0] : 'Not scheduled',
            endTime: endDate ? formatTimeIST(endDate) : 'Not scheduled',
            endDate: endDate ? endDate.toISOString().split('T')[0] : 'Not scheduled',
            duration: quiz.duration_minutes ? `${quiz.duration_minutes}:00` : '60:00',
            module_name: quiz.module_name,
            module_id: quiz.module_id,
            can_start: quiz.can_start,
            can_continue: quiz.can_continue,
            created_at: quiz.created_at,
            duration_minutes: quiz.duration_minutes,
            start_time: quiz.quiz_start_time,
            end_time: quiz.quiz_end_time,
          };
        }) || [];

        setQuizzes(transformedQuizzes);

        // Extract unique modules from API response
        const modules = modulesResponse.modules?.map(module => module.name) ||
          [...new Set(transformedQuizzes.map(quiz => quiz.module_name).filter(Boolean))];
        setAvailableModules(modules);

        console.log('Successfully loaded real quiz data:', transformedQuizzes);

      } catch (error) {
        console.error('Error fetching quizzes:', error);

        // Show API error to user instead of falling back to mock data
        setQuizzes([]);
        setAvailableModules([]);

        // You can add an error state here if needed
        alert('Failed to load quizzes. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [navigate]);

  // Filter quizzes by selected module
  const filteredQuizzes = selectedModule === 'all'
    ? quizzes
    : quizzes.filter(quiz => quiz.module_name === selectedModule);

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      setStartingQuizId(quiz.id);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log(`Starting quiz ${quiz.id}...`);
      console.log('Using token:', token.substring(0, 20) + '...');

      // Start the quiz using the API
      const response = await axios.post(`http://localhost:5000/api/students/quizzes/${quiz.id}/start`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Quiz started successfully:', response.data);

      // Navigate to the quiz page without question ID
      navigate(`/students/quiz/${quiz.id}/question`);

    } catch (error: any) {
      console.error('Error starting quiz:', error);

      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || 'Access forbidden';
        console.error('403 Forbidden details:', errorMessage);

        if (errorMessage.includes('token') || errorMessage.includes('expired')) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('studentUser');
          navigate('/students/login');
        } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          alert('You do not have permission to start this quiz. Please contact your instructor.');
        } else {
          alert(`Access forbidden: ${errorMessage}`);
        }
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Quiz has already been started or completed';
        // If quiz already started, navigate to it anyway
        navigate(`/students/quiz/${quiz.id}/question`);
      } else if (error.response?.status === 404) {
        alert('Quiz not found.');
      } else if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('studentUser');
        navigate('/students/login');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to start quiz';
        alert(`Error: ${errorMessage}. Please try again.`);
      }
    } finally {
      setStartingQuizId(null);
    }
  };

  // Helper function to check if quiz can be started based on timing (using IST)
  const canStartQuiz = (quiz: Quiz): boolean => {
    const currentTimeIST = getCurrentTimeIST();

    // If quiz is completed, it cannot be started
    if (quiz.status === 'completed') {
      return false;
    }

    // Check if quiz has start and end times with dates
    if (quiz.start_time && quiz.end_time) {
      const startDateTime = toIST(quiz.start_time);
      const endDateTime = toIST(quiz.end_time);

      // Check if current time is within the quiz window
      return currentTimeIST >= startDateTime && currentTimeIST <= endDateTime;
    }

    // If no specific timing constraints, allow based on can_start flag
    return quiz.can_start !== false;
  };

  // Helper function to get button text based on quiz timing (using IST)
  const getStartButtonText = (quiz: Quiz): string => {
    if (startingQuizId === quiz.id) {
      return 'Starting...';
    }

    if (quiz.status === 'completed') {
      return 'Completed';
    }

    const currentTimeIST = getCurrentTimeIST();

    if (quiz.start_time && quiz.end_time) {
      const startDateTime = toIST(quiz.start_time);
      const endDateTime = toIST(quiz.end_time);

      if (currentTimeIST < startDateTime) {
        return `Starts ${formatDateTimeIST(startDateTime)}`;
      }

      if (currentTimeIST > endDateTime) {
        return 'Time Expired';
      }
    }

    return quiz.can_continue ? 'Continue' : 'Start';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faeec9] flex justify-center items-center">
        <div className="loading">Loading quizzes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faeec9]">
      <StHeader />

      <div className="p-4 md:p-8">
        <h1 className="text-4xl font-bold mb-6">Quiz</h1>

        {/* Module Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Module:
          </label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Modules</option>
            {availableModules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-[40px] p-6 shadow-sm">
          <div className="space-y-4">
            {filteredQuizzes.length > 0 ? (
              filteredQuizzes.map((quiz) => {
                let bgColor = "bg-gray-200";
                if (quiz.status === 'completed') {
                  bgColor = quiz.result === 'Pass' ? "bg-green-100" : "bg-red-100";
                } else if (quiz.status === 'upcoming') {
                  bgColor = "bg-yellow-100";
                }

                const isStartEnabled = canStartQuiz(quiz);
                const buttonText = getStartButtonText(quiz);

                return (
                  <div
                    key={quiz.id}
                    className={`${bgColor} rounded-[20px] p-4 flex flex-col lg:flex-row justify-between lg:items-center`}
                  >
                    <div className="flex flex-[2] flex-col">
                      <h2 className="text-[1.5rem] font-semibold">{quiz.title}</h2>
                      <p className="text-gray-600">{quiz.description}</p>
                      {quiz.module_name && (
                        <p className="text-sm text-blue-600 font-medium">Module: {quiz.module_name}</p>
                      )}
                      <p className="mt-1">{quiz.status}</p>
                    </div>

                    <div className='flex-1 [&>*]:text-xl'>
                      {quiz.result && (
                        <span className={quiz.result === 'Pass' ? 'text-green-600' : 'text-red-600'}>
                          {quiz.result}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-[3] justify-start sm:justify-end items-end">

                      <div className="sm:text-right flex flex-1 flex-col sm:flex-row gap-1 sm:gap-10 justify-center items-start [&>p]:text-[1.2rem] sm:[&>p]:text-[1.4rem] mr-10">
                        <p>{quiz.score}</p>
                        <p>Start: {quiz.startDate} {quiz.startTime}</p>
                        <p>End: {quiz.endDate} {quiz.endTime}</p>
                        <p className="!text-[1.6rem] font-bold">{quiz.duration}</p>
                      </div>

                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        disabled={!isStartEnabled}
                        className={`px-6 py-2 rounded-xl transition ${isStartEnabled
                          ? 'bg-[#172554] text-white hover:bg-[#1e3a8a]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No quizzes available at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Please check back later or contact your instructor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAllPage;