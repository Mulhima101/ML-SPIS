// src/pages/students/QuizAllPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import StHeader from '../../components/students/stHeader';

interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'uncompleted';
  result?: 'Pass' | 'Fail';
  score?: string;
  startTime: string;
  endTime: string;
  duration: string; // e.g., "20:00", "30:00"
}

const QuizAllPage: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('studentUser');
    if (!user) {
      navigate('/students/login');
      return;
    }

    // Mock fetching quizzes data
    const fetchQuizzes = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockQuizzes: Quiz[] = [
            {
              id: 'q1',
              title: 'What is OOP?',
              description: 'Programming Fundamentals',
              status: 'uncompleted',
              score: '0/10',
              startTime: '07:00pm',
              endTime: '08:00pm',
              duration: '20:00'
            },
            {
              id: 'q2',
              title: 'Black-Box And White-Box Testing.',
              description: 'Software Engineering',
              status: 'completed',
              result: 'Pass',
              score: '10/10',
              startTime: '07:00pm',
              endTime: '08:00pm',
              duration: '30:00'
            },
            {
              id: 'q3',
              title: 'Supervised And Unsupervised Learning',
              description: 'Artificial Intelligence',
              status: 'uncompleted',
              result: 'Pass',
              score: '10/10',
              startTime: '04:00pm',
              endTime: '05:00pm',
              duration: '15:00'
            },
            {
              id: 'q4',
              title: 'What is Encryption?',
              description: 'Computer Networks',
              status: 'completed',
              result: 'Fail',
              score: '5/5',
              startTime: '04:00pm',
              endTime: '05:00pm',
              duration: '00:00'
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
  }, [navigate]);
  
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
        
        <div className="bg-white rounded-[40px] p-6 shadow-sm">
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              let bgColor = "bg-gray-200";
              if (quiz.status === 'completed') {
                bgColor = quiz.result === 'Pass' ? "bg-green-100" : "bg-red-100";
              }
              
              return (
                <div 
                  key={quiz.id} 
                  className={`${bgColor} rounded-[20px] p-4 flex flex-col lg:flex-row justify-between lg:items-center`}
                >
                  <div className="flex flex-[2] flex-col">
                    <h2 className="text-[1.5rem] font-semibold">{quiz.title}</h2>
                    <p className="text-gray-600">{quiz.description}</p>
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
                      <p>Start At: {quiz.startTime}</p>
                      <p>End At: {quiz.endTime}</p>
                      <p className="!text-[1.6rem] font-bold">{quiz.duration}</p>
                    </div>
                    
                    <Link 
                      to={`/students/quiz/${quiz.id}`}
                      className="bg-[#172554] text-white px-6 py-2 rounded-xl hover:bg-[#1e3a8a] transition"
                    >
                      Start
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAllPage;