from models.UserModel import User, Student, Professor
from app import db

def get_user_by_id(user_id, user_type=None):
    """Get a user by ID and optionally filter by type"""
    if user_type == 'student':
        return Student.query.get(user_id)
    elif user_type == 'professor':
        return Professor.query.get(user_id)
    else:
        return User.query.get(user_id)

def get_user_by_email(email):
    """Get a user by email"""
    return User.query.filter_by(email=email).first()

def create_student(data):
    """Create a new student"""
    student = Student(
        email=data['email'],
        first_name=data['firstName'],
        last_name=data['lastName'],
        student_id=data.get('studentId', ''),
        faculty=data.get('faculty', ''),
        intake_no=data.get('intakeNo', ''),
        academic_year=data.get('academicYear', '')
    )
    student.set_password(data['password'])
    
    db.session.add(student)
    db.session.commit()
    
    return student

def create_professor(data):
    """Create a new professor"""
    professor = Professor(
        email=data['email'],
        first_name=data['firstName'],
        last_name=data['lastName'],
        honorifics=data.get('honorifics', ''),
        faculty=data.get('faculty', '')
    )
    professor.set_password(data['password'])
    
    db.session.add(professor)
    db.session.commit()
    
    return professor