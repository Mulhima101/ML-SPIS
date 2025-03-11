import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Professor {
  firstName: string;
  lastName: string;
  email: string;
  honorifics: string;
  faculty: string;
  profileImage?: string;
}

const ProfessorProfile: React.FC = () => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Mock fetching professor data
    const fetchProfessorData = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          // Get data from localStorage or mock it
          const storedUser = JSON.parse(localStorage.getItem('professorUser') || '{}');
          
          const mockProfessor: Professor = {
            firstName: storedUser.firstName || 'Harsha',
            lastName: storedUser.lastName || 'Nirmaral',
            email: storedUser.email || 'professor231@gmail.com',
            honorifics: storedUser.honorifics || 'Prof.',
            faculty: storedUser.faculty || 'Software Engineer'
          };
          
          setProfessor(mockProfessor);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching professor data:', error);
        setLoading(false);
      }
    };
    
    fetchProfessorData();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
        <div className="loading">Loading profile data...</div>
      </div>
    );
  }
  
  if (!professor) {
    return (
      <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
        <div className="text-red-600">Professor profile not found</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--primary-background-color)]">
      <header className="bg-[var(--secondary-background-color)] p-4 flex justify-between items-center">
        <a href="/professors" className="text-lg font-medium">Students</a>
        <div className="flex items-center gap-4">
          <button className="text-sm">Logout</button>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
        </div>
        
        <div className="bg-[var(--secondary-background-color)] rounded-lg p-6 max-w-md mx-auto mb-6">
          <h2 className="text-xl font-bold mb-2">Professor Name</h2>
          <p className="text-gray-600 mb-6">Professor ID</p>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">First Name</p>
              <p className="text-gray-700">{professor.firstName}</p>
            </div>
            
            <div>
              <p className="font-medium">Last Name</p>
              <p className="text-gray-700">{professor.lastName}</p>
            </div>
            
            <div>
              <p className="font-medium">Honorifics</p>
              <p className="text-gray-700">{professor.honorifics}</p>
            </div>
            
            <div>
              <p className="font-medium">Email ID</p>
              <p className="text-gray-700">{professor.email}</p>
            </div>
            
            <div>
              <p className="font-medium">Faculty</p>
              <p className="text-gray-700">{professor.faculty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;