# admin_side/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize Flask extensions
db = SQLAlchemy()

def create_app():
    # Create and configure the app
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    # Initialize CORS with more specific settings
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database
    db.init_app(app)
    
    # Register blueprints (routes)
    from routes.auth_routes import auth_bp
    from routes.quiz_routes import quiz_bp
    from routes.student_routes import student_bp
    from routes.professor_routes import professor_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(quiz_bp, url_prefix='/api/quizzes')
    app.register_blueprint(student_bp, url_prefix='/api/students')
    app.register_blueprint(professor_bp, url_prefix='/api/professors')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def welcome():
        return jsonify({"message": "Welcome to the ML-Based Student Progress Improvement System API!"})
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"message": "Route not found"}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"message": "Internal server error", "error": str(e)}), 500
    
    return app