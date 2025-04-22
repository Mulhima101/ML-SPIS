import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StHeader from '../../components/students/stHeader';
import axios from 'axios';

interface TopicGuidance {
  topic: string;
  score: number;
  status: string; // 'low', 'normal', or 'high'
  recommendations: {
    type: string;
    title: string;
    description: string;
    link?: string;
  }[];
}

interface LearningPath {
  level: string;
  description: string;
  milestones: {
    title: string;
    description: string;
    isCompleted: boolean;
  }[];
}

interface GuidanceData {
  topicGuidance: TopicGuidance[];
  learningPath: LearningPath;
}

const GuidancePage: React.FC = () => {
  const [guidanceData, setGuidanceData] = useState<GuidanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guidance' | 'learningPath'>('guidance');
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
        
        // Get guidance data from API
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:5000/api/students/${user.id}/guidance`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setGuidanceData(response.data);
        } catch (apiError: any) {
          console.error('API Error:', apiError);
          setError('Failed to load guidance data from server. Using default guidance.');
          
          // Use mock data as fallback
          setGuidanceData({
            topicGuidance: [
              {
                topic: 'SDLC',
                score: 0.45,
                status: 'low',
                recommendations: [
                  {
                    type: 'resource',
                    title: 'Fundamentals',
                    description: 'Review the basic concepts of SDLC to build a solid foundation.',
                    link: '/resources/fundamentals'
                  },
                  {
                    type: 'practice',
                    title: 'Basic Practice',
                    description: 'Complete basic exercises to reinforce your understanding of SDLC.',
                    link: '/practice/basic'
                  }
                ]
              },
              {
                topic: 'Agile',
                score: 0.6,
                status: 'normal',
                recommendations: [
                  {
                    type: 'resource',
                    title: 'Advanced Concepts',
                    description: 'Explore more advanced concepts in Agile to deepen your knowledge.',
                    link: '/resources/advanced'
                  }
                ]
              },
              {
                topic: 'OSI Model',
                score: 0.8,
                status: 'high',
                recommendations: [
                  {
                    type: 'goal',
                    title: 'Knowledge Sharing',
                    description: 'Consider sharing your knowledge of the OSI Model with peers.',
                    link: '/community'
                  }
                ]
              }
            ],
            learningPath: {
              level: 'Normal',
              description: 'Your current knowledge level is Normal. This personalized learning path will help you strengthen your weak areas and advance to a High knowledge level.',
              milestones: [
                {
                  title: 'Strengthen Knowledge',
                  description: 'Aim to improve your scores in all topics to at least 70%.',
                  isCompleted: false
                },
                {
                  title: 'Apply Concepts',
                  description: 'Work on applying theoretical knowledge to practical problems.',
                  isCompleted: false
                },
                {
                  title: 'Advanced Topics',
                  description: 'Begin exploring more advanced topics and concepts.',
                  isCompleted: false
                }
              ]
            }
          });
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
  
  const getStatusColor = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'low':
        return 'red-100 border-red-200 text-red-700';
      case 'normal':
        return 'blue-100 border-blue-200 text-blue-700';
      case 'high':
        return 'green-100 border-green-200 text-green-700';
      default:
        return 'gray-100 border-gray-200 text-gray-700';
    }
  };
  
  const getRecommendationIcon = (type: string): string => {
    switch(type) {
      case 'resource':
        return '📚'; // Book icon
      case 'practice':
        return '⚙️'; // Gear icon
      case 'goal':
        return '🎯'; // Target icon
      case 'prerequisite':
        return '🔑'; // Key icon
      default:
        return '📝'; // Note icon
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
  
  if (!guidanceData) {
    return (
      <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
        <div className="error-message">No guidance data available.</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--primary-background-color)]">
      <StHeader />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Personalized Guidance</h1>
        
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'guidance' 
                ? 'border-b-2 border-amber-500 text-amber-600' 
                : 'text-gray-600 hover:text-amber-500'
            }`}
            onClick={() => setActiveTab('guidance')}
          >
            Topic Guidance
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'learningPath' 
                ? 'border-b-2 border-amber-500 text-amber-600' 
                : 'text-gray-600 hover:text-amber-500'
            }`}
            onClick={() => setActiveTab('learningPath')}
          >
            Learning Path
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          {activeTab === 'guidance' ? (
            <div>
              <h2 className="text-xl font-semibold mb-6">Topic-Based Guidance</h2>
              <p className="text-gray-700 mb-6">
                Based on your quiz performance, we've identified areas where you can focus to improve your skills.
                The topics below are ordered by priority, with the ones needing the most attention listed first.
              </p>
              
              <div className="space-y-6">
                {guidanceData.topicGuidance.map((topic, index) => (
                  <div 
                    key={index}
                    className={`border rounded-lg ${getStatusColor(topic.status)}`}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">{topic.topic}</h3>
                        <span className="px-3 py-1 rounded-full bg-opacity-20 font-medium text-sm">
                          Score: {(topic.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    {topic.recommendations.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Recommendations</h4>
                        <div className="space-y-3">
                          {topic.recommendations.map((rec, recIndex) => (
                            <div key={recIndex} className="flex gap-3 p-3 bg-white rounded-lg shadow-sm">
                              <div className="text-2xl">
                                {getRecommendationIcon(rec.type)}
                              </div>
                              <div>
                                <h5 className="font-medium mb-1">{rec.title}</h5>
                                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                                {rec.link && (
                                  <Link 
                                    to={rec.link}
                                    className="text-amber-600 text-sm font-medium hover:underline"
                                  >
                                    Learn more →
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-2">Learning Path</h2>
              <p className="text-sm text-gray-500 mb-4">
                Your current knowledge level: <span className="font-medium">{guidanceData.learningPath.level}</span>
              </p>
              <p className="text-gray-700 mb-6">{guidanceData.learningPath.description}</p>
              
              <h3 className="text-lg font-semibold mb-4">Milestones</h3>
              <div className="space-y-4">
                {guidanceData.learningPath.milestones.map((milestone, index) => (
                  <div 
                    key={index}
                    className={`border rounded-lg p-4 ${
                      milestone.isCompleted ? 'bg-green-50 border-green-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                        milestone.isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                      </div>
                      <div className="ml-auto">
                        {milestone.isCompleted ? (
                          <span className="text-green-600 text-sm font-medium">Completed</span>
                        ) : (
                          <span className="text-amber-600 text-sm font-medium">In Progress</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link 
                  to="/students/quizzes" 
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                  Take a Quiz to Progress
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidancePage;