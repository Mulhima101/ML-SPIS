import React, { useState } from "react";

const QuizPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const handleNext = () => {
    if (currentQuestion < 10) setCurrentQuestion(currentQuestion + 1);
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center">
      <header className="bg-yellow-400 w-full py-4 text-white text-center text-xl font-bold">
        Quiz Page
      </header>
      <main className="p-8 w-full max-w-2xl">
        <div className="bg-yellow-100 p-6 rounded shadow mb-6">
          <h2 className="text-gray-800 font-bold text-lg mb-4">
            Question {currentQuestion} of 10
          </h2>
          <p className="text-gray-600 mb-4">
            What is the output of 2 + 2 in JavaScript?
          </p>
          <div className="space-y-3">
            <button
              className={`w-full p-3 text-left bg-white border ${
                selectedAnswer === "A"
                  ? "border-yellow-400"
                  : "border-yellow-300"
              } rounded`}
              onClick={() => setSelectedAnswer("A")}
            >
              A. 4
            </button>
            <button
              className={`w-full p-3 text-left bg-white border ${
                selectedAnswer === "B"
                  ? "border-yellow-400"
                  : "border-yellow-300"
              } rounded`}
              onClick={() => setSelectedAnswer("B")}
            >
              B. "4"
            </button>
          </div>
        </div>
        <button
          className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium"
          onClick={handleNext}
        >
          Next Question
        </button>
      </main>
    </div>
  );
};

export default QuizPage;
