from flask import Blueprint, request, jsonify
from models.ModuleModel import Module
from models.QuizModel import Quiz
from models.ProgressModel import StudentQuiz
from app import db
from utils.jwt_utils import token_required
from sqlalchemy.orm import joinedload
from datetime import datetime

module_bp = Blueprint('modules', __name__)

@module_bp.route('/available', methods=['GET'])
@token_required
def get_available_modules(current_user):
    """Get all available modules with their quizzes (for students)"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get all modules with their quizzes
        modules = Module.query.options(joinedload(Module.quizzes)).all()
        
        module_list = []
        for module in modules:
            # Get quizzes assigned to this student in this module
            student_quizzes = StudentQuiz.query.filter_by(
                student_id=current_user.id
            ).join(Quiz).filter(Quiz.module_id == module.id).all()
            
            # Build quiz data for this module
            quiz_data = []
            for sq in student_quizzes:
                quiz = Quiz.query.get(sq.quiz_id)
                if quiz:
                    # Check if quiz is currently available
                    now = datetime.utcnow()
                    is_available = True
                    if quiz.start_time and quiz.end_time:
                        is_available = quiz.start_time <= now <= quiz.end_time
                    
                    quiz_info = {
                        'id': quiz.id,
                        'title': quiz.title,
                        'description': quiz.description,
                        'duration_minutes': quiz.duration_minutes,
                        'status': sq.status,
                        'score': sq.score,
                        'is_available': is_available,
                        'can_start': is_available and sq.status == 'uncompleted' and not sq.start_time,
                        'can_continue': sq.status == 'uncompleted' and sq.start_time is not None,
                        'is_completed': sq.status == 'completed',
                        'start_time': quiz.start_time.isoformat() if quiz.start_time else None,
                        'end_time': quiz.end_time.isoformat() if quiz.end_time else None
                    }
                    quiz_data.append(quiz_info)
            
            # Only include modules that have quizzes assigned to the student
            if quiz_data:
                module_info = {
                    'id': module.id,
                    'name': module.name,
                    'description': module.description,
                    'created_at': module.created_at.isoformat(),
                    'quizzes': quiz_data,
                    'total_quizzes': len(quiz_data),
                    'completed_quizzes': len([q for q in quiz_data if q['is_completed']]),
                    'available_quizzes': len([q for q in quiz_data if q['is_available']])
                }
                module_list.append(module_info)
        
        return jsonify({
            'modules': module_list,
            'total': len(module_list)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch modules: {str(e)}'}), 500

@module_bp.route('/<int:module_id>', methods=['GET'])
@token_required
def get_module_details(current_user, module_id):
    """Get detailed information about a specific module (for students)"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get the module
        module = Module.query.get(module_id)
        if not module:
            return jsonify({'message': 'Module not found'}), 404
        
        # Get student's quizzes for this module
        student_quizzes = StudentQuiz.query.filter_by(
            student_id=current_user.id
        ).join(Quiz).filter(Quiz.module_id == module_id).all()
        
        # If student has no quizzes in this module, they shouldn't access it
        if not student_quizzes:
            return jsonify({'message': 'Not authorized to access this module'}), 403
        
        # Build detailed quiz information
        quiz_details = []
        for sq in student_quizzes:
            quiz = Quiz.query.get(sq.quiz_id)
            if quiz:
                now = datetime.utcnow()
                is_available = True
                if quiz.start_time and quiz.end_time:
                    is_available = quiz.start_time <= now <= quiz.end_time
                
                quiz_info = {
                    'id': quiz.id,
                    'title': quiz.title,
                    'description': quiz.description,
                    'duration_minutes': quiz.duration_minutes,
                    'status': sq.status,
                    'score': sq.score,
                    'start_time': sq.start_time.isoformat() if sq.start_time else None,
                    'end_time': sq.end_time.isoformat() if sq.end_time else None,
                    'is_available': is_available,
                    'can_start': is_available and sq.status == 'uncompleted' and not sq.start_time,
                    'can_continue': sq.status == 'uncompleted' and sq.start_time is not None,
                    'is_completed': sq.status == 'completed',
                    'quiz_start_time': quiz.start_time.isoformat() if quiz.start_time else None,
                    'quiz_end_time': quiz.end_time.isoformat() if quiz.end_time else None,
                    'created_at': quiz.created_at.isoformat()
                }
                quiz_details.append(quiz_info)
        
        # Calculate module progress
        total_quizzes = len(quiz_details)
        completed_quizzes = len([q for q in quiz_details if q['is_completed']])
        average_score = 0
        if completed_quizzes > 0:
            scores = [q['score'] for q in quiz_details if q['score'] is not None]
            average_score = sum(scores) / len(scores) if scores else 0
        
        module_data = {
            'id': module.id,
            'name': module.name,
            'description': module.description,
            'created_at': module.created_at.isoformat(),
            'quizzes': quiz_details,
            'progress': {
                'total_quizzes': total_quizzes,
                'completed_quizzes': completed_quizzes,
                'completion_percentage': (completed_quizzes / total_quizzes * 100) if total_quizzes > 0 else 0,
                'average_score': average_score
            }
        }
        
        return jsonify({
            'module': module_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch module details: {str(e)}'}), 500
