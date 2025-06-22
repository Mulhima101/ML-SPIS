import React, { useState, useEffect, useRef } from 'react';
import { Users, BookOpen, TrendingUp, AlertCircle, Eye, Download, Filter, Search, BarChart3, PieChart, Calendar, Bell, Package, ChevronDown, User, LogOut, FileText, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MyModules from './MyModules';
import { getStudentAnalytics, transformAnalyticsData } from '../../services/analyticsService';
import { generateAnalyticsReport, generateStudentReport } from '../../services/pdfReportService';
import '../../styles/dashboard.css';

const ProfessorDashboard = () => {
    const [selectedTab, setSelectedTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [dashboardData, setDashboardData] = useState({
        totalStudents: 0,
        averageProgress: 0,
        lowPerformers: 0,
        highPerformers: 0,
        recentActivities: 0
    });

    const [students, setStudents] = useState([]);

    const [notifications, setNotifications] = useState([
        { id: 1, message: "Loading analytics data...", type: "info", time: "now" }
    ]);

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterLevel === 'all' || student.knowledgeLevel.toLowerCase() === filterLevel;
        return matchesSearch && matchesFilter;
    });

    const getKnowledgeLevelColor = (level) => {
        switch (level) {
            case 'High': return 'text-green-600 bg-green-100';
            case 'Normal': return 'text-blue-600 bg-blue-100';
            case 'Low': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return '📈';
            case 'down': return '📉';
            case 'stable': return '➡️';
            default: return '➡️';
        }
    };

    const handleGenerateAnalyticsReport = () => {
        try {
            if (analyticsData && dashboardData && students.length > 0) {
                generateAnalyticsReport(analyticsData, dashboardData, students);
            } else {
                alert('Analytics data is not available. Please wait for data to load.');
            }
        } catch (error) {
            console.error('Error generating analytics report:', error);
            alert('Failed to generate analytics report. Please try again.');
        }
    };

    const handleGenerateStudentReport = (student) => {
        try {
            generateStudentReport(student, analyticsData);
        } catch (error) {
            console.error('Error generating student report:', error);
            alert('Failed to generate student report. Please try again.');
        }
    };

    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    };

    const markAllAsRead = () => {
        setNotifications([]);
        setShowNotificationModal(false);
    };

    const handleNotificationClick = () => {
        setShowNotificationModal(!showNotificationModal);
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <Icon className="h-8 w-8" style={{ color }} />
            </div>
        </div>
    );

    const OverviewTab = () => (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={dashboardData.totalStudents}
                    icon={Users}
                    color="#3B82F6"
                    subtitle="Active learners"
                />
                <StatCard
                    title="Average Progress"
                    value={`${dashboardData.averageProgress}%`}
                    icon={TrendingUp}
                    color="#10B981"
                    subtitle="Overall class performance"
                />
                <StatCard
                    title="Need Attention"
                    value={dashboardData.lowPerformers}
                    icon={AlertCircle}
                    color="#EF4444"
                    subtitle="Low performing students"
                />
                <StatCard
                    title="High Performers"
                    value={dashboardData.highPerformers}
                    icon={BookOpen}
                    color="#8B5CF6"
                    subtitle="Excelling students"
                />
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-blue-600" />
                        Recent Notifications
                    </h3>
                </div>
                <div className="space-y-3">
                    {notifications.map(notification => (
                        <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`h-2 w-2 rounded-full mt-2 ${notification.type === 'warning' ? 'bg-yellow-400' :
                                notification.type === 'info' ? 'bg-blue-400' : 'bg-green-400'
                                }`} />
                            <div className="flex-1">
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500">{notification.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={handleGenerateAnalyticsReport}
                        disabled={loading || !analyticsData}
                        className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="text-blue-600 font-medium">
                            {loading ? 'Loading...' : 'Download Report'}
                        </span>
                    </button>
                    <button
                        onClick={() => setSelectedTab('analytics')}
                        className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                        <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-green-600 font-medium">View Analytics</span>
                    </button>
                    <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        <span className="text-purple-600 font-medium">Schedule Review</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const StudentsTab = () => (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Levels</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Student Progress Overview</h3>
                        <button
                            onClick={handleGenerateAnalyticsReport}
                            disabled={loading || !analyticsData}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Export All Reports
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knowledge Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module Scores</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className={`hover:bg-gray-50 ${student.needsAttention ? 'bg-red-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.id}</div>
                                            </div>
                                            {student.needsAttention && (
                                                <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getKnowledgeLevelColor(student.knowledgeLevel)}`}>
                                            {student.knowledgeLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">{(student.overallScore * 100).toFixed(0)}%</div>
                                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${student.overallScore * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs space-y-1">
                                            {student.modules && Object.keys(student.modules).length > 0 ? (
                                                Object.entries(student.modules).slice(0, 3).map(([moduleName, score]) => (
                                                    <div key={moduleName} className="flex justify-between items-center">
                                                        <span className="truncate max-w-20" title={moduleName}>
                                                            {moduleName.length > 12 ? `${moduleName.substring(0, 12)}...` : moduleName}:
                                                        </span>
                                                        <span className="ml-1 font-medium">
                                                            {(score * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-400 text-center">No module data</div>
                                            )}
                                            {student.modules && Object.keys(student.modules).length > 3 && (
                                                <div className="text-gray-500 text-center">
                                                    +{Object.keys(student.modules).length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-lg">{getTrendIcon(student.trend)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.lastActive}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-blue-600 hover:text-blue-900 flex items-center">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleGenerateStudentReport(student)}
                                                className="text-green-600 hover:text-green-900 flex items-center"
                                                title="Generate Individual Report"
                                            >
                                                <FileText className="h-4 w-4 mr-1" />
                                                Report
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const AnalyticsTab = () => (
        <div className="space-y-6">
            {loading ? (
                <div className="text-center py-8">
                    <p>Loading analytics data...</p>
                </div>
            ) : (
                <>
                    {/* Header with Download Button */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                        <button
                            onClick={handleGenerateAnalyticsReport}
                            disabled={!analyticsData}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Full Report
                        </button>
                    </div>

                    {/* Performance Distribution */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                            Knowledge Level Distribution
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {analyticsData?.overall_statistics?.percentage_distribution?.high?.toFixed(0) || 0}%
                                </div>
                                <div className="text-sm text-gray-600">High Performers</div>
                                <div className="text-xs text-gray-500">
                                    {analyticsData?.overall_statistics?.students_by_level?.high || 0} students
                                </div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {analyticsData?.overall_statistics?.percentage_distribution?.normal?.toFixed(0) || 0}%
                                </div>
                                <div className="text-sm text-gray-600">Normal Performers</div>
                                <div className="text-xs text-gray-500">
                                    {analyticsData?.overall_statistics?.students_by_level?.normal || 0} students
                                </div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">
                                    {analyticsData?.overall_statistics?.percentage_distribution?.low?.toFixed(0) || 0}%
                                </div>
                                <div className="text-sm text-gray-600">Low Performers</div>
                                <div className="text-xs text-gray-500">
                                    {analyticsData?.overall_statistics?.students_by_level?.low || 0} students
                                </div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">
                                    {analyticsData?.overall_statistics?.percentage_distribution?.no_data?.toFixed(0) || 0}%
                                </div>
                                <div className="text-sm text-gray-600">No Data</div>
                                <div className="text-xs text-gray-500">
                                    {analyticsData?.overall_statistics?.students_by_level?.no_data || 0} students
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI-Generated Insights */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights & Recommendations</h3>
                        <div className="space-y-4">
                            {analyticsData?.topic_analytics && Object.entries(analyticsData.topic_analytics)
                                .filter(([_, data]) => data.average_score < 0.6)
                                .map(([topic, data]) => (
                                    <div key={topic} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                        <h4 className="font-medium text-yellow-800">Focus Area: {topic} Topics</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Students are struggling with {topic} concepts (Average: {(data.average_score * 100).toFixed(1)}%).
                                            Consider additional practice sessions or simplified explanations.
                                        </p>
                                    </div>
                                ))
                            }

                            {analyticsData?.topic_analytics && Object.entries(analyticsData.topic_analytics)
                                .filter(([_, data]) => data.average_score >= 0.75)
                                .slice(0, 1)
                                .map(([topic, data]) => (
                                    <div key={topic} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                                        <h4 className="font-medium text-blue-800">Positive Trend: {topic}</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Students show strong understanding of {topic} (Average: {(data.average_score * 100).toFixed(1)}%).
                                            This teaching approach is working well.
                                        </p>
                                    </div>
                                ))
                            }

                            {dashboardData.lowPerformers > 0 && (
                                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                                    <h4 className="font-medium text-red-800">Immediate Attention Required</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        {dashboardData.lowPerformers} students have low knowledge levels.
                                        Consider personalized interventions or additional support.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotificationModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const loadAnalyticsData = async () => {
            try {
                setLoading(true);
                const data = await getStudentAnalytics();
                const transformed = transformAnalyticsData(data);

                if (transformed) {
                    setAnalyticsData(data);
                    setDashboardData(transformed.dashboardData);
                    setStudents(transformed.students);

                    // Generate dynamic notifications based on analytics
                    const dynamicNotifications = [
                        {
                            id: 1,
                            message: `${transformed.dashboardData.lowPerformers} students need immediate attention`,
                            type: "warning",
                            time: "now"
                        },
                        {
                            id: 2,
                            message: `Analytics data updated - ${transformed.dashboardData.totalStudents} students analyzed`,
                            type: "info",
                            time: "just now"
                        }
                    ];

                    if (transformed.dashboardData.recentActivities > 0) {
                        dynamicNotifications.push({
                            id: 3,
                            message: `${transformed.dashboardData.recentActivities} students active in last 3 days`,
                            type: "success",
                            time: "recent"
                        });
                    }

                    setNotifications(dynamicNotifications);
                }
            } catch (error) {
                console.error('Failed to load analytics data:', error);
                setNotifications([
                    { id: 1, message: "Failed to load analytics data. Using offline mode.", type: "warning", time: "now" }
                ]);
                // Keep existing mock data as fallback
            } finally {
                setLoading(false);
            }
        };

        loadAnalyticsData();
    }, []);

    const NotificationModal = () => (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden" ref={notificationRef}>
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center space-x-2">
                        {notifications.length > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                        <button
                            onClick={() => setShowNotificationModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notification => (
                            <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${notification.type === 'warning' ? 'bg-yellow-400' :
                                            notification.type === 'info' ? 'bg-blue-400' : 'bg-green-400'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 break-words">{notification.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                    </div>
                                    <button
                                        onClick={() => markNotificationAsRead(notification.id)}
                                        className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600 transition-colors"
                                        title="Mark as read"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No new notifications</p>
                    </div>
                )}
            </div>
        </div>
    );

    const handleViewProfile = () => {
        setShowProfileDropdown(false);
        navigate('/professors/profile');
    };

    const handleLogout = () => {
        logout();
        navigate('/professors/login');
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Professor Dashboard</h1>
                            <p className="text-sm text-gray-600">ML-Based Student Progress Improvement System</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Notification Bell with Modal */}
                            <div className="relative">
                                <button
                                    onClick={handleNotificationClick}
                                    className="relative p-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                >
                                    <Bell className="h-6 w-6" />
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Modal */}
                                {showNotificationModal && <NotificationModal />}
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">P</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">Professor</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showProfileDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                        <button
                                            onClick={handleViewProfile}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <User className="h-4 w-4 mr-3" />
                                            View Profile
                                        </button>
                                        <div className="border-t border-gray-100"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'overview', name: 'Overview', icon: BarChart3 },
                            { id: 'students', name: 'Students', icon: Users },
                            { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                            { id: 'modules', name: 'My Modules', icon: Package }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${selectedTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {selectedTab === 'overview' && <OverviewTab />}
                {selectedTab === 'students' && <StudentsTab />}
                {selectedTab === 'analytics' && <AnalyticsTab />}
                {selectedTab === 'modules' && <MyModules />}
            </div>
        </div>
    );
};

export default ProfessorDashboard;