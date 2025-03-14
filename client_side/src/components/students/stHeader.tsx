// src/components/students/stHeader.tsx
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
    <header className="flex justify-between items-center bg-[#fcfaed] p-0 shadow-sm">
      <div className="flex">
        <Link 
          to="/students/dashboard" 
          className={`px-12 py-4 font-medium ${activePage.home ? 'bg-[#faeec9] text-black' : 'text-gray-700'}`}
        >
          Home
        </Link>
        <Link 
          to="/students/quizzes" 
          className={`px-12 py-4 font-medium ${activePage.quiz ? 'bg-[#faeec9] text-black' : 'text-gray-700'}`}
        >
          Quiz
        </Link>
      </div>
      
      <div className="flex items-center gap-4 pr-4">
        <button 
          onClick={() => {
            localStorage.removeItem('studentUser');
            window.location.href = '/students/login';
          }}
          className="text-sm font-medium text-gray-700"
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