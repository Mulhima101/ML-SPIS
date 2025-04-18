from flask import Blueprint, request, jsonify
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz, StudentAnswer
from models.UserModel import Student
from app import db
from datetime import datetime
from utils.jwt_utils import token_required
from services.quiz_service import generate_quiz_for_student

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/', methods=['GET'])
@token_required
def get_all_quizzes(current_user):
    """Get all quizzes (different behavior for students and professors)"""
    if current_user.user_type == 'professor':
        # Professors see all quizzes
        quizzes = Quiz.query.all()
        return jsonify({
            'quizzes': [quiz.to_dict() for quiz in quizzes]
        }), 200
    else:
        # Students see only quizzes assigned to them
        student_quizzes = StudentQuiz.query.filter_by(student_id=current_user.id).all()
        quiz_data = []
        
        for sq in student_quizzes:
            quiz = Quiz.query.get(sq.quiz_id)
            if quiz:
                quiz_dict = quiz.to_dict()
                quiz_dict['status'] = sq.status
                quiz_dict['score'] = sq.score
                quiz_dict['student_quiz_id'] = sq.id
                quiz_data.append(quiz_dict)
        
        return jsonify({
            'quizzes': quiz_data
        }), 200

@quiz_bp.route('/', methods=['POST'])
@token_required
def create_quiz(current_user):
    """Create a new quiz (professors only)"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    # Create quiz
    new_quiz = Quiz(
        title=data['title'],
        description=data.get('description', ''),
        start_time=datetime.fromisoformat(data['start_time']) if 'start_time' in data else None,
        end_time=datetime.fromisoformat(data['end_time']) if 'end_time' in data else None,
        duration_minutes=data.get('duration_minutes', 20)
    )
    
    db.session.add(new_quiz)
    db.session.commit()
    
    # Add questions to quiz
    if 'questions' in data:
        for q_data in data['questions']:
            question = Question(
                quiz_id=new_quiz.id,
                text=q_data['text'],
                option_1=q_data['options'][0],
                option_2=q_data['options'][1],
                option_3=q_data['options'][2],
                option_4=q_data['options'][3],
                correct_answer=q_data['correct_answer'],
                weight=q_data.get('weight', 1.0),
                topic=q_data.get('topic', ''),
                source_qid=q_data.get('source_qid', '')
            )
            db.session.add(question)
        
        db.session.commit()
    
    return jsonify({
        'message': 'Quiz created successfully',
        'quiz': new_quiz.to_dict()
    }), 201

@quiz_bp.route('/generate', methods=['POST'])
@token_required
def generate_quiz(current_user):
    """Generate a quiz for a student (professors only)"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    student_id = data['student_id']
    title = data['title']
    num_questions = data.get('num_questions', 15)
    
    try:
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        
        # Generate quiz
        quiz = generate_quiz_for_student(student, title, num_questions)
        
        return jsonify({
            'message': 'Quiz generated successfully',
            'quiz': quiz.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to generate quiz: {str(e)}'}), 500

@quiz_bp.route('/<int:quiz_id>', methods=['GET'])
@token_required
def get_quiz(current_user, quiz_id):
    """Get a specific quiz with its questions"""
    quiz = Quiz.query.get(quiz_id)
    
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    # Check authorization
    if current_user.user_type == 'student':
        # Students can only access quizzes assigned to them
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Not authorized to access this quiz'}), 403
    
    # Get quiz with questions
    quiz_data = quiz.to_dict()
    quiz_data['questions'] = [q.to_dict(include_answer=(current_user.user_type == 'professor')) 
                             for q in quiz.questions]
    
    return jsonify({'quiz': quiz_data}), 200

@quiz_bp.route('/<int:quiz_id>/start', methods=['POST'])
@token_required
def start_quiz(current_user, quiz_id):
    """Start a quiz for a student"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Only students can start quizzes'}), 403
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    # Check if student has already started this quiz
    student_quiz = StudentQuiz.query.filter_by(
        student_id=current_user.id,
        quiz_id=quiz_id
    ).first()
    
    if student_quiz:
        if student_quiz.status == 'completed':
            return jsonify({'message': 'Quiz already completed'}), 400
    else:
        # Create new student quiz record
        student_quiz = StudentQuiz(
            student_id=current_user.id,
            quiz_id=quiz_id,
            status='uncompleted',
            start_time=datetime.utcnow()
        )
        db.session.add(student_quiz)
        db.session.commit()
    
    return jsonify({
        'message': 'Quiz started successfully',
        'student_quiz_id': student_quiz.id
    }), 200

@quiz_bp.route('/<int:quiz_id>/submit', methods=['POST'])
@token_required
def submit_quiz(current_user, quiz_id):
    """Submit answers for a quiz"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Only students can submit quizzes'}), 403
    
    data = request.get_json()
    answers = data.get('answers', [])
    
    # Check if student has started this quiz
    student_quiz = StudentQuiz.query.filter_by(
        student_id=current_user.id,
        quiz_id=quiz_id,
        status='uncompleted'
    ).first()
    
    if not student_quiz:
        return jsonify({'message': 'Quiz not found or already completed'}), 400
    
    try:
        # Process answers
        total_points = 0
        max_points = 0
        
        for answer_data in answers:
            question_id = answer_data['question_id']
            selected_option = answer_data['selected_option']
            
            # Get the question
            question = Question.query.get(question_id)
            if not question:
                continue
            
            # Check if answer is correct
            is_correct = (selected_option == question.correct_answer)
            
            # Add points if correct
            if is_correct:
                total_points += question.weight
            
            max_points += question.weight
            
            # Save student answer
            student_answer = StudentAnswer(
                student_quiz_id=student_quiz.id,
                question_id=question_id,
                selected_option=selected_option,
                is_correct=is_correct
            )
            db.session.add(student_answer)
        
        # Calculate score as percentage
        score = (total_points / max_points * 100) if max_points > 0 else 0
        
        # Update student quiz record
        student_quiz.status = 'completed'
        student_quiz.end_time = datetime.utcnow()
        student_quiz.score = score
        
        db.session.commit()
        
        # Update knowledge levels (this would be done by a background task in production)
        from services.ml_service import update_knowledge_levels
        update_knowledge_levels(current_user.id)
        
        return jsonify({
            'message': 'Quiz submitted successfully',
            'score': score
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to submit quiz: {str(e)}'}), 500