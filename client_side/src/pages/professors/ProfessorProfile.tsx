import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/profile.css';

interface Professor {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  joinDate?: string;
  profileImage?: string;
}

interface ClassStats {
  className: string;
  studentCount: number;
  averageKnowledgeLevel: number;
  topicsStrength: { topic: string; score: number }[];
  topicsWeakness: { topic: string; score: number }[];
}

const ProfessorProfile: React.FC = () => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [classes, setClasses] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<Professor>>({});
  
  useEffect(() => {
    // Mock fetching professor data
    const fetchProfessorData = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Get data from localStorage or mock it
          const storedUser = JSON.parse(localStorage.getItem('professorUser') || '{}');
          
          const mockProfessor: Professor = {
            name: storedUser.name || 'Dr. Jane Smith',
            email: storedUser.email || 'professor231@gmail.com',
            employeeId: storedUser.employeeId || 'EMP-1001',
            department: storedUser.department || 'Information Technology',
            joinDate: '2018-06-15',
            profileImage: '/assets/profile-placeholder.jpg'
          };
          
          const mockClasses: ClassStats[] = [
            {
              className: 'Software Engineering (IT3050)',
              studentCount: 45,
              averageKnowledgeLevel: 0.72,
              topicsStrength: [
                { topic: 'SDLC', score: 0.85 },
                { topic: 'Software Testing', score: 0.81 }
              ],
              topicsWeakness: [
                { topic: 'Design Patterns', score: 0.42 },
                { topic: 'UML Diagrams', score: 0.54 }
              ]
            },
            {
              className: 'Network Engineering (IT3060)',
              studentCount: 38,
              averageKnowledgeLevel: 0.68,
              topicsStrength: [
                { topic: 'TCP/IP', score: 0.79 },
                { topic: 'Network Topology', score: 0.77 }
              ],
              topicsWeakness: [
                { topic: 'OSI Model', score: 0.48 },
                { topic: 'Routing Protocols', score: 0.52 }
              ]
            }
          ];
          
          setProfessor(mockProfessor);
          setEditForm(mockProfessor);
          setClasses(mockClasses);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching professor data:', error);
        setLoading(false);
      }
    };
    
    fetchProfessorData();
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
      
      // Update professor state
      setProfessor(prev => {
        if (!prev) return null;
        return { ...prev, ...editForm };
      });
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('professorUser') || '{}');
      localStorage.setItem('professorUser', JSON.stringify({
        ...storedUser,
        name: editForm.name,
        email: editForm.email,
        department: editForm.department
      }));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }
  
  if (!professor) {
    return <div className="profile-error">Professor profile not found</div>;
  }
  
  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Professor Profile</h1>
        <div className="header-actions">
          <Link to="/professors/students" className="button">View All Students</Link>
        </div>
      </header>
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-image">
            {professor.profileImage ? (
              <img src={professor.profileImage} alt={professor.name} />
            ) : (
              <div className="profile-initial">{professor.name?.charAt(0)}</div>
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
              
              <div className="form-actions">
                <button 
                  className="cancel-button" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(professor);
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
                <h2>{professor.name}</h2>
                <p className="professor-id">{professor.employeeId}</p>
                <p className="professor-email">{professor.email}</p>
                
                <div className="additional-details">
                  <div className="detail-item">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{professor.department}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Joined</span>
                    <span className="detail-value">
                      {professor.joinDate ? new Date(professor.joinDate).toLocaleDateString() : 'N/A'}
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
        
        <div className="classes-overview">
          <h2>My Classes</h2>
          
          {classes.map((classItem, index) => (
            <div key={index} className="class-card">
              <div className="class-header">
                <h3>{classItem.className}</h3>
                <span className="student-count">{classItem.studentCount} Students</span>
              </div>
              
              <div className="class-stats">
                <div className="stat-item">
                  <span className="stat-label">Average Knowledge Level</span>
                  <span className="stat-value">{(classItem.averageKnowledgeLevel * 100).toFixed(1)}%</span>
                </div>
                
                <div className="topics-container">
                  <div className="topics-column">
                    <h4>Strengths</h4>
                    {classItem.topicsStrength.map((topic, idx) => (
                      <div key={idx} className="topic-item">
                        <span className="topic-name">{topic.topic}</span>
                        <div className="progress-bar-container mini">
                          <div
                            className="progress-bar"
                            style={{ 
                              width: `${topic.score * 100}%`,
                              backgroundColor: 'green'
                            }}
                          ></div>
                        </div>
                        <span className="score-value">{(topic.score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="topics-column">
                    <h4>Areas for Improvement</h4>
                    {classItem.topicsWeakness.map((topic, idx) => (
                      <div key={idx} className="topic-item">
                        <span className="topic-name">{topic.topic}</span>
                        <div className="progress-bar-container mini">
                          <div
                            className="progress-bar"
                            style={{ 
                              width: `${topic.score * 100}%`,
                              backgroundColor: 'red'
                            }}
                          ></div>
                        </div>
                        <span className="score-value">{(topic.score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="class-actions">
                <Link to={`/professors/class/${classItem.className}`} className="button">
                  View Class Details
                </Link>
                <button className="button">Generate Class Report</button>
              </div>
            </div>
          ))}
          
          <button className="add-class-button">+ Add New Class</button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;