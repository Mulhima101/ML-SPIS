from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.UserModel import User, Student, Professor
from app import db
from utils.jwt_utils import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    # Create new student
    try:
        # Create user/student
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
        
        # Save to database
        db.session.add(student)
        db.session.commit()
        
        # Generate token
        token = generate_token(student.id, 'student')
        
        return jsonify({
            'message': 'Student registered successfully',
            'token': token,
            'user': student.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/register/professor', methods=['POST'])
def register_professor():
    data = request.get_json()
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    # Create new professor
    try:
        # Create user/professor
        professor = Professor(
            email=data['email'],
            first_name=data['firstName'],
            last_name=data['lastName'],
            honorifics=data.get('honorifics', ''),
            faculty=data.get('faculty', '')
        )
        professor.set_password(data['password'])
        
        # Save to database
        db.session.add(professor)
        db.session.commit()
        
        # Generate token
        token = generate_token(professor.id, 'professor')
        
        return jsonify({
            'message': 'Professor registered successfully',
            'token': token,
            'user': professor.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Verify credentials
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    # Generate token
    token = generate_token(user.id, user.user_type)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify if a token is valid and return user info"""
    from utils.jwt_utils import decode_token
    
    # Get token from request
    data = request.get_json()
    token = data.get('token', '')
    
    if not token:
        return jsonify({'valid': False, 'message': 'No token provided'}), 400
    
    try:
        # Decode the token
        payload = decode_token(token)
        
        # Get user from database
        user_id = int(payload.get('sub'))
        user_type = payload.get('type')
        
        # Find the user
        if user_type == 'student':
            user = Student.query.get(user_id)
        elif user_type == 'professor':
            user = Professor.query.get(user_id)
        else:
            user = User.query.get(user_id)
        
        if not user:
            return jsonify({'valid': False, 'message': 'User not found'}), 404
        
        # Return user info
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'valid': False, 'message': str(e)}), 401