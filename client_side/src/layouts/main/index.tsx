import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const location = useLocation();
  
  // Determine if the current route is a login/register page
  const isAuthPage = 
    location.pathname === '/' || 
    location.pathname.includes('/login') || 
    location.pathname.includes('/register');
  
  return (
    <div className={`app-container ${isAuthPage ? 'auth-page' : ''}`}>
      {/* We don't need a header for auth pages as they have their own layout */}
      {!isAuthPage && (
        <header className="main-header">
          {/* You can add a universal header here if needed */}
        </header>
      )}
      
      <main className="main-content">
        <Outlet />
      </main>
      
      {!isAuthPage && (
        <footer className="main-footer">
          {/* You can add a universal footer here if needed */}
          <div className="footer-content">
            <p>© 2024 ML-Based Student Progress Improvement System</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;