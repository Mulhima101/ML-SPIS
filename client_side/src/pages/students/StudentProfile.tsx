// src/pages/students/StudentProfile.tsx
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
            name: storedUser.name || 'Mulhima Jawahir',
            email: storedUser.email || 'jawahirm821@gmail.com',
            studentId: storedUser.studentId || 'ITBIN-2110-0063',
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
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#4caf50'; // Green for high scores
    if (score >= 0.65) return '#2196f3'; // Blue for medium scores
    return '#f44336'; // Red for low scores
  };
  
  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }
  
  if (!student) {
    return <div className="profile-error">Student profile not found</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#faeec9] p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Student Profile</h1>
        <Link 
          to="/students/dashboard" 
          className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - student info */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col items-center mb-6">
            <div 
              className="w-36 h-36 rounded-full bg-[#f57c00] flex items-center justify-center text-white text-3xl font-bold mb-4"
              style={{ fontSize: '36px' }}
            >
              {student.name.split(' ')[0].substring(0, 5)}
            </div>
          </div>
          
          {isEditing ? (
            <form className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 text-sm">Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={editForm.studentId || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Department</label>
                <select
                  name="department"
                  value={editForm.department || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Network Engineering">Network Engineering</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Semester</label>
                <input
                  type="number"
                  name="semester"
                  value={editForm.semester || ''}
                  onChange={handleInputChange}
                  min="1"
                  max="8"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(student);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-[#f57c00] text-white rounded-md"
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Full Name</label>
                <input
                  type="text"
                  value={student.name}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>

              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Student ID</label>
                <input
                  type="text"
                  value={student.studentId}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Email</label>
                <input
                  type="email"
                  value={student.email}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Department</label>
                <select
                  value={student.department}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  disabled
                >
                  <option>{student.department}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Semester</label>
                <input
                  type="number"
                  value={student.semester}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
              
              <button 
                className="mt-4 px-4 py-2 bg-[#f57c00] text-white rounded-md w-full"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
        
        {/* Right column - performance summary */}
        {performanceSummary && (
          <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Performance Summary</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Knowledge Level</p>
                <p className="text-xl font-semibold" style={{ color: '#2196f3' }}>
                  {performanceSummary.level}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className="text-xl font-semibold">
                  {(performanceSummary.overallScore * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Quizzes Completed</p>
                <p className="text-xl font-semibold">
                  {performanceSummary.quizzesCompleted}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-xl font-semibold">
                  {performanceSummary.averageScore.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Topic Performance</h3>
            
            <div className="space-y-4 mb-6">
              {performanceSummary.topicScores.map(topic => (
                <div key={topic.topic} className="flex items-center">
                  <span className="w-1/4 text-gray-700">{topic.topic}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full mx-4">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${topic.score * 100}%`,
                        backgroundColor: getScoreColor(topic.score)
                      }}
                    ></div>
                  </div>
                  <span className="w-16 text-right font-medium">
                    {(topic.score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/students/guidance" 
                className="px-6 py-3 bg-[#f57c00] text-white rounded-md hover:bg-[#ef6c00] transition"
              >
                View Personalized Guidance
              </Link>
              <Link 
                to="/students/quizzes" 
                className="px-6 py-3 bg-[#f57c00] text-white rounded-md hover:bg-[#ef6c00] transition"
              >
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