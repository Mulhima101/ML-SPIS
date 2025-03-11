import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function StHeader() {
  const location = useLocation();
  const [activePage, setActivePage] = useState({ home: false, quiz: false });

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/" || pathname === "/students/dashboard") {
      setActivePage({ home: true, quiz: false });
    } else if (pathname.includes("/quiz") || pathname === "/students/quizzes") {
      setActivePage({ home: false, quiz: true });
    } else {
      setActivePage({ home: false, quiz: false });
    }
  }, [location]);

  return (
    <header className="flex justify-between items-center bg-[var(--secondary-background-color)] p-4">
      <div className="flex space-x-4">
        <Link 
          to="/students/dashboard" 
          className={`px-6 py-2 rounded-t-lg ${activePage.home ? 'bg-[var(--primary-background-color)]' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/students/quizzes" 
          className={`px-6 py-2 rounded-t-lg ${activePage.quiz ? 'bg-[var(--primary-background-color)]' : ''}`}
        >
          Quiz
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => {
            localStorage.removeItem('studentUser');
            window.location.href = '/students/login';
          }}
          className="text-sm"
        >
          Logout
        </button>
        <Link to="/students/profile">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </Link>
      </div>
    </header>
  );
}

export default StHeader;