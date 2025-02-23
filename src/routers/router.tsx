import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/main"; // Main layout for shared UI (like header, footer, etc.)
import Home from "../pages/home";

// Student Pages
import StudentLogin from "../pages/students/StudentLogin";
import StudentRegister from "../pages/students/StudentRegister";
import StudentDashboard from "../pages/students/StudentDashboard";
import QuizPage from "../pages/students/QuizPage";
import StudentProfile from "../pages/students/StudentProfile";
import GuidancePage from "../pages/students/GuidancePage";
import QuizAllPage from "../pages/students/QuizAllPage";
import SingleQuestionPage from "../pages/students/SingleQuestionPage";


// Professor Pages
import ProfessorLogin from "../pages/professors/ProfessorLogin";
import ProfessorRegistration from "../pages/professors/ProfessorRegistration";
import ProfessorProfile from "../pages/professors/ProfessorProfile";
import StudentDetails from "../pages/professors/StudentDetails";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "/",
                element: <StudentDashboard />,
            },
            {
                path: "/students/login",
                element: <StudentLogin />,
            },
            {
                path: "/students/register",
                element: <StudentRegister />,
            },
            {
                path: "/students/quiz",
                element: <QuizPage />,
            },
            {
                path: "/students/profile",
                element: <StudentProfile />,
            },
            {
                path: "/students/guidance",
                element: <GuidancePage />,
            },
            {
                path: "/students/quizzes",
                element: <QuizAllPage />,
            },
            {
                path: "/students/quiz/:questionId",
                element: <SingleQuestionPage />,
            },
            // Professor Routes
            {
                path: "/professors/login",
                element: <ProfessorLogin />,
            },
            {
                path: "/professors/register",
                element: <ProfessorRegistration />,
            },
            {
                path: "/professors/profile",
                element: <ProfessorProfile />,
            },
            {
                path: "/professors/students",
                element: <StudentDetails />,
            },
        ],
    },
]);

export default router;
