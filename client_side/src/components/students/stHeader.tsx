import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function StHeader() {
  const [activePage, setActivePage] = useState({home: false, quizzes: false});

  useEffect(() => {
    const pathname = document.location.pathname;
    if(pathname === "/"){
      setActivePage(() => ({quizzes: false, home: true}));
    } else if (pathname === "/students/quizzes"){
      setActivePage(() => ({home: false, quizzes: true}));
    } else {
      setActivePage(() => ({home: false, quizzes: false}));
    }
  });

  return (
    <header className="student-header flex justify-between bg-[var(--header-bg)] pt-4 px-4 mb-6">
      <div className='flex [&>a]:px-5 [&>a]:py-3 [&>a]:leading-[40px] [&>a]:rounded-t-[20px]'>
        <a href='/' className={`header-btn ${activePage.home? "active": ""}`}>Home</a>
        <a href='/students/quizzes' className={`header-btn ${activePage.quizzes? "active": ""}`}>Quizzes</a>
      </div>
      <div className="header-actions mb-4">
        <button className="logout-button">Logout</button>
        <a href='/students/profile'><span className='w-[50px] h-[50px] bg-red-100 rounded-full'></span></a>
      </div>
    </header>
  )
}

export default StHeader;
