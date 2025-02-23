import React, { useState } from "react";

const ProfessorLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Professor Login", { email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50">
      <div className="bg-yellow-100 p-8 rounded shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Professor Login
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 border border-yellow-300 rounded"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-4 border border-yellow-300 rounded"
          />
          <button
            type="submit"
            className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfessorLogin;
