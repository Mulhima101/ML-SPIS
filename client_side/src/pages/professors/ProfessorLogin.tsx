import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProfessorLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.userType === 'student') {
        navigate('/students/dashboard');
      } else if (user?.userType === 'professor') {
        navigate('/professors/dashboard');
      }
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

          <h2 className="text-2xl font-bold mb-8 text-center">Professor Login</h2>

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
                placeholder="professor231@gmail.com"
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
              <Link to="/privacy-policy" className="text-amber-600">Privacy Policy</Link> | <Link to="/professors/register" className="text-amber-600">Professor Registration</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessorLogin;