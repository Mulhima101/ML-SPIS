from flask import Blueprint, request, jsonify
from models.UserModel import Student
from models.ProgressModel import KnowledgeLevel, StudentQuiz, StudentAnswer
from models.QuizModel import Quiz, Question
from models.ModuleModel import Module
from app import db
from utils.jwt_utils import token_required
from services.ml_service import get_personalized_guidance, update_knowledge_levels
from sqlalchemy.orm import joinedload
from datetime import datetime
from services.quiz_service import is_quiz_available
from utils.timezone_utils import get_ist_datetime_for_db, format_ist_datetime, convert_utc_to_ist_naive, get_current_ist_naive

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
    
    # Get student quizzes with module names
    student_quizzes = StudentQuiz.query.filter_by(student_id=student_id).options(joinedload(StudentQuiz.quiz).joinedload('module')).all()
    
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

@student_bp.route('/quiz-participants', methods=['GET'])
@token_required
def get_quiz_participants(current_user):
    """Get all students in the system"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get all students from the students table
    all_students = Student.query.all()
    
    print(f"Found {len(all_students)} total students in database")
    
    # Format response according to specified format
    student_list = []
    for student in all_students:
        student_data = {
            'id': student.id,
            'firstName': student.first_name,
            'lastName': student.last_name,
            'email': student.email,
            'studentId': student.student_id
        }
        
        student_list.append(student_data)
        print(f"Processed student: {student.first_name} {student.last_name}")
    
    return jsonify({
        'students': student_list,
        'total': len(student_list)
    }), 200

@student_bp.route('/debug-db', methods=['GET'])
@token_required
def debug_database_state(current_user):
    """Debug endpoint to check database state"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Check all students in users table
    all_students = Student.query.all()
    
    # Check all student_quizzes records
    all_student_quizzes = StudentQuiz.query.all()
    
    # Check all quizzes
    all_quizzes = Quiz.query.all()
    
    # Format detailed response
    students_info = []
    for student in all_students:
        # Count quizzes for this student
        quiz_count = StudentQuiz.query.filter_by(student_id=student.id).count()
        students_info.append({
            'id': student.id,
            'firstName': student.first_name,
            'lastName': student.last_name,
            'email': student.email,
            'studentId': student.student_id,
            'quiz_count': quiz_count
        })
    
    quiz_assignments = []
    for sq in all_student_quizzes:
        student = Student.query.get(sq.student_id)
        quiz = Quiz.query.get(sq.quiz_id)
        quiz_assignments.append({
            'student_quiz_id': sq.id,
            'student_id': sq.student_id,
            'student_name': f"{student.first_name} {student.last_name}" if student else "Unknown",
            'quiz_id': sq.quiz_id,
            'quiz_title': quiz.title if quiz else "Unknown",
            'status': sq.status
        })
    
    return jsonify({
        'total_students': len(all_students),
        'total_student_quizzes': len(all_student_quizzes),
        'total_quizzes': len(all_quizzes),
        'students': students_info,
        'quiz_assignments': quiz_assignments
    }), 200

@student_bp.route('/quizzes', methods=['GET'])
@token_required
def get_student_quizzes_list(current_user):
    """Get all quizzes assigned to the current student"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get all quizzes assigned to this student with proper eager loading
        student_quizzes = StudentQuiz.query.filter_by(
            student_id=current_user.id
        ).options(
            joinedload(StudentQuiz.quiz).joinedload(Quiz.module)
        ).order_by(StudentQuiz.created_at.desc()).all()
        
        quiz_list = []
        for sq in student_quizzes:
            quiz = sq.quiz
            if not quiz:
                continue
            
            # Check if quiz is currently available
            now = datetime.utcnow()
            is_available = True
            if quiz.start_time and quiz.end_time:
                is_available = quiz.start_time <= now <= quiz.end_time
            
            quiz_data = {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'module_name': quiz.module.name if quiz.module else None,
                'duration_minutes': quiz.duration_minutes,
                'status': sq.status,
                'score': sq.score,
                'start_time': sq.start_time.isoformat() if sq.start_time else None,
                'end_time': sq.end_time.isoformat() if sq.end_time else None,
                'created_at': sq.created_at.isoformat(),
                'is_available': is_available,
                'can_start': is_available and sq.status == 'uncompleted' and not sq.start_time,
                'can_continue': sq.status == 'uncompleted' and sq.start_time is not None,
                'is_completed': sq.status == 'completed',
                'quiz_start_time': quiz.start_time.isoformat() if quiz.start_time else None,
                'quiz_end_time': quiz.end_time.isoformat() if quiz.end_time else None
            }
            
            quiz_list.append(quiz_data)
        
        return jsonify({
            'quizzes': quiz_list,
            'total': len(quiz_list)
        }), 200
        
    except Exception as e:
        print(f"Error in get_student_quizzes_list: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to fetch quizzes: {str(e)}'}), 500

@student_bp.route('/quizzes/<int:quiz_id>/questions', methods=['GET'])
@token_required
def get_quiz_questions_for_student(current_user, quiz_id):
    """Get quiz questions for a student"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Check if the student has access to this quiz
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Quiz not found or not assigned to you'}), 404
        
        # Get the quiz
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        # Check if quiz is available using the improved function with IST time
        current_ist_time = get_ist_datetime_for_db()
        is_available, availability_message = is_quiz_available(quiz, current_ist_time)
        if not is_available:
            return jsonify({
                'message': availability_message,
                'quiz_start_time': format_ist_datetime(quiz.start_time),
                'quiz_end_time': format_ist_datetime(quiz.end_time),
                'current_time_ist': format_ist_datetime(current_ist_time)
            }), 403
        
        # Check if student has already completed the quiz
        if student_quiz.status == 'completed':
            return jsonify({'message': 'Quiz already completed'}), 400
        
        # Start the quiz if not already started using IST time
        if not student_quiz.start_time:
            student_quiz.start_time = current_ist_time
            db.session.commit()
        
        # Get quiz questions (without correct answers)
        questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id).all()
        
        questions_data = []
        for i, question in enumerate(questions):
            # Check if student has already answered this question
            existing_answer = StudentAnswer.query.filter_by(
                student_quiz_id=student_quiz.id,
                question_id=question.id
            ).first()
            
            question_data = {
                'id': question.id,
                'question_number': i + 1,
                'text': question.text,
                'options': [
                    question.option_1,
                    question.option_2,
                    question.option_3,
                    question.option_4
                ],
                'topic': question.topic,
                'points': question.points,
                'selected_answer': existing_answer.selected_option if existing_answer else None
            }
            
            # Filter out empty options
            question_data['options'] = [opt for opt in question_data['options'] if opt.strip()]
            questions_data.append(question_data)

            print(questions_data)
        
        return jsonify({
            'quiz': {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'duration_minutes': quiz.duration_minutes,
                'total_questions': len(questions_data)
            },
            'student_quiz': {
                'id': student_quiz.id,
                'status': student_quiz.status,
                'start_time': student_quiz.start_time.isoformat() if student_quiz.start_time else None,
                'time_remaining': None  # You can calculate this based on duration and start time
            },
            'questions': questions_data
        }), 200
        
    except Exception as e:
        print(f"Error in get_quiz_questions_for_student: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to fetch quiz questions: {str(e)}'}), 500

@student_bp.route('/quizzes/<int:quiz_id>/submit', methods=['POST'])
@token_required
def submit_quiz_answers(current_user, quiz_id):
    """Submit answers for a quiz"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        data = request.get_json()
        answers = data.get('answers', [])
        
        # Get the student quiz
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id,
            status='uncompleted'
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Quiz not found or already completed'}), 400
        
        # Get the quiz
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        # Process each answer
        total_points = 0
        max_points = 0
        
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            selected_option = answer_data.get('selected_option')
            
            # Get the question
            question = Question.query.get(question_id)
            if not question or question.quiz_id != quiz_id:
                continue
            
            # Check if answer already exists
            existing_answer = StudentAnswer.query.filter_by(
                student_quiz_id=student_quiz.id,
                question_id=question_id
            ).first()
            
            # Determine if answer is correct (0-based indexing)
            is_correct = (selected_option == question.correct_answer)
            
            if existing_answer:
                # Update existing answer
                existing_answer.selected_option = selected_option
                existing_answer.is_correct = is_correct
            else:
                # Create new answer
                student_answer = StudentAnswer(
                    student_quiz_id=student_quiz.id,
                    question_id=question_id,
                    selected_option=selected_option,
                    is_correct=is_correct
                )
                db.session.add(student_answer)
            
            # Calculate points
            if is_correct:
                total_points += question.weight
            max_points += question.weight
        
        # Calculate final score
        score = (total_points / max_points * 100) if max_points > 0 else 0
        
        # Update student quiz
        student_quiz.status = 'completed'
        student_quiz.end_time = datetime.utcnow()
        student_quiz.score = score
        
        db.session.commit()
        
        # Update knowledge levels
        try:
            update_knowledge_levels(current_user.id)
        except Exception as e:
            print(f"Error updating knowledge levels: {str(e)}")
        
        return jsonify({
            'message': 'Quiz submitted successfully',
            'score': score,
            'total_points': total_points,
            'max_points': max_points,
            'percentage': score
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in submit_quiz_answers: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to submit quiz: {str(e)}'}), 500

@student_bp.route('/quizzes/<int:quiz_id>/attempt', methods=['GET'])
@token_required
def get_quiz_attempt_details(current_user, quiz_id):
    """Get details of a student's quiz attempt"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get the student quiz
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Quiz attempt not found'}), 404
        
        # Get the quiz
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        # Get all answers for this attempt
        answers = StudentAnswer.query.filter_by(student_quiz_id=student_quiz.id).all()
        
        answer_details = []
        for answer in answers:
            question = Question.query.get(answer.question_id)
            if question:
                answer_details.append({
                    'question_id': question.id,
                    'question_text': question.text,
                    'selected_option': answer.selected_option,
                    'correct_answer': question.correct_answer,
                    'is_correct': answer.is_correct,
                    'topic': question.topic,
                    'points_earned': question.weight if answer.is_correct else 0,
                    'max_points': question.weight
                })
        
        return jsonify({
            'quiz': {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description
            },
            'attempt': {
                'id': student_quiz.id,
                'status': student_quiz.status,
                'score': student_quiz.score,
                'start_time': student_quiz.start_time.isoformat() if student_quiz.start_time else None,
                'end_time': student_quiz.end_time.isoformat() if student_quiz.end_time else None,
                'created_at': student_quiz.created_at.isoformat()
            },
            'answers': answer_details,
            'summary': {
                'total_questions': len(answer_details),
                'correct_answers': sum(1 for a in answer_details if a['is_correct']),
                'total_points': sum(a['points_earned'] for a in answer_details),
                'max_possible_points': sum(a['max_points'] for a in answer_details)
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_quiz_attempt_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to fetch quiz attempt details: {str(e)}'}), 500

@student_bp.route('/quizzes/<int:quiz_id>/debug-time', methods=['GET'])
@token_required
def debug_quiz_time(current_user, quiz_id):
    """Debug endpoint to check quiz timing issues"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get the quiz
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        # Get various time representations
        utc_now = datetime.utcnow()
        ist_now_naive = get_current_ist_naive()
        ist_db_time = get_ist_datetime_for_db()
        
        # The quiz times are stored as naive IST times, not UTC
        # So we should compare them directly with current IST naive time
        quiz_start_ist = quiz.start_time  # Already IST, stored as naive
        quiz_end_ist = quiz.end_time      # Already IST, stored as naive
        
        return jsonify({
            'quiz_id': quiz_id,
            'quiz_times_raw': {
                'start_time': quiz.start_time.isoformat() if quiz.start_time else None,
                'end_time': quiz.end_time.isoformat() if quiz.end_time else None
            },
            'quiz_times_interpretation': {
                'start_time_ist': quiz_start_ist.isoformat() if quiz_start_ist else None,
                'end_time_ist': quiz_end_ist.isoformat() if quiz_end_ist else None,
                'note': 'Quiz times are stored as IST naive datetimes'
            },
            'current_times': {
                'utc_now': utc_now.isoformat(),
                'ist_now_naive': ist_now_naive.isoformat(),
                'ist_db_time': ist_db_time.isoformat()
            },
            'comparisons': {
                'ist_now_vs_quiz_start': {
                    'ist_now_before_start': ist_now_naive < quiz_start_ist if quiz_start_ist else None,
                    'ist_now_after_start': ist_now_naive >= quiz_start_ist if quiz_start_ist else None
                },
                'availability_check': is_quiz_available(quiz, ist_now_naive)
            },
            'timezone_explanation': {
                'issue': 'Quiz times stored as IST but treated as UTC',
                'solution': 'Treat stored times as IST naive datetimes',
                'comparison_method': 'Compare IST naive with IST naive directly'
            }
        }), 200
        
    except Exception as e:
        print(f"Error in debug_quiz_time: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Debug failed: {str(e)}'}), 500

@student_bp.route('/quizzes/<int:quiz_id>/start', methods=['POST'])
@token_required
def start_quiz_for_student(current_user, quiz_id):
    """Start a quiz for the current student"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Check if the student has access to this quiz
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Quiz not found or not assigned to you'}), 404
        
        # Check if quiz is already completed
        if student_quiz.status == 'completed':
            return jsonify({'message': 'Quiz already completed'}), 400
        
        # Check if quiz is already started
        if student_quiz.start_time:
            return jsonify({'message': 'Quiz already started'}), 400
        
        # Get the quiz to check availability
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        # Use current IST time for comparison
        current_ist_time = get_current_ist_naive()
        
        # Check availability with proper timezone handling
        is_available, availability_message = is_quiz_available(quiz, current_ist_time)
        if not is_available:
            return jsonify({
                'message': availability_message,
                'quiz_start_time': quiz.start_time.isoformat() if quiz.start_time else None,
                'quiz_end_time': quiz.end_time.isoformat() if quiz.end_time else None,
                'current_time_ist': current_ist_time.isoformat(),
                'current_time_utc': datetime.utcnow().isoformat(),
                'debug_info': {
                    'quiz_start_raw': quiz.start_time.isoformat() if quiz.start_time else None,
                    'quiz_end_raw': quiz.end_time.isoformat() if quiz.end_time else None,
                    'current_ist_raw': current_ist_time.isoformat(),
                    'timezone_used': 'IST (GMT+5:30)',
                    'note': 'All times compared as IST naive datetimes'
                }
            }), 403
        
        # Start the quiz using IST time
        student_quiz.start_time = current_ist_time
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz started successfully',
            'student_quiz_id': student_quiz.id,
            'start_time': student_quiz.start_time.isoformat(),
            'duration_minutes': quiz.duration_minutes
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in start_quiz_for_student: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to start quiz: {str(e)}'}), 500

@student_bp.route('/quizzes/<int:quiz_id>/results', methods=['GET'])
@token_required
def get_quiz_results(current_user, quiz_id):
    """Get detailed quiz results including all answers and scoring"""
    try:
        # Get the quiz
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        # Authorization check
        if current_user.user_type == 'student':
            # Students can only view their own quiz results
            student_quiz = StudentQuiz.query.filter_by(
                student_id=current_user.id,
                quiz_id=quiz_id
            ).first()
            
            if not student_quiz:
                return jsonify({'message': 'Quiz not found or not assigned to you'}), 404
            
            # Only allow viewing completed quizzes
            if student_quiz.status != 'completed':
                return jsonify({'message': 'Quiz not completed yet'}), 400
            
            student_quizzes = [student_quiz]
            
        elif current_user.user_type == 'professor':
            # Professors can view results for their own quizzes
            if quiz.professor_id != current_user.id:
                return jsonify({'message': 'Not authorized to view this quiz results'}), 403
            
            # Get all student attempts for this quiz
            student_quizzes = StudentQuiz.query.filter_by(
                quiz_id=quiz_id,
                status='completed'
            ).all()
        else:
            return jsonify({'message': 'Not authorized'}), 403
        
        # Prepare results data
        quiz_results = {
            'quiz': {
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'duration_minutes': quiz.duration_minutes,
                'total_questions': Question.query.filter_by(quiz_id=quiz_id).count()
            },
            'results': []
        }
        
        # Process each student's quiz attempt
        for sq in student_quizzes:
            # Get student info
            student = Student.query.get(sq.student_id)
            if not student:
                continue
            
            # Get all answers for this attempt
            answers = StudentAnswer.query.filter_by(student_quiz_id=sq.id).all()
            
            # Get all questions for detailed analysis
            questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id).all()
            
            # Build detailed answer information
            answer_details = []
            total_correct = 0
            total_points = 0
            max_possible_points = 0
            
            for question in questions:
                # Find the student's answer for this question
                student_answer = next(
                    (a for a in answers if a.question_id == question.id), 
                    None
                )
                
                # Calculate points
                question_points = question.weight
                max_possible_points += question_points
                
                if student_answer:
                    is_correct = student_answer.is_correct
                    if is_correct:
                        total_correct += 1
                        total_points += question_points
                    
                    answer_detail = {
                        'question_id': question.id,
                        'question_text': question.text,
                        'question_topic': question.topic,
                        'question_weight': question.weight,
                        'options': [
                            question.option_1,
                            question.option_2,
                            question.option_3,
                            question.option_4
                        ],
                        'correct_answer': question.correct_answer,
                        'student_answer': student_answer.selected_option,
                        'is_correct': is_correct,
                        'points_earned': question_points if is_correct else 0,
                        'answered_at': student_answer.created_at.isoformat()
                    }
                else:
                    # Question not answered
                    answer_detail = {
                        'question_id': question.id,
                        'question_text': question.text,
                        'question_topic': question.topic,
                        'question_weight': question.weight,
                        'options': [
                            question.option_1,
                            question.option_2,
                            question.option_3,
                            question.option_4
                        ],
                        'correct_answer': question.correct_answer,
                        'student_answer': None,
                        'is_correct': False,
                        'points_earned': 0,
                        'answered_at': None
                    }
                
                # Filter out empty options
                answer_detail['options'] = [opt for opt in answer_detail['options'] if opt.strip()]
                answer_details.append(answer_detail)
            
            # Calculate topic-wise performance
            topic_performance = {}
            for answer_detail in answer_details:
                topic = answer_detail['question_topic']
                if topic and topic.strip():
                    if topic not in topic_performance:
                        topic_performance[topic] = {
                            'total_questions': 0,
                            'correct_answers': 0,
                            'total_points': 0,
                            'earned_points': 0
                        }
                    
                    topic_performance[topic]['total_questions'] += 1
                    topic_performance[topic]['total_points'] += answer_detail['question_weight']
                    
                    if answer_detail['is_correct']:
                        topic_performance[topic]['correct_answers'] += 1
                        topic_performance[topic]['earned_points'] += answer_detail['points_earned']
            
            # Calculate topic scores
            for topic in topic_performance:
                perf = topic_performance[topic]
                perf['accuracy'] = (perf['correct_answers'] / perf['total_questions']) * 100 if perf['total_questions'] > 0 else 0
                perf['score_percentage'] = (perf['earned_points'] / perf['total_points']) * 100 if perf['total_points'] > 0 else 0
            
            # Add student result to the results list
            student_result = {
                'student': {
                    'id': student.id,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'email': student.email,
                    'student_id': student.student_id
                } if current_user.user_type == 'professor' else None,
                'attempt': {
                    'id': sq.id,
                    'status': sq.status,
                    'start_time': sq.start_time.isoformat() if sq.start_time else None,
                    'end_time': sq.end_time.isoformat() if sq.end_time else None,
                    'duration_taken': None,  # Calculate if both times available
                    'score_percentage': sq.score,
                    'total_correct': total_correct,
                    'total_questions': len(questions),
                    'total_points': total_points,
                    'max_possible_points': max_possible_points
                },
                'topic_performance': topic_performance,
                'answers': answer_details
            }
            
            # Calculate duration taken if both times are available
            if sq.start_time and sq.end_time:
                duration = sq.end_time - sq.start_time
                student_result['attempt']['duration_taken'] = {
                    'total_seconds': duration.total_seconds(),
                    'minutes': int(duration.total_seconds() // 60),
                    'seconds': int(duration.total_seconds() % 60)
                }
            
            quiz_results['results'].append(student_result)
        
        # Add summary statistics for professors
        if current_user.user_type == 'professor' and quiz_results['results']:
            scores = [result['attempt']['score_percentage'] for result in quiz_results['results'] if result['attempt']['score_percentage'] is not None]
            
            quiz_results['summary'] = {
                'total_attempts': len(quiz_results['results']),
                'average_score': sum(scores) / len(scores) if scores else 0,
                'highest_score': max(scores) if scores else 0,
                'lowest_score': min(scores) if scores else 0,
                'completion_rate': len([r for r in quiz_results['results'] if r['attempt']['status'] == 'completed']) / len(quiz_results['results']) * 100
            }
        
        return jsonify(quiz_results), 200
        
    except Exception as e:
        print(f"Error in get_quiz_results: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to fetch quiz results: {str(e)}'}), 500

@student_bp.route('/module-performance', methods=['GET'])
@token_required
def get_module_performance(current_user):
    """Get module-wise performance for the current student"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get all completed quizzes for this student with module information
        student_quizzes = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            status='completed'
        ).join(Quiz).join(Module).all()
        
        if not student_quizzes:
            return jsonify({
                'modules': [],
                'total_modules': 0,
                'message': 'No completed quizzes found'
            }), 200
        
        # Group quizzes by module
        module_performance = {}
        
        for sq in student_quizzes:
            quiz = sq.quiz
            module = quiz.module
            
            if not module:
                continue  # Skip quizzes without modules
            
            module_id = module.id
            module_name = module.name
            
            # Initialize module data if not exists
            if module_id not in module_performance:
                module_performance[module_id] = {
                    'module_name': module_name,
                    'module_id': module_id,
                    'total_quizzes': 0,
                    'completed_quizzes': 0,
                    'total_score': 0,
                    'quiz_scores': []
                }
            
            # Add quiz score to module performance
            if sq.score is not None:
                module_performance[module_id]['completed_quizzes'] += 1
                module_performance[module_id]['total_score'] += sq.score
                module_performance[module_id]['quiz_scores'].append({
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'score': sq.score,
                    'completed_at': sq.end_time.isoformat() if sq.end_time else None
                })
        
        # Get total quiz count per module (including uncompleted ones)
        for module_id in module_performance:
            total_quizzes_in_module = StudentQuiz.query.filter_by(
                student_id=current_user.id
            ).join(Quiz).filter(Quiz.module_id == module_id).count()
            
            module_performance[module_id]['total_quizzes'] = total_quizzes_in_module
        
        # Calculate average performance for each module
        module_results = []
        for module_id, data in module_performance.items():
            completed_quizzes = data['completed_quizzes']
            total_score = data['total_score']
            
            # Calculate average percentage
            average_percentage = (total_score / completed_quizzes) if completed_quizzes > 0 else 0
            
            # Calculate completion rate
            completion_rate = (completed_quizzes / data['total_quizzes']) * 100 if data['total_quizzes'] > 0 else 0
            
            module_result = {
                'module_id': module_id,
                'module_name': data['module_name'],
                'total_quizzes': data['total_quizzes'],
                'completed_quizzes': completed_quizzes,
                'average_percentage': round(average_percentage, 2),
                'completion_rate': round(completion_rate, 2),
                'quiz_details': data['quiz_scores']
            }
            
            module_results.append(module_result)
        
        # Sort modules by average percentage (descending)
        module_results.sort(key=lambda x: x['average_percentage'], reverse=True)
        
        return jsonify({
            'modules': module_results,
            'total_modules': len(module_results),
            'student_id': current_user.id,
            'student_name': f"{current_user.first_name} {current_user.last_name}"
        }), 200
        
    except Exception as e:
        print(f"Error in get_module_performance: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to fetch module performance: {str(e)}'}), 500

@student_bp.route('/quiz-results', methods=['GET'])
@token_required
def get_incorrect_quiz_answers(current_user):
    """Get all incorrectly answered questions from all quizzes for the current student"""
    if current_user.user_type != 'student':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get all completed quizzes for this student
        student_quizzes = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            status='completed'
        ).order_by(StudentQuiz.end_time.desc()).all()
        
        if not student_quizzes:
            return jsonify({
                'incorrect_answers': [],
                'total_incorrect': 0,
                'total_quizzes': 0,
                'message': 'No completed quizzes found'
            }), 200
        
        incorrect_answers = []
        total_incorrect = 0
        
        for sq in student_quizzes:
            # Get the quiz details
            quiz = Quiz.query.get(sq.quiz_id)
            if not quiz:
                continue
            
            # Get all incorrect answers for this quiz
            incorrect_student_answers = StudentAnswer.query.filter_by(
                student_quiz_id=sq.id,
                is_correct=False
            ).all()
            
            for answer in incorrect_student_answers:
                # Get the question details
                question = Question.query.get(answer.question_id)
                if not question:
                    continue
                
                # Build the incorrect answer details
                incorrect_answer_data = {
                    'quiz_id': quiz.id,
                    'quiz_title': quiz.title,
                    'quiz_completed_at': sq.end_time.isoformat() if sq.end_time else None,
                    'quiz_score': sq.score,
                    'module_name': quiz.module.name if quiz.module else None,
                    'question_id': question.id,
                    'question_text': question.text,
                    'question_topic': question.topic,
                    'question_weight': question.weight,
                    'options': [
                        question.option_1,
                        question.option_2,
                        question.option_3,
                        question.option_4
                    ],
                    'correct_answer': question.correct_answer,
                    'student_answer': answer.selected_option,
                    'answered_at': answer.created_at.isoformat(),
                    'points_lost': question.weight
                }
                
                # Filter out empty options
                incorrect_answer_data['options'] = [opt for opt in incorrect_answer_data['options'] if opt.strip()]
                
                incorrect_answers.append(incorrect_answer_data)
                total_incorrect += 1
        
        # Group by topics for better analysis
        topic_analysis = {}
        for answer in incorrect_answers:
            topic = answer['question_topic']
            if topic and topic.strip():
                if topic not in topic_analysis:
                    topic_analysis[topic] = {
                        'topic': topic,
                        'incorrect_count': 0,
                        'total_points_lost': 0,
                        'questions': []
                    }
                
                topic_analysis[topic]['incorrect_count'] += 1
                topic_analysis[topic]['total_points_lost'] += answer['points_lost']
                topic_analysis[topic]['questions'].append({
                    'quiz_title': answer['quiz_title'],
                    'question_text': answer['question_text'],
                    'correct_answer': answer['correct_answer'],
                    'student_answer': answer['student_answer']
                })
        
        # Convert topic analysis to list and sort by incorrect count
        topic_analysis_list = list(topic_analysis.values())
        topic_analysis_list.sort(key=lambda x: x['incorrect_count'], reverse=True)
        
        return jsonify({
            'incorrect_answers': incorrect_answers,
            'total_incorrect': total_incorrect,
            'total_quizzes': len(student_quizzes),
            'topic_analysis': topic_analysis_list,
            'student_info': {
                'id': current_user.id,
                'name': f"{current_user.first_name} {current_user.last_name}",
                'email': current_user.email
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_incorrect_quiz_answers: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Failed to fetch incorrect answers: {str(e)}'}), 500