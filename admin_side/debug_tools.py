# admin_side/debug_tools.py
import sys
import os
from flask import Flask
from app import create_app, db
from models.UserModel import User, Student, Professor
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz, StudentAnswer, KnowledgeLevel
from services.ml_service import update_knowledge_levels, get_personalized_guidance
from utils.csv_utils import get_questions_from_csv
from services.quiz_service import generate_quiz_for_student

app = create_app()

def create_test_data():
    """Create test data for debugging"""
    with app.app_context():
        # Create test student
        student = Student.query.filter_by(email='test@example.com').first()
        if not student:
            student = Student(
                email='test@example.com',
                first_name='Test',
                last_name='Student',
                student_id='TEST001',
                faculty='Test Faculty',
                intake_no='6',
                academic_year='2024'
            )
            student.set_password('password')
            db.session.add(student)
            db.session.commit()
            print(f"Created test student with ID {student.id}")
        else:
            print(f"Using existing test student with ID {student.id}")
        
        # Create test professor
        professor = Professor.query.filter_by(email='prof@example.com').first()
        if not professor:
            professor = Professor(
                email='prof@example.com',
                first_name='Test',
                last_name='Professor',
                honorifics='Dr.',
                faculty='Test Faculty'
            )
            professor.set_password('password')
            db.session.add(professor)
            db.session.commit()
            print(f"Created test professor with ID {professor.id}")
        else:
            print(f"Using existing test professor with ID {professor.id}")
        
        # Test reading questions from CSV
        try:
            questions = get_questions_from_csv()
            print(f"Successfully read {len(questions)} questions from CSV")
            if questions:
                print(f"Sample question: {questions[0]}")
        except Exception as e:
            print(f"Error reading questions from CSV: {str(e)}")
        
        # Generate a test quiz
        try:
            quiz = generate_quiz_for_student(student, "Test Quiz")
            print(f"Successfully generated quiz with ID {quiz.id}")
        except Exception as e:
            print(f"Error generating quiz: {str(e)}")
        
        # Test guidance generation
        try:
            guidance = get_personalized_guidance(student.id)
            print(f"Successfully generated guidance: {guidance}")
        except Exception as e:
            print(f"Error generating guidance: {str(e)}")

if __name__ == '__main__':
    create_test_data()