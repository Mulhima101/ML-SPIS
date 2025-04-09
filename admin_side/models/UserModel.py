from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
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
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
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