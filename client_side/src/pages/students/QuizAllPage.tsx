import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/quiz-all.css';

interface Quiz {
  id: string;
  title: string;
  description: string;
  topics: string[];
  questionCount: number;
  duration: number; // in minutes
  status: 'completed' | 'ongoing' | 'upcoming' | 'recommended';
  date?: string;
  score?: number;
}

const QuizAllPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  useEffect(() => {
    // Mock fetching quizzes data
    const fetchQuizzes = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockQuizzes: Quiz[] = [
            {
              id: 'q1',
              title: 'Software Engineering Basics',
              description: 'A comprehensive assessment of software engineering fundamentals including SDLC, agile methodologies, and software testing.',
              topics: ['SDLC', 'Agile', 'Software Testing'],
              questionCount: 15,
              duration: 20,
              status: 'completed',
              date: '2024-10-15',
              score: 85
            },
            {
              id: 'q2',
              title: 'Network Engineering Fundamentals',
              description: 'Test your knowledge of networking concepts, protocols, and architectures.',
              topics: ['OSI Model', 'TCP/IP', 'Network Security'],
              questionCount: 15,
              duration: 20,
              status: 'ongoing',
              date: '2024-10-20'
            },
            {
              id: 'q3',
              title: 'Advanced Programming Concepts',
              description: 'Explore advanced programming paradigms, design patterns, and coding best practices.',
              topics: ['Design Patterns', 'Algorithms', 'Data Structures'],
              questionCount: 15,
              duration: 25,
              status: 'upcoming',
              date: '2024-10-25'
            },
            {
              id: 'q4',
              title: 'Database Management Systems',
              description: 'Test your understanding of database concepts, SQL, and database design principles.',
              topics: ['SQL', 'Database Design', 'Normalization'],
              questionCount: 15,
              duration: 20,
              status: 'upcoming',
              date: '2024-10-30'
            },
            {
              id: 'q5',
              title: 'OSI Model Deep Dive',
              description: 'A focused assessment on the OSI model and its application in modern networking.',
              topics: ['OSI Model', 'Network Protocols', 'Network Architecture'],
              questionCount: 10,
              duration: 15,
              status: 'recommended',
              date: '2024-10-22'
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
  
  const filterQuizzes = (quizzes: Quiz[]): Quiz[] => {
    // First filter by status if needed
    let filtered = quizzes;
    if (activeFilter !== 'all') {
      filtered = quizzes.filter(quiz => quiz.status === activeFilter);
    }
    
    // Then filter by search term if any
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(term) || 
        quiz.description.toLowerCase().includes(term) ||
        quiz.topics.some(topic => topic.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  };
  
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'completed': return 'green';
      case 'ongoing': return 'blue';
      case 'upcoming': return 'gray';
      case 'recommended': return 'purple';
      default: return 'gray';
    }
  };
  
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  if (loading) {
    return <div className="loading">Loading quizzes...</div>;
  }
  
  const filteredQuizzes = filterQuizzes(quizzes);
  
  return (
    <div className="quiz-all-container">
      <header className="quizzes-header">
        <h1>All Quizzes</h1>
        <div className="header-actions">
          <Link to="/students/dashboard" className="back-button">Back to Dashboard</Link>
        </div>
      </header>
      
      <div className="quiz-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by title, topic, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'recommended' ? 'active' : ''}`}
            onClick={() => setActiveFilter('recommended')}
          >
            Recommended
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ongoing')}
          >
            In Progress
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>
      
      <div className="quiz-count">
        <span>{filteredQuizzes.length} quizzes found</span>
      </div>
      
      <div className="quizzes-grid">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <h2>{quiz.title}</h2>
                <span 
                  className="quiz-status"
                  style={{ color: getStatusColor(quiz.status) }}
                >
                  {quiz.status === 'recommended' ? '⭐ Recommended' : 
                   quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                </span>
              </div>
              
              <div className="quiz-card-body">
                <p className="quiz-description">{quiz.description}</p>
                
                <div className="quiz-details">
                  <div className="detail-item">
                    <span className="detail-label">Questions</span>
                    <span className="detail-value">{quiz.questionCount}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{formatDuration(quiz.duration)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{formatDate(quiz.date)}</span>
                  </div>
                  
                  {quiz.score !== undefined && (
                    <div className="detail-item">
                      <span className="detail-label">Score</span>
                      <span className="detail-value">{quiz.score}%</span>
                    </div>
                  )}
                </div>
                
                <div className="quiz-topics">
                  {quiz.topics.map(topic => (
                    <span key={topic} className="topic-tag">{topic}</span>
                  ))}
                </div>
              </div>
              
              <div className="quiz-card-footer">
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
                
                {(quiz.status === 'upcoming' || quiz.status === 'recommended') && (
                  <Link to={`/students/quiz/${quiz.id}`} className="button">
                    Start Quiz
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-quizzes-message">
            <p>No quizzes match your current filters. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAllPage;