// src/routers/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/main';
import AuthGuard from '../components/AuthGuard';

// Student Pages
import StudentLogin from '../pages/students/StudentLogin';
import StudentRegister from '../pages/students/StudentRegister';
import StudentDashboard from '../pages/students/StudentDashboard';
import QuizPage from '../pages/students/QuizPage';
import StudentProfile from '../pages/students/StudentProfile';
import GuidancePage from '../pages/students/GuidancePage';
import QuizAllPage from '../pages/students/QuizAllPage';
import SingleQuestionPage from '../pages/students/SingleQuestionPage';

// Professor Pages
import ProfessorLogin from '../pages/professors/ProfessorLogin';
import ProfessorRegistration from '../pages/professors/ProfessorRegistration';
import ProfessorProfile from '../pages/professors/ProfessorProfile';
import StudentDetails from '../pages/professors/StudentDetails';
import StudentsList from '../pages/professors/StudentsList';

// Privacy Policy Page
import PrivacyPolicy from '../pages/PrivacyPolicy';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Public routes
      {
        path: '/',
        element: <StudentLogin />,
      },
      {
        path: '/privacy-policy',
        element: <PrivacyPolicy />,
      },
      
      // Authentication routes
      {
        path: '/students/login',
        element: <StudentLogin />,
      },
      {
        path: '/students/register',
        element: <StudentRegister />,
      },
      {
        path: '/professors/login',
        element: <ProfessorLogin />,
      },
      {
        path: '/professors/register',
        element: <ProfessorRegistration />,
      },
      
      // Protected student routes
      {
        path: '/students/dashboard',
        element: (
          <AuthGuard requiredRole="student">
            <StudentDashboard />
          </AuthGuard>
        ),
      },
      {
        path: '/students/profile',
        element: (
          <AuthGuard requiredRole="student">
            <StudentProfile />
          </AuthGuard>
        ),
      },
      {
        path: '/students/guidance',
        element: (
          <AuthGuard requiredRole="student">
            <GuidancePage />
          </AuthGuard>
        ),
      },
      {
        path: '/students/quizzes',
        element: (
          <AuthGuard requiredRole="student">
            <QuizAllPage />
          </AuthGuard>
        ),
      },
      {
        path: '/students/quiz/:quizId',
        element: (
          <AuthGuard requiredRole="student">
            <QuizPage />
          </AuthGuard>
        ),
      },
      {
        path: '/students/quiz/:quizId/question/:questionId',
        element: (
          <AuthGuard requiredRole="student">
            <SingleQuestionPage />
          </AuthGuard>
        ),
      },
      {
        path: '/students/quiz-result/:quizId',
        element: (
          <AuthGuard requiredRole="student">
            <StudentDashboard />
          </AuthGuard>
        ),
      },
      
      // Protected professor routes
      {
        path: '/professors/profile',
        element: (
          <AuthGuard requiredRole="professor">
            <ProfessorProfile />
          </AuthGuard>
        ),
      },
      {
        path: '/professors/students',
        element: (
          <AuthGuard requiredRole="professor">
            <StudentsList />
          </AuthGuard>
        ),
      },
      {
        path: '/professors/student/:studentId',
        element: (
          <AuthGuard requiredRole="professor">
            <StudentDetails />
          </AuthGuard>
        ),
      },
    ],
  },
]);

export default router;