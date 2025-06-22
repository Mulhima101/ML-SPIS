import React, { useState } from 'react';
import { ArrowLeft, Save, Edit3, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const QuizEditor = ({ quiz, module, onSave, onBack, isEditing = false }) => {
    // Ensure quiz has proper structure with default values
    const initializeQuiz = (quiz) => {
        if (!quiz) {
            return {
                title: '',
                description: '',
                questions: []
            };
        }

        return {
            ...quiz,
            title: quiz.title || '',
            description: quiz.description || '',
            questions: Array.isArray(quiz.questions) ? quiz.questions : []
        };
    };

    const [editedQuiz, setEditedQuiz] = useState(initializeQuiz(quiz));
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [errors, setErrors] = useState({});

    const validateQuiz = () => {
        const newErrors = {};

        if (!editedQuiz.title.trim()) {
            newErrors.title = 'Quiz title is required';
        }

        if (!editedQuiz.questions || editedQuiz.questions.length === 0) {
            newErrors.questions = 'At least one question is required';
            setErrors(newErrors);
            return false;
        }

        editedQuiz.questions.forEach((question, index) => {
            if (!question.question || !question.question.trim()) {
                newErrors[`question_${index}`] = 'Question text is required';
            }
            if (!question.options || !Array.isArray(question.options)) {
                newErrors[`options_${index}`] = 'Question options are required';
            } else {
                if (question.options.some(opt => !opt || !opt.trim())) {
                    newErrors[`options_${index}`] = 'All options must have text';
                }
                if (question.options.length < 2) {
                    newErrors[`options_${index}`] = 'At least 2 options are required';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...editedQuiz.questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setEditedQuiz({ ...editedQuiz, questions: updatedQuestions });
    };

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        const updatedQuestions = [...editedQuiz.questions];
        updatedQuestions[questionIndex].options[optionIndex] = value;
        setEditedQuiz({ ...editedQuiz, questions: updatedQuestions });
    };

    const addOption = (questionIndex) => {
        const updatedQuestions = [...editedQuiz.questions];
        updatedQuestions[questionIndex].options.push('');
        setEditedQuiz({ ...editedQuiz, questions: updatedQuestions });
    };

    const removeOption = (questionIndex, optionIndex) => {
        const updatedQuestions = [...editedQuiz.questions];
        const question = updatedQuestions[questionIndex];

        if (question.options.length <= 2) return; // Minimum 2 options

        question.options.splice(optionIndex, 1);

        // Adjust correct answer if necessary
        if (question.correctAnswer >= optionIndex) {
            question.correctAnswer = Math.max(0, question.correctAnswer - 1);
        }

        setEditedQuiz({ ...editedQuiz, questions: updatedQuestions });
    };

    const addQuestion = () => {
        const newQuestion = {
            question: '',
            options: ['', ''],
            correctAnswer: 0,
            explanation: ''
        };
        setEditedQuiz({
            ...editedQuiz,
            questions: [...(editedQuiz.questions || []), newQuestion]
        });
    };

    const removeQuestion = (index) => {
        const updatedQuestions = editedQuiz.questions.filter((_, i) => i !== index);
        setEditedQuiz({ ...editedQuiz, questions: updatedQuestions });
    };

    const handleSave = () => {
        if (validateQuiz()) {
            onSave(editedQuiz);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Edit Quiz' : 'Create Quiz'}
                        </h2>
                        <p className="text-gray-600">Module: {module?.name || 'Unknown Module'}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Quiz' : 'Save Quiz'}
                </button>
            </div>

            {/* Quiz Title */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Title *
                    </label>
                    <input
                        type="text"
                        value={editedQuiz.title}
                        onChange={(e) => setEditedQuiz({ ...editedQuiz, title: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                    {errors.title && (
                        <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Description (Optional)
                    </label>
                    <textarea
                        value={editedQuiz.description}
                        onChange={(e) => setEditedQuiz({ ...editedQuiz, description: e.target.value })}
                        rows={2}
                        placeholder="Enter quiz description..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Questions */}
            {editedQuiz.questions && editedQuiz.questions.length > 0 ? (
                <div className="space-y-6">
                    {editedQuiz.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Question {questionIndex + 1}
                                </h3>
                                <button
                                    onClick={() => removeQuestion(questionIndex)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Question Text */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Question Text *
                                </label>
                                <textarea
                                    value={question.question || ''}
                                    onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[`question_${questionIndex}`] ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                                {errors[`question_${questionIndex}`] && (
                                    <p className="text-red-600 text-sm mt-1">{errors[`question_${questionIndex}`]}</p>
                                )}
                            </div>

                            {/* Options */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Answer Options *
                                </label>
                                <div className="space-y-2">
                                    {(question.options || []).map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name={`correct_${questionIndex}`}
                                                checked={question.correctAnswer === optionIndex}
                                                onChange={() => handleQuestionChange(questionIndex, 'correctAnswer', optionIndex)}
                                                className="text-blue-600"
                                            />
                                            <input
                                                type="text"
                                                value={option || ''}
                                                onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            {(question.options || []).length > 2 && (
                                                <button
                                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {errors[`options_${questionIndex}`] && (
                                    <p className="text-red-600 text-sm mt-1">{errors[`options_${questionIndex}`]}</p>
                                )}
                                {(question.options || []).length < 5 && (
                                    <button
                                        onClick={() => addOption(questionIndex)}
                                        className="mt-2 flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Option
                                    </button>
                                )}
                            </div>

                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    value={question.explanation || ''}
                                    onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                                    rows={2}
                                    placeholder="Explain why this answer is correct..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600 mb-4">No questions added yet. Add your first question to get started.</p>
                </div>
            )}

            {/* Add Question Button */}
            <div className="text-center">
                <button
                    onClick={addQuestion}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mx-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                </button>
            </div>

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                    </div>
                    <ul className="text-sm text-red-700 mt-2 ml-7">
                        {Object.values(errors).map((error, index) => (
                            <li key={index}>• {error}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default QuizEditor;
