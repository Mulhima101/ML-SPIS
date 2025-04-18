from flask import Blueprint, request, jsonify
from models.UserModel import Professor
from app import db
from utils.jwt_utils import token_required

professor_bp = Blueprint('professor', __name__)

@professor_bp.route('/<int:professor_id>', methods=['GET'])
@token_required
def get_professor(current_user, professor_id):
    """Get a specific professor (professors only)"""
    if current_user.user_type != 'professor' and current_user.id != professor_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get professor
    professor = Professor.query.get(professor_id)
    if not professor:
        return jsonify({'message': 'Professor not found'}), 404
    
    return jsonify({'professor': professor.to_dict()}), 200

@professor_bp.route('/<int:professor_id>/profile', methods=['PUT'])
@token_required
def update_profile(current_user, professor_id):
    """Update a professor's profile"""
    # Authorization check
    if current_user.user_type != 'professor' or current_user.id != professor_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get professor
    professor = Professor.query.get(professor_id)
    if not professor:
        return jsonify({'message': 'Professor not found'}), 404
    
    # Update profile
    data = request.get_json()
    
    if 'firstName' in data:
        professor.first_name = data['firstName']
    if 'lastName' in data:
        professor.last_name = data['lastName']
    if 'honorifics' in data:
        professor.honorifics = data['honorifics']
    if 'faculty' in data:
        professor.faculty = data['faculty']
    if 'password' in data:
        professor.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'professor': professor.to_dict()
    }), 200

@professor_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard_data(current_user):
    """Get dashboard data for a professor"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Count students, quizzes, etc.
    from models.UserModel import Student
    from models.QuizModel import Quiz
    from models.ProgressModel import StudentQuiz
    
    students_count = Student.query.count()
    quizzes_count = Quiz.query.count()
    completed_quizzes = StudentQuiz.query.filter_by(status='completed').count()
    
    return jsonify({
        'students_count': students_count,
        'quizzes_count': quizzes_count,
        'completed_quizzes': completed_quizzes
    }), 200