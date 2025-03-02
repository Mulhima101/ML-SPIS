import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../../styles/quiz.css';

import StHeader from '../../components/students/stHeader';

interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctAnswer?: number; // Only available in review mode
  explanation?: string; // Only available in review mode
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
    // Mock fetching question data
    const fetchQuestionData = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockQuiz: Quiz = {
            id: quizId || 'default',
            title: 'Software Engineering Concepts'
          };
          
          // Check URL for review mode
          const isInReviewMode = window.location.search.includes('review=true');
          
          const mockQuestion: Question = {
            id: questionId || 'q1',
            text: 'What does SDLC stand for in software engineering?',
            topic: 'SDLC',
            options: [
              'Software Development Life Cycle',
              'System Design Life Cycle',
              'Software Design Level Control',
              'System Development Logic Control'
            ]
          };
          
          // Add review-specific data if in review mode
          if (isInReviewMode) {
            mockQuestion.correctAnswer = 0; // First option is correct
            mockQuestion.explanation = 'SDLC (Software Development Life Cycle) is a process followed for a software project, within a software organization. It consists of a detailed plan describing how to develop, maintain, replace and alter or enhance specific software.';
          }
          
          setQuiz(mockQuiz);
          setQuestion(mockQuestion);
          setIsReviewMode(isInReviewMode);
          
          // Mock question number and total
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
    
    // Start timer
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizId, questionId]);
  
  const handleOptionSelect = (optionIndex: number) => {
    if (isReviewMode) return; // Don't allow changes in review mode
    setSelectedOption(optionIndex);
  };
  
  const handleSubmitAnswer = async () => {
    if (selectedOption === null) return;
    
    setIsSaving(true);
    
    try {
      // In a real app, you would send the answer to your API
      console.log('Submitting answer:', {
        quizId,
        questionId,
        selectedOption,
        timeSpent
      });
      
      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to next question or completion
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
    <div className="single-question-container">
      <StHeader />
      
      <div className="progress-bar">
        <div 
          className="progress-filled"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        ></div>
      </div>
      
      <div className="question-content">
        <div className="question-text">
          <h2>{question.text}</h2>
          <div className="topic-tag">Topic: {question.topic}</div>
        </div>
        
        <div className="options-list">
          {question.options.map((option, index) => (
            <div 
              key={index}
              className={`option-item ${selectedOption === index ? 'selected' : ''} ${
                isReviewMode && question.correctAnswer === index ? 'correct' : ''
              } ${
                isReviewMode && selectedOption === index && question.correctAnswer !== index ? 'incorrect' : ''
              }`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="option-marker">{String.fromCharCode(65 + index)}</div>
              <div className="option-text">{option}</div>
            </div>
          ))}
        </div>
        
        {isReviewMode && question.explanation && (
          <div className="explanation-box">
            <h3>Explanation</h3>
            <p>{question.explanation}</p>
          </div>
        )}
      </div>
      
      <div className="question-footer">
        {isReviewMode ? (
          <div className="review-navigation">
            <button 
              className="nav-button"
              onClick={() => navigate(`/students/quiz/${quizId}/question/${questionNumber - 1}?review=true`)}
              disabled={questionNumber <= 1}
            >
              Previous
            </button>
            
            <Link to={`/students/quiz-result/${quizId}`} className="back-to-results">
              Back to Results
            </Link>
            
            <button 
              className="nav-button"
              onClick={() => navigate(`/students/quiz/${quizId}/question/${questionNumber + 1}?review=true`)}
              disabled={questionNumber >= totalQuestions}
            >
              Next
            </button>
          </div>
        ) : (
          <div className="answer-actions">
            <button 
              className="nav-button"
              onClick={() => navigate(`/students/quiz/${quizId}/question/${questionNumber - 1}`)}
              disabled={questionNumber <= 1}
            >
              Previous
            </button>
            
            <button 
              className="submit-button"
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || isSaving}
            >
              {isSaving ? 'Saving...' : questionNumber < totalQuestions ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
      
      <div className="question-navigation-dots">
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <Link 
            key={index}
            to={`/students/quiz/${quizId}/question/${index + 1}${isReviewMode ? '?review=true' : ''}`}
            className={`nav-dot ${index + 1 === questionNumber ? 'active' : ''}`}
          >
            {index + 1}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SingleQuestionPage;