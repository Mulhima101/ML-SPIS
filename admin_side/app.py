from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize Flask extensions
db = SQLAlchemy()

def create_app():
    # Create and configure the app
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    # Initialize CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
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
        return {"message": "Welcome to the ML-Based Student Progress Improvement System API!"}
    
    return app