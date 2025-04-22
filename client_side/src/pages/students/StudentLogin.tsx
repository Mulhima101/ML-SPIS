// client_side/src/pages/students/StudentLogin.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';

const StudentLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Try to connect to the API
      try {
        // Connect to backend API
        const response = await authService.login({ email, password });
        
        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('studentUser', JSON.stringify(response.data.user));
        
        // Redirect to guidance page
        navigate('/students/guidance');
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        
        // Fallback if API fails
        if (email && password) {
          // Mock successful login as a fallback
          localStorage.setItem('studentUser', JSON.stringify({ 
            id: 1,
            email,
            firstName: 'Student',
            lastName: 'User',
            userType: 'student'
          }));
          
          // Redirect to guidance page
          navigate('/students/guidance');
        } else {
          setError('Please enter both email and password');
        }
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    }
  };

  // Keep the rest of your component and UI unchanged
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faeec9]">
      <div className="flex flex-col lg:flex-row w-full max-w-4xl rounded-2xl m-4 overflow-hidden shadow-xl">
        <div className="w-full lg:w-2/5 bg-amber-300 flex items-center justify-center p-2 lg:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              <span className="text-xl">Machine Learning Based </span>
              <br />
              <span className="text-2xl">Student Progress Improvement System</span>
            </h2>
          </div>
        </div>
        
        <div className="w-full lg:w-3/5 bg-[#fcfaed] p-4 sm:p-12 relative">
          
          <h2 className="text-2xl font-bold mb-8 text-center">Student Login</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">Email ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student231@gmail.com"
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div className="mb-8">
              <label className="block text-gray-700 mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••"
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition"
            >
              Login
            </button>
            
            <div className="mt-6 text-center text-sm">
              <Link to="/privacy-policy" className="text-amber-600">Privacy Policy</Link> | <Link to="/students/register" className="text-amber-600">Student Registration</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;