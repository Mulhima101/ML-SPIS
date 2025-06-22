import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerProfessor } from '../../services/authService';

const ProfessorRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    honorifics: 'Prof.',
    email: '',
    faculty: 'Software Engineer',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { firstName, lastName, honorifics, email, faculty, password, confirmPassword, agreeToTerms } = formData;

    // Basic validation
    if (!firstName || !lastName || !honorifics || !email || !faculty || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    try {
      const result = await registerProfessor({
        firstName: formData.firstName,
        lastName: formData.lastName,
        honorifics: formData.honorifics,
        email: formData.email,
        faculty: formData.faculty,
        password: formData.password,
      })
      
      if (result === true) {
        alert('Registration successful! Please login to continue.');
        navigate('/professors/login');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faeec9]">
      <div className="flex flex-col lg:flex-row w-full max-w-4xl rounded-2xl m-4 overflow-hidden shadow-xl">
         {/* Left Side */}
        <div className="w-full lg:w-2/5 bg-amber-300 flex items-center justify-center p-2 lg:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              <span className="text-xl">Machine Learning Based </span>
              <br />
              <span className="text-2xl">Student Progress Improvement System</span>
            </h2>
          </div>
        </div>
        
         {/* Right Side */}
        <div className="w-full lg:w-3/5 bg-[#fcfaed] p-4 sm:p-12 relative">
          
          <h2 className="text-2xl font-bold mb-6 text-center">Professor Registration</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-sm">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Harsha"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-sm">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nirmaral"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium text-sm">Honorifics</label>
              <select
                name="honorifics"
                value={formData.honorifics}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg appearance-none text-sm"
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
              <label className="block text-gray-700 mb-1 font-medium text-sm">Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="professor231@gmail.com"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium text-sm">Faculty</label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg appearance-none text-sm"
                required
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Network Engineering">Network Engineering</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium text-sm">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium text-sm">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                id="terms" 
                className="mr-2 text-sm"
                required
              />
              <label htmlFor="terms" className="text-sm">I Agree to Terms & Conditions</label>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition"
            >
              Sign Up
            </button>

            <div className="mt-4 text-center text-sm">
              <Link to="/professors/login" className="text-amber-600">Already have an account? Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessorRegistration;