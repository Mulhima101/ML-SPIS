// client_side/src/pages/students/GuidancePage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StHeader from '../../components/students/stHeader';
import { studentService } from '../../services/api';

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
  
  useEffect(() => {
    const fetchGuidanceData = async () => {
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('studentUser') || '{}');
        const studentId = userData.id;
        
        if (studentId) {
          // Try to get data from API
          try {
            const response = await studentService.getGuidance(studentId);
            
            if (response.data && response.data.topicGuidance) {
              setTopicGuidance(response.data.topicGuidance);
            }
            
            if (response.data && response.data.learningPath) {
              setLearningPath(response.data.learningPath);
            }
          } catch (apiError) {
            console.error('API Error:', apiError);
            // Fallback to mock data on API error
            useMockData();
          }
        } else {
          // Use mock data if no user ID found
          useMockData();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching guidance data:', error);
        useMockData();
        setLoading(false);
      }
    };
    
    // Function to use mock data as fallback
    const useMockData = () => {
      // This is your existing mock data
      const mockTopicGuidance: TopicGuidance[] = [
        {
          topic: 'leo venenatis placerat',
          score: 0.8,
          status: 'strong',
          recommendations: [
            {
              type: 'resource',
              title: 'Advanced Concepts',
              description: 'Learn about advanced concepts in this area.',
              link: '/resources/advanced'
            }
          ]
        },
        {
          topic: 'Aliquam vel lacus volutpat',
          score: 0.65,
          status: 'moderate',
          recommendations: [
            {
              type: 'practice',
              title: 'Case Studies',
              description: 'Review real-world case studies.',
              link: '/practice/cases'
            }
          ]
        },
        {
          topic: 'non consectetur',
          score: 0.45,
          status: 'weak',
          recommendations: [
            {
              type: 'resource',
              title: 'Fundamentals',
              description: 'Back-to-basics approach on understanding the core concepts.',
              link: '/resources/fundamentals'
            }
          ]
        },
        {
          topic: 'Vivamus bibendum',
          score: 0.72,
          status: 'moderate',
          recommendations: []
        },
        {
          topic: 'Suspendisse congue',
          score: 0.38,
          status: 'weak',
          recommendations: []
        },
        {
          topic: 'Nibh vitae laoreet pharetra',
          score: 0.85,
          status: 'strong',
          recommendations: []
        },
        {
          topic: 'Sed finibus dignissim',
          score: 0.42,
          status: 'weak',
          recommendations: []
        },
        {
          topic: 'Cras bibendum felis',
          score: 0.68,
          status: 'moderate',
          recommendations: []
        },
        {
          topic: 'vitae laoreet pharetra',
          score: 0.78,
          status: 'moderate',
          recommendations: []
        },
        {
          topic: 'Donec sollicitudin purus',
          score: 0.35,
          status: 'weak',
          recommendations: []
        }
      ];
      
      const mockLearningPath: LearningPath = {
        level: 'Normal',
        description: 'Your current knowledge level is Normal. This personalized learning path will help you strengthen your weak areas and advance to a High knowledge level.',
        milestones: [
          {
            title: 'Master Fundamentals',
            description: 'Focus on understanding the purpose and function of each concept.',
            isCompleted: false
          },
          {
            title: 'Improve Methodology Understanding',
            description: 'Learn more about roles and practical applications.',
            isCompleted: false
          }
        ]
      };
      
      setTopicGuidance(mockTopicGuidance);
      setLearningPath(mockLearningPath);
    };
    
    fetchGuidanceData();
  }, []);
  
  // Keep the rest of your component unchanged
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faeec9] flex justify-center items-center">
        <div className="loading">Loading personalized guidance...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#faeec9]">
      <StHeader />
      
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">Guidance</h2>
          
          <p className="text-gray-700 mb-6">
            Aliquam nulla diam, semper eu libero eget, dictum interdum mi. Vestibulum fringilla luctus hendrerit. 
            Fusce auctor mi in elit tempor pretium et ac augue. Duis vitae mattis arcu, vel gravida dolor.
          </p>
          
          <p className="text-gray-700 mb-6">
            Nunc pulvinar mollis erat. Sed nec sapien nec ligula commodo auctor a id massa. Fusce vitae justo a 
            turpis tincidunt tristique. In et nisi rutrum, sodales lectus sed, porttitor quam. Proin vitae eros eu purus 
            hendrerit facilisis id vitae lacus. Etiam vehicula viverra venenatis. Nam sed orci tempus, molestie mi 
            eget, volutpat libero. Sed finibus sagittis libero ac vehicula. Orci varius natoque penatibus et magnis 
            dis parturient montes, nascetur ridiculus mus. Integer eleifend ligula in metus ultrices maximus.
          </p>
          
          <p className="text-gray-700 mb-6">
            Quisque id felis et mauris porta commodo non ac purus. Maecenas turpis nibh, faucibus ac convallis a, 
            aliquet sit amet quam. Curabitur eu felis tempus urna laoreet vehicula nec nec metus. Duis ultricies 
            commodo suscipit. Duis suscipit diam a lobortis porttitor. Etiam non magna euismod, dictum elit vel, 
            luctus dolor.
          </p>
          
          <p className="text-gray-700">
            Quisque tristique molestie arcu. Fusce tincidunt dictum eros, tempus fermentum nunc ultrices eu. 
            Proin in lacus eleifend, pharetra ipsum eget, lacinia elit. Class aptent taciti sociosqu ad litora torquent 
            per conubia nostra, per inceptos himenaeos. Suspendisse potenti. Curabitur ac purus ut nulla 
            bibendum efficitur. Morbi posuere, mauris id vestibulum malesuada, nisi velit ornare risus, et 
            vestibulum elit libero non eros. Pellentesque habitant morbi tristique senectus et netus et malesuada 
            fames ac turpis egestas. Nulla lacinia porttitor sem, eu rutrum ante luctus sit amet.
          </p>
        </div>
        
        <div className="bg-blue-600 rounded-xl p-6 shadow-sm text-white">
          <h2 className="text-xl font-bold mb-6">Targets</h2>
          
          <div className="space-y-3">
            {topicGuidance.map(topic => (
              <div 
                key={topic.topic}
                className={`p-3 rounded-md ${
                  topic.status === 'strong' 
                    ? 'bg-green-500' 
                    : topic.status === 'moderate'
                      ? 'bg-blue-400'
                      : 'bg-red-400'
                }`}
              >
                {topic.topic}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidancePage;