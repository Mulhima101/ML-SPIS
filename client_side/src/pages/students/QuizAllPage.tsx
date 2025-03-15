// src/pages/students/QuizAllPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import StHeader from '../../components/students/stHeader';

interface Quiz {
  id: string;
  title: string;
  description: string;
  topics: string[];
  questionCount: number;
  duration: number; // in minutes
  status: 'completed' | 'ongoing' | 'uncompleted';
  date?: string;
  score?: number;
  startTime?: string;
  endTime?: string;
}

const QuizAllPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Mock fetching quizzes data
    const fetchQuizzes = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockQuizzes: Quiz[] = [
            {
              id: 'q1',
              title: 'What is Lorem Ipsum.',
              description: 'Software Engineering',
              topics: ['SDLC', 'Agile', 'Software Testing'],
              questionCount: 15,
              duration: 20,
              status: 'uncompleted',
              startTime: '07:00pm',
              endTime: '08:00pm'
            },
            {
              id: 'q2',
              title: 'Consectetur adipiscing elit.',
              description: 'Software Engineering',
              topics: ['OSI Model', 'TCP/IP', 'Network Security'],
              questionCount: 15,
              duration: 30,
              status: 'completed',
              score: 100,
              startTime: '07:00pm',
              endTime: '08:00pm'
            },
            {
              id: 'q3',
              title: 'Orci varius natoque penatibus.',
              description: 'Software Engineering',
              topics: ['Design Patterns', 'Algorithms', 'Data Structures'],
              questionCount: 15,
              duration: 15,
              status: 'uncompleted',
              score: 80,
              startTime: '04:00pm',
              endTime: '05:00pm'
            },
            {
              id: 'q4',
              title: 'Nulla dictum tincidunt dolor.',
              description: 'Network &',
              topics: ['SQL', 'Database Design', 'Normalization'],
              questionCount: 15,
              duration: 20,
              status: 'completed',
              score: 0,
              startTime: '04:00pm',
              endTime: '05:00pm'
            }
          ];
          
          setQuizzes(mockQuizzes);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, []);
  
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
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Quiz</h1>
        
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <div 
              key={quiz.id} 
              className={`rounded-xl p-6 ${
                quiz.status === 'completed' && quiz.score === 0 
                  ? 'bg-red-100' 
                  : quiz.status === 'completed' 
                    ? 'bg-green-100' 
                    : 'bg-gray-100'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold">{quiz.title}</h2>
                  <p className="text-gray-600">{quiz.description}</p>
                  <p className={quiz.status === 'completed' ? 'font-medium' : ''}>
                    {quiz.status === 'completed' ? 'Completed' : 'Uncompleted'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-gray-700">
                    {quiz.status === 'completed' ? quiz.score === 0 ? 'Fail' : 'Pass' : ''}
                  </p>
                  <p className="text-gray-700">{quiz.questionCount}/{quiz.questionCount}</p>
                  <p className="text-gray-700">Start At: {quiz.startTime}</p>
                  <p className="text-gray-700">End At: {quiz.endTime}</p>
                  <p className="text-xl font-bold">{quiz.duration}:00</p>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Link 
                  to={`/students/quiz/${quiz.id}`}
                  className="bg-black text-white px-6 py-2 rounded-md"
                >
                  Start
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizAllPage;