// src/pages/students/QuizPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StHeader from '../../components/students/stHeader';

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
}

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('studentUser');
    if (!user) {
      navigate('/students/login');
      return;
    }

    // Mock fetch quiz data
    const fetchQuiz = async () => {
      try {
        setTimeout(() => {
          const mockQuiz: Quiz = {
            id: quizId || 'default',
            title: 'What is Lorem Ipsum.',
            description: 'This quiz tests your knowledge of software engineering fundamentals.',
            duration: 20 // minutes
          };
          setQuiz(mockQuiz);
          setLoading(false);
          
          // Automatically redirect to first question
          navigate(`/students/quiz/${quizId}/question/1`);
        }, 500);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faeec9] flex justify-center items-center">
        <div className="loading">Loading quiz information...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#faeec9]">
      <StHeader />
      <div className="container mx-auto px-4 py-6 text-center">
        <h1>Redirecting to quiz questions...</h1>
      </div>
    </div>
  );
};

export default QuizPage;