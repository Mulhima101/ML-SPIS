import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import StHeader from '../../components/students/stHeader';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number;
}

const SingleQuestionPage: React.FC = () => {
  const { quizId, questionId } = useParams<{ quizId: string; questionId: string }>();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState<string>('What is Lorem Ipsum.');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(1200); // 20 minutes
  const [loading, setLoading] = useState<boolean>(true);
  const [questionNumbers, setQuestionNumbers] = useState<{number: number, answered: boolean, current: boolean}[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(15);
  
  // Get current question number from param
  const currentQuestionNumber = parseInt(questionId || '1', 10);
  const isLastQuestion = currentQuestionNumber === 15;
  
  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('studentUser');
    if (!user) {
      navigate('/students/login');
      return;
    }

    // Set up question numbers array for navigation
    const questionNumbersArray = Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      // Mark some questions as answered for demonstration
      answered: [1, 2, 3, 4, 5, 7, 8, 11, 12, 13, 14].includes(i + 1),
      current: i + 1 === currentQuestionNumber
    }));
    setQuestionNumbers(questionNumbersArray);
    
    // Mock fetching question data
    const fetchQuestion = async () => {
      try {
        setTimeout(() => {
          // Simulate different questions based on question number
          const questionText = currentQuestionNumber === 15 
            ? "Vestibulum congue luctus lorem, vitae varius nunc condimentum et. Vestibulum feugiat imperdiet dapibus. Aliquam eu sodales diam."
            : "Quisque tristique molestie arcu. Fusce tincidunt dictum eros, tempus fermentum nunc ultrices eu. Proin in lacus eleifend, pharetra ipsum eget, lacinia elit.";
            
          const mockQuestion: Question = {
            id: `q${currentQuestionNumber}`,
            text: questionText,
            options: currentQuestionNumber === 15 
              ? [
                "Suspendisse potenti",
                "leo a diam volutpat",
                "Vivamus et hendrerit tortor",
                "volutpat quam tincidunt"
              ]
              : [
                "Maecenas turpis nibh",
                "faucibus ac convallis a",
                "aliquet sit amet quam",
                "tempus in volutpat at"
              ]
          };
          
          setCurrentQuestion(mockQuestion);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching question:', error);
        setLoading(false);
      }
    };
    
    fetchQuestion();
    
    // Timer effect
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizId, questionId, currentQuestionNumber, navigate]);
  
  const handleNextQuestion = () => {
    // In real app, save answer to state or backend before navigating
    if (selectedOption !== null) {
      navigate(`/students/quiz/${quizId}/question/${currentQuestionNumber + 1}`);
      setSelectedOption(null); // Reset selection for next question
    }
  };
  
  const handlePreviousQuestion = () => {
    navigate(`/students/quiz/${quizId}/question/${currentQuestionNumber - 1}`);
  };
  
  const handleSubmitQuiz = () => {
    // In real app, submit all answers to backend
    navigate(`/students/quiz-result/${quizId}`);
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faeec9] flex justify-center items-center">
        <div className="loading">Loading question...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#faeec9]">
      <StHeader />
      
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{quizTitle}</h1>
        
        <div className="flex gap-4 px-4">
          {/* Question area */}
          <div className="w-2/3 bg-amber-200 rounded-2xl p-8">
            {currentQuestion && (
              <>
                <h2 className="text-xl mb-6">
                  {currentQuestionNumber}. {currentQuestion.text}
                </h2>
                
                <div className="space-y-4 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className={`w-full p-4 bg-white rounded-lg text-left hover:bg-gray-50 
                        ${selectedOption === index ? 'bg-amber-50 border-2 border-amber-500' : ''}`}
                      onClick={() => setSelectedOption(index)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-between mt-8">
                  <button 
                    className={`px-6 py-2 rounded-lg ${
                      currentQuestionNumber > 1 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionNumber <= 1}
                  >
                    ← Previous
                  </button>
                  
                  {isLastQuestion ? (
                    <button 
                      className="bg-green-500 text-white px-6 py-2 rounded-lg"
                      onClick={handleSubmitQuiz}
                    >
                      Submit →
                    </button>
                  ) : (
                    <button 
                      className={`bg-gray-800 text-white px-6 py-2 rounded-lg ${
                        selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={handleNextQuestion}
                      disabled={selectedOption === null}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Question numbers and timer */}
          <div className="w-1/3 bg-amber-100 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-6">Question Numbers</h3>
            
            <div className="grid grid-cols-5 gap-4 mb-auto">
              {questionNumbers.map((item) => (
                <Link
                  key={item.number}
                  to={`/students/quiz/${quizId}/question/${item.number}`}
                  className={`w-12 h-12 flex items-center justify-center font-bold rounded-lg
                    ${item.current && item.answered ? 'bg-blue-500 text-white' : ''}
                    ${item.current && !item.answered ? 'bg-red-500 text-white' : ''}
                    ${!item.current && item.answered ? 'bg-green-500 text-white' : ''}
                    ${!item.current && !item.answered ? 'bg-amber-200' : ''}
                  `}
                >
                  {item.number}
                </Link>
              ))}
            </div>
            
            <div className="mt-16 flex justify-center">
              <div className="w-40 h-40 rounded-full border-4 border-amber-500 flex items-center justify-center">
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