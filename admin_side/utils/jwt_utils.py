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
        'sub': user_id,
        'type': user_type
    }
    
    return jwt.encode(
        payload,
        current_app.config.get('JWT_SECRET_KEY'),
        algorithm='HS256'
    )

def token_required(f):
    """Decorator for endpoints that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Decode token
            from models.UserModel import User
            data = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY'), algorithms=['HS256'])
            
            # Get user from database
            current_user = User.query.get(data['sub'])
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'message': f'Token error: {str(e)}'}), 401
        
        # Pass user to route
        return f(current_user, *args, **kwargs)
    
    return decorated