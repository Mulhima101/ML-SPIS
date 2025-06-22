// src/pages/PrivacyPolicy.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--primary-background-color)] flex justify-center items-center">
      <div className="bg-white rounded-xl p-8 shadow-md max-w-4xl mx-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-[var(--primary-accent-color)]">
          Privacy Policy
        </h1>
        
        <div className="space-y-4">
          <p>
            At the Machine Learning-Based Student Progress Improvement System, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose your personal information.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">Information We Collect</h2>
          <p>
            We collect personal information that you provide to us when you register for an account, such as your name, email address, student ID, and faculty. We also collect information about your usage of the system, including your quiz results and progress data.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">How We Use Your Information</h2>
          <p>
            We use your personal information to provide and improve the Machine Learning-Based Student Progress Improvement System, to personalize your learning experience, and to communicate with you about your progress and relevant educational opportunities.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">Information Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to outside parties unless we provide you with advance notice. We may share anonymized and aggregated data with researchers and educators to improve educational outcomes.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal information. You may also object to the processing of your personal information or request the restriction of processing.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
          
          <h2 className="text-xl font-bold text-[var(--primary-accent-color)]">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@studentprogress.edu.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <Link 
            to="/students/login"
            className="px-6 py-3 bg-[var(--primary-accent-color)] text-white font-semibold rounded-lg hover:bg-[var(--primary-accent-hover-color)] transition"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;