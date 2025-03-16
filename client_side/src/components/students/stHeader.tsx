import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function StHeader() {
  const location = useLocation();
  const [activePage, setActivePage] = useState({ home: false, quiz: false });

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/" || pathname === "/students/guidance" || pathname === "/students/dashboard") {
      setActivePage({ home: true, quiz: false });
    } else if (
      pathname.includes("/quiz") || 
      pathname === "/students/quizzes" || 
      pathname.includes("/question")
    ) {
      setActivePage({ home: false, quiz: true });
    } else {
      setActivePage({ home: false, quiz: false });
    }
  }, [location]);

  return (
    <header className="flex justify-between items-center bg-[#fcfaed] p-0 shadow-sm student-header">
      <div className="flex">
        <Link 
          to="/students/guidance" 
          className={`header-btn px-12 py-4 font-medium ${activePage.home ? 'active bg-[#faeec9] text-black' : 'text-gray-700 hover:bg-amber-50'}`}
        >
          Home
        </Link>
        <Link 
          to="/students/quizzes" 
          className={`header-btn px-12 py-4 font-medium ${activePage.quiz ? 'active bg-[#faeec9] text-black' : 'text-gray-700 hover:bg-amber-50'}`}
        >
          Quiz
        </Link>
      </div>
      
      <div className="flex items-center gap-4 pr-6">
        <button 
          onClick={() => {
            localStorage.removeItem('studentUser');
            window.location.href = '/students/login';
          }}
          className="text-sm font-medium text-gray-700 hover:text-amber-700"
        >
          Logout
        </button>
        <Link to="/students/profile">
          <div className="w-10 h-10 bg-gray-300 rounded-full shadow-sm overflow-hidden flex items-center justify-center text-gray-700 hover:bg-amber-200 transition-colors">
            <span className="font-semibold">MJ</span>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default StHeader;