import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/quiz.css';

interface QuizQuestion {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  questions: QuizQuestion[];
}

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Mock fetching quiz data
    const fetchQuiz = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockQuiz: Quiz = {
            id: quizId || 'default',
            title: 'Software Engineering Concepts',
            description: 'This quiz tests your knowledge of software engineering fundamentals.',
            timeLimit: 20, // 20 minutes
            questions: [
              {
                id: 'q1',
                text: 'What does SDLC stand for?',
                topic: 'SDLC',
                options: [
                  'Software Development Life Cycle',
                  'System Design Life Cycle',
                  'Software Design Level Control',
                  'System Development Logic Control'
                ],
                correctAnswer: 0
              },
              {
                id: 'q2',
                text: 'Which of the following is NOT a phase in the traditional waterfall model?',
                topic: 'SDLC',
                options: [
                  'Requirements Analysis',
                  'Implementation',
                  'Sprint Planning',
                  'Maintenance'
                ],
                correctAnswer: 2
              },
              {
                id: 'q3',
                text: 'What is the main advantage of Agile methodologies?',
                topic: 'Agile',
                options: [
                  'Less documentation required',
                  'Adaptability to changing requirements',
                  'No need for testing',
                  'Reduced development time'
                ],
                correctAnswer: 1
              },
              {
                id: 'q4',
                text: 'Which of the following best describes the OSI Model?',
                topic: 'OSI Model',
                options: [
                  'A programming paradigm',
                  'A network architecture model',
                  'A database management system',
                  'A version control system'
                ],
                correctAnswer: 1
              },
              {
                id: 'q5',
                text: 'How many layers does the OSI Model have?',
                topic: 'OSI Model',
                options: [
                  '5',
                  '6',
                  '7',
                  '8'
                ],
                correctAnswer: 2
              }
            ]
          };
          
          setQuiz(mockQuiz);
          setTimeRemaining(mockQuiz.timeLimit * 60); // Convert to seconds
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId]);
  
  // Timer effect
  useEffect(() => {
    if (!quiz || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, timeRemaining]);
  
  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };
  
  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate results
      let correctAnswers = 0;
      const topicScores: Record<string, { correct: number, total: number }> = {};
      
      quiz.questions.forEach(question => {
        // Initialize topic if not exists
        if (!topicScores[question.topic]) {
          topicScores[question.topic] = { correct: 0, total: 0 };
        }
        
        topicScores[question.topic].total += 1;
        
        // Check if answer is correct
        if (selectedAnswers[question.id] === question.correctAnswer) {
          correctAnswers += 1;
          topicScores[question.topic].correct += 1;
        }
      });
      
      // Calculate overall score and topic scores
      const overallScore = correctAnswers / quiz.questions.length;
      const topicScoresNormalized = Object.entries(topicScores).map(([topic, scores]) => ({
        topic,
        score: scores.correct / scores.total
      }));
      
      // Determine knowledge level
      let knowledgeLevel: 'Low' | 'Normal' | 'High';
      if (overallScore < 0.5) knowledgeLevel = 'Low';
      else if (overallScore < 0.8) knowledgeLevel = 'Normal';
      else knowledgeLevel = 'High';
      
      // Mock saving results to backend
      console.log('Quiz submitted with results:', {
        quizId,
        overallScore,
        topicScores: topicScoresNormalized,
        knowledgeLevel
      });
      
      // In a real app, you would send this data to your API
      // await api.submitQuizResults({ ... });
      
      // Navigate to results page
      navigate(`/students/quiz-result/${quizId}`, { 
        state: { 
          overallScore,
          topicScores: topicScoresNormalized,
          knowledgeLevel
        }
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }
  
  if (!quiz) {
    return <div className="quiz-error">Quiz not found</div>;
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allQuestionsAnswered = quiz.questions.every(q => selectedAnswers[q.id] !== undefined);
  
  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <h1>{quiz.title}</h1>
        <div className="timer">
          Time remaining: <span className={timeRemaining < 60 ? 'time-critical' : ''}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </header>
      
      <div className="quiz-progress">
        <div className="progress-bar">
          <div 
            className="progress-filled" 
            style={{ width: `${(currentQuestionIndex / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="question-counter">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>
      </div>
      
      <div className="question-container">
        <div className="question-text">
          <h2>{currentQuestion.text}</h2>
          <div className="topic-tag">Topic: {currentQuestion.topic}</div>
        </div>
        
        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <div 
              key={index}
              className={`option ${selectedAnswers[currentQuestion.id] === index ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(currentQuestion.id, index)}
            >
              <div className="option-letter">{String.fromCharCode(65 + index)}</div>
              <div className="option-text">{option}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="quiz-navigation">
        <button 
          className="nav-button prev" 
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        
        {isLastQuestion ? (
          <button 
            className="submit-button"
            onClick={handleSubmitQuiz}
            disabled={!allQuestionsAnswered || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button 
            className="nav-button next" 
            onClick={handleNextQuestion}
            disabled={!isAnswered}
          >
            Next
          </button>
        )}
      </div>
      
      <div className="question-navigator">
        {quiz.questions.map((q, index) => (
          <div 
            key={index}
            className={`question-dot ${index === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[q.id] !== undefined ? 'answered' : ''}`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizPage;