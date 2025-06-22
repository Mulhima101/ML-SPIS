import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const StudentDetails: React.FC = () => {
  const navigate = useNavigate();
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [students, setStudents] = useState([
    {
      id: '1',
      name: 'Student Name',
      studentId: 'Student Id',
      faculty: 'Faculty',
      intakeNo: 'Intake No',
      academicYear: 'Academic Year',
      quizzes: 41,
      targets: 26
    },
    {
      id: '2',
      name: 'Student Name',
      studentId: 'Student Id',
      faculty: 'Faculty',
      intakeNo: 'Intake No',
      academicYear: 'Academic Year',
      quizzes: 22,
      targets: 18
    }
  ]);

  const [filters, setFilters] = useState({
    intakeNo: '6',
    academicYear: '2024',
    faculty: 'Select The Faculty',
    studentId: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('professorUser');
    localStorage.removeItem('token');
    localStorage.removeItem('professorModules'); // Clear cached data
    navigate('/students/login');
  };

  return (
    <div className="min-h-screen bg-[#FEF8DD]">
      <header className="flex justify-between items-center px-6 py-4">
        <h1 className="text-lg font-medium">Students</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="text-sm font-medium"
          >
            Logout
          </button>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Intake No</label>
            <select
              name="intakeNo"
              value={filters.intakeNo}
              onChange={handleFilterChange}
              className="bg-white border border-gray-200 rounded-md p-2 px-4 pr-8 w-24 appearance-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em"
              }}
            >
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Academic Year</label>
            <select
              name="academicYear"
              value={filters.academicYear}
              onChange={handleFilterChange}
              className="bg-white border border-gray-200 rounded-md p-2 px-4 pr-8 w-32 appearance-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em"
              }}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Faculty</label>
            <select
              name="faculty"
              value={filters.faculty}
              onChange={handleFilterChange}
              className="bg-white border border-gray-200 rounded-md p-2 px-4 pr-8 w-60 appearance-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em"
              }}
            >
              <option value="Select The Faculty">Select The Faculty</option>
              <option value="IT">Information Technology</option>
              <option value="SE">Software Engineering</option>
              <option value="NMC">Networking and Mobile Computing</option>
            </select>
          </div>

          <div className="ml-auto">
            <label className="block text-sm mb-1">Student ID</label>
            <input
              type="text"
              name="studentId"
              value={filters.studentId}
              onChange={handleFilterChange}
              placeholder="Enter Student ID"
              className="bg-white border border-gray-200 rounded-md p-2 px-4 w-56"
            />
          </div>
        </div>

        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-lg p-6 shadow-sm mb-4">
            <div className="flex flex-wrap justify-between items-start">
              <div>
                <h2 className="text-lg font-medium">{student.name}</h2>
                <p className="text-sm text-gray-600">{student.studentId}</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <p className="text-sm text-gray-800">{student.faculty}</p>
                  <p className="text-sm text-gray-800">{student.intakeNo}</p>
                  <p className="text-sm text-gray-800">{student.academicYear}</p>
                </div>
              </div>
              <div className="flex gap-8 mt-4 md:mt-0">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Number of Quiz</p>
                  <p className="text-2xl font-medium">{student.quizzes}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Number of Targets</p>
                  <p className="text-2xl font-medium">{student.targets}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDetails;