from flask import Blueprint, request, jsonify
from models.UserModel import Professor, Student
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz, KnowledgeLevel
from models.ModuleModel import Module
from app import db
from utils.jwt_utils import token_required
from datetime import datetime, timedelta

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
    students_count = Student.query.count()
    quizzes_count = Quiz.query.count()
    completed_quizzes = StudentQuiz.query.filter_by(status='completed').count()
    
    return jsonify({
        'students_count': students_count,
        'quizzes_count': quizzes_count,
        'completed_quizzes': completed_quizzes
    }), 200

@professor_bp.route('/quizzes', methods=['GET'])
@token_required
def get_professor_quizzes(current_user):
    """Get all quizzes created by the current professor"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get all quizzes created by this professor
    quizzes = Quiz.query.filter_by(professor_id=current_user.id).order_by(Quiz.created_at.desc()).all()
    
    return jsonify({
        'quizzes': [quiz.to_dict() for quiz in quizzes]
    }), 200

@professor_bp.route('/quizzes', methods=['POST'])
@token_required
def create_quiz(current_user):
    """Create a new quiz"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400
    
    if not data.get('questions') or len(data['questions']) == 0:
        return jsonify({'message': 'At least one question is required'}), 400
    
    try:
        # Parse datetime strings and treat them as IST times
        start_time = None
        end_time = None
        
        if data.get('start_time'):
            # Parse the datetime string as IST time
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', ''))
            # Store as naive datetime (IST time without timezone info)
            
        if data.get('end_time'):
            # Parse the datetime string as IST time  
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', ''))
            # Store as naive datetime (IST time without timezone info)
        
        # Create quiz
        new_quiz = Quiz(
            title=data['title'],
            description=data.get('description', ''),
            professor_id=current_user.id,
            module_id=data.get('module_id'),
            start_time=start_time,
            end_time=end_time,
            duration_minutes=data.get('duration_minutes', 20)
        )
        
        db.session.add(new_quiz)
        db.session.flush()  # Get quiz ID without committing
        
        # Add questions to quiz
        for q_data in data['questions']:
            # Validate question data
            if not q_data.get('question_text'):
                return jsonify({'message': 'Question text is required for all questions'}), 400
            
            if not q_data.get('options') or len(q_data['options']) < 2:
                return jsonify({'message': 'At least 2 options are required for each question'}), 400
            
            # Ensure we have exactly 4 options (pad with empty strings if needed)
            options = q_data['options']
            while len(options) < 4:
                options.append('')
            
            # Validate correct_answer index
            correct_answer = q_data.get('correct_answer', 0)
            if correct_answer < 0 or correct_answer >= len([opt for opt in options if opt.strip()]):
                return jsonify({'message': 'Invalid correct_answer index'}), 400
            
            question = Question(
                quiz_id=new_quiz.id,
                text=q_data['question_text'],
                question_type=q_data.get('question_type', 'multiple_choice'),
                option_1=options[0] if len(options) > 0 else '',
                option_2=options[1] if len(options) > 1 else '',
                option_3=options[2] if len(options) > 2 else '',
                option_4=options[3] if len(options) > 3 else '',
                correct_answer=correct_answer,
                explanation=q_data.get('explanation', ''),
                points=q_data.get('points', 1.0),
                weight=q_data.get('points', 1.0),  # Use points as weight for compatibility
                topic=q_data.get('topic', '')
            )
            db.session.add(question)
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz created successfully',
            'quiz': new_quiz.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create quiz: {str(e)}'}), 500

@professor_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
@token_required
def get_quiz_details(current_user, quiz_id):
    """Get detailed information about a specific quiz"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the quiz and verify ownership
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    if quiz.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to access this quiz'}), 403
    
    # Get quiz with questions
    quiz_data = quiz.to_dict()
    quiz_data['questions'] = [q.to_dict(include_answer=True) for q in quiz.questions]
    
    return jsonify({'quiz': quiz_data}), 200

@professor_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@token_required
def update_quiz(current_user, quiz_id):
    """Update an existing quiz"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the quiz and verify ownership
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    if quiz.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to modify this quiz'}), 403
    
    data = request.get_json()
    
    try:
        # Update quiz properties
        if 'title' in data:
            quiz.title = data['title']
        if 'description' in data:
            quiz.description = data['description']
        if 'module_id' in data:
            quiz.module_id = data['module_id']
        if 'start_time' in data:
            quiz.start_time = datetime.fromisoformat(data['start_time']) if data['start_time'] else None
        if 'end_time' in data:
            quiz.end_time = datetime.fromisoformat(data['end_time']) if data['end_time'] else None
        if 'duration_minutes' in data:
            quiz.duration_minutes = data['duration_minutes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz updated successfully',
            'quiz': quiz.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update quiz: {str(e)}'}), 500

@professor_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@token_required
def delete_quiz(current_user, quiz_id):
    """Delete a quiz"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the quiz and verify ownership
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    if quiz.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to delete this quiz'}), 403
    
    try:
        # Delete the quiz (cascade will delete questions and student_quizzes)
        db.session.delete(quiz)
        db.session.commit()
        
        return jsonify({'message': 'Quiz deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete quiz: {str(e)}'}), 500

@professor_bp.route('/quizzes/<int:quiz_id>/availability', methods=['POST', 'PUT'])
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

@professor_bp.route('/quizzes/<int:quiz_id>/availability', methods=['GET'])
@token_required
def get_quiz_availability(current_user, quiz_id):
    """Get availability settings for a quiz"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the quiz and verify ownership
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    if quiz.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to access this quiz'}), 403
    
    try:
        # Get assigned students count and details
        assigned_students = StudentQuiz.query.filter_by(quiz_id=quiz_id).all()
        assigned_count = len(assigned_students)
        
        # Get student details for assigned students
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
        
        # Determine if quiz is active (has future or current availability)
        now = datetime.utcnow()
        is_active = quiz.start_time is not None and quiz.end_time is not None and quiz.end_time > now
        
        # Determine target type based on assignment pattern
        total_students = Student.query.count()
        target_type = 'all' if assigned_count == total_students else 'specific'
        
        # Determine status based on quiz timing
        status = "active" if is_active else "inactive"
        if quiz.start_time and quiz.end_time:
            if now < quiz.start_time:
                status = "upcoming"
            elif now > quiz.end_time:
                status = "expired"
        
        availability_data = {
            'availability': {
                'start_date': quiz.start_time.strftime('%Y-%m-%d') if quiz.start_time else None,
                'start_time': quiz.start_time.strftime('%H:%M') if quiz.start_time else None,
                'duration_minutes': quiz.duration_minutes,
                'target_type': target_type,
                'is_active': is_active
            },
            'assigned_students': student_details,
            'status': status
        }
        
        return jsonify(availability_data), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch quiz availability: {str(e)}'}), 500

@professor_bp.route('/quizzes/<int:quiz_id>/assign-students', methods=['POST'])
@token_required
def assign_quiz_to_students(current_user, quiz_id):
    """Assign a quiz to specific students or all students"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the quiz and verify ownership
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
    
    if quiz.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to assign this quiz'}), 403
    
    data = request.get_json()
    target_type = data.get('target_type', 'all')  # 'all' or 'specific'
    student_ids = data.get('student_ids', [])
    
    try:
        assignments_created = 0
        
        if target_type == 'all':
            # Assign to all students
            all_students = Student.query.all()
            for student in all_students:
                # Check if assignment already exists
                existing = StudentQuiz.query.filter_by(
                    student_id=student.id,
                    quiz_id=quiz_id
                ).first()
                
                if not existing:
                    student_quiz = StudentQuiz(
                        student_id=student.id,
                        quiz_id=quiz_id,
                        status='uncompleted'
                    )
                    db.session.add(student_quiz)
                    assignments_created += 1
        
        elif target_type == 'specific' and student_ids:
            # Assign to specific students
            for student_id in student_ids:
                # Verify student exists
                student = Student.query.get(student_id)
                if not student:
                    continue
                
                # Check if assignment already exists
                existing = StudentQuiz.query.filter_by(
                    student_id=student_id,
                    quiz_id=quiz_id
                ).first()
                
                if not existing:
                    student_quiz = StudentQuiz(
                        student_id=student_id,
                        quiz_id=quiz_id,
                        status='uncompleted'
                    )
                    db.session.add(student_quiz)
                    assignments_created += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Quiz assigned successfully to {assignments_created} students',
            'assignments_created': assignments_created
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to assign quiz: {str(e)}'}), 500

@professor_bp.route('/modules', methods=['POST'])
@token_required
def create_module(current_user):
    """Create a new module"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'message': 'Module name is required'}), 400
    
    # Validate status if provided
    valid_statuses = ['active', 'inactive']
    status = data.get('status', 'active')
    if status not in valid_statuses:
        return jsonify({'message': 'Status must be either "active" or "inactive"'}), 400
    
    try:
        # Create new module
        new_module = Module(
            name=data['name'],
            description=data.get('description', ''),
            status=status,
            professor_id=current_user.id
        )
        
        db.session.add(new_module)
        db.session.commit()
        
        return jsonify({
            'message': 'Module created successfully',
            'module': new_module.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create module: {str(e)}'}), 500

@professor_bp.route('/modules', methods=['GET'])
@token_required
def get_modules(current_user):
    """Get all modules created by the current professor"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get all modules created by this professor
    modules = Module.query.filter_by(professor_id=current_user.id).order_by(Module.created_at.desc()).all()
    
    return jsonify({
        'modules': [module.to_dict() for module in modules]
    }), 200

@professor_bp.route('/modules/<int:module_id>', methods=['GET'])
@token_required
def get_module(current_user, module_id):
    """Get a specific module"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the module and verify ownership
    module = Module.query.get(module_id)
    if not module:
        return jsonify({'message': 'Module not found'}), 404
    
    if module.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to access this module'}), 403
    
    return jsonify({'module': module.to_dict()}), 200

@professor_bp.route('/modules/<int:module_id>', methods=['PUT'])
@token_required
def update_module(current_user, module_id):
    """Update an existing module"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the module and verify ownership
    module = Module.query.get(module_id)
    if not module:
        return jsonify({'message': 'Module not found'}), 404
    
    if module.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to modify this module'}), 403
    
    data = request.get_json()
    
    # Validate status if provided
    if 'status' in data:
        valid_statuses = ['active', 'inactive']
        if data['status'] not in valid_statuses:
            return jsonify({'message': 'Status must be either "active" or "inactive"'}), 400
    
    try:
        # Update module properties
        if 'name' in data:
            module.name = data['name']
        if 'description' in data:
            module.description = data['description']
        if 'status' in data:
            module.status = data['status']
        
        module.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Module updated successfully',
            'module': module.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update module: {str(e)}'}), 500

@professor_bp.route('/modules/<int:module_id>', methods=['DELETE'])
@token_required
def delete_module(current_user, module_id):
    """Delete a module"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    # Get the module and verify ownership
    module = Module.query.get(module_id)
    if not module:
        return jsonify({'message': 'Module not found'}), 404
    
    if module.professor_id != current_user.id:
        return jsonify({'message': 'Not authorized to delete this module'}), 403
    
    try:
        # Check if module has associated quizzes
        associated_quizzes = Quiz.query.filter_by(module_id=module_id).count()
        if associated_quizzes > 0:
            return jsonify({
                'message': f'Cannot delete module: {associated_quizzes} quiz(es) are associated with this module'
            }), 400
        
        # Delete the module
        db.session.delete(module)
        db.session.commit()
        
        return jsonify({'message': 'Module deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete module: {str(e)}'}), 500

@professor_bp.route('/analytics/students', methods=['GET'])
@token_required
def get_students_knowledge_analytics(current_user):
    """Get total number of students and their knowledge levels for analytics"""
    if current_user.user_type != 'professor':
        return jsonify({'message': 'Not authorized'}), 403
    
    try:
        # Get all students
        students = Student.query.all()
        total_students = len(students)
        
        # Get knowledge levels for all students
        student_analytics = []
        overall_stats = {
            'total_low': 0,
            'total_normal': 0,
            'total_high': 0,
            'total_no_data': 0
        }
        
        for student in students:
            # Get student's knowledge levels
            knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student.id).all()
            
            # Get overall knowledge level (OVERALL topic)
            overall_kl = KnowledgeLevel.query.filter_by(
                student_id=student.id,
                topic='OVERALL'
            ).first()
            
            # Calculate topic-specific knowledge levels
            topic_levels = []
            for kl in knowledge_levels:
                if kl.topic != 'OVERALL':  # Exclude overall from topic list
                    topic_levels.append({
                        'topic': kl.topic,
                        'score': round(kl.score, 3),
                        'level': kl.level,
                        'updated_at': kl.updated_at.isoformat()
                    })
            
            # Get completed quiz count
            completed_quizzes = StudentQuiz.query.filter_by(
                student_id=student.id,
                status='completed'
            ).count()
            
            # Calculate average quiz score
            quiz_scores = StudentQuiz.query.filter_by(
                student_id=student.id,
                status='completed'
            ).all()
            
            avg_quiz_score = 0
            if quiz_scores:
                scores = [sq.score for sq in quiz_scores if sq.score is not None]
                avg_quiz_score = sum(scores) / len(scores) if scores else 0
            
            # Determine overall level and update stats
            if overall_kl:
                overall_level = overall_kl.level
                overall_score = overall_kl.score
            elif topic_levels:
                # Calculate from topic averages if no overall record
                topic_scores = [tl['score'] for tl in topic_levels]
                overall_score = sum(topic_scores) / len(topic_scores)
                if overall_score < 0.5:
                    overall_level = 'Low'
                elif overall_score < 0.8:
                    overall_level = 'Normal'
                else:
                    overall_level = 'High'
            else:
                overall_level = 'No Data'
                overall_score = 0
            
            # Update overall statistics
            if overall_level == 'Low':
                overall_stats['total_low'] += 1
            elif overall_level == 'Normal':
                overall_stats['total_normal'] += 1
            elif overall_level == 'High':
                overall_stats['total_high'] += 1
            else:
                overall_stats['total_no_data'] += 1
            
            # Add student data
            student_data = {
                'student_id': student.id,
                'student_info': {
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'email': student.email,
                    'student_id': student.student_id,
                    'registration_date': student.created_at.isoformat()
                },
                'overall_knowledge': {
                    'level': overall_level,
                    'score': round(overall_score, 3) if overall_score else 0,
                    'updated_at': overall_kl.updated_at.isoformat() if overall_kl else None
                },
                'topic_knowledge': topic_levels,
                'quiz_statistics': {
                    'completed_quizzes': completed_quizzes,
                    'average_score': round(avg_quiz_score, 2)
                },
                'knowledge_summary': {
                    'total_topics_assessed': len(topic_levels),
                    'strong_topics': len([tl for tl in topic_levels if tl['level'] == 'High']),
                    'developing_topics': len([tl for tl in topic_levels if tl['level'] == 'Normal']),
                    'weak_topics': len([tl for tl in topic_levels if tl['level'] == 'Low'])
                }
            }
            
            student_analytics.append(student_data)
        
        # Sort students by overall knowledge level and then by score
        def get_sort_key(student_data):
            level = student_data['overall_knowledge']['level']
            score = student_data['overall_knowledge']['score']
            level_priority = {'High': 3, 'Normal': 2, 'Low': 1, 'No Data': 0}
            return (level_priority.get(level, 0), score)
        
        student_analytics.sort(key=get_sort_key, reverse=True)
        
        # Calculate additional analytics
        topic_distribution = {}
        for student_data in student_analytics:
            for topic_data in student_data['topic_knowledge']:
                topic = topic_data['topic']
                level = topic_data['level']
                
                if topic not in topic_distribution:
                    topic_distribution[topic] = {
                        'total_assessments': 0,
                        'high_count': 0,
                        'normal_count': 0,
                        'low_count': 0,
                        'average_score': 0
                    }
                
                topic_distribution[topic]['total_assessments'] += 1
                topic_distribution[topic][f'{level.lower()}_count'] += 1
        
        # Calculate average scores for each topic
        for topic in topic_distribution:
            topic_scores = []
            for student_data in student_analytics:
                for topic_data in student_data['topic_knowledge']:
                    if topic_data['topic'] == topic:
                        topic_scores.append(topic_data['score'])
            
            if topic_scores:
                topic_distribution[topic]['average_score'] = round(
                    sum(topic_scores) / len(topic_scores), 3
                )
        
        # Prepare response
        response_data = {
            'total_students': total_students,
            'overall_statistics': {
                'students_by_level': {
                    'high': overall_stats['total_high'],
                    'normal': overall_stats['total_normal'],
                    'low': overall_stats['total_low'],
                    'no_data': overall_stats['total_no_data']
                },
                'percentage_distribution': {
                    'high': round((overall_stats['total_high'] / total_students) * 100, 1) if total_students > 0 else 0,
                    'normal': round((overall_stats['total_normal'] / total_students) * 100, 1) if total_students > 0 else 0,
                    'low': round((overall_stats['total_low'] / total_students) * 100, 1) if total_students > 0 else 0,
                    'no_data': round((overall_stats['total_no_data'] / total_students) * 100, 1) if total_students > 0 else 0
                }
            },
            'topic_analytics': topic_distribution,
            'students': student_analytics,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch student analytics: {str(e)}'}), 500