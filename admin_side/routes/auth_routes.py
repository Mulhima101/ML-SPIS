from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models.UserModel import User, Student, Professor
from app import db
from utils.jwt_utils import generate_token
from sqlalchemy.exc import OperationalError, DisconnectionError
from sqlalchemy import text
import time

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    
    try:
        # Check if email already exists with retry logic
        existing_user = None
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            try:
                existing_user = User.query.filter_by(email=data['email']).first()
                break
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    current_app.logger.error(f"Database connection failed after {max_retries} retries: {str(e)}")
                    return jsonify({'message': 'Database connection error. Please try again.'}), 500
                
                # Wait a bit before retrying
                import time
                time.sleep(0.5)
                
                # Try to reconnect
                try:
                    db.session.rollback()
                    db.session.close()
                except:
                    pass
        
        if existing_user:
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new student
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
        
        # Save to database with retry logic
        retry_count = 0
        while retry_count < max_retries:
            try:
                db.session.add(student)
                db.session.commit()
                break
            except Exception as e:
                retry_count += 1
                db.session.rollback()
                
                if retry_count >= max_retries:
                    current_app.logger.error(f"Failed to save student after {max_retries} retries: {str(e)}")
                    return jsonify({'message': 'Registration failed due to database error. Please try again.'}), 500
                
                # Wait a bit before retrying
                import time
                time.sleep(0.5)
        
        return jsonify({
            'success': True,
            'message': 'Student registered successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': 'Registration failed. Please try again.'}), 500

@auth_bp.route('/register/professor', methods=['POST'])
def register_professor():
    data = request.get_json()
    
    try:
        # Check if email already exists with retry logic
        existing_user = None
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            try:
                existing_user = User.query.filter_by(email=data['email']).first()
                break
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    current_app.logger.error(f"Database connection failed after {max_retries} retries: {str(e)}")
                    return jsonify({'message': 'Database connection error. Please try again.'}), 500
                
                # Wait a bit before retrying
                import time
                time.sleep(0.5)
                
                # Try to reconnect
                try:
                    db.session.rollback()
                    db.session.close()
                except:
                    pass
        
        if existing_user:
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new professor
        professor = Professor(
            email=data['email'],
            first_name=data['firstName'],
            last_name=data['lastName'],
            honorifics=data.get('honorifics', ''),
            faculty=data.get('faculty', '')
        )
        professor.set_password(data['password'])
        
        # Save to database with retry logic
        retry_count = 0
        while retry_count < max_retries:
            try:
                db.session.add(professor)
                db.session.commit()
                break
            except Exception as e:
                retry_count += 1
                db.session.rollback()
                
                if retry_count >= max_retries:
                    current_app.logger.error(f"Failed to save professor after {max_retries} retries: {str(e)}")
                    return jsonify({'message': 'Registration failed due to database error. Please try again.'}), 500
                
                # Wait a bit before retrying
                import time
                time.sleep(0.5)
        
        return jsonify({
            'success': True,
            'message': 'Professor registered successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': 'Registration failed. Please try again.'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Database connection with improved error handling
        user = None
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                # Test database connection first - fix textual SQL
                db.session.execute(text('SELECT 1'))
                
                # Find user
                user = User.query.filter_by(email=email).first()
                break
                
            except (OperationalError, DisconnectionError) as e:
                current_app.logger.warning(f"Database connection attempt {attempt + 1} failed: {str(e)}")
                
                if attempt < max_retries - 1:
                    # Clean up session and wait before retry
                    try:
                        db.session.rollback()
                        db.session.close()
                    except:
                        pass
                    
                    # Recreate engine connection
                    db.engine.dispose()
                    time.sleep(1)
                else:
                    current_app.logger.error(f"All database connection attempts failed: {str(e)}")
                    return jsonify({'message': 'Database temporarily unavailable. Please try again in a moment.'}), 503
            
            except Exception as e:
                current_app.logger.error(f"Unexpected error during login: {str(e)}")
                return jsonify({'message': 'An error occurred during login'}), 500
        
        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401
            
        if not user.check_password(password):
            return jsonify({'message': 'Invalid email or password'}), 401

        token = generate_token(user.id, user.user_type)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'An error occurred during login'}), 500

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