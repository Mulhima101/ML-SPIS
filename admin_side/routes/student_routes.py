from flask import Blueprint, request, jsonify
from models.UserModel import Student
from models.ProgressModel import KnowledgeLevel, StudentQuiz
from app import db
from utils.jwt_utils import token_required
from services.ml_service import get_personalized_guidance

student_bp = Blueprint('student', __name__)

@student_bp.route('/', methods=['GET'])
@token_required
def get_all_students(current_user):
    """Get all students (professors only)"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get all students
    students = Student.query.all()
    
    return jsonify({
        'students': [student.to_dict() for student in students]
    }), 200

@student_bp.route('/<int:student_id>', methods=['GET'])
@token_required
def get_student(current_user, student_id):
    """Get a specific student (professors or the student themselves)"""
    # Authorization check
    if current_user.user_type != 'professor' and current_user.id != student_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    return jsonify({'student': student.to_dict()}), 200

@student_bp.route('/<int:student_id>/knowledge', methods=['GET'])
@token_required
def get_knowledge_levels(current_user, student_id):
    """Get knowledge levels for a student"""
    # Authorization check
    if current_user.user_type != 'professor' and current_user.id != student_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    # Get knowledge levels
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    # Calculate overall level
    levels = [kl.score for kl in knowledge_levels]
    overall_score = sum(levels) / len(levels) if levels else 0
    
    # Determine overall level category
    if overall_score < 0.4:
        overall_level = 'Low'
    elif overall_score < 0.7:
        overall_level = 'Normal'
    else:
        overall_level = 'High'
    
    return jsonify({
        'overall': {
            'score': overall_score,
            'level': overall_level
        },
        'topics': [kl.to_dict() for kl in knowledge_levels]
    }), 200

@student_bp.route('/<int:student_id>/guidance', methods=['GET'])
@token_required
def get_guidance(current_user, student_id):
    """Get personalized guidance for a student"""
    # Authorization check
    if current_user.user_type != 'professor' and current_user.id != student_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    # Get personalized guidance
    guidance = get_personalized_guidance(student_id)
    
    return jsonify(guidance), 200

@student_bp.route('/<int:student_id>/quizzes', methods=['GET'])
@token_required
def get_student_quizzes(current_user, student_id):
    """Get quizzes for a student"""
    # Authorization check
    if current_user.user_type != 'professor' and current_user.id != student_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    # Get student quizzes
    student_quizzes = StudentQuiz.query.filter_by(student_id=student_id).all()
    
    result = []
    for sq in student_quizzes:
        # Get the quiz
        quiz = sq.quiz
        if not quiz:
            continue
        
        # Build response data
        quiz_data = quiz.to_dict()
        quiz_data.update({
            'status': sq.status,
            'score': sq.score,
            'start_time': sq.start_time.isoformat() if sq.start_time else None,
            'end_time': sq.end_time.isoformat() if sq.end_time else None
        })
        result.append(quiz_data)
    
    return jsonify({'quizzes': result}), 200

@student_bp.route('/<int:student_id>/profile', methods=['PUT'])
@token_required
def update_profile(current_user, student_id):
    """Update a student's profile"""
    # Authorization check
    if current_user.user_type != 'professor' and current_user.id != student_id:
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    # Update profile
    data = request.get_json()
    
    if 'firstName' in data:
        student.first_name = data['firstName']
    if 'lastName' in data:
        student.last_name = data['lastName']
    if 'studentId' in data:
        student.student_id = data['studentId']
    if 'faculty' in data:
        student.faculty = data['faculty']
    if 'intakeNo' in data:
        student.intake_no = data['intakeNo']
    if 'academicYear' in data:
        student.academic_year = data['academicYear']
    if 'password' in data:
        student.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'student': student.to_dict()
    }), 200