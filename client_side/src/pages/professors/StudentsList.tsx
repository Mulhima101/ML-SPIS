import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  faculty: string;
  intakeNo: string;
  academicYear: string;
  quizzes: {
    total: number;
    targets: number;
  };
}

const StudentsList: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState({
    intakeNo: '6',
    academicYear: '2024',
    faculty: '',
    studentId: ''
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is authenticated
    const professorUser = localStorage.getItem('professorUser');
    if (!professorUser) {
      navigate('/professors/login');
      return;
    }

    // Mock fetching students data
    const fetchStudents = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const mockStudents: Student[] = [
            {
              id: 'std1',
              name: 'John Doe',
              faculty: 'Software Engineer',
              intakeNo: '6',
              academicYear: '2024',
              quizzes: {
                total: 41,
                targets: 26
              }
            },
            {
              id: 'std2',
              name: 'Jane Smith',
              faculty: 'Network Engineer',
              intakeNo: '6',
              academicYear: '2024',
              quizzes: {
                total: 22,
                targets: 18
              }
            }
          ];

          setStudents(mockStudents);
          setFilteredStudents(mockStudents);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [navigate]);

  // Filter students when filters change
  useEffect(() => {
    let result = [...students];

    if (filters.intakeNo) {
      result = result.filter(student => student.intakeNo === filters.intakeNo);
    }

    if (filters.academicYear) {
      result = result.filter(student => student.academicYear === filters.academicYear);
    }

    if (filters.faculty) {
      result = result.filter(student => student.faculty.toLowerCase().includes(filters.faculty.toLowerCase()));
    }

    if (filters.studentId) {
      result = result.filter(student => student.id.toLowerCase().includes(filters.studentId.toLowerCase()));
    }

    setFilteredStudents(result);
  }, [filters, students]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/professors/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
        <div className="loading">Loading students data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--primary-background-color)]">
      <header className="bg-[var(--secondary-background-color)] p-4 flex justify-between items-center">
        <h1 className="text-lg font-medium">Students</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="text-sm"
          >
            Logout
          </button>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-[var(--secondary-background-color)] rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Intake No</label>
              <select
                name="intakeNo"
                value={filters.intakeNo}
                onChange={handleFilterChange}
                className="border rounded-md px-3 py-2 w-24"
              >
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Academic Year</label>
              <select
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                className="border rounded-md px-3 py-2 w-32"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Faculty</label>
              <select
                name="faculty"
                value={filters.faculty}
                onChange={handleFilterChange}
                className="border rounded-md px-3 py-2 w-64"
              >
                <option value="">Select The Faculty</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Network Engineer">Network Engineer</option>
              </select>
            </div>

            <div className="ml-auto">
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={filters.studentId}
                onChange={handleFilterChange}
                placeholder="Enter Student ID"
                className="border rounded-md px-3 py-2 w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredStudents.map(student => (
              <Link
                key={student.id}
                to={`/professors/student/${student.id}`}
                className="block hover:bg-gray-50 transition"
              >
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <h2 className="text-lg font-semibold">{student.name}</h2>
                      <p className="text-gray-600">Student Id</p>
                      <p className="mt-2">Faculty</p>
                      <p>Intake No</p>
                      <p>Academic Year</p>
                    </div>

                    <div className="col-span-6 text-right">
                      <div className="flex justify-end items-center gap-16">
                        <div>
                          <p className="font-medium">Number of Quiz</p>
                          <p className="text-3xl font-bold">{student.quizzes.total}</p>
                        </div>

                        <div>
                          <p className="font-medium">Number of Targets</p>
                          <p className="text-3xl font-bold">{student.quizzes.targets}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsList;