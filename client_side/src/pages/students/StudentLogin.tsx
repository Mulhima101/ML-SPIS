import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
      console.log('Logging in with:', { email, password });
      
      // Mock successful login
      if (email && password) {
        // Store user info in localStorage or context
        localStorage.setItem('studentUser', JSON.stringify({ email }));
        // Redirect to guidance page instead of dashboard
        navigate('/students/guidance');
      } else {
        setError('Please enter both email and password');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faeec9]">
      <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-xl">
        <div className="w-2/5 bg-amber-300 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              <span className="text-xl">Machine Learning Based </span>
              <br />
              <span className="text-2xl">Student Progress</span>
              <br />
              <span className="text-2xl">Improvement System</span>
            </h2>
          </div>
        </div>
        
        <div className="w-3/5 bg-[#fcfaed] p-12 relative">
          <div className="absolute top-4 right-4 text-2xl cursor-pointer">×</div>
          
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