// src/pages/students/QuizPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/quiz.css';

import StHeader from '../../components/students/stHeader';

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
  const [timeRemaining, setTimeRemaining] = useState<number>(1200); // 20 minutes in seconds
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
            title: 'What is Lorem Ipsum.',
            description: 'This quiz tests your knowledge of software engineering fundamentals.',
            timeLimit: 20, // 20 minutes
            questions: [
              {
                id: 'q1',
                text: 'Quisque tristique molestie arcu. Fusce tincidunt dictum eros, tempus fermentum nunc ultrices eu. Proin in lacus eleifend, pharetra ipsum eget, lacinia elit.',
                topic: 'Software Engineering',
                options: [
                  'Maecenas turpis nibh',
                  'faucibus ac convallis a',
                  'aliquet sit amet quam',
                  'tempus in volutpat at'
                ],
                correctAnswer: 0
              },
              {
                id: 'q2',
                text: 'Maecenas eleifend sapien felis, quis interdum ex tempor a. Aenean sodales, eros ac fermentum elementum, enim nisi finibus nisi, sed tempus turpis mauris ac quam.',
                topic: 'Software Engineering',
                options: [
                  'Vivamus et hendrerit',
                  'Donec finibus euismod',
                  'Nulla convallis egestas',
                  'Aliquam fringilla aliquam'
                ],
                correctAnswer: 2
              },
              {
                id: 'q3',
                text: 'Nullam a pretium nulla. Sed sed dapibus est, eget hendrerit ex. Aenean id libero arcu. Ut tempus diam id eros elementum, eu sodales justo ornare.',
                topic: 'Software Engineering',
                options: [
                  'Praesent malesuada urna',
                  'Vivamus vel fermentum',
                  'Proin et condimentum',
                  'Duis viverra diam non'
                ],
                correctAnswer: 1
              },
              {
                id: 'q4',
                text: 'Fusce pharetra suscipit orci nec tempor. Quisque vitae sem sit amet sem mollis consequat. Sed at imperdiet lorem.',
                topic: 'Software Engineering',
                options: [
                  'Aliquam erat volutpat',
                  'Nunc aliquet bibendum',
                  'Suspendisse lectus tortor',
                  'Vivamus rhoncus molestie'
                ],
                correctAnswer: 3
              },
              {
                id: 'q5',
                text: 'Vestibulum congue cursus lorem, vitae varius nunc condimentum et. Vestibulum feugiat imperdiet dapibus. Aliquam eu sodales diam.',
                topic: 'Software Engineering',
                options: [
                  'Suspendisse potenti',
                  'leo a diam volutpat',
                  'Vivamus et hendrerit tortor',
                  'volutpat quam tincidunt'
                ],
                correctAnswer: 0
              },
              {
                id: 'q6',
                text: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut arcu libero, pulvinar non massa sed, accumsan scelerisque dui.',
                topic: 'Software Engineering',
                options: [
                  'Morbi euismod magna',
                  'Proin sagittis maximus',
                  'Cras convallis lacus',
                  'Fusce non bibendum'
                ],
                correctAnswer: 1
              },
              {
                id: 'q7',
                text: 'Maecenas et metus nisl. Morbi ac interdum metus. Aliquam erat volutpat. Donec posuere fringilla augue ut ultricies.',
                topic: 'Software Engineering',
                options: [
                  'Pellentesque dapibus suscipit',
                  'Donec tempor ipsum',
                  'Fusce eu dui finibus',
                  'Morbi scelerisque blandit'
                ],
                correctAnswer: 2
              },
              {
                id: 'q8',
                text: 'Nulla at nulla justo, eget luctus tortor. Nulla facilisi. Duis aliquet egestas purus in blandit. Curabitur vulputate, ligula lacinia scelerisque tempor.',
                topic: 'Software Engineering',
                options: [
                  'Nunc blandit ligula',
                  'Sed eget libero vel',
                  'Pellentesque accumsan',
                  'Cras tincidunt sit amet'
                ],
                correctAnswer: 0
              },
              {
                id: 'q9',
                text: 'Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus.',
                topic: 'Software Engineering',
                options: [
                  'Nulla quis lorem ut',
                  'Sed cursus ante dapibus',
                  'Duis sodales odio',
                  'Fusce ac turpis quis'
                ],
                correctAnswer: 3
              },
              {
                id: 'q10',
                text: 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec pharetra, magna vestibulum aliquet ultrices.',
                topic: 'Software Engineering',
                options: [
                  'Praesent blandit laoreet',
                  'Mauris blandit aliquet',
                  'Curabitur arcu erat',
                  'Aenean commodo ligula'
                ],
                correctAnswer: 1
              },
              {
                id: 'q11',
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus.',
                topic: 'Software Engineering',
                options: [
                  'Maecenas tempus tellus',
                  'Donec vitae sapien ut',
                  'Nam eget dui. Etiam',
                  'Nullam quis ante'
                ],
                correctAnswer: 0
              },
              {
                id: 'q12',
                text: 'Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus.',
                topic: 'Software Engineering',
                options: [
                  'Maecenas tempus',
                  'Donec sodales sagittis',
                  'Sed consequat, leo eget',
                  'Aliquam lorem ante'
                ],
                correctAnswer: 2
              },
              {
                id: 'q13',
                text: 'Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus.',
                topic: 'Software Engineering',
                options: [
                  'Fusce vulputate eleifend',
                  'Aenean leo ligula',
                  'Quisque id odio',
                  'Suspendisse potenti'
                ],
                correctAnswer: 1
              },
              {
                id: 'q14',
                text: 'Praesent congue erat at massa. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu. Phasellus accumsan cursus velit.',
                topic: 'Software Engineering',
                options: [
                  'Vestibulum ante ipsum',
                  'Praesent blandit dolore',
                  'Fusce fermentum odio',
                  'Nam pretium turpis'
                ],
                correctAnswer: 3
              },
              {
                id: 'q15',
                text: 'Vestibulum congue luctus lorem, vitae varius nunc condimentum et. Vestibulum feugiat imperdiet dapibus. Aliquam eu sodales diam.',
                topic: 'Software Engineering',
                options: [
                  'Suspendisse potenti',
                  'leo a diam volutpat',
                  'Vivamus et hendrerit tortor',
                  'volutpat quam tincidunt'
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
  
  // Determine which questions are answered (for the question number UI)
  const answeredQuestions = Object.keys(selectedAnswers).map(id => {
    return quiz.questions.findIndex(q => q.id === id);
  });
  
  return (
    <div className="bg-[var(--primary-background-color)] min-h-screen">
      <StHeader />
      
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-center mb-6">{quiz.title}</h1>
        
        <div className="flex">
          {/* Left side - Question */}
          <div className="w-2/3 pr-4">
            <div className="bg-amber-200 rounded-2xl p-8 min-h-[600px] flex flex-col justify-between">
              <div>
                <h2 className="text-xl mb-6">
                  {currentQuestionIndex + 1}. {currentQuestion.text}
                </h2>
                
                <div className="space-y-4 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className="w-full p-4 bg-white rounded-lg text-left hover:bg-gray-50"
                      onClick={() => handleOptionSelect(currentQuestion.id, index)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between">
                {currentQuestionIndex > 0 ? (
                  <button 
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg"
                    onClick={handlePrevQuestion}
                  >
                    ← Previous
                  </button>
                ) : (
                  <button 
                    className="bg-gray-200 text-gray-400 px-6 py-2 rounded-lg opacity-50 cursor-not-allowed"
                    disabled
                  >
                    ← Previous
                  </button>
                )}
                
                {isLastQuestion ? (
                  <button 
                    className="bg-green-500 text-white px-8 py-2 rounded-lg"
                    onClick={handleSubmitQuiz}
                  >
                    Submit →
                  </button>
                ) : (
                  <button 
                    className="bg-gray-800 text-white px-6 py-2 rounded-lg"
                    onClick={handleNextQuestion}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Question numbers and timer */}
          <div className="w-1/3 pl-4">
            <div className="bg-amber-100 rounded-2xl p-6 min-h-[600px] flex flex-col">
              <h3 className="text-xl font-semibold mb-6">Question Numbers</h3>
              
              <div className="grid grid-cols-5 gap-4 mb-auto">
                {Array.from({ length: 15 }, (_, i) => {
                  // Set button color based on status
                  let bgColor = "bg-amber-200"; // Default
                  
                  if (i === currentQuestionIndex) {
                    bgColor = "bg-red-500 text-white"; // Current question
                  } else if (answeredQuestions.includes(i)) {
                    // For Image 2, show green for answered but not current questions
                    bgColor = "bg-green-500 text-white";
                  }
                  
                  return (
                    <button
                      key={i}
                      className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center font-bold`}
                      onClick={() => setCurrentQuestionIndex(i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-auto flex justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-amber-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-500">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;