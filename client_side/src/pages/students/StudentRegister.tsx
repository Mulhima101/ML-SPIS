import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StudentRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    faculty: 'Software Engineer',
    intakeNo: '6',
    academicYear: '2024',
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

    const { firstName, lastName, email, password, confirmPassword, agreeToTerms } = formData;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
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
      // This would connect to your backend API in production
      console.log('Registering student:', formData);
      
      // Mock successful registration
      localStorage.setItem('studentUser', JSON.stringify({ 
        email, 
        firstName, 
        lastName,
        faculty: formData.faculty,
        intakeNo: formData.intakeNo,
        academicYear: formData.academicYear
      }));
      
      // Redirect to guidance page instead of dashboard
      navigate('/students/guidance');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faeec9]">
      <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-xl">
        {/* Left Side */}
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
        
        {/* Right Side */}
        <div className="w-3/5 bg-[#fcfaed] p-12 relative">
          <div className="absolute top-4 right-4 text-2xl cursor-pointer">×</div>
          
          <h2 className="text-2xl font-bold mb-6 text-center">Student Registration</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-sm">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Mulhima"
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
                  placeholder="Jawahir"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium text-sm">Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student231@gmail.com"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium text-sm">Faculty</label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white"
                required
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Network Engineer">Network Engineer</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-sm">Intake No</label>
                <select
                  name="intakeNo"
                  value={formData.intakeNo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white"
                  required
                >
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 font-medium text-sm">Academic Year</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white"
                  required
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
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
            
            <div className="mb-6">
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
            
            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <label className="text-sm text-gray-700">I Agree to Terms & Conditions</label>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition"
            >
              Sign Up
            </button>
            
            <div className="mt-4 text-center text-sm">
              <Link to="/students/login" className="text-amber-600">Already have an account? Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;