import React from "react";

const StudentDetails: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-yellow-400 p-4 text-white text-center font-bold text-lg">
        Student Details
      </header>
      <main className="p-8">
        <div className="bg-yellow-100 p-6 rounded shadow">
          <h2 className="text-gray-800 font-bold text-lg mb-4">John Doe</h2>
          <p className="text-gray-600">Email: johndoe@example.com</p>
          <p className="text-gray-600">Guidance: Focus on JavaScript fundamentals.</p>
        </div>
      </main>
    </div>
  );
};

export default StudentDetails;
