import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/auth.css';

import StHeader from '../../components/students/stHeader';

const StudentLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // This would normally connect to your backend API
      // For now, we'll simulate a successful login
      console.log('Logging in with:', { email, password });
      
      // Mock successful login
      if (email && password) {
        // Store user info in localStorage or context
        localStorage.setItem('studentUser', JSON.stringify({ email }));
        // Redirect to dashboard
        navigate('/students/dashboard');
      } else {
        setError('Please enter both email and password');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>
            <span>Machine Learning Based </span>
            <br />
            Student Progress Improvement
            <br />
            <span>System </span>
          </h2>
        </div>
        <div className="auth-right">
          <div className="close-button">×</div>
          <h2>Student Login</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student231@gmail.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
              />
            </div>
            
            <button type="submit" className="login-button">
              Login
            </button>
            
            <div className="auth-links">
              <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/students/register">Student Registration</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;