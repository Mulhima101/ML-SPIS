from app import create_app, db
from models.UserModel import User, Student, Professor
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz, StudentAnswer, KnowledgeLevel

app = create_app()

def update_database():
    """Drop and recreate all tables with new schema"""
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        
        print("Creating all tables with new schema...")
        db.create_all()
        
        print("Database updated successfully!")

if __name__ == '__main__':
    update_database()
