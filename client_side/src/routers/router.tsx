// src/routers/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/main';

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
        element: <GuidancePage />,
      },
      {
        path: '/privacy-policy',
        element: <PrivacyPolicy />,
      },
      
      // Student routes
      {
        path: '/students/login',
        element: <StudentLogin />,
      },
      {
        path: '/students/register',
        element: <StudentRegister />,
      },
      {
        path: '/students/dashboard',
        element: <StudentDashboard />,
      },
      {
        path: '/students/profile',
        element: <StudentProfile />,
      },
      {
        path: '/students/guidance',
        element: <GuidancePage />,
      },
      {
        path: '/students/quizzes',
        element: <QuizAllPage />,
      },
      {
        path: '/students/quiz/:quizId',
        element: <QuizPage />,
      },
      {
        path: '/students/quiz/:quizId/question/:questionId',
        element: <SingleQuestionPage />,
      },
      {
        path: '/students/quiz-result/:quizId',
        element: <StudentDashboard />, // Redirect to dashboard for now
      },
      
      // Professor routes
      {
        path: '/professors/login',
        element: <ProfessorLogin />,
      },
      {
        path: '/professors/register',
        element: <ProfessorRegistration />,
      },
      {
        path: '/professors/profile',
        element: <ProfessorProfile />,
      },
      {
        path: '/professors/students',
        element: <StudentsList />,
      },
      {
        path: '/professors/student/:studentId',
        element: <StudentDetails />,
      },
    ],
  },
]);

export default router;