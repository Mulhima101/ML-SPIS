import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

import StHeader from '../../components/students/stHeader';
import { getCurrentTimeIST, formatTimeIST } from '../../utils/dateUtils';

interface Question {
  id: number;
  text: string;
  options: string[];
  question_number: number;
  selected_answer: number | null;
  points: number;
  topic: string;
}

interface QuizData {
  id: string;
  title: string;
  duration_minutes: number;
  total_questions: number;
  questions: Question[];
}

const SingleQuestionPage: React.FC = () => {
  const { quizId, questionId } = useParams<{ quizId: string; questionId?: string }>();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [questionNumbers, setQuestionNumbers] = useState<{ number: number, answered: boolean, current: boolean }[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);
  const [showCompletionNotification, setShowCompletionNotification] = useState<boolean>(false);

  const currentQuestionNumber = currentQuestionIndex + 1;
  const currentQuestion = quizData?.questions[currentQuestionIndex] || null;

  useEffect(() => {
    const user = localStorage.getItem('studentUser');
    if (!user) {
      navigate('/students/login');
      return;
    }

    const fetchQuizQuestions = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        try {
          const response = await axios.get(`http://localhost:5000/api/students/quizzes/${quizId}/questions`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const questionsData = response.data;

          if (!questionsData.questions || questionsData.questions.length === 0) {
            setError('No questions found for this quiz');
            return;
          }

          const quizInfo: QuizData = {
            id: quizId || '',
            title: questionsData.quiz_title || 'Quiz',
            duration_minutes: questionsData.duration_minutes || 60,
            total_questions: questionsData.questions.length,
            questions: questionsData.questions
          };

          setQuizData(quizInfo);

          // Set initial question index based on questionId parameter if provided
          const initialQuestionIndex = questionId ? parseInt(questionId) - 1 : 0;
          if (initialQuestionIndex >= 0 && initialQuestionIndex < quizInfo.total_questions) {
            setCurrentQuestionIndex(initialQuestionIndex);
          }

          const questionNumbersArray = Array.from({ length: quizInfo.total_questions }, (_, i) => ({
            number: i + 1,
            answered: answers[i + 1] !== undefined,
            current: i === initialQuestionIndex
          }));
          setQuestionNumbers(questionNumbersArray);

          setTimeRemaining(quizInfo.duration_minutes * 60);

        } catch (questionsError: any) {
          if (questionsError.response?.status === 404) {
            try {
              const startResponse = await axios.post(`http://localhost:5000/api/students/quizzes/${quizId}/start`, {}, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              const questionsResponse = await axios.get(`http://localhost:5000/api/students/quizzes/${quizId}/questions`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              const questionsData = questionsResponse.data;

              if (!questionsData.questions || questionsData.questions.length === 0) {
                setError('No questions found for this quiz');
                return;
              }

              const quizInfo: QuizData = {
                id: quizId || '',
                title: questionsData.quiz_title || 'Quiz',
                duration_minutes: questionsData.duration_minutes || 60,
                total_questions: questionsData.questions.length,
                questions: questionsData.questions
              };

              setQuizData(quizInfo);

              // Set initial question index based on questionId parameter if provided
              const initialQuestionIndex = questionId ? parseInt(questionId) - 1 : 0;
              if (initialQuestionIndex >= 0 && initialQuestionIndex < quizInfo.total_questions) {
                setCurrentQuestionIndex(initialQuestionIndex);
              }

              const questionNumbersArray = Array.from({ length: quizInfo.total_questions }, (_, i) => ({
                number: i + 1,
                answered: answers[i + 1] !== undefined,
                current: i === initialQuestionIndex
              }));
              setQuestionNumbers(questionNumbersArray);

              setTimeRemaining(quizInfo.duration_minutes * 60);

            } catch (startError: any) {
              if (startError.response?.status === 400) {
                setError('Quiz has already been started or completed.');
              } else if (startError.response?.status === 404) {
                setError('Quiz not found.');
              } else {
                setError('Failed to start quiz. Please try again.');
              }
            }
          } else if (questionsError.response?.status === 403) {
            setError('You do not have permission to access this quiz');
          } else {
            setError('Failed to load quiz questions');
          }
        }

      } catch (error: any) {
        setError('Failed to load quiz questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, [quizId, questionId, navigate]);

  useEffect(() => {
    if (quizData && currentQuestion) {
      setSelectedOption(answers[currentQuestionNumber] ?? null);

      setQuestionNumbers(prev => prev.map((q, index) => ({
        ...q,
        current: index === currentQuestionIndex,
        answered: answers[q.number] !== undefined
      })));
    }
  }, [currentQuestionIndex, answers, currentQuestionNumber, quizData, currentQuestion]);

  useEffect(() => {
    if (!loading && quizData) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, quizData]);

  const saveAnswer = (questionNumber: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answerIndex
    }));
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    saveAnswer(currentQuestionNumber, optionIndex);
  };

  const handleNextQuestion = () => {
    if (!quizData) return;

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < quizData.total_questions) {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handlePreviousQuestion = () => {
    const prevIndex = currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const handleQuestionNavigation = (questionNumber: number) => {
    const questionIndex = questionNumber - 1;
    if (questionIndex >= 0 && questionIndex < (quizData?.total_questions || 0)) {
      setCurrentQuestionIndex(questionIndex);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmittingQuiz(true);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const formattedAnswers = Object.entries(answers).map(([questionNum, answerIndex]) => ({
        question_id: quizData?.questions[parseInt(questionNum) - 1]?.id,
        selected_option: answerIndex
      }));

      const response = await axios.post(`http://localhost:5000/api/students/quizzes/${quizId}/submit`, {
        answers: formattedAnswers
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Quiz submitted successfully:', response.data);

      // Show completion notification
      setShowCompletionNotification(true);

      // Wait 2 seconds before navigating to allow user to see the notification
      setTimeout(() => {
        navigate(`/students/quiz-result/${quizId}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faeec9] flex justify-center items-center">
        <div className="loading">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faeec9]">
        <StHeader />
        <div className="container mx-auto py-6 flex justify-center items-center min-h-[70vh]">
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <Link
              to="/students/quizzes"
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition"
            >
              Back to Quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#faeec9]">
        <StHeader />
        <div className="container mx-auto py-6 flex justify-center items-center min-h-[70vh]">
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <p className="text-gray-600 text-lg">Question not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === quizData.total_questions - 1;

  return (
    <div className="min-h-screen bg-[#faeec9]">
      <StHeader />

      {/* Quiz Completion Notification */}
      {showCompletionNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md mx-4">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
              <p className="text-gray-600">Your answers have been submitted successfully.</p>
            </div>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{quizData.title}</h1>

        <div className="flex gap-4 px-4">
          <div className="w-2/3 bg-amber-100 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Question {currentQuestionNumber} of {quizData.total_questions}
              </h2>
              <p className="text-lg mb-6">{currentQuestion.text}</p>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${selectedOption === index
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-300 bg-white hover:border-amber-300'
                      }`}
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                className={`px-6 py-2 rounded-lg transition ${currentQuestionIndex > 0
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex <= 0 || submittingQuiz}
              >
                ← Previous
              </button>

              {isLastQuestion ? (
                <button
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz}
                >
                  {submittingQuiz ? 'Submitting...' : 'Submit Quiz →'}
                </button>
              ) : (
                <button
                  className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
                  onClick={handleNextQuestion}
                  disabled={submittingQuiz}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          <div className="w-1/3 bg-amber-100 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Questions</h3>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {questionNumbers.map((q) => (
                <button
                  key={q.number}
                  onClick={() => handleQuestionNavigation(q.number)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition ${q.current
                    ? 'bg-red-500 text-white'
                    : q.answered
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                >
                  {q.number}
                </button>
              ))}
            </div>

            <div className="text-center">
              <h4 className="text-lg font-semibold mb-4">Time Remaining</h4>
              <div className="w-40 h-40 rounded-full border-4 border-amber-500 flex items-center justify-center mx-auto">
                <span className="text-4xl font-bold text-amber-500">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleQuestionPage;