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

  useEffect(() => {
    // Check if the professor is logged in
    const user = localStorage.getItem('professorUser');
    if (!user) {
      navigate('/professors/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('professorUser');
    navigate('/professors/login');
  };

  return (
    <div className="min-h-screen bg-[#FEF8DD]">
      <header className="flex justify-between items-center px-6 py-4">
        <h1 className="text-lg font-medium">Students</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout} 
            className="text-sm font-medium"
          >
            Logout
          </button>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </header>

      <div className="flex flex-col items-center mt-6">
        <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
        <h2 className="text-xl font-medium">Professor Name</h2>
        <p className="text-gray-600 mb-8">Professor ID</p>
        
        <div className="w-full max-w-5xl flex justify-center gap-6 px-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md">
            <div className="space-y-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">First Name</p>
                <p className="font-normal">{professorData.firstName}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm mb-1">Last Name</p>
                <p className="font-normal">{professorData.lastName}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm mb-1">Honorifics</p>
                <p className="font-normal">{professorData.honorifics}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm mb-1">Email ID</p>
                <p className="font-normal">{professorData.emailId}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md">
            <div>
              <p className="text-gray-500 text-sm mb-1">Faculty</p>
              <p className="font-normal">{professorData.faculty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;