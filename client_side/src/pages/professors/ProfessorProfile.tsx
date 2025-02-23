import React from "react";

const ProfessorProfile: React.FC = () => {
  const professor = {
    name: "Dr. Jane Smith",
    email: "janesmith@university.edu",
    department: "Computer Science",
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-yellow-400 p-4 text-white text-center font-bold text-lg">
        Professor Profile
      </header>
      <main className="p-8">
        <div className="bg-yellow-100 p-6 rounded shadow">
          <h2 className="text-gray-800 font-bold text-lg mb-4">Profile Details</h2>
          <p className="text-gray-600 mb-2">
            <strong>Name:</strong> {professor.name}
          </p>
          <p className="text-gray-600 mb-2">
            <strong>Email:</strong> {professor.email}
          </p>
          <p className="text-gray-600">
            <strong>Department:</strong> {professor.department}
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProfessorProfile;
