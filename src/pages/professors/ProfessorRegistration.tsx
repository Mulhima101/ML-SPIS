import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/auth.css';

const ProfessorRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    employeeId: ''
  });
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword, department, employeeId } = formData;

    // Basic validation
    if (!name || !email || !password || !confirmPassword || !department || !employeeId) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // This would connect to your backend API in production
      console.log('Registering professor:', formData);
      
      // Mock successful registration
      localStorage.setItem('professorUser', JSON.stringify({ 
        email, 
        name, 
        department,
        employeeId 
      }));
      
      // Redirect to dashboard
      navigate('/professors/profile');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>
            <span>Machine Learning</span>
            <br />
            Based Student Improvement
            <br />
            System
          </h2>
        </div>
        <div className="auth-right">
          <div className="close-button">×</div>
          <h2>Professor Registration</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. John Doe"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="professor@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                <option value="IT">Information Technology</option>
                <option value="CS">Computer Science</option>
                <option value="NE">Network Engineering</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP-XXXX"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••"
                required
              />
            </div>
            
            <button type="submit" className="register-button">
              Register
            </button>
            
            <div className="auth-links">
              <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/professors/login">Already have an account? Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessorRegistration;