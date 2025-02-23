import React from "react";

const quizzes = [
  {
    title: "What is Lorem Ipsum",
    subject: "Software Engineer",
    startTime: "7:00pm",
    endTime:  "8:00pm",
    numberOfQuestions: 15,
    numberOfAnsweredQuestions: 0,
    duration: "00:20:00",
    result: null,
  },
  {
    title: "What is Lorem Ipsum",
    subject: "Software Engineer",
    startTime: "7:00pm",
    endTime:  "8:00pm",
    numberOfQuestions: 15,
    numberOfAnsweredQuestions: 0,
    duration: "00:20:00",
    result: null,
  },
  {
    title: "What is Lorem Ipsum",
    subject: "Software Engineer",
    startTime: "7:00pm",
    endTime:  "8:00pm",
    numberOfQuestions: 15,
    numberOfAnsweredQuestions: 0,
    duration: "00:20:00",
    result: null,
  },
  {
    title: "What is Lorem Ipsum",
    subject: "Software Engineer",
    startTime: "7:00pm",
    endTime:  "8:00pm",
    numberOfQuestions: 15,
    numberOfAnsweredQuestions: 0,
    duration: "00:20:00",
    result: null,
  }
];

const QuizAllPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-yellow-400 p-4 text-white text-center font-bold text-lg">
        All Quizzes
      </header>
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, index) => (
            <div
              key={index}
              className="bg-yellow-100 p-6 rounded shadow cursor-pointer"
            >
              <h3 className="text-gray-800 font-bold text-lg">{quiz.title}</h3>
              <p className="text-gray-600">Test your knowledge in {quiz.subject}.</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default QuizAllPage;
