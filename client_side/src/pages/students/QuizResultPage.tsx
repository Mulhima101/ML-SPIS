import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import StHeader from '../../components/students/stHeader';
import { CheckCircle, XCircle, ArrowLeft, Book } from 'lucide-react';

interface QuestionResult {
    id: number;
    question_text: string;
    options: string[];
    correct_answer: number;
    student_answer: number | null;
    explanation?: string;
    is_correct: boolean;
    points: number;
}

interface QuizResult {
    id: string;
    title: string;
    description?: string;
    total_questions: number;
    score: number;
    percentage: number;
    time_taken?: number;
    completed_at: string;
    module_name?: string;
    questions: QuestionResult[];
}

const QuizResultPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchQuizResult = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('Authentication required. Please log in again.');
                    return;
                }

                if (!quizId) {
                    setError('Quiz ID is missing');
                    return;
                }

                const response = await axios.get(
                    `http://localhost:5000/api/students/quiz-results/${quizId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setQuizResult(response.data);
            } catch (error: any) {
                console.error('Error fetching quiz result:', error);

                if (error.response?.status === 404) {
                    setError('Quiz result not found');
                } else if (error.response?.status === 403) {
                    setError('You do not have permission to view this quiz result');
                } else {
                    setError('Failed to load quiz result. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQuizResult();
    }, [quizId]);

    const getAnswerLabel = (index: number): string => {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faeec9]">
                <StHeader />
                <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading quiz results...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !quizResult) {
        return (
            <div className="min-h-screen bg-[#faeec9]">
                <StHeader />
                <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
                    <div className="bg-white rounded-2xl p-8 shadow-md text-center">
                        <p className="text-red-600 text-lg mb-4">{error || 'Quiz result not found'}</p>
                        <Link
                            to="/students/quizzes"
                            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition"
                        >
                            Back to Quizzes
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const correctAnswers = quizResult.questions.filter(q => q.is_correct).length;
    const incorrectAnswers = quizResult.questions.length - correctAnswers;

    return (
        <div className="min-h-screen bg-[#faeec9]">
            <StHeader />

            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/students/quizzes')}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Quizzes
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{quizResult.title}</h1>
                    {quizResult.module_name && (
                        <p className="text-blue-600 font-medium">Module: {quizResult.module_name}</p>
                    )}
                </div>

                {/* Results Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">Quiz Results Summary</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{quizResult.percentage}%</div>
                            <div className="text-sm text-gray-600">Final Score</div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{correctAnswers}/{quizResult.total_questions}</div>
                            <div className="text-sm text-gray-600">Correct Answers</div>
                        </div>

                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                            <div className="text-sm text-gray-600">Incorrect Answers</div>
                        </div>

                        {quizResult.time_taken && (
                            <div className="text-center p-4 bg-amber-50 rounded-lg">
                                <div className="text-2xl font-bold text-amber-600">{formatTime(quizResult.time_taken)}</div>
                                <div className="text-sm text-gray-600">Time Taken</div>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-600">
                        Completed on: {new Date(quizResult.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Questions and Answers */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Question Review</h2>

                    {quizResult.questions.map((question, index) => (
                        <div key={question.id} className="bg-white rounded-2xl p-6 shadow-md">
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                                <div className="flex items-center">
                                    {question.is_correct ? (
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="h-5 w-5 mr-1" />
                                            <span className="font-medium">Correct</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600">
                                            <XCircle className="h-5 w-5 mr-1" />
                                            <span className="font-medium">Incorrect</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Question Text */}
                            <p className="text-gray-800 mb-4 text-lg">{question.question_text}</p>

                            {/* Answer Options */}
                            <div className="space-y-3 mb-4">
                                {question.options.map((option, optionIndex) => {
                                    const isCorrect = optionIndex === question.correct_answer;
                                    const isStudentAnswer = optionIndex === question.student_answer;

                                    let bgColor = 'bg-gray-50';
                                    let textColor = 'text-gray-800';
                                    let borderColor = 'border-gray-200';

                                    if (isCorrect) {
                                        bgColor = 'bg-green-100';
                                        textColor = 'text-green-800';
                                        borderColor = 'border-green-300';
                                    } else if (isStudentAnswer && !isCorrect) {
                                        bgColor = 'bg-red-100';
                                        textColor = 'text-red-800';
                                        borderColor = 'border-red-300';
                                    }

                                    return (
                                        <div
                                            key={optionIndex}
                                            className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`font-bold mr-3 ${textColor}`}>
                                                    {getAnswerLabel(optionIndex)}.
                                                </span>
                                                <span className={textColor}>{option}</span>
                                                <div className="ml-auto flex items-center space-x-2">
                                                    {isCorrect && (
                                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                                            Correct Answer
                                                        </span>
                                                    )}
                                                    {isStudentAnswer && (
                                                        <span className={`text-xs px-2 py-1 rounded ${isCorrect
                                                                ? 'bg-green-200 text-green-800'
                                                                : 'bg-red-200 text-red-800'
                                                            }`}>
                                                            Your Answer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Student didn't answer */}
                            {question.student_answer === null && (
                                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                                    <p className="text-yellow-800 text-sm">You did not answer this question.</p>
                                </div>
                            )}

                            {/* Explanation */}
                            {question.explanation && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <Book className="h-4 w-4 text-blue-600 mr-2" />
                                        <span className="font-medium text-blue-800">Explanation</span>
                                    </div>
                                    <p className="text-blue-700 text-sm">{question.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center space-x-4">
                    <Link
                        to="/students/quizzes"
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        Back to Quizzes
                    </Link>

                    <Link
                        to="/students/dashboard"
                        className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default QuizResultPage;
