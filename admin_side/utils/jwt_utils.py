# admin_side/utils/jwt_utils.py
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timedelta

def generate_token(user_id, user_type):
    """Generate a JWT token for a user"""
    payload = {
        'exp': datetime.utcnow() + timedelta(hours=24),  # Token expires in 24 hours
        'iat': datetime.utcnow(),
        'sub': str(user_id),
        'type': user_type
    }
    
    return jwt.encode(
        payload,
        current_app.config.get('JWT_SECRET_KEY'),
        algorithm='HS256'
    )

def decode_token(token):
    """Decode a JWT token and return the payload"""
    try:
        # Decode token
        payload = jwt.decode(
            token, 
            current_app.config.get('JWT_SECRET_KEY'), 
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')

def token_required(f):
    """Decorator for endpoints that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Handle both "Bearer <token>" and just "<token>" formats
                if auth_header.startswith('Bearer '):
                    token = auth_header.split("Bearer ")[1].strip()
                else:
                    token = auth_header.strip()
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Decode token
            from models.UserModel import User, Student, Professor
            payload = decode_token(token)
            user_id = payload['sub']
            user_type = payload.get('type')
            
            # Get user from database based on type
            if user_type == 'student':
                current_user = Student.query.get(user_id)
            elif user_type == 'professor':
                current_user = Professor.query.get(user_id)
            else:
                current_user = User.query.get(user_id)
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            
        except Exception as e:
            return jsonify({'message': f'Token error: {str(e)}'}), 401
        
        # Pass user to route
        return f(current_user, *args, **kwargs)
    
    return decorated