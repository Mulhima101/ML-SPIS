from flask import Blueprint, request, jsonify
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz, StudentAnswer
from models.UserModel import Student
from models.ModuleModel import Module
from app import db
from datetime import datetime
from utils.jwt_utils import token_required
from services.quiz_service import generate_quiz_for_student
from sqlalchemy.orm import joinedload

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/', methods=['GET'])
@token_required
def get_all_quizzes(current_user):
    """Get all quizzes (different behavior for students and professors)"""
    if current_user.user_type == 'professor':
        # Professors see all quizzes with module names
        quizzes = Quiz.query.options(joinedload(Quiz.module)).all()
        return jsonify({
            'quizzes': [quiz.to_dict() for quiz in quizzes]
        }), 200
    else:
        # Students see only quizzes assigned to them
        student_quizzes = StudentQuiz.query.filter_by(student_id=current_user.id).all()
        quiz_data = []
        
        for sq in student_quizzes:
            quiz = Quiz.query.options(joinedload(Quiz.module)).get(sq.quiz_id)
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
    
    # Create quiz with professor_id
    new_quiz = Quiz(
        title=data['title'],
        description=data.get('description', ''),
        professor_id=current_user.id,  # Add this line
        module_id=data.get('module_id'),  # Add this line
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
        
        # Set the professor_id for the generated quiz
        quiz.professor_id = current_user.id
        db.session.commit()
        
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
    quiz = Quiz.query.options(joinedload(Quiz.module)).get(quiz_id)
    
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

@quiz_bp.route('/<int:quiz_id>/questions', methods=['GET'])
@token_required
def get_quiz_questions(current_user, quiz_id):
    """Get all questions for a specific quiz with relevant data"""
    quiz = Quiz.query.options(joinedload(Quiz.module)).get(quiz_id)
    
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    # Check authorization based on user type
    if current_user.user_type == 'student':
        # Students can only access questions for quizzes assigned to them
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Not authorized to access this quiz'}), 403
        
        # Check if quiz has started for the student
        if student_quiz.status == 'uncompleted' and not student_quiz.start_time:
            return jsonify({'message': 'Quiz not started yet'}), 403
    elif current_user.user_type == 'professor':
        # Professors can access questions for their own quizzes
        if quiz.professor_id != current_user.id:
            return jsonify({'message': 'Not authorized to access this quiz'}), 403
    
    # Get all questions for the quiz
    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id).all()
    
    # Prepare questions data based on user type
    include_answers = (current_user.user_type == 'professor')
    questions_data = []
    
    for question in questions:
        question_dict = question.to_dict(include_answer=include_answers)
        
        # Add additional relevant data
        question_dict.update({
            'quiz_title': quiz.title,
            'question_number': len(questions_data) + 1,
            'total_questions': len(questions)
        })
        
        # If student, check if they've already answered this question
        if current_user.user_type == 'student':
            student_quiz = StudentQuiz.query.filter_by(
                student_id=current_user.id,
                quiz_id=quiz_id
            ).first()
            
            if student_quiz:
                existing_answer = StudentAnswer.query.filter_by(
                    student_quiz_id=student_quiz.id,
                    question_id=question.id
                ).first()
                
                if existing_answer:
                    question_dict['student_answer'] = {
                        'selected_option': existing_answer.selected_option,
                        'answered_at': existing_answer.created_at.isoformat()
                    }
        
        questions_data.append(question_dict)
    
    # Prepare response with quiz metadata
    response_data = {
        'quiz': {
            'id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'duration_minutes': quiz.duration_minutes,
            'start_time': quiz.start_time.isoformat() if quiz.start_time else None,
            'end_time': quiz.end_time.isoformat() if quiz.end_time else None,
            'total_questions': len(questions)
        },
        'questions': questions_data
    }
    
    # Add student-specific data if applicable
    if current_user.user_type == 'student':
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if student_quiz:
            response_data['student_progress'] = {
                'status': student_quiz.status,
                'start_time': student_quiz.start_time.isoformat() if student_quiz.start_time else None,
                'end_time': student_quiz.end_time.isoformat() if student_quiz.end_time else None,
                'score': student_quiz.score,
                'answered_questions': len([q for q in questions_data if 'student_answer' in q])
            }
    
    return jsonify(response_data), 200

@quiz_bp.route('/<int:quiz_id>/availability', methods=['PUT'])
@token_required
def set_quiz_availability(current_user, quiz_id):
    """Set availability settings for a quiz"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the quiz and verify ownership
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    if quiz.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to modify this quiz'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('start_date'):
        return jsonify({'message': 'start_date is required'}), 400
    
    if not data.get('start_time'):
        return jsonify({'message': 'start_time is required'}), 400
    
    if not data.get('target_type') or data.get('target_type') not in ['all', 'specific']:
        return jsonify({'message': 'target_type must be either "all" or "specific"'}), 400
    
    if data.get('target_type') == 'specific' and not data.get('target_students'):
        return jsonify({'message': 'target_students is required when target_type is "specific"'}), 400
    
    try:
        from datetime import timedelta
        
        # Parse start date and time
        start_date = data['start_date']
        start_time = data['start_time']
        duration_minutes = data.get('duration_minutes', 60)
        target_type = data['target_type']
        target_students = data.get('target_students', [])
        is_active = data.get('is_active', True)
        
        # Combine date and time into datetime objects
        start_datetime = datetime.fromisoformat(f"{start_date}T{start_time}")
        end_datetime = start_datetime + timedelta(minutes=duration_minutes)
        
        # Update quiz availability
        quiz.start_time = start_datetime
        quiz.end_time = end_datetime
        quiz.duration_minutes = duration_minutes
        
        # Clear existing assignments if deactivating
        if not is_active:
            existing_assignments = StudentQuiz.query.filter_by(
                quiz_id=quiz_id,
                status='uncompleted'
            ).all()
            for assignment in existing_assignments:
                db.session.delete(assignment)
        
        # Handle student assignments based on target_type and is_active
        if is_active:
            if target_type == 'all':
                # Assign quiz to all students
                all_students = Student.query.all()
                for student in all_students:
                    # Check if student quiz already exists
                    existing_sq = StudentQuiz.query.filter_by(
                        student_id=student.id,
                        quiz_id=quiz_id
                    ).first()
                    
                    if not existing_sq:
                        # Create new student quiz assignment
                        student_quiz = StudentQuiz(
                            student_id=student.id,
                            quiz_id=quiz_id,
                            status='uncompleted'
                        )
                        db.session.add(student_quiz)
            
            elif target_type == 'specific' and target_students:
                # First, remove assignments for students not in the target list
                existing_assignments = StudentQuiz.query.filter_by(
                    quiz_id=quiz_id,
                    status='uncompleted'
                ).all()
                
                for assignment in existing_assignments:
                    if assignment.student_id not in target_students:
                        db.session.delete(assignment)
                
                # Then assign quiz to specific students
                for student_id in target_students:
                    # Verify student exists
                    student = Student.query.get(student_id)
                    if not student:
                        continue
                    
                    # Check if student quiz already exists
                    existing_sq = StudentQuiz.query.filter_by(
                        student_id=student_id,
                        quiz_id=quiz_id
                    ).first()
                    
                    if not existing_sq:
                        # Create new student quiz assignment
                        student_quiz = StudentQuiz(
                            student_id=student_id,
                            quiz_id=quiz_id,
                            status='uncompleted'
                        )
                        db.session.add(student_quiz)
        
        # Commit all changes
        db.session.commit()
        
        # Get final count of assigned students
        assigned_count = StudentQuiz.query.filter_by(quiz_id=quiz_id).count()
        
        # Prepare response data
        response_data = {
            'message': 'Quiz availability updated successfully',
            'quiz': quiz.to_dict(),
            'availability': {
                'start_date': start_date,
                'start_time': start_time,
                'duration_minutes': duration_minutes,
                'target_type': target_type,
                'target_students': target_students if target_type == 'specific' else None,
                'is_active': is_active,
                'assigned_students_count': assigned_count
            }
        }
        
        return jsonify(response_data), 200
        
    except ValueError as e:
        return jsonify({'message': f'Invalid date/time format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update quiz availability: {str(e)}'}), 500

@quiz_bp.route('/<int:quiz_id>/availability', methods=['GET'])
@token_required
def get_quiz_availability(current_user, quiz_id):
    """Get availability settings for a quiz"""
    # Get the quiz
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    # Check authorization based on user type
    if current_user.user_type == 'professor':
        # Professors can only access their own quizzes
        if quiz.professor_id != current_user.id:
            return jsonify({'message': 'Not authorized to access this quiz'}), 403
    elif current_user.user_type == 'student':
        # Students can only access quizzes assigned to them
        student_quiz = StudentQuiz.query.filter_by(
            student_id=current_user.id,
            quiz_id=quiz_id
        ).first()
        
        if not student_quiz:
            return jsonify({'message': 'Not authorized to access this quiz'}), 403
    else:
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Determine if quiz is active
        now = datetime.utcnow()
        is_active = quiz.start_time is not None and quiz.end_time is not None and quiz.end_time > now
        
        # Determine status based on quiz timing
        status = "active" if is_active else "inactive"
        if quiz.start_time and quiz.end_time:
            if now < quiz.start_time:
                status = "upcoming"
            elif now > quiz.end_time:
                status = "expired"
        
        # Base availability data
        availability_data = {
            'availability': {
                'start_date': quiz.start_time.strftime('%Y-%m-%d') if quiz.start_time else None,
                'start_time': quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
                'duration_minutes': quiz.duration_minutes,
                'is_active': is_active
            },
            'status': status
        }
        
        # Add different data based on user type
        if current_user.user_type == 'professor':
            # Get assigned students for professors
            assigned_students = StudentQuiz.query.filter_by(quiz_id=quiz_id).all()
            assigned_count = len(assigned_students)
            total_students = Student.query.count()
            target_type = 'all' if assigned_count == total_students else 'specific'
            
            student_details = []
            for sq in assigned_students:
                student = Student.query.get(sq.student_id)
                if student:
                    student_details.append({
                        'id': student.id,
                        'firstName': student.first_name,
                        'lastName': student.last_name,
                        'email': student.email
                    })
            
            availability_data['availability']['target_type'] = target_type
            availability_data['assigned_students'] = student_details
            
        elif current_user.user_type == 'student':
            # Add student-specific information
            student_quiz = StudentQuiz.query.filter_by(
                student_id=current_user.id,
                quiz_id=quiz_id
            ).first()
            
            if student_quiz:
                is_available = quiz.start_time is not None and quiz.start_time <= now <= quiz.end_time if quiz.end_time else False
                availability_data['student_status'] = {
                    'status': student_quiz.status,
                    'score': student_quiz.score,
                    'can_start': is_available and student_quiz.status == 'uncompleted' and not student_quiz.start_time,
                    'can_continue': student_quiz.status == 'uncompleted' and student_quiz.start_time is not None,
                    'is_completed': student_quiz.status == 'completed'
                }
        
        return jsonify(availability_data), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch quiz availability: {str(e)}'}), 500

@quiz_bp.route('/<int:quiz_id>/results', methods=['GET'])
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