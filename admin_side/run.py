# admin_side/run.py
from app import create_app
import os

app = create_app()

# Add some basic setup for first run
if not os.path.exists('instance/mlspis.db'):
    with app.app_context():
        # Import models to ensure they're registered with SQLAlchemy
        from models.UserModel import User, Student, Professor
        from models.QuizModel import Quiz, Question
        from models.ProgressModel import StudentQuiz, StudentAnswer, KnowledgeLevel
        
        # Create database tables
        from app import db
        db.create_all()
        
        print("Database initialized successfully!")

if __name__ == '__main__':
    app.run(debug=True)