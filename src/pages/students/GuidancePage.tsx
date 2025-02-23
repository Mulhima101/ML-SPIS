import React from "react";

const GuidancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-yellow-400 p-4 text-white text-center font-bold text-lg">
        Personalized Guidance
      </header>
      <main className="p-8">
        <div className="bg-yellow-100 p-6 rounded shadow">
          <h2 className="font-bold text-lg text-gray-800 mb-4">
            Guidance Based on Your Performance
          </h2>
          <p className="text-gray-600">
            Based on your recent quizzes, we recommend focusing on improving
            your JavaScript and Data Structures skills.
          </p>
        </div>
      </main>
    </div>
  );
};

export default GuidancePage;
