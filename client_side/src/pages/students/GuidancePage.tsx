import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StHeader from '../../components/students/stHeader';
import axios from 'axios';
import {
  collectWrongAnswers,
  generateAIGuidance,
  saveGuidanceToStorage,
  loadGuidanceFromStorage
} from '../../services/guidanceService';

interface AIGuidanceTopic {
  topic: string;
  weaknesses: string[];
  keyConcepts: string[];
  learningStrategies: string[];
  websiteReferences: {
    title: string;
    url: string;
    description: string;
  }[];
  youtubeVideos: {
    title: string;
    searchTerm: string;
    description: string;
  }[];
  practiceRecommendations: string[];
}

interface AIGuidanceData {
  topics: AIGuidanceTopic[];
  generalAdvice: string;
}

const GuidancePage: React.FC = () => {
  const [aiGuidance, setAiGuidance] = useState<AIGuidanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGuidanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError('User not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Load existing AI guidance from storage
        const storedGuidance = loadGuidanceFromStorage();
        if (storedGuidance) {
          setAiGuidance(storedGuidance);
        }

        // Generate AI guidance if not already cached
        if (!storedGuidance) {
          await generatePersonalizedGuidance();
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching guidance data:', error);
        setError('Failed to load guidance data. Please try again.');
        setLoading(false);
      }
    };

    fetchGuidanceData();
  }, [user]);

  const generatePersonalizedGuidance = async () => {
    if (!user) return;

    try {
      setAiLoading(true);

      // Collect wrong answers
      const wrongAnswers = await collectWrongAnswers(user.id);
      console.log('Collected wrong answers:', wrongAnswers);

      if (wrongAnswers.length > 0) {
        // Generate AI guidance
        const guidance = await generateAIGuidance(wrongAnswers);

        if (guidance) {
          setAiGuidance(guidance);
          saveGuidanceToStorage(guidance);
        } else {
          console.warn('AI guidance generation returned null');
        }
      } else {
        console.log('No wrong answers found for guidance generation');
      }
    } catch (error) {
      console.error('Error generating personalized guidance:', error);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
        <div className="loading">Loading personalized guidance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
        <div className="error-message p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
          <div className="mt-4">
            <Link to="/students/login" className="px-4 py-2 bg-amber-600 text-white rounded-lg">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--primary-background-color)]">
      <StHeader />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">AI-Powered Learning Guidance</h1>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div>
            <h2 className="text-xl font-semibold mb-6">AI-Powered Learning Guidance</h2>

            {aiLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your quiz performance...</p>
              </div>
            ) : aiGuidance ? (
              <div>
                <p className="text-gray-700 mb-6">
                  Based on your incorrectly answered questions from recent quizzes, here's personalized guidance to help you improve:
                </p>

                {aiGuidance.generalAdvice && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">📋 General Learning Advice</h3>
                    <p className="text-blue-700">{aiGuidance.generalAdvice}</p>
                  </div>
                )}

                <div className="space-y-8">
                  {aiGuidance.topics.map((topic, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <h3 className="text-lg font-semibold mb-4 text-red-600 flex items-center">
                        🎯 {topic.topic}
                        <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                          Needs Attention
                        </span>
                      </h3>

                      {topic.weaknesses.length > 0 && (
                        <div className="mb-4 bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            ⚠️ Areas to Focus On:
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {topic.weaknesses.map((weakness, idx) => (
                              <li key={idx}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {topic.keyConcepts.length > 0 && (
                        <div className="mb-4 bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            🔑 Key Concepts to Review:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {topic.keyConcepts.map((concept, idx) => (
                              <span key={idx} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {topic.learningStrategies.length > 0 && (
                        <div className="mb-4 bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            📚 Learning Strategies:
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 space-y-2">
                            {topic.learningStrategies.map((strategy, idx) => (
                              <li key={idx} className="leading-relaxed">{strategy}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {topic.websiteReferences.length > 0 && (
                        <div className="mb-4 bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            🌐 Recommended Online Resources:
                          </h4>
                          <div className="space-y-3">
                            {topic.websiteReferences.map((ref, idx) => (
                              <div key={idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                <h5 className="font-semibold text-blue-700 mb-1">{ref.title}</h5>
                                <p className="text-sm text-gray-600 mb-2">{ref.description}</p>
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-800 hover:underline"
                                >
                                  🔗 Visit Resource
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {topic.youtubeVideos.length > 0 && (
                        <div className="mb-4 bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            📺 Video Learning Resources:
                          </h4>
                          <div className="space-y-3">
                            {topic.youtubeVideos.map((video, idx) => (
                              <div key={idx} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                                <h5 className="font-semibold text-red-700 mb-1">{video.title}</h5>
                                <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchTerm)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-red-600 text-sm font-medium hover:text-red-800 hover:underline"
                                >
                                  🎥 Search: "{video.searchTerm}"
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {topic.practiceRecommendations.length > 0 && (
                        <div className="mb-4 bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            ⚡ Practice Recommendations:
                          </h4>
                          <ul className="list-disc list-inside text-gray-700 space-y-2">
                            {topic.practiceRecommendations.map((practice, idx) => (
                              <li key={idx} className="leading-relaxed">{practice}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">💡 Next Steps</h3>
                  <p className="text-green-700 mb-4">
                    Focus on one topic at a time, starting with the areas where you lost the most points.
                    Use the provided resources to study, then take practice quizzes to test your improvement.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to="/students/quizzes"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Practice with Quizzes
                    </Link>
                    <button
                      onClick={generatePersonalizedGuidance}
                      disabled={aiLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {aiLoading ? 'Refreshing...' : 'Refresh Guidance'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <span className="text-6xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No AI Guidance Available Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Take some quizzes to get personalized AI-powered recommendations based on your performance and areas for improvement.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    to="/students/quizzes"
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
                  >
                    Take Your First Quiz
                  </Link>
                  <button
                    onClick={generatePersonalizedGuidance}
                    disabled={aiLoading}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:opacity-50"
                  >
                    {aiLoading ? 'Checking...' : 'Check for Guidance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidancePage;