import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ProfessorRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    honorifics: 'Prof.',
    email: '',
    faculty: 'Software Engineer',
    password: '',
    confirmPassword: ''
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

    const { firstName, lastName, honorifics, email, faculty, password, confirmPassword } = formData;

    // Basic validation
    if (!firstName || !lastName || !honorifics || !email || !faculty || !password || !confirmPassword) {
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
        name: `${honorifics} ${firstName} ${lastName}`, 
        faculty
      }));
      
      // Redirect to dashboard
      navigate('/professors/profile');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--primary-background-color)]">
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
        
        <div className="w-3/5 bg-[var(--secondary-background-color)] p-12 relative">
          <div className="absolute top-4 right-4 text-2xl cursor-pointer">×</div>
          
          <h2 className="text-2xl font-bold mb-8 text-center">Professor Registration</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Harsha"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nirmaral"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Honorifics</label>
              <select
                name="honorifics"
                value={formData.honorifics}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg appearance-none"
                required
              >
                <option value="Prof.">Prof.</option>
                <option value="Dr.">Dr.</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="professor231@gmail.com"
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Faculty</label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg appearance-none"
                required
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Network Engineering">Network Engineering</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="terms" 
                className="mr-2"
                required
              />
              <label htmlFor="terms" className="text-sm">I Agree to Team & Conditions</label>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessorRegistration;