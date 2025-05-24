# admin_side/run.py
from app import create_app
import os
from sqlalchemy.exc import OperationalError
import sys

app = create_app()

# Add some basic setup for first run
with app.app_context():
    try:
        # Import models to ensure they're registered with SQLAlchemy
        from models.UserModel import User, Student, Professor
        from models.QuizModel import Quiz, Question
        from models.ProgressModel import StudentQuiz, StudentAnswer, KnowledgeLevel
        
        # Create database tables
        from app import db
        db.create_all()
        
        print("Database initialized successfully!")
        
    except OperationalError as e:
        print(f"Error connecting to database: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred while initializing the database: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    app.run(debug=True)