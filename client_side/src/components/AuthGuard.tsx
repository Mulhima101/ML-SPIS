import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'professor';
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait until auth check is complete
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        navigate('/students/login', { state: { from: location } });
      } else if (requiredRole && user?.userType !== requiredRole) {
        // Redirect to appropriate dashboard if role doesn't match
        if (user?.userType === 'student') {
          navigate('/students/dashboard');
        } else {
          navigate('/professors/dashboard');
        }
      }
    }
  }, [isAuthenticated, loading, navigate, location, user, requiredRole]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // If authenticated and role matches (or no role required), render children
  if (isAuthenticated && (!requiredRole || user?.userType === requiredRole)) {
    return <>{children}</>;
  }

  // Render nothing while redirecting
  return null;
};

export default AuthGuard;