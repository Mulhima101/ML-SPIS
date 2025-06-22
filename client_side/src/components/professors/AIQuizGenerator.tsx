import React, { useState } from 'react';
import { ArrowLeft, Brain, Loader2 } from 'lucide-react';
import { generateQuizWithAI } from '../../services/openaiService';

const AIQuizGenerator = ({ module, onQuizGenerated, onBack }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        topic: '',
        numQuestions: 5,
        numOptions: 4,
        difficulty: 'medium'
    });
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!formData.topic.trim()) {
            setError('Please enter a topic for the quiz');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const quiz = await generateQuizWithAI({
                topic: formData.topic,
                numQuestions: formData.numQuestions,
                numOptions: formData.numOptions,
                difficulty: formData.difficulty,
                module: module.name
            });

            onQuizGenerated({
                title: `${formData.topic} Quiz`,
                topic: formData.topic,
                difficulty: formData.difficulty,
                questions: quiz.questions,
                createdAt: new Date().toISOString(),
                generatedByAI: true
            });
        } catch (error) {
            setError(error.message || 'Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Modules
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Quiz Generator</h2>
                    <p className="text-gray-600">Module: {module.name}</p>
                </div>
            </div>

            {/* Generator Form */}
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <div className="flex items-center mb-6">
                    <Brain className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Generate Quiz with AI</h3>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quiz Topic *
                        </label>
                        <input
                            type="text"
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            placeholder="e.g., Software Development Life Cycle, Object-Oriented Programming"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Be specific about the topic for better question generation
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Questions
                            </label>
                            <select
                                value={formData.numQuestions}
                                onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={5}>5 Questions</option>
                                <option value={10}>10 Questions</option>
                                <option value={15}>15 Questions</option>
                                <option value={20}>20 Questions</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Answer Options per Question
                            </label>
                            <select
                                value={formData.numOptions}
                                onChange={(e) => setFormData({ ...formData, numOptions: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={2}>2 Options</option>
                                <option value={3}>3 Options</option>
                                <option value={4}>4 Options</option>
                                <option value={5}>5 Options</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty Level
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !formData.topic.trim()}
                            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating Quiz...
                                </>
                            ) : (
                                <>
                                    <Brain className="h-4 w-4 mr-2" />
                                    Generate Quiz
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-800 mb-2">How AI Quiz Generation Works</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                    <li>• AI analyzes your topic and generates relevant questions</li>
                    <li>• Questions are created with multiple choice answers</li>
                    <li>• Correct answers are automatically marked</li>
                    <li>• You can edit all questions and answers before saving</li>
                </ul>
            </div>
        </div>
    );
};

export default AIQuizGenerator;
