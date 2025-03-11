import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorProfile: React.FC = () => {
  const navigate = useNavigate();
  const [professorData, setProfessorData] = useState({
    firstName: 'Harsha',
    lastName: 'Nirmaral',
    honorifics: 'Prof.',
    emailId: 'professor231@gmail.com',
    faculty: 'Software Engineer'
  });

  const handleLogout = () => {
    localStorage.removeItem('professorUser');
    navigate('/professors/login');
  };

  return (
    <div className="min-h-screen bg-[var(--secondary-background-color)] p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-medium">Students</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout} 
            className="text-sm"
          >
            Logout
          </button>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </header>

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">First Name</label>
            <p className="text-lg">{professorData.firstName}</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last Name</label>
            <p className="text-lg">{professorData.lastName}</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Honorifics</label>
            <p className="text-lg">{professorData.honorifics}</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email ID</label>
            <p className="text-lg">{professorData.emailId}</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Faculty</label>
            <p className="text-lg">{professorData.faculty}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;