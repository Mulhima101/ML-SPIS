import React, { useState } from "react";

const StudentRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Student Registration", formData);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50">
      <div className="bg-yellow-100 p-8 rounded shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Student Registration
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-yellow-300 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-yellow-300 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 mb-4 border border-yellow-300 rounded"
          />
          <button
            type="submit"
            className="w-full p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
