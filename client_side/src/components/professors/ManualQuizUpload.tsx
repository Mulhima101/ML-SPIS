import React, { useState } from 'react';
import { ArrowLeft, FileUp, Download, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

const ManualQuizUpload = ({ module, onQuizGenerated, onBack }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState('');
    const [quizTitle, setQuizTitle] = useState('');

    const csvTemplate = `question,option_a,option_b,option_c,option_d,correct_answer,explanation
"What is the first phase of SDLC?","Planning","Design","Implementation","Testing","A","Planning is the initial phase where project scope and requirements are defined"
"Which methodology emphasizes iterative development?","Waterfall","Agile","Spiral","V-Model","B","Agile methodology focuses on iterative and incremental development"
"What does API stand for?","Application Programming Interface","Automated Program Integration","Advanced Programming Instructions","Application Process Integration","A","API stands for Application Programming Interface"`;

    const downloadTemplate = () => {
        const blob = new Blob([csvTemplate], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        setCsvFile(file);
        setError('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError('Error parsing CSV: ' + results.errors[0].message);
                    return;
                }

                // Validate CSV structure
                const requiredColumns = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
                const csvColumns = Object.keys(results.data[0] || {});
                const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));

                if (missingColumns.length > 0) {
                    setError(`Missing required columns: ${missingColumns.join(', ')}`);
                    return;
                }

                // Transform data to quiz format
                const questions = results.data.map((row, index) => {
                    const options = [row.option_a, row.option_b, row.option_c, row.option_d].filter(opt => opt && opt.trim());
                    const correctAnswerLetter = row.correct_answer.toUpperCase();
                    const correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswerLetter);

                    if (correctAnswerIndex === -1 || correctAnswerIndex >= options.length) {
                        throw new Error(`Invalid correct answer "${row.correct_answer}" for question ${index + 1}`);
                    }

                    return {
                        question: row.question,
                        options: options,
                        correctAnswer: correctAnswerIndex,
                        explanation: row.explanation || ''
                    };
                });

                setParsedData(questions);
            },
            error: (error) => {
                setError('Error reading file: ' + error.message);
            }
        });
    };

    const handleProceed = () => {
        if (!quizTitle.trim()) {
            setError('Please enter a quiz title');
            return;
        }

        if (!parsedData || parsedData.length === 0) {
            setError('No valid questions found');
            return;
        }

        onQuizGenerated({
            title: quizTitle,
            questions: parsedData,
            createdAt: new Date().toISOString(),
            generatedByAI: false
        });
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
                    <h2 className="text-2xl font-bold text-gray-900">Manual Quiz Upload</h2>
                    <p className="text-gray-600">Module: {module.name}</p>
                </div>
            </div>

            {/* CSV Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Required</h4>
                        <p className="text-sm text-blue-700 mb-3">
                            Your CSV file must include the following columns: question, option_a, option_b, option_c, option_d, correct_answer, explanation
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Download Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <div className="flex items-center mb-6">
                    <FileUp className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Upload Quiz CSV</h3>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quiz Title *
                        </label>
                        <input
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="Enter quiz title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload CSV File *
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Upload a CSV file with your quiz questions and answers
                        </p>
                    </div>

                    {parsedData && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-800 mb-2">File Parsed Successfully</h4>
                            <p className="text-sm text-green-700">
                                Found {parsedData.length} questions in the uploaded file
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleProceed}
                            disabled={!parsedData || !quizTitle.trim()}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Proceed to Edit Questions
                        </button>
                    </div>
                </div>
            </div>

            {/* CSV Format Example */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">CSV Format Example:</h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                    {`question,option_a,option_b,option_c,option_d,correct_answer,explanation
"What is SDLC?","Software Development Life Cycle","System Design Life Cycle","Software Design Logic Cycle","System Development Logic Cycle","A","SDLC stands for Software Development Life Cycle"`}
                </pre>
            </div>
        </div>
    );
};

export default ManualQuizUpload;
