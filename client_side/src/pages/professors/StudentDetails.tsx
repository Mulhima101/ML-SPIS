import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../styles/student-details.css';

interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  department: string;
  semester: number;
  profileImage?: string;
}

interface QuizResult {
  id: string;
  title: string;
  date: string;
  score: number;
  level: 'Low' | 'Normal' | 'High';
  topicScores: {
    topic: string;
    score: number;
  }[];
}

interface ProgressData {
  dates: string[];
  scores: number[];
  levels: ('Low' | 'Normal' | 'High')[];
}

const StudentDetails: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'quizzes' | 'progress'>('overview');
  
  useEffect(() => {
    // Mock fetching student data
    const fetchStudentData = async () => {
      try {
        // In a real app, this would be an API call to get data for the specific student
        setTimeout(() => {
          const mockStudent: Student = {
            id: studentId || 'std1',
            name: 'John Doe',
            studentId: 'ITBIN-2110-0001',
            email: 'john.doe@student.edu',
            department: 'Information Technology',
            semester: 5
          };
          
          const mockQuizResults: QuizResult[] = [
            {
              id: 'q1',
              title: 'Software Engineering Basics',
              date: '2024-10-15',
              score: 85,
              level: 'High',
              topicScores: [
                { topic: 'SDLC', score: 0.9 },
                { topic: 'Software Testing', score: 0.82 },
                { topic: 'UML', score: 0.79 }
              ]
            },
            {
              id: 'q2',
              title: 'Network Engineering Fundamentals',
              date: '2024-09-28',
              score: 65,
              level: 'Normal',
              topicScores: [
                { topic: 'TCP/IP', score: 0.72 },
                { topic: 'OSI Model', score: 0.52 },
                { topic: 'Network Security', score: 0.71 }
              ]
            },
            {
              id: 'q3',
              title: 'Design Patterns',
              date: '2024-09-10',
              score: 45,
              level: 'Low',
              topicScores: [
                { topic: 'Creational Patterns', score: 0.48 },
                { topic: 'Structural Patterns', score: 0.42 },
                { topic: 'Behavioral Patterns', score: 0.45 }
              ]
            }
          ];
          
          const mockProgressData: ProgressData = {
            dates: ['2024-08-15', '2024-09-01', '2024-09-15', '2024-10-01', '2024-10-15'],
            scores: [52, 58, 65, 72, 78],
            levels: ['Low', 'Low', 'Normal', 'Normal', 'Normal']
          };
          
          setStudent(mockStudent);
          setQuizResults(mockQuizResults);
          setProgressData(mockProgressData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [studentId]);
  
  const getLevelColor = (level: 'Low' | 'Normal' | 'High'): string => {
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
    return <div className="loading">Loading student data...</div>;
  }
  
  if (!student) {
    return <div className="error-message">Student not found</div>;
  }
  
  return (
    <div className="student-details-container">
      <header className="details-header">
        <h1>Student Details</h1>
        <div className="header-actions">
          <Link to="/professors/students" className="back-button">Back to All Students</Link>
        </div>
      </header>
      
      <div className="student-profile-card">
        <div className="profile-image">
          {student.profileImage ? (
            <img src={student.profileImage} alt={student.name} />
          ) : (
            <div className="profile-initial">{student.name.charAt(0)}</div>
          )}
        </div>
        
        <div className="student-info">
          <h2>{student.name}</h2>
          <p className="student-id">{student.studentId}</p>
          <p className="student-email">{student.email}</p>
          
          <div className="additional-info">
            <div className="info-item">
              <span className="info-label">Department</span>
              <span className="info-value">{student.department}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Semester</span>
              <span className="info-value">{student.semester}</span>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <button className="button">Send Message</button>
          <button className="button">Generate Report</button>
        </div>
      </div>
      
      <div className="details-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          Quiz Results
        </button>
        <button 
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress Tracking
        </button>
      </div>
      
      <div className="details-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="knowledge-summary">
              <h3>Knowledge Level Summary</h3>
              
              <div className="current-level">
                <span className="level-label">Current Level:</span>
                <span 
                  className="level-value"
                  style={{ color: getLevelColor(quizResults[0]?.level || 'Normal') }}
                >
                  {quizResults[0]?.level || 'Normal'}
                </span>
              </div>
              
              <div className="latest-score">
                <span className="score-label">Latest Quiz Score:</span>
                <span className="score-value">{quizResults[0]?.score || 0}%</span>
              </div>
              
              <h4>Top Performing Topics</h4>
              <div className="topics-list">
                {quizResults[0]?.topicScores
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3)
                  .map((topic, index) => (
                    <div key={index} className="topic-score-item">
                      <span className="topic-name">{topic.topic}</span>
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
              
              <h4>Areas Needing Improvement</h4>
              <div className="topics-list">
                {quizResults[0]?.topicScores
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 3)
                  .map((topic, index) => (
                    <div key={index} className="topic-score-item">
                      <span className="topic-name">{topic.topic}</span>
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
            </div>
            
            <div className="recommendations">
              <h3>Recommended Actions</h3>
              
              <div className="recommendation-card">
                <div className="recommendation-icon">📚</div>
                <div className="recommendation-content">
                  <h4>Provide Additional Resources</h4>
                  <p>Based on the student's performance, consider sharing additional materials on Design Patterns and OSI Model.</p>
                  <button className="button">Send Resources</button>
                </div>
              </div>
              
              <div className="recommendation-card">
                <div className="recommendation-icon">📝</div>
                <div className="recommendation-content">
                  <h4>Assign Targeted Practice</h4>
                  <p>Recommend practice quizzes focusing on Network Security and Behavioral Patterns to help improve these areas.</p>
                  <button className="button">Assign Practice</button>
                </div>
              </div>
              
              <div className="recommendation-card">
                <div className="recommendation-icon">👥</div>
                <div className="recommendation-content">
                  <h4>Consider Group Learning</h4>
                  <p>This student might benefit from collaborative learning with peers who excel in the areas where improvement is needed.</p>
                  <button className="button">Form Learning Group</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'quizzes' && (
          <div className="quizzes-tab">
            <h3>Quiz Results History</h3>
            
            <div className="quiz-list">
              {quizResults.map((quiz, index) => (
                <div key={index} className="quiz-result-card">
                  <div className="quiz-header">
                    <h4>{quiz.title}</h4>
                    <span className="quiz-date">{formatDate(quiz.date)}</span>
                  </div>
                  
                  <div className="quiz-summary">
                    <div className="summary-item">
                      <span className="summary-label">Score:</span>
                      <span className="summary-value">{quiz.score}%</span>
                    </div>
                    
                    <div className="summary-item">
                      <span className="summary-label">Level:</span>
                      <span 
                        className="summary-value"
                        style={{ color: getLevelColor(quiz.level) }}
                      >
                        {quiz.level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="topic-scores">
                    <h5>Topic Performance</h5>
                    
                    {quiz.topicScores.map((topic, idx) => (
                      <div key={idx} className="topic-score-item">
                        <span className="topic-name">{topic.topic}</span>
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
                  
                  <div className="quiz-actions">
                    <button className="button">View Details</button>
                    <button className="button">Download PDF</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'progress' && progressData && (
          <div className="progress-tab">
            <h3>Progress Over Time</h3>
            
            <div className="progress-chart">
              <div className="chart-container">
                {/* In a real app, you'd use a charting library here */}
                <div className="placeholder-chart">
                  <div className="chart-y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  
                  <div className="chart-bars">
                    {progressData.scores.map((score, index) => (
                      <div key={index} className="chart-bar-group">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${score}%`,
                            backgroundColor: getLevelColor(progressData.levels[index])
                          }}
                        >
                          <span className="bar-value">{score}%</span>
                        </div>
                        <span className="bar-label">{formatDate(progressData.dates[index])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="progress-analysis">
                <h4>Analysis</h4>
                
                <div className="analysis-card">
                  <h5>Growth Trend</h5>
                  <p>The student has shown consistent improvement, moving from a Low knowledge level to Normal over the past two months.</p>
                </div>
                
                <div className="analysis-card">
                  <h5>Milestone Achievement</h5>
                  <p>Reached Normal knowledge level on September 15, 2024. Continuing to show steady progress toward High level.</p>
                </div>
                
                <div className="analysis-card">
                  <h5>Potential Timeline</h5>
                  <p>At the current rate of improvement, the student is projected to reach a High knowledge level by mid-November 2024.</p>
                </div>
              </div>
            </div>
            
            <div className="progress-actions">
              <button className="button">Generate Detailed Report</button>
              <button className="button">Adjust Learning Path</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetails;