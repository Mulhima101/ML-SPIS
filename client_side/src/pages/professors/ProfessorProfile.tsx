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
    <div className="min-h-screen bg-[#FEF8DD]">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-lg font-medium">Students</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout} 
            className="text-sm font-medium"
          >
            Logout
          </button>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center mt-8">
        <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
        <h2 className="text-xl font-medium">Professor Name</h2>
        <p className="text-gray-600 mb-8">Professor ID</p>
        
        <div className="w-full max-w-3xl flex flex-wrap justify-center gap-8 px-4">
          <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">First Name</p>
                <p className="font-medium">{professorData.firstName}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm">Last Name</p>
                <p className="font-medium">{professorData.lastName}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm">Honorifics</p>
                <p className="font-medium">{professorData.honorifics}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm">Email ID</p>
                <p className="font-medium">{professorData.emailId}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
            <div>
              <p className="text-gray-500 text-sm">Faculty</p>
              <p className="font-medium">{professorData.faculty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;