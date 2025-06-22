from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
from app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'student' or 'professor'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __mapper_args__ = {
        'polymorphic_on': user_type,
        'polymorphic_identity': 'user'
    }
    
    def set_password(self, password):
        if not password:
            raise ValueError("Password cannot be empty")
        try:
            self.password_hash = generate_password_hash(
                password,
                method='pbkdf2:sha256:260000'
            )
            current_app.logger.debug(f"Password hash generated: {self.password_hash[:20]}...")
        except Exception as e:
            current_app.logger.error(f"Error generating password hash: {str(e)}")
            raise
        
    def check_password(self, password):
        if not self.password_hash:
            current_app.logger.error(f"User {self.id} has no password hash")
            return False
        try:
            result = check_password_hash(self.password_hash, password)
            current_app.logger.debug(f"Password hash for comparison: {self.password_hash[:20]}...")
            return result
        except Exception as e:
            current_app.logger.error(f"Password check error for user {self.id}: {str(e)}")
            return False
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'userType': self.user_type
        }

class Student(User):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    student_id = db.Column(db.String(64), unique=True)
    faculty = db.Column(db.String(64))
    intake_no = db.Column(db.String(10))
    academic_year = db.Column(db.String(10))
    
    __mapper_args__ = {
        'polymorphic_identity': 'student'
    }
    
    def to_dict(self):
        data = super().to_dict()
        data.update({
            'studentId': self.student_id,
            'faculty': self.faculty,
            'intakeNo': self.intake_no,
            'academicYear': self.academic_year
        })
        return data

class Professor(User):
    __tablename__ = 'professors'
    
    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    honorifics = db.Column(db.String(10))
    faculty = db.Column(db.String(64))
    
    # Add the missing relationships
    modules = db.relationship('Module', back_populates='professor', lazy=True)
    created_quizzes = db.relationship('Quiz', backref='professor', lazy=True)
    
    __mapper_args__ = {
        'polymorphic_identity': 'professor'
    }
    
    def to_dict(self):
        data = super().to_dict()
        data.update({
            'honorifics': self.honorifics,
            'faculty': self.faculty
        })
        return data