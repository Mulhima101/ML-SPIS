import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Brain, FileUp, Edit3, Save, X, Clock, Users, Calendar, Trash2, CheckCircle, Settings } from 'lucide-react';
import AIQuizGenerator from '../../components/professors/AIQuizGenerator';
import ManualQuizUpload from '../../components/professors/ManualQuizUpload';
import QuizEditor from '../../components/professors/QuizEditor';
import QuizSettings from '../../components/professors/QuizSettings';
import { saveModule, getProfessorModules, updateModule, deleteModule as deleteModuleAPI, getModuleById } from '../../services/moduleService';
import { saveQuiz, updateQuizAvailability, deleteQuiz, updateQuiz, getQuizQuestions, getProfessorQuizzes, getStudentsForQuizAssignment, getQuizAvailability } from '../../services/quizService';
import { getCurrentTimeIST, formatDateTimeIST, toIST, isWithinTimeWindow } from '../../utils/dateUtils';

const MyModules = () => {
    const [modules, setModules] = useState([]);
    const [showAddModule, setShowAddModule] = useState(false);
    const [newModuleName, setNewModuleName] = useState('');
    const [selectedModule, setSelectedModule] = useState(null);
    const [activeView, setActiveView] = useState('modules');
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [availabilitySettings, setAvailabilitySettings] = useState({
        startDate: '',
        startTime: '',
        duration: 60,
        target: 'all',
        specificStudents: []
    });
    const [editingModule, setEditingModule] = useState(null);
    const [showEditModule, setShowEditModule] = useState(false);
    const [editModuleForm, setEditModuleForm] = useState({
        name: '',
        description: '',
        status: 'active'
    });
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [showEditQuiz, setShowEditQuiz] = useState(false);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);

    useEffect(() => {
        loadModules();
    }, []);

    const loadModules = async () => {
        try {
            setLoading(true);
            const response = await getProfessorModules();
            const modules = response.modules || [];

            const allQuizzesResponse = await getProfessorQuizzes();
            const allQuizzes = allQuizzesResponse.quizzes || [];

            const quizzesByModule = {};

            for (const quiz of allQuizzes) {
                const moduleId = quiz.module_id;
                if (moduleId) {
                    if (!quizzesByModule[moduleId]) {
                        quizzesByModule[moduleId] = [];
                    }
                    const existingQuiz = quizzesByModule[moduleId].find(q => q.id === quiz.id);
                    if (!existingQuiz) {
                        quizzesByModule[moduleId].push(quiz);
                    }
                }
            }

            const formattedModules = await Promise.all(modules.map(async (module) => {
                const moduleQuizzes = quizzesByModule[module.id] || [];

                const uniqueQuizzesMap = new Map();
                moduleQuizzes.forEach(quiz => {
                    uniqueQuizzesMap.set(quiz.id, quiz);
                });
                const uniqueQuizzes = Array.from(uniqueQuizzesMap.values());

                const quizzesWithCounts = await Promise.all(uniqueQuizzes.map(async (quiz) => {
                    try {
                        const questionsResponse = await getQuizQuestions(quiz.id);
                        const questionCount = questionsResponse.questions?.length || 0;

                        let availabilityData = null;
                        try {
                            availabilityData = await getQuizAvailability(quiz.id);
                            console.log(`Availability data for quiz ${quiz.id}:`, availabilityData);
                        } catch (availError) {
                            console.warn(`Failed to fetch availability for quiz ${quiz.id}:`, availError);
                        }

                        const hasAvailability = availabilityData?.availability != null;
                        const availabilityStatus = availabilityData?.status || 'inactive';

                        return {
                            ...quiz,
                            question_count: questionCount,
                            questions: questionsResponse.questions || [],
                            isAvailable: hasAvailability,
                            availabilityStatus: availabilityStatus,
                            availabilitySettings: availabilityData?.availability || null,
                            assignedStudents: availabilityData?.assigned_students || []
                        };
                    } catch (error) {
                        console.warn(`Failed to fetch questions for quiz ${quiz.id}:`, error);
                        return {
                            ...quiz,
                            question_count: quiz.question_count || quiz.questions?.length || 0,
                            questions: quiz.questions || [],
                            isAvailable: false,
                            availabilityStatus: 'inactive',
                            availabilitySettings: null,
                            assignedStudents: []
                        };
                    }
                }));

                return {
                    ...module,
                    quizzes: quizzesWithCounts,
                    quiz_count: quizzesWithCounts.length
                };
            }));

            setModules(formattedModules);
            localStorage.setItem('professorModules', JSON.stringify(formattedModules));
        } catch (error) {
            console.error('Error loading modules:', error);

            const savedModules = localStorage.getItem('professorModules');
            if (savedModules) {
                try {
                    const parsedModules = JSON.parse(savedModules);
                    const deduplicatedModules = parsedModules.map(module => {
                        if (module.quizzes && Array.isArray(module.quizzes)) {
                            const quizMap = new Map();
                            module.quizzes.forEach(quiz => {
                                quizMap.set(quiz.id, quiz);
                            });
                            return {
                                ...module,
                                quizzes: Array.from(quizMap.values())
                            };
                        }
                        return {
                            ...module,
                            quizzes: []
                        };
                    });
                    setModules(deduplicatedModules);
                } catch (parseError) {
                    console.error('Error parsing saved modules:', parseError);
                    setModules([]);
                }
            } else {
                setModules([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = async () => {
        if (newModuleName.trim()) {
            try {
                setLoading(true);
                const moduleData = {
                    name: newModuleName.trim(),
                    description: `Module for ${newModuleName.trim()}`,
                    professor_id: localStorage.getItem('professorId') || null,
                    created_at: new Date().toISOString(),
                    status: 'active'
                };
                const response = await saveModule(moduleData);
                const newModule = {
                    id: response.module.id,
                    name: response.module.name,
                    description: response.module.description,
                    createdAt: response.module.created_at,
                    status: response.module.status || 'active',
                    quizzes: []
                };
                setModules(prev => [...prev, newModule]);
                setNewModuleName('');
                setShowAddModule(false);
                setError('');
            } catch (error) {
                console.error('Error adding module:', error);
                setError(`Failed to add module: ${error.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteModule = async (moduleId) => {
        if (window.confirm('Are you sure you want to delete this module? All quizzes in this module will also be deleted.')) {
            try {
                setLoading(true);
                await deleteModuleAPI(moduleId);
                setModules(prev => prev.filter(m => m.id !== moduleId));
                setError('');
            } catch (error) {
                console.error('Error deleting module:', error);
                setError('Failed to delete module');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditModule = async (module) => {
        try {
            setLoading(true);
            const response = await getModuleById(module.id);
            const moduleData = response.module || module;
            setEditingModule(moduleData);
            setEditModuleForm({
                name: moduleData.name || '',
                description: moduleData.description || '',
                status: moduleData.status || 'active'
            });
            setShowEditModule(true);
        } catch (error) {
            console.error('Error fetching module details:', error);
            setEditingModule(module);
            setEditModuleForm({
                name: module.name || '',
                description: module.description || '',
                status: module.status || 'active'
            });
            setShowEditModule(true);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateModule = async () => {
        if (!editModuleForm.name.trim()) {
            setError('Module name is required');
            return;
        }
        try {
            setLoading(true);
            const response = await updateModule(editingModule.id, editModuleForm);
            setModules(prev => prev.map(module =>
                module.id === editingModule.id
                    ? { ...module, ...response.module }
                    : module
            ));
            setShowEditModule(false);
            setEditingModule(null);
            setError('');
        } catch (error) {
            console.error('Error updating module:', error);
            setError(`Failed to update module: ${error.message || 'Unknown error'}`);
            setShowEditModule(false);
            setEditingModule(null);
        } finally {
            setLoading(false);
        }
    };

    const handleQuizGenerated = (quiz) => {
        setCurrentQuiz(quiz);
        setActiveView('edit-quiz');
    };

    const handleQuizSaved = async (quiz) => {
        try {
            setLoading(true);
            const quizData = {
                title: quiz.title,
                description: quiz.description || '',
                module_id: selectedModule.id,
                questions: quiz.questions.map(q => ({
                    question_text: q.question,
                    question_type: 'multiple_choice',
                    options: q.options,
                    correct_answer: q.correctAnswer,
                    explanation: q.explanation || '',
                    points: 1
                }))
            };
            const response = await saveQuiz(quizData);
            const savedQuiz = {
                id: response.quiz.id,
                title: response.quiz.title,
                description: response.quiz.description,
                questions: quiz.questions,
                question_count: quiz.questions.length,
                isAvailable: false,
                availabilitySettings: null,
                createdAt: response.quiz.created_at
            };

            interface Module {
                id: string | number;
                name: string;
                description?: string;
                createdAt?: string;
                status?: 'active' | 'inactive' | 'draft';
                quizzes: Quiz[];
                quiz_count?: number;
            }

            interface Quiz {
                id: string | number;
                title: string;
                description?: string;
                questions: Question[];
                question_count: number;
                isAvailable: boolean;
                availabilityStatus?: 'active' | 'inactive' | 'upcoming' | 'ended';
                availabilitySettings: AvailabilitySettings | null;
                createdAt?: string;
                updated_at?: string;
                module_id?: string | number;
                moduleId?: string | number;
                assignedStudents?: Student[];
            }

            interface Question {
                question: string;
                options: string[];
                correctAnswer: number;
                explanation?: string;
            }

            interface AvailabilitySettings {
                startDate: string;
                startTime: string;
                duration: number;
                target: 'all' | 'specific';
                specificStudents: string[];
                start_date?: string;
                start_time?: string;
                duration_minutes?: number;
                target_type?: 'all' | 'specific';
                createdAt?: string;
            }

            interface Student {
                id: string | number;
                firstName: string;
                lastName: string;
                email: string;
                studentId?: string;
            }

            setModules((prev: Module[]) => prev.map((module: Module) =>
                module.id === selectedModule.id
                    ? {
                        ...module,
                        quizzes: [
                            ...module.quizzes.filter((q: Quiz) => q.id !== savedQuiz.id),
                            savedQuiz
                        ],
                        quiz_count: module.quizzes.filter((q: Quiz) => q.id !== savedQuiz.id).length + 1
                    }
                    : module
            ));
            setActiveView('modules');
            setCurrentQuiz(null);
            setSelectedModule(null);
            setError('');
        } catch (error) {
            console.error('Error saving quiz:', error);
            setError('Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleEditQuiz = async (quiz, moduleId) => {
        try {
            setLoading(true);
            const questionsResponse = await getQuizQuestions(quiz.id);

            // Debug logging to see what we're getting from the API
            console.log('Raw questions response:', questionsResponse);
            console.log('Questions array:', questionsResponse.questions);

            const transformedQuestions = questionsResponse.questions?.map((q, index) => {
                console.log(`Processing question ${index}:`, q);

                return {
                    question: q.text || q.question_text || q.question || '',
                    options: Array.isArray(q.options) ? q.options : [],
                    correctAnswer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
                    explanation: q.explanation || ''
                };
            }) || [];

            console.log('Transformed questions:', transformedQuestions);

            const editQuizData = {
                ...quiz,
                title: quiz.title || '',
                description: quiz.description || '',
                questions: transformedQuestions,
                moduleId
            };

            console.log('Final quiz data for editing:', editQuizData);

            setEditingQuiz(editQuizData);
            setCurrentQuiz(editQuizData);
            setSelectedModule(modules.find(m => m.id === moduleId));
            setActiveView('edit-quiz');
        } catch (error) {
            console.error('Error preparing quiz for editing:', error);
            setError('Failed to load quiz for editing');
        } finally {
            setLoading(false);
        }
    };

    const handleQuizUpdated = async (updatedQuiz) => {
        try {
            setLoading(true);
            const quizData = {
                title: updatedQuiz.title,
                description: updatedQuiz.description || '',
                questions: updatedQuiz.questions.map(q => ({
                    question_text: q.question,
                    question_type: 'multiple_choice',
                    options: q.options,
                    correct_answer: q.correctAnswer,
                    explanation: q.explanation || '',
                    points: 1
                }))
            };
            await updateQuiz(editingQuiz.id, quizData);
            setModules(prev => prev.map(module =>
                module.id === editingQuiz.moduleId
                    ? {
                        ...module,
                        quizzes: module.quizzes.map(quiz =>
                            quiz.id === editingQuiz.id
                                ? { ...quiz, ...updatedQuiz, updated_at: new Date().toISOString() }
                                : quiz
                        ).filter((quiz, index, self) =>
                            index === self.findIndex(q => q.id === quiz.id)
                        )
                    }
                    : module
            ));
            setActiveView('modules');
            setCurrentQuiz(null);
            setEditingQuiz(null);
            setSelectedModule(null);
            setError('');
        } catch (error) {
            console.error('Error updating quiz:', error);
            setError('Failed to update quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleMakeAvailable = async (quiz, moduleId) => {
        setSelectedQuiz({ ...quiz, moduleId });
        setShowAvailabilityModal(true);

        setLoadingStudents(true);
        try {
            const studentsResponse = await getStudentsForQuizAssignment();
            setAvailableStudents(studentsResponse.students);
        } catch (error) {
            console.error('Error fetching students:', error);
            setError('Failed to load students');
            setAvailableStudents([]);
        } finally {
            setLoadingStudents(false);
        }

        if (quiz.isAvailable && quiz.availabilitySettings) {
            const settings = quiz.availabilitySettings;

            const startDateIST = settings.start_date ? toIST(`${settings.start_date}T${settings.start_time || '00:00'}`) : getCurrentTimeIST();

            setAvailabilitySettings({
                startDate: startDateIST.toISOString().split('T')[0],
                startTime: startDateIST.toTimeString().slice(0, 5),
                duration: settings.duration_minutes || 60,
                target: settings.target_type || 'all',
                specificStudents: []
            });

            if (settings.target_type === 'specific' && quiz.assignedStudents) {
                setSelectedStudents(quiz.assignedStudents.map(student => student.id));
            } else {
                setSelectedStudents([]);
            }
        } else {
            const nowIST = getCurrentTimeIST();
            const defaultStartIST = new Date(nowIST.getTime() + 60 * 60 * 1000);

            setAvailabilitySettings({
                startDate: defaultStartIST.toISOString().split('T')[0],
                startTime: defaultStartIST.toTimeString().slice(0, 5),
                duration: 60,
                target: 'all',
                specificStudents: []
            });
            setSelectedStudents([]);
        }
    };

    const handleSaveAvailability = async () => {
        if (!availabilitySettings.startDate || !availabilitySettings.startTime) {
            setError('Please select start date and time');
            return;
        }

        try {
            setLoading(true);
            setError('');

            let targetStudentIds = [];
            if (availabilitySettings.target === 'specific') {
                if (selectedStudents.length === 0) {
                    setError('Please select at least one student for specific targeting');
                    return;
                }
                targetStudentIds = selectedStudents;
            } else {
                targetStudentIds = availableStudents.map(student => student.id);
            }

            const availabilityData = {
                start_date: availabilitySettings.startDate,
                start_time: availabilitySettings.startTime,
                duration_minutes: availabilitySettings.duration,
                target_type: availabilitySettings.target,
                target_students: targetStudentIds,
                is_active: true
            };

            console.log('Sending availability data:', availabilityData);

            await updateQuizAvailability(selectedQuiz.id, availabilityData);

            setModules(prev => prev.map(module =>
                module.id === selectedQuiz.moduleId
                    ? {
                        ...module,
                        quizzes: module.quizzes.map(quiz =>
                            quiz.id === selectedQuiz.id
                                ? {
                                    ...quiz,
                                    isAvailable: true,
                                    availabilitySettings: {
                                        ...availabilitySettings,
                                        createdAt: new Date().toISOString()
                                    }
                                }
                                : quiz
                        )
                    }
                    : module
            ));

            setShowAvailabilityModal(false);
            setSelectedQuiz(null);
            setSelectedStudents([]);
            setAvailableStudents([]);

            setAvailabilitySettings({
                startDate: '',
                startTime: '',
                duration: 60,
                target: 'all',
                specificStudents: []
            });

        } catch (error) {
            console.error('Error updating quiz availability:', error);
            setError(error.message || 'Failed to update quiz availability');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelection = (studentId) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const handleSelectAllStudents = () => {
        if (selectedStudents.length === availableStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(availableStudents.map(student => student.id));
        }
    };

    const formatAvailabilityStatus = (quiz) => {
        if (!quiz.isAvailable || !quiz.availabilitySettings) return null;

        const settings = quiz.availabilitySettings;
        const startDateTimeIST = toIST(`${settings.start_date}T${settings.start_time}`);
        const endDateTimeIST = new Date(startDateTimeIST.getTime() + (settings.duration_minutes || 60) * 60 * 1000);
        const nowIST = getCurrentTimeIST();

        const apiStatus = quiz.availabilityStatus;

        let status, text;

        if (apiStatus === 'upcoming' || nowIST < startDateTimeIST) {
            status = 'scheduled';
            text = `Starts ${formatDateTimeIST(startDateTimeIST)} IST`;
        } else if (apiStatus === 'active' || (nowIST >= startDateTimeIST && nowIST <= endDateTimeIST)) {
            status = 'active';
            text = `Active until ${formatDateTimeIST(endDateTimeIST)} IST`;
        } else if (apiStatus === 'ended' || nowIST > endDateTimeIST) {
            status = 'ended';
            text = `Ended ${formatDateTimeIST(endDateTimeIST)} IST`;
        } else {
            status = apiStatus;
            text = `Status: ${apiStatus}`;
        }

        return {
            status: status,
            text: text,
            studentCount: quiz.assignedStudents?.length || 0
        };
    };

    if (activeView === 'ai-quiz') {
        return (
            <AIQuizGenerator
                module={selectedModule}
                onQuizGenerated={handleQuizGenerated}
                onBack={() => setActiveView('modules')}
            />
        );
    }

    if (activeView === 'manual-quiz') {
        return (
            <ManualQuizUpload
                module={selectedModule}
                onQuizGenerated={handleQuizGenerated}
                onBack={() => setActiveView('modules')}
            />
        );
    }

    if (activeView === 'edit-quiz') {
        return (
            <QuizEditor
                quiz={currentQuiz}
                module={selectedModule}
                onSave={editingQuiz ? handleQuizUpdated : handleQuizSaved}
                onBack={() => {
                    setActiveView('modules');
                    setEditingQuiz(null);
                }}
                isEditing={!!editingQuiz}
            />
        );
    }

    const AvailabilityModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        {selectedQuiz?.isAvailable ? 'Edit Quiz Availability' : 'Make Quiz Available'}
                    </h3>
                    <button
                        onClick={() => {
                            setShowAvailabilityModal(false);
                            setSelectedStudents([]);
                            setAvailableStudents([]);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-3">
                            Quiz: <span className="font-medium">{selectedQuiz?.title}</span>
                        </p>
                        {selectedQuiz?.isAvailable && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-800">
                                    This quiz is currently available.
                                    Status: <span className="font-medium capitalize">{selectedQuiz?.availabilityStatus || 'unknown'}</span>
                                </p>
                                {selectedQuiz?.assignedStudents?.length > 0 && (
                                    <p className="text-sm text-blue-700 mt-1">
                                        Assigned to {selectedQuiz.assignedStudents.length} student(s)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={availabilitySettings.startDate}
                                onChange={(e) => setAvailabilitySettings({
                                    ...availabilitySettings,
                                    startDate: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time *
                            </label>
                            <input
                                type="time"
                                value={availabilitySettings.startTime}
                                onChange={(e) => setAvailabilitySettings({
                                    ...availabilitySettings,
                                    startTime: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (minutes) *
                        </label>
                        <input
                            type="number"
                            value={availabilitySettings.duration}
                            onChange={(e) => setAvailabilitySettings({
                                ...availabilitySettings,
                                duration: parseInt(e.target.value)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign To *
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="all"
                                    checked={availabilitySettings.target === 'all'}
                                    onChange={(e) => {
                                        setAvailabilitySettings({
                                            ...availabilitySettings,
                                            target: e.target.value
                                        });
                                        setSelectedStudents([]);
                                    }}
                                    className="mr-2"
                                />
                                All Students
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="specific"
                                    checked={availabilitySettings.target === 'specific'}
                                    onChange={(e) => setAvailabilitySettings({
                                        ...availabilitySettings,
                                        target: e.target.value
                                    })}
                                    className="mr-2"
                                />
                                Specific Students
                            </label>
                        </div>
                    </div>

                    {availabilitySettings.target === 'specific' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Students
                            </label>
                            {loadingStudents ? (
                                <div className="text-center py-4">
                                    <span className="text-gray-500">Loading students...</span>
                                </div>
                            ) : (
                                <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                                    {availableStudents.length > 0 && (
                                        <div className="p-2 border-b border-gray-200 bg-gray-50">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.length === availableStudents.length && availableStudents.length > 0}
                                                    onChange={handleSelectAllStudents}
                                                    className="mr-2"
                                                />
                                                <span className="font-medium">Select All ({availableStudents.length})</span>
                                            </label>
                                        </div>
                                    )}
                                    {availableStudents.map(student => (
                                        <div key={student.id} className="p-2 border-b border-gray-100 last:border-b-0">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => handleStudentSelection(student.id)}
                                                    className="mr-2"
                                                />
                                                <div>
                                                    <span className="font-medium">{student.firstName} {student.lastName}</span>
                                                    <br />
                                                    <span className="text-sm text-gray-500">{student.email}</span>
                                                    {student.studentId && (
                                                        <span className="text-sm text-gray-500"> - {student.studentId}</span>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                    {availableStudents.length === 0 && !loadingStudents && (
                                        <div className="p-4 text-center text-gray-500">
                                            No students available
                                        </div>
                                    )}
                                </div>
                            )}
                            {availabilitySettings.target === 'specific' && selectedStudents.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedStudents.length} student(s) selected
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => {
                                setShowAvailabilityModal(false);
                                setSelectedStudents([]);
                                setAvailableStudents([]);
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAvailability}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : selectedQuiz?.isAvailable ? 'Update Availability' : 'Make Available'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const EditModuleModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Edit Module</h3>
                    <button
                        onClick={() => {
                            setShowEditModule(false);
                            setEditingModule(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Module Name *
                        </label>
                        <input
                            type="text"
                            value={editModuleForm.name}
                            onChange={(e) => setEditModuleForm({
                                ...editModuleForm,
                                name: e.target.value
                            })}
                            placeholder="Enter module name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={editModuleForm.description}
                            onChange={(e) => setEditModuleForm({
                                ...editModuleForm,
                                description: e.target.value
                            })}
                            placeholder="Enter module description"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={editModuleForm.status}
                            onChange={(e) => setEditModuleForm({
                                ...editModuleForm,
                                status: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => {
                                setShowEditModule(false);
                                setEditingModule(null);
                            }}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateModule}
                            disabled={loading || !editModuleForm.name.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Module'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <X className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-700">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="ml-auto text-red-500 hover:text-red-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Processing...</span>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Modules</h2>
                    <p className="text-gray-600">Manage your course modules and create quizzes</p>
                </div>
                <button
                    onClick={() => setShowAddModule(true)}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                </button>
            </div>
            {showAddModule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add New Module</h3>
                        <input
                            type="text"
                            value={newModuleName}
                            onChange={(e) => setNewModuleName(e.target.value)}
                            placeholder="Enter module name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                            autoFocus
                            disabled={loading}
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAddModule(false)}
                                disabled={loading}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddModule}
                                disabled={loading || !newModuleName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Module'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showEditModule && <EditModuleModal />}
            {showAvailabilityModal && <AvailabilityModal />}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <div key={module.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center flex-1">
                                <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                                    {module.description && (
                                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                    )}
                                    <div className="flex items-center mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${module.status === 'active' ? 'bg-green-100 text-green-800' :
                                            module.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {module.status || 'active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleEditModule(module)}
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Edit Module"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteModule(module.id)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete Module"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {module.quizzes?.length || 0} quiz(es) created
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setSelectedModule(module);
                                    setActiveView('ai-quiz');
                                }}
                                className="w-full flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
                            >
                                <Brain className="h-4 w-4 mr-2" />
                                Generate Quiz using AI
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedModule(module);
                                    setActiveView('manual-quiz');
                                }}
                                className="w-full flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                            >
                                <FileUp className="h-4 w-4 mr-2" />
                                Manually Add Quiz
                            </button>
                        </div>
                        {module.quizzes && module.quizzes.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Quizzes:</h4>
                                <div className="space-y-3">
                                    {module.quizzes.map((quiz) => {
                                        const availabilityStatus = formatAvailabilityStatus(quiz);
                                        const questionCount = quiz.question_count || quiz.questions?.length || 0;

                                        return (
                                            <div key={quiz.id} className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                                                        </p>
                                                        {availabilityStatus && (
                                                            <div className={`text-xs mt-1 ${availabilityStatus.status === 'active' ? 'text-green-600' :
                                                                availabilityStatus.status === 'scheduled' ? 'text-blue-600' :
                                                                    availabilityStatus.status === 'ended' ? 'text-gray-600' :
                                                                        'text-orange-600'
                                                                }`}>
                                                                <Clock className="h-3 w-3 inline mr-1" />
                                                                {availabilityStatus.text}
                                                                {availabilityStatus.studentCount > 0 && (
                                                                    <span className="ml-2">
                                                                        <Users className="h-3 w-3 inline mr-1" />
                                                                        {availabilityStatus.studentCount} student(s)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {quiz.isAvailable && !availabilityStatus && (
                                                            <div className="text-xs mt-1 text-blue-600">
                                                                <Settings className="h-3 w-3 inline mr-1" />
                                                                Availability configured
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => handleEditQuiz(quiz, module.id)}
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="Edit Quiz"
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </button>
                                                        {quiz.isAvailable && (
                                                            <CheckCircle className="h-4 w-4 text-green-500" title="Availability configured" />
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleMakeAvailable(quiz, module.id)}
                                                    className={`w-full mt-2 flex items-center justify-center px-3 py-1.5 text-sm rounded hover:opacity-80 transition ${quiz.isAvailable
                                                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        }`}
                                                >
                                                    <Settings className="h-3 w-3 mr-1" />
                                                    {quiz.isAvailable ? 'Edit Availability' : 'Make Available'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {modules.length === 0 && (
                <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                    <p className="text-gray-600 mb-4">Create your first module to start adding quizzes</p>
                    <button
                        onClick={() => setShowAddModule(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add First Module
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyModules;
