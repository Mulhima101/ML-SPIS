import { Link } from 'react-router-dom';

const StFooter = () => {
    return (
        <footer className="bg-[#fcfaed] py-6 px-4 mt-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                            ML-Based Student Progress Improvement System
                        </h3>
                        <p className="text-sm text-gray-600">
                            Empowering students through personalized learning guidance
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Link
                            to="/privacy-policy"
                            className="text-sm text-gray-600 hover:text-amber-600 transition"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            to="/students/guidance"
                            className="text-sm text-gray-600 hover:text-amber-600 transition"
                        >
                            Guidance
                        </Link>
                        <Link
                            to="/students/quizzes"
                            className="text-sm text-gray-600 hover:text-amber-600 transition"
                        >
                            Quizzes
                        </Link>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} ML-SPIS. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default StFooter;
