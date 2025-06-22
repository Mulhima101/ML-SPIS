import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import StHeader from '../../components/students/stHeader';
import { CheckCircle, XCircle, ArrowLeft, Book, Clock, Target, Trophy, TrendingUp } from 'lucide-react';

interface QuizInfo {
    id: number;
    title: string;
    description?: string;
    duration_minutes: number;
    total_questions: number;
}

interface AttemptInfo {
    id: number;
    status: string;
    start_time: string;
    end_time: string;
    duration_taken: {
        total_seconds: number;
        minutes: number;
        seconds: number;
    };
    score_percentage: number;
    total_correct: number;
    total_questions: number;
    total_points: number;
    max_possible_points: number;
}

interface TopicPerformance {
    [topic: string]: {
        total_questions: number;
        correct_answers: number;
        total_points: number;
        earned_points: number;
        accuracy: number;
        score_percentage: number;
    };
}

interface Answer {
    question_id: number;
    question_text: string;
    question_topic: string;
    question_weight: number;
    options: string[];
    correct_answer: number;
    student_answer: number | null;
    is_correct: boolean;
    points_earned: number;
    answered_at: string;
}

interface QuizResults {
    quiz: QuizInfo;
    results: Array<{
        student: any;
        attempt: AttemptInfo;
        topic_performance: TopicPerformance;
        answers: Answer[];
    }>;
}

const QuizResultsPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchQuizResults = async () => {
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
                    `http://localhost:5000/api/quizzes/${quizId}/results`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setQuizResults(response.data);
            } catch (error: any) {
                console.error('Error fetching quiz results:', error);

                if (error.response?.status === 404) {
                    setError('Quiz results not found');
                } else if (error.response?.status === 403) {
                    setError('You do not have permission to view these quiz results');
                } else {
                    setError('Failed to load quiz results. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchQuizResults();
    }, [quizId]);

    const getAnswerLabel = (index: number): string => {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    const formatDuration = (duration: { minutes: number; seconds: number }): string => {
        return `${duration.minutes}m ${duration.seconds}s`;
    };

    const getPerformanceColor = (percentage: number): string => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPerformanceBgColor = (percentage: number): string => {
        if (percentage >= 80) return 'bg-green-50 border-green-200';
        if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
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

    if (error || !quizResults) {
        return (
            <div className="min-h-screen bg-[#faeec9]">
                <StHeader />
                <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
                    <div className="bg-white rounded-2xl p-8 shadow-md text-center">
                        <p className="text-red-600 text-lg mb-4">{error || 'Quiz results not found'}</p>
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

    const result = quizResults.results[0]; // Get the first (and likely only) result
    if (!result) {
        return (
            <div className="min-h-screen bg-[#faeec9]">
                <StHeader />
                <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[70vh]">
                    <div className="bg-white rounded-2xl p-8 shadow-md text-center">
                        <p className="text-red-600 text-lg mb-4">No results found for this quiz</p>
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

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{quizResults.quiz.title}</h1>
                    {quizResults.quiz.description && (
                        <p className="text-gray-600">{quizResults.quiz.description}</p>
                    )}
                </div>

                {/* Results Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                        Quiz Results Summary
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className={`text-center p-4 rounded-lg border-2 ${getPerformanceBgColor(result.attempt.score_percentage)}`}>
                            <div className={`text-2xl font-bold ${getPerformanceColor(result.attempt.score_percentage)}`}>
                                {result.attempt.score_percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Final Score</div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {result.attempt.total_correct}/{result.attempt.total_questions}
                            </div>
                            <div className="text-sm text-gray-600">Correct Answers</div>
                        </div>

                        <div className="text-center p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {result.attempt.total_points.toFixed(1)}/{result.attempt.max_possible_points.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">Points Earned</div>
                        </div>

                        <div className="text-center p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                            <div className="text-2xl font-bold text-amber-600">
                                {formatDuration(result.attempt.duration_taken)}
                            </div>
                            <div className="text-sm text-gray-600">Time Taken</div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        <p className="flex items-center mb-2">
                            <Clock className="h-4 w-4 mr-2" />
                            Started: {new Date(result.attempt.start_time).toLocaleString()}
                        </p>
                        <p className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed: {new Date(result.attempt.end_time).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Topic Performance */}
                <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        Topic Performance
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(result.topic_performance).map(([topic, performance]) => (
                            <div key={topic} className={`p-4 rounded-lg border-2 ${getPerformanceBgColor(performance.score_percentage)}`}>
                                <h3 className="font-semibold text-gray-900 mb-2">{topic}</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Accuracy:</span>
                                        <span className={`font-medium ${getPerformanceColor(performance.accuracy)}`}>
                                            {performance.accuracy.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Questions:</span>
                                        <span>{performance.correct_answers}/{performance.total_questions}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Points:</span>
                                        <span>{performance.earned_points.toFixed(1)}/{performance.total_points.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${performance.score_percentage >= 80 ? 'bg-green-500' :
                                                performance.score_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${performance.score_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question Review */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                        <Book className="h-6 w-6 mr-2 text-green-600" />
                        Question-by-Question Review
                    </h2>

                    {result.answers.map((answer, index) => (
                        <div key={answer.question_id} className="bg-white rounded-2xl p-6 shadow-md">
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <h3 className="text-lg font-semibold mr-3">Question {index + 1}</h3>
                                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {answer.question_topic}
                                    </span>
                                    <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
                                        {answer.question_weight} pts
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    {answer.is_correct ? (
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="h-5 w-5 mr-1" />
                                            <span className="font-medium">Correct (+{answer.points_earned} pts)</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600">
                                            <XCircle className="h-5 w-5 mr-1" />
                                            <span className="font-medium">Incorrect (0 pts)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Question Text */}
                            <p className="text-gray-800 mb-4 text-lg">{answer.question_text}</p>

                            {/* Answer Options */}
                            <div className="space-y-3 mb-4">
                                {answer.options.map((option, optionIndex) => {
                                    const isCorrect = optionIndex === answer.correct_answer;
                                    const isStudentAnswer = optionIndex === answer.student_answer;

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
                            {answer.student_answer === null && (
                                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                                    <p className="text-yellow-800 text-sm">You did not answer this question.</p>
                                </div>
                            )}

                            {/* Answer timestamp */}
                            {answer.answered_at && (
                                <div className="text-xs text-gray-500">
                                    Answered at: {new Date(answer.answered_at).toLocaleTimeString()}
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

export default QuizResultsPage;
