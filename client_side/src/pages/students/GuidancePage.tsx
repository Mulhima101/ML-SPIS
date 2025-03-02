import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/guidance.css';

interface TopicGuidance {
  topic: string;
  score: number;
  status: 'weak' | 'moderate' | 'strong';
  recommendations: {
    type: 'resource' | 'practice' | 'goal';
    title: string;
    description: string;
    link?: string;
  }[];
}

interface LearningPath {
  level: 'Low' | 'Normal' | 'High';
  description: string;
  milestones: {
    title: string;
    description: string;
    isCompleted: boolean;
  }[];
}

const GuidancePage: React.FC = () => {
  const [topicGuidance, setTopicGuidance] = useState<TopicGuidance[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'topics' | 'path'>('topics');
  
  useEffect(() => {
    // Mock fetching guidance data
    const fetchGuidanceData = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockTopicGuidance: TopicGuidance[] = [
            {
              topic: 'SDLC',
              score: 0.8,
              status: 'strong',
              recommendations: [
                {
                  type: 'resource',
                  title: 'Advanced SDLC Concepts',
                  description: 'Learn about advanced concepts in the Software Development Life Cycle.',
                  link: '/resources/sdlc-advanced'
                },
                {
                  type: 'practice',
                  title: 'SDLC Case Studies',
                  description: 'Review real-world case studies applying SDLC methodologies.',
                  link: '/practice/sdlc-cases'
                },
                {
                  type: 'goal',
                  title: 'Maintain Strong Performance',
                  description: 'Continue excelling in this topic by exploring more advanced concepts.'
                }
              ]
            },
            {
              topic: 'Agile',
              score: 0.65,
              status: 'moderate',
              recommendations: [
                {
                  type: 'resource',
                  title: 'Agile Methodology Deep Dive',
                  description: 'Comprehensive guide to Agile frameworks and practices.',
                  link: '/resources/agile-deep-dive'
                },
                {
                  type: 'practice',
                  title: 'Scrum Simulation',
                  description: 'Interactive simulation of Scrum methodology in action.',
                  link: '/practice/scrum-simulation'
                },
                {
                  type: 'goal',
                  title: 'Improve to Advanced Level',
                  description: 'Focus on enhancing your knowledge of Agile ceremonies and roles.'
                }
              ]
            },
            {
              topic: 'OSI Model',
              score: 0.45,
              status: 'weak',
              recommendations: [
                {
                  type: 'resource',
                  title: 'OSI Model Fundamentals',
                  description: 'Back-to-basics approach on understanding the OSI layers.',
                  link: '/resources/osi-fundamentals'
                },
                {
                  type: 'practice',
                  title: 'OSI Layer Identification Quiz',
                  description: 'Practice identifying which OSI layer various protocols belong to.',
                  link: '/practice/osi-quiz'
                },
                {
                  type: 'goal',
                  title: 'Master the Basics',
                  description: 'Focus on understanding the purpose and function of each OSI layer.'
                }
              ]
            }
          ];
          
          const mockLearningPath: LearningPath = {
            level: 'Normal',
            description: 'Your current knowledge level is Normal. This personalized learning path will help you strengthen your weak areas and advance to a High knowledge level.',
            milestones: [
              {
                title: 'Master OSI Model Fundamentals',
                description: 'Focus on understanding the purpose and function of each layer in the OSI model.',
                isCompleted: false
              },
              {
                title: 'Improve Agile Methodology Understanding',
                description: 'Learn more about Agile ceremonies, roles, and practical applications.',
                isCompleted: false
              },
              {
                title: 'Apply SDLC in Projects',
                description: 'Use your strong understanding of SDLC in practical project scenarios.',
                isCompleted: true
              },
              {
                title: 'Complete Advanced Network Engineering Quiz',
                description: 'Test your improved knowledge with an advanced assessment.',
                isCompleted: false
              }
            ]
          };
          
          setTopicGuidance(mockTopicGuidance);
          setLearningPath(mockLearningPath);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching guidance data:', error);
        setLoading(false);
      }
    };
    
    fetchGuidanceData();
  }, []);
  
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'weak': return 'red';
      case 'moderate': return 'orange';
      case 'strong': return 'green';
      default: return 'gray';
    }
  };
  
  const getTypeIcon = (type: string): string => {
    switch(type) {
      case 'resource': return '📚';
      case 'practice': return '🏋️';
      case 'goal': return '🎯';
      default: return '📝';
    }
  };
  
  if (loading) {
    return <div className="loading">Loading personalized guidance...</div>;
  }
  
  return (
    <div className="guidance-container">
      <header className="guidance-header">
        <h1>Personalized Learning Guidance</h1>
        <div className="header-actions">
          <Link to="/students/dashboard" className="back-button">Back to Dashboard</Link>
        </div>
      </header>
      
      <div className="guidance-tabs">
        <button 
          className={`tab-button ${activeTab === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveTab('topics')}
        >
          Topic-Based Guidance
        </button>
        <button 
          className={`tab-button ${activeTab === 'path' ? 'active' : ''}`}
          onClick={() => setActiveTab('path')}
        >
          Learning Path
        </button>
      </div>
      
      <div className="guidance-content">
        {activeTab === 'topics' && (
          <div className="topic-guidance">
            <p className="guidance-intro">
              Based on your quiz performances, we've analyzed your strengths and areas for improvement across different topics.
              Below are personalized recommendations to help you enhance your knowledge in each area.
            </p>
            
            {topicGuidance.map(topic => (
              <div key={topic.topic} className="topic-card">
                <div className="topic-header">
                  <h2>{topic.topic}</h2>
                  <div 
                    className="topic-status"
                    style={{ color: getStatusColor(topic.status) }}
                  >
                    {topic.status.charAt(0).toUpperCase() + topic.status.slice(1)} 
                    ({(topic.score * 100).toFixed(0)}%)
                  </div>
                </div>
                
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ 
                      width: `${topic.score * 100}%`,
                      backgroundColor: getStatusColor(topic.status)
                    }}
                  ></div>
                </div>
                
                <div className="recommendations-list">
                  {topic.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-item">
                      <div className="recommendation-icon">{getTypeIcon(rec.type)}</div>
                      <div className="recommendation-content">
                        <h3>{rec.title}</h3>
                        <p>{rec.description}</p>
                        {rec.link && (
                          <Link to={rec.link} className="recommendation-link">
                            {rec.type === 'resource' ? 'View Resource' : 'Start Practice'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'path' && learningPath && (
          <div className="learning-path">
            <div className="path-header">
              <h2>Your Personalized Learning Path</h2>
              <div className="knowledge-level">
                Current Level: <span className="level-badge">{learningPath.level}</span>
              </div>
            </div>
            
            <p className="path-description">{learningPath.description}</p>
            
            <div className="milestones-container">
              {learningPath.milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`milestone-card ${milestone.isCompleted ? 'completed' : ''}`}
                >
                  <div className="milestone-number">{index + 1}</div>
                  <div className="milestone-content">
                    <h3>{milestone.title}</h3>
                    <p>{milestone.description}</p>
                  </div>
                  <div className="milestone-status">
                    {milestone.isCompleted ? '✓ Completed' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="path-actions">
              <Link to="/students/quiz/next-recommended" className="button primary">
                Take Recommended Quiz
              </Link>
              <button className="button">
                Download Learning Path
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidancePage;