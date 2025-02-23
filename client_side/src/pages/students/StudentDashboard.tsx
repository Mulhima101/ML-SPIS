import React from "react";

const StudentDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-yellow-400 p-4 text-white text-center font-bold text-lg">
        Student Dashboard
      </header>
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-yellow-100 p-6 rounded shadow">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Quizzes</h2>
            <p className="text-gray-600">Attempt the latest quizzes to improve your knowledge.</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded shadow">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Guidance</h2>
            <p className="text-gray-600">Get personalized guidance from professors.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
