import React from "react";

const SingleQuestionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-yellow-400 p-4 text-white text-center font-bold text-lg">
        Quiz Question
      </header>
      <main className="p-8">
        <div className="bg-yellow-100 p-6 rounded shadow">
          <h2 className="text-gray-800 font-bold text-lg mb-4">
            Question: What is 2 + 2?
          </h2>
          <div className="space-y-3">
            <button className="w-full p-3 bg-white border border-yellow-300 rounded">
              A. 4
            </button>
            <button className="w-full p-3 bg-white border border-yellow-300 rounded">
              B. 22
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SingleQuestionPage;
