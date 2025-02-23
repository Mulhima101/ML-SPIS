import React from "react";

const StudentProfile: React.FC = () => {
  const student = {
    id: 123,
    name: "John Doe",
    email: "johndoe@example.com",
    course: "BSc (Hons) Software Engineering",
    progress: "85%",
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-400 p-4 text-white text-center font-bold text-lg">
        Student Profile
      </header>
      <main className="p-8">
        <div className="bg-blue-100 p-6 rounded shadow space-y-4">
          <h3 className="text-gray-800 font-bold text-lg">{student.name}</h3>
          <p className="text-gray-600">
            <strong>Email:</strong> {student.email}
          </p>
          <p className="text-gray-600">
            <strong>Course:</strong> {student.course}
          </p>
          <p className="text-gray-600">
            <strong>Progress:</strong> {student.progress}
          </p>
          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full text-center text-white text-sm font-bold"
              style={{ width: student.progress }}
            >
              {student.progress}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
