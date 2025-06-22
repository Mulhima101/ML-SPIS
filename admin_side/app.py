# admin_side/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
import os
import time

# Initialize Flask extensions
db = SQLAlchemy()

def create_app():
    # Create and configure the app
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    # Initialize CORS with more specific settings
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database with improved error handling
    db.init_app(app)
    
    # Register blueprints (routes)
    from routes.auth_routes import auth_bp
    from routes.quiz_routes import quiz_bp
    from routes.student_routes import student_bp
    from routes.professor_routes import professor_bp
    from routes.module_routes import module_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(quiz_bp, url_prefix='/api/quizzes')
    app.register_blueprint(student_bp, url_prefix='/api/students')
    app.register_blueprint(professor_bp, url_prefix='/api/professors')
    app.register_blueprint(module_bp, url_prefix='/api/modules')
    
    # Create database tables with improved error handling
    with app.app_context():
        # Import all models to ensure they're registered with SQLAlchemy
        from models.UserModel import User, Student, Professor
        from models.QuizModel import Quiz, Question
        from models.ProgressModel import StudentQuiz, StudentAnswer, KnowledgeLevel
        from models.ModuleModel import Module
        
        # Database initialization with retry logic
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Test connection first - fix textual SQL
                db.session.execute(text('SELECT 1'))
                
                # Create tables
                db.create_all()
                print("Database tables created successfully!")
                break
                
            except OperationalError as e:
                print(f"Database connection attempt {attempt + 1} failed: {str(e)}")
                
                if attempt < max_retries - 1:
                    print(f"Retrying in 2 seconds...")
                    time.sleep(2)
                    
                    # Dispose of the current engine
                    db.engine.dispose()
                else:
                    print("Failed to connect to database after multiple attempts.")
                    print("Please check your database connection settings and ensure MySQL is running.")
                    
            except Exception as e:
                print(f"Unexpected error during database initialization: {str(e)}")
                if attempt >= max_retries - 1:
                    break
    
    @app.route('/')
    def welcome():
        return jsonify({"message": "Welcome to the ML-Based Student Progress Improvement System API!"})
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"message": "Route not found"}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"message": "Internal server error", "error": str(e)}), 500
    
    @app.errorhandler(503)
    def service_unavailable(e):
        return jsonify({"message": "Service temporarily unavailable"}), 503
    
    # Add a debug route to list all routes
    @app.route('/debug/routes')
    def list_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'rule': str(rule)
            })
        return jsonify({'routes': routes})
    
    return app