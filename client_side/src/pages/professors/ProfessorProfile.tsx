import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, TrendingUp, AlertCircle, BarChart3, Package, ChevronDown, User, LogOut, Bell, Edit3, Save, X, FileText } from 'lucide-react';
import { getProfessorModules } from '../../services/moduleService';
import { useAuth } from '../../contexts/AuthContext';

const ProfessorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef(null);
  const [professorData, setProfessorData] = useState({
    firstName: 'Harsha',
    lastName: 'Nirmaral',
    honorifics: 'Prof.',
    emailId: 'professor231@gmail.com',
    faculty: 'Software Engineer'
  });
  const [editForm, setEditForm] = useState({ ...professorData });

  const [notifications] = useState([
    { id: 1, message: "5 students need immediate attention in SDLC topics", type: "warning", time: "10 min ago" },
    { id: 2, message: "Weekly progress report is ready for download", type: "info", time: "1 hour ago" },
    { id: 3, message: "New quiz responses submitted by 12 students", type: "success", time: "2 hours ago" }
  ]);

  const [moduleStats, setModuleStats] = useState({
    totalModules: 0,
    totalQuizzes: 0,
    activeModules: 0
  });

  useEffect(() => {
    // Check if the professor is logged in
    const user = localStorage.getItem('professorUser');
    if (!user) {
      navigate('/professors/login');
    } else {
      // Load module statistics
      loadModuleStats();
    }
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadModuleStats = async () => {
    try {
      const response = await getProfessorModules();
      const modules = response.modules || [];

      const stats = {
        totalModules: modules.length,
        totalQuizzes: modules.reduce((total, module) => total + (module.quizzes?.length || 0), 0),
        activeModules: modules.filter(module => module.status === 'active').length
      };

      setModuleStats(stats);
    } catch (error) {
      console.error('Error loading module stats:', error);
      // Fallback to localStorage
      const savedModules = localStorage.getItem('professorModules');
      if (savedModules) {
        const modules = JSON.parse(savedModules);
        setModuleStats({
          totalModules: modules.length,
          totalQuizzes: modules.reduce((total, module) => total + (module.quizzes?.length || 0), 0),
          activeModules: modules.filter(module => module.status === 'active').length
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/professors/login');
  };

  const handleViewProfile = () => {
    setShowProfileDropdown(false);
    // Already on profile page, no navigation needed
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    setProfessorData(editForm);
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Saving profile:', editForm);
  };

  const handleCancelEdit = () => {
    setEditForm(professorData);
    setIsEditing(false);
  };

  const navigateToDashboard = () => {
    navigate('/professors/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Same as ProfessorDashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Professor Profile</h1>
              <p className="text-sm text-gray-600">ML-Based Student Progress Improvement System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
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
                      className="flex items-center w-full px-4 py-2 text-sm text-blue-600 bg-blue-50 transition-colors"
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

      {/* Navigation Tabs - Same as ProfessorDashboard */}
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
                onClick={navigateToDashboard}
                className="flex items-center py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Statistics Card */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Module Overview</h3>
            <button
              onClick={() => navigate('/professors/modules')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Manage Modules →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{moduleStats.totalModules}</div>
              <div className="text-sm text-blue-600">Total Modules</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{moduleStats.totalQuizzes}</div>
              <div className="text-sm text-green-600">Total Quizzes</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{moduleStats.activeModules}</div>
              <div className="text-sm text-orange-600">Active Modules</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-2xl font-bold">
                    {professorData.firstName.charAt(0)}{professorData.lastName.charAt(0)}
                  </span>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {professorData.honorifics} {professorData.firstName} {professorData.lastName}
                  </h2>
                  <p className="text-blue-100">{professorData.faculty}</p>
                  <p className="text-blue-100">{professorData.emailId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Honorifics</label>
                    <select
                      name="honorifics"
                      value={editForm.honorifics}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Prof.">Prof.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
                    <select
                      name="faculty"
                      value={editForm.faculty}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Network Engineering">Network Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="emailId"
                      value={editForm.emailId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2 inline" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Honorifics</h3>
                  <p className="text-lg text-gray-900">{professorData.honorifics}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Faculty</h3>
                  <p className="text-lg text-gray-900">{professorData.faculty}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">First Name</h3>
                  <p className="text-lg text-gray-900">{professorData.firstName}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Name</h3>
                  <p className="text-lg text-gray-900">{professorData.lastName}</p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-lg text-gray-900">{professorData.emailId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;