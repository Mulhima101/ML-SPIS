import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/dashboard.css';

import StHeader from '../../components/students/stHeader';
import { getStudentQuizzes } from '../../services/quizService';
import { getStudentModulePerformance } from '../../services/studentService';
import { toIST } from '../../utils/dateUtils';

interface Quiz {
  id: string;
  title: string;
  status: 'completed' | 'ongoing' | 'upcoming';
  date: string;
  startDate?: string;
  endDate?: string;
  score?: number;
  totalQuestions: number;
  module_name?: string;
  module_id?: string;
}

interface KnowledgeLevel {
  level: 'Low' | 'Normal' | 'High';
  overall: number;
  topics: {
    name: string;
    score: number;
  }[];
}

interface ModulePerformance {
  id: number;
  name: string;
  total_quizzes: number;
  completed_quizzes: number;
  average_score: number;
  quiz_percentage: number;
  quiz_details?: {
    quiz_id: number;
    quiz_title: string;
    score: number;
    completed_at: string;
  }[];
}

const StudentDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel | null>(null);
  const [modulePerformance, setModulePerformance] = useState<ModulePerformance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const quizzesResponse = await getStudentQuizzes();
        const transformedQuizzes = quizzesResponse.quizzes?.slice(0, 3).map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          status: quiz.status === 'completed' ? 'completed' :
            quiz.status === 'in_progress' ? 'ongoing' : 'upcoming',
          date: quiz.created_at ? quiz.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          startDate: quiz.quiz_start_time ? toIST(quiz.quiz_start_time).toISOString().split('T')[0] : undefined,
          endDate: quiz.quiz_end_time ? toIST(quiz.quiz_end_time).toISOString().split('T')[0] : undefined,
          score: quiz.score,
          totalQuestions: quiz.total_questions || 15,
          module_name: quiz.module_name,
          module_id: quiz.module_id
        })) || [];

        setQuizzes(transformedQuizzes);

        try {
          const modulePerformanceData = await getStudentModulePerformance();
          setModulePerformance(modulePerformanceData.modules || []);

          if (modulePerformanceData.modules && modulePerformanceData.modules.length > 0) {
            const overallScore = modulePerformanceData.modules.reduce((sum, module) => sum + module.average_score, 0) / modulePerformanceData.modules.length;
            const level = overallScore >= 80 ? 'High' : overallScore >= 60 ? 'Normal' : 'Low';

            setKnowledgeLevel({
              level: level,
              overall: overallScore / 100,
              topics: modulePerformanceData.modules.map(module => ({
                name: module.name,
                score: module.average_score / 100
              }))
            });
          }
        } catch (moduleError) {
          console.error('Error fetching module performance:', moduleError);
          setKnowledgeLevel({
            level: 'Normal',
            overall: 0.72,
            topics: []
          });
        }

        console.log('Successfully loaded dashboard data:', transformedQuizzes);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);

        setQuizzes([]);
        setModulePerformance([]);
        setKnowledgeLevel({
          level: 'Normal',
          overall: 0,
          topics: []
        });

        console.warn('Unable to load dashboard data from API');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'green';
      case 'ongoing': return 'blue';
      case 'upcoming': return 'red';
      default: return 'gray';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'Low': return 'red';
      case 'Normal': return 'blue';
      case 'High': return 'green';
      default: return 'gray';
    }
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#2196f3';
    return '#f44336';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard-container">
      <StHeader />

      <main className="dashboard-content mx-6">
        <section className="knowledge-level-section">
          <h2>My Knowledge Level</h2>
          {loading ? (
            <div className="loading-state">
              <p>Loading your knowledge data...</p>
            </div>
          ) : knowledgeLevel ? (
            <div className="knowledge-card">
              <div className="knowledge-header">
                <h3>Overall Level: <span style={{ color: getLevelColor(knowledgeLevel.level) }}>{knowledgeLevel.level}</span></h3>
                <p>Score: {(knowledgeLevel.overall * 100).toFixed(1)}%</p>
              </div>

              <div className="topic-scores">
                <h4>Topic Performance</h4>
                {knowledgeLevel.topics.map(topic => (
                  <div key={topic.name} className="topic-score-item">
                    <span className="topic-name">{topic.name}</span>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${topic.score * 100}%`,
                          backgroundColor: topic.score < 0.5 ? 'red' : topic.score < 0.8 ? 'blue' : 'green'
                        }}
                      ></div>
                    </div>
                    <span className="score-value">{(topic.score * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              <div className="module-performance">
                <h4>Module Performance</h4>
                {modulePerformance.length > 0 ? (
                  <div className="module-performance-grid">
                    {modulePerformance.map(module => (
                      <div key={module.id} className="module-performance-item">
                        <div className="module-header">
                          <span className="module-name">{module.name}</span>
                          <span className="module-percentage" style={{ color: getPerformanceColor(module.average_score) }}>
                            {module.average_score.toFixed(1)}%
                          </span>
                        </div>
                        <div className="module-stats">
                          <span className="quiz-completion">
                            {module.completed_quizzes}/{module.total_quizzes} quizzes completed
                          </span>
                          <div className="completion-rate">
                            <small>Completion Rate: {module.quiz_percentage.toFixed(1)}%</small>
                          </div>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar"
                              style={{
                                width: `${module.quiz_percentage}%`,
                                backgroundColor: getPerformanceColor(module.average_score)
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-modules">
                    <p>No module data available yet.</p>
                    <p>Complete some quizzes to see your performance by module.</p>
                  </div>
                )}
              </div>

              <div className="guidance-link">
                <Link to="/students/guidance" className="button">View Personalized Guidance</Link>
              </div>
            </div>
          ) : (
            <div className="no-knowledge-data">
              <p>No knowledge data available.</p>
              <p>Take some quizzes to see your performance analysis.</p>
            </div>
          )}
        </section>

        <section className="quizzes-section">
          <div className="section-header">
            <h2>My Quizzes</h2>
            <Link to="/students/quizzes" className="view-all-link">View All</Link>
          </div>

          <div className="quiz-list">
            {quizzes.length > 0 ? (
              quizzes.map(quiz => (
                <div key={quiz.id} className="quiz-card">
                  <div className="quiz-header">
                    <h3>{quiz.title}</h3>
                    <span
                      className="quiz-status"
                      style={{ color: getStatusColor(quiz.status) }}
                    >
                      {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                    </span>
                  </div>

                  <div className="quiz-info">
                    <p>Date: {formatDate(quiz.date)}</p>
                    {quiz.startDate && <p>Start Date: {formatDate(quiz.startDate)}</p>}
                    {quiz.endDate && <p>End Date: {formatDate(quiz.endDate)}</p>}
                    <p>Questions: {quiz.totalQuestions}</p>
                    {quiz.module_name && <p>Module: {quiz.module_name}</p>}
                    {quiz.score !== undefined && (
                      <p>Score: {quiz.score}%</p>
                    )}
                  </div>

                  <div className="quiz-actions">
                    {quiz.status === 'completed' && (
                      <Link to={`/students/quiz-results/${quiz.id}`} className="button">
                        View Results
                      </Link>
                    )}

                    {quiz.status === 'ongoing' && (
                      <Link to={`/students/quiz/${quiz.id}`} className="button primary">
                        Continue Quiz
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="quiz-card">
                <div className="quiz-header">
                  <h3>No quizzes available</h3>
                </div>
                <div className="quiz-info">
                  <p>Please check back later or contact your instructor for quiz assignments.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;