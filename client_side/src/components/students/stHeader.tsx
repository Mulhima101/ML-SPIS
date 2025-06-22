import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

function StHeader() {
  const location = useLocation();
  const [activePage, setActivePage] = useState({ dashboard: false, guidance: false, quiz: false });
  const authContext = useContext(AuthContext);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/" || pathname === "/students/dashboard") {
      setActivePage({ dashboard: true, guidance: false, quiz: false });
    } else if (
      pathname.includes("/quiz") || 
      pathname === "/students/quizzes" || 
      pathname.includes("/question")
    ) {
      setActivePage({ dashboard: false, guidance: false, quiz: true });
    } else {
      setActivePage({ dashboard: false, guidance: true, quiz: false });
    }
  }, [location]);

  return (
    <header className="flex justify-between items-center bg-[#fcfaed] p-0 px-6">
      <div className="flex pt-4 [&>a]:rounded-tr-[20px] [&>a]:rounded-tl-[20px] [&>a]:font-medium">
        <Link 
          to="/students/dashboard" 
          className={`header-btn px-6 md:px-12 py-4 text-[1.2rem] ${activePage.dashboard ? 'active bg-[#faeec9] text-black' : 'text-gray-500 hover:bg-amber-50'}`}
        >
          Home
        </Link>
        <Link 
          to="/students/guidance" 
          className={`header-btn px-6 md:px-12 py-4 text-[1.2rem] ${activePage.guidance ? 'active bg-[#faeec9] text-black' : 'text-gray-500 hover:bg-amber-50'}`}
        >
          Guidance
        </Link>
        <Link 
          to="/students/quizzes" 
          className={`header-btn px-6 md:px-12 py-4 text-[1.2rem] ${activePage.quiz ? 'active bg-[#faeec9] text-black' : 'text-gray-500 hover:bg-amber-50'}`}
        >
          Quiz
        </Link>
      </div>
      
      <div className="flex items-center gap-4 pr-6">
        <button 
          onClick={() => {
            authContext?.logout()
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