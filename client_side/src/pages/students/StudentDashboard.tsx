import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/dashboard.css';

import StHeader from '../../components/students/stHeader';

interface Quiz {
  id: string;
  title: string;
  status: 'completed' | 'ongoing' | 'upcoming';
  date: string;
  score?: number;
  totalQuestions: number;
}

interface KnowledgeLevel {
  level: 'Low' | 'Normal' | 'High';
  overall: number;
  topics: {
    name: string;
    score: number;
  }[];
}

const StudentDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Mock data fetching
    setTimeout(() => {
      // Mock quizzes data
      setQuizzes([
        {
          id: 'q1',
          title: 'Software Engineering Basics',
          status: 'completed',
          date: '2024-10-15',
          score: 85,
          totalQuestions: 15
        },
        {
          id: 'q2',
          title: 'Network Engineering Fundamentals',
          status: 'ongoing',
          date: '2024-10-20',
          totalQuestions: 15
        },
        {
          id: 'q3',
          title: 'Advanced Programming Concepts',
          status: 'upcoming',
          date: '2024-10-25',
          totalQuestions: 15
        }
      ]);
      
      // Mock knowledge level data
      setKnowledgeLevel({
        level: 'Normal',
        overall: 0.72,
        topics: [
          { name: 'SDLC', score: 0.8 },
          { name: 'Agile', score: 0.6 },
          { name: 'OSI Model', score: 0.75 }
        ]
      });
      
      setLoading(false);
    }, 1000);
  }, []);
  
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'completed': return 'green';
      case 'ongoing': return 'blue';
      case 'upcoming': return 'red';
      default: return 'gray';
    }
  };
  
  const getLevelColor = (level: string): string => {
    switch(level) {
      case 'Low': return 'red';
      case 'Normal': return 'blue';
      case 'High': return 'green';
      default: return 'gray';
    }
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }
  
  return (
    <div className="dashboard-container">
      <StHeader />
      
      <main className="dashboard-content mx-6">
        <section className="knowledge-level-section">
          <h2>My Knowledge Level</h2>
          {knowledgeLevel && (
            <div className="knowledge-card">
              <div className="knowledge-header">
                <h3>Overall Level: <span style={{ color: getLevelColor(knowledgeLevel.level) }}>{knowledgeLevel.level}</span></h3>
                <p>Score: {(knowledgeLevel.overall * 100).toFixed(1)}%</p>
              </div>
              
              <div className="topic-scores">
                <h4>Topic Performance</h4>
                {knowledgeLevel.topics.map(topic => (
                  <div key={topic.name} className="topic-score-item">
                    <span className="topic-name">{topic.name}</span>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ 
                          width: `${topic.score * 100}%`,
                          backgroundColor: topic.score < 0.5 ? 'red' : topic.score < 0.8 ? 'blue' : 'green'
                        }}
                      ></div>
                    </div>
                    <span className="score-value">{(topic.score * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              
              <div className="guidance-link">
                <Link to="/students/guidance" className="button">View Personalized Guidance</Link>
              </div>
            </div>
          )}
        </section>
        
        <section className="quizzes-section">
          <div className="section-header">
            <h2>My Quizzes</h2>
            <Link to="/students/quizzes" className="view-all-link">View All</Link>
          </div>
          
          <div className="quiz-list">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-header">
                  <h3>{quiz.title}</h3>
                  <span 
                    className="quiz-status" 
                    style={{ color: getStatusColor(quiz.status) }}
                  >
                    {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                  </span>
                </div>
                
                <div className="quiz-info">
                  <p>Date: {formatDate(quiz.date)}</p>
                  <p>Questions: {quiz.totalQuestions}</p>
                  {quiz.score !== undefined && (
                    <p>Score: {quiz.score}%</p>
                  )}
                </div>
                
                <div className="quiz-actions">
                  {quiz.status === 'completed' && (
                    <Link to={`/students/quiz-result/${quiz.id}`} className="button">
                      View Results
                    </Link>
                  )}
                  
                  {quiz.status === 'ongoing' && (
                    <Link to={`/students/quiz/${quiz.id}`} className="button primary">
                      Continue Quiz
                    </Link>
                  )}
                  
                  {quiz.status === 'upcoming' && (
                    <Link to={`/students/quiz/${quiz.id}`} className="button">
                      Start Quiz
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;