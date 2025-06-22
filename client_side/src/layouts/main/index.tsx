import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StFooter from '../../components/students/stFooter';
import ProfessorFooter from '../../components/professors/ProfessorFooter';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Determine if the current route is a login/register page
  const isAuthPage =
    location.pathname === '/' ||
    location.pathname.includes('/login') ||
    location.pathname.includes('/register');

  // Determine if the current route is a professor page
  const isProfessorPage = location.pathname.includes('/professors');

  return (
    <div className={`app-container ${isAuthPage ? 'auth-page' : ''}`}>
      <main className="main-content">
        <Outlet />
      </main>

      {!isAuthPage && (
        <footer className="main-footer">
          {isAuthenticated && (
            <div className="footer-content">
              {isProfessorPage ? <ProfessorFooter /> : <StFooter />}
            </div>
          )}
        </footer>
      )}
    </div>
  );
};

export default MainLayout;