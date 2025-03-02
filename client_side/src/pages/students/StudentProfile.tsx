import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/profile.css';

import StHeader from '../../components/students/stHeader';

interface Student {
  name: string;
  email: string;
  studentId: string;
  department?: string;
  semester?: number;
  joinDate?: string;
  profileImage?: string;
}

interface PerformanceSummary {
  level: 'Low' | 'Normal' | 'High';
  overallScore: number;
  quizzesCompleted: number;
  averageScore: number;
  topicScores: {
    topic: string;
    score: number;
  }[];
}

const StudentProfile: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  
  useEffect(() => {
    // Mock fetching student data
    const fetchStudentData = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Get data from localStorage or mock it
          const storedUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
          
          const mockStudent: Student = {
            name: storedUser.name || 'John Doe',
            email: storedUser.email || 'student231@gmail.com',
            studentId: storedUser.studentId || 'ITBIN-2110-0001',
            department: 'Information Technology',
            semester: 5,
            joinDate: '2021-09-01',
            profileImage: '/assets/profile-placeholder.jpg'
          };
          
          const mockPerformance: PerformanceSummary = {
            level: 'Normal',
            overallScore: 0.72,
            quizzesCompleted: 8,
            averageScore: 76.5,
            topicScores: [
              { topic: 'SDLC', score: 0.8 },
              { topic: 'Agile', score: 0.65 },
              { topic: 'OSI Model', score: 0.7 },
              { topic: 'Software Engineering', score: 0.75 }
            ]
          };
          
          setStudent(mockStudent);
          setEditForm(mockStudent);
          setPerformanceSummary(mockPerformance);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      // In a real app, you would send this to your API
      console.log('Saving profile:', editForm);
      
      // Update student state
      setStudent(prev => {
        if (!prev) return null;
        return { ...prev, ...editForm };
      });
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
      localStorage.setItem('studentUser', JSON.stringify({
        ...storedUser,
        name: editForm.name,
        email: editForm.email
      }));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
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
  
  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }
  
  if (!student) {
    return <div className="profile-error">Student profile not found</div>;
  }
  
  return (
    <div className="profile-container">
      <StHeader />
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-image">
            {student.profileImage ? (
              <img src={student.profileImage} alt={student.name} />
            ) : (
              <div className="profile-initial">{student.name?.charAt(0)}</div>
            )}
          </div>
          
          {isEditing ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={editForm.department || ''}
                  onChange={handleInputChange}
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Network Engineering">Network Engineering</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Semester</label>
                <input
                  type="number"
                  name="semester"
                  value={editForm.semester || ''}
                  onChange={handleInputChange}
                  min="1"
                  max="8"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="cancel-button" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(student);
                  }}
                >
                  Cancel
                </button>
                <button className="save-button" onClick={handleSaveProfile}>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-details">
                <h2>{student.name}</h2>
                <p className="student-id">{student.studentId}</p>
                <p className="student-email">{student.email}</p>
                
                <div className="additional-details">
                  <div className="detail-item">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{student.department}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Semester</span>
                    <span className="detail-value">{student.semester}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Joined</span>
                    <span className="detail-value">
                      {student.joinDate ? new Date(student.joinDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                className="edit-profile-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
        
        {performanceSummary && (
          <div className="performance-card">
            <h2>Performance Summary</h2>
            
            <div className="performance-overview">
              <div className="performance-item">
                <span className="performance-label">Knowledge Level</span>
                <span 
                  className="performance-value"
                  style={{ color: getLevelColor(performanceSummary.level) }}
                >
                  {performanceSummary.level}
                </span>
              </div>
              
              <div className="performance-item">
                <span className="performance-label">Overall Score</span>
                <span className="performance-value">
                  {(performanceSummary.overallScore * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="performance-item">
                <span className="performance-label">Quizzes Completed</span>
                <span className="performance-value">{performanceSummary.quizzesCompleted}</span>
              </div>
              
              <div className="performance-item">
                <span className="performance-label">Average Score</span>
                <span className="performance-value">{performanceSummary.averageScore.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="topic-performance">
              <h3>Topic Performance</h3>
              
              {performanceSummary.topicScores.map(topic => (
                <div key={topic.topic} className="topic-score-item">
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
            
            <div className="performance-actions">
              <Link to="/students/guidance" className="button">
                View Personalized Guidance
              </Link>
              <Link to="/students/quizzes" className="button">
                View All Quizzes
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;