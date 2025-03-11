import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import StHeader from '../../components/students/stHeader';

interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
}

const SingleQuestionPage: React.FC = () => {
  const { quizId, questionId } = useParams<{ quizId: string; questionId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(15);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        setTimeout(() => {
          const mockQuiz: Quiz = {
            id: quizId || 'default',
            title: 'What is Lorem Ipsum.'
          };

          const isInReviewMode = window.location.search.includes('review=true');
          
          const mockQuestion: Question = {
            id: questionId || 'q1',
            text: 'Quisque tristique molestie arcu. Fusce tincidunt dictum eros, tempus fermentum nunc ultrices eu. Proin in lacus eleifend, pharetra ipsum eget, lacinia elit.',
            topic: 'SDLC',
            options: [
              'Maecenas turpis nibh',
              'faucibus ac convallis a',
              'aliquet sit amet quam',
              'tempus in volutpat at'
            ]
          };
          
          if (isInReviewMode) {
            mockQuestion.correctAnswer = 0;
            mockQuestion.explanation = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
          }
          
          setQuiz(mockQuiz);
          setQuestion(mockQuestion);
          setIsReviewMode(isInReviewMode);
          setQuestionNumber(parseInt(questionId || '1'));
          setTotalQuestions(15);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching question data:', error);
        setLoading(false);
      }
    };
    
    fetchQuestionData();
    
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizId, questionId]);
  
  const handleOptionSelect = (optionIndex: number) => {
    if (isReviewMode) return;
    setSelectedOption(optionIndex);
  };
  
  const handleSubmitAnswer = async () => {
    if (selectedOption === null) return;
    
    setIsSaving(true);
    
    try {
      console.log('Submitting answer:', {
        quizId,
        questionId,
        selectedOption,
        timeSpent
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (questionNumber < totalQuestions) {
        navigate(`/students/quiz/${quizId}/question/${questionNumber + 1}`);
      } else {
        navigate(`/students/quiz-result/${quizId}`);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return <div className="loading">Loading question...</div>;
  }
  
  if (!quiz || !question) {
    return <div className="error-message">Question not found</div>;
  }
  
  return (
    <div className="min-h-screen bg-[var(--primary-background-color)]">
      <StHeader />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>
        
        <div className="bg-[var(--secondary-background-color)] rounded-xl p-8 mb-6">
          <div className="flex flex-col mb-6">
            <p className="text-xl font-medium mb-4">{questionNumber}. {question.text}</p>
            
            <div className="space-y-4 mb-8">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedOption === index 
                      ? 'bg-[var(--quiz-button-color)] text-white' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  onClick={() => handleOptionSelect(index)}
                >
                  {option}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                className="bg-gray-200 px-6 py-2 rounded-lg font-medium"
                onClick={() => navigate(`/students/quiz/${quizId}/question/${questionNumber - 1}`)}
                disabled={questionNumber <= 1}
              >
                ← Previous
              </button>
              
              {questionNumber < totalQuestions ? (
                <button 
                  className="bg-[var(--quiz-button-color)] text-white px-6 py-2 rounded-lg font-medium"
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null || isSaving}
                >
                  Next →
                </button>
              ) : (
                <button 
                  className="bg-[var(--quiz-button-color)] text-white px-6 py-2 rounded-lg font-medium"
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null || isSaving}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--secondary-background-color)] rounded-xl p-6">
          <p className="mb-4 font-medium">Question Numbers</p>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: totalQuestions }).map((_, index) => (
              <Link
                key={index}
                to={`/students/quiz/${quizId}/question/${index + 1}`}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  index + 1 === questionNumber 
                    ? 'bg-red-500 text-white' 
                    : index < questionNumber
                      ? 'bg-green-500 text-white'
                      : 'bg-amber-200'
                }`}
              >
                {index + 1}
              </Link>
            ))}
          </div>
          
          <div className="flex justify-center mt-16">
            <div className="w-40 h-40 rounded-full border-4 border-[var(--quiz-button-color)] flex items-center justify-center">
              <span className="text-4xl font-bold text-[var(--quiz-button-color)]">20:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleQuestionPage;