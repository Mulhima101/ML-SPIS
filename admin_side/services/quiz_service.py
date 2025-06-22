# admin_side/services/quiz_service.py
import random
from datetime import datetime, timedelta, timezone
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz, StudentAnswer, KnowledgeLevel
from app import db
from flask import current_app
from utils.timezone_utils import get_ist_now, get_ist_datetime_for_db, format_ist_datetime, IST
import numpy as np

def is_quiz_available(quiz, current_time=None):
    """Check if a quiz is currently available for taking"""
    if current_time is None:
        # Use IST time for comparison since quiz times are stored in IST
        current_time = get_ist_datetime_for_db()
    
    # Debug logging
    print(f"DEBUG: Quiz availability check for quiz {quiz.id}")
    print(f"DEBUG: Current time: {current_time} (type: {type(current_time)})")
    print(f"DEBUG: Quiz start time: {quiz.start_time} (type: {type(quiz.start_time)})")
    print(f"DEBUG: Quiz end time: {quiz.end_time} (type: {type(quiz.end_time)})")
    
    # If no time restrictions are set, quiz is always available
    if not quiz.start_time and not quiz.end_time:
        return True, "Quiz is available"
    
    # The key fix: quiz times are stored as UTC in database but represent IST times
    # We need to treat them as IST times for comparison
    quiz_start_time = quiz.start_time
    quiz_end_time = quiz.end_time
    
    # Instead of converting UTC to IST, we need to convert IST times that were stored as UTC back to IST
    # The times in the database are actually IST times but stored without timezone info
    # So we can compare them directly with current IST time (also without timezone info)
    
    print(f"DEBUG: Using quiz start time as-is: {quiz_start_time}")
    print(f"DEBUG: Using quiz end time as-is: {quiz_end_time}")
    print(f"DEBUG: Current IST time: {current_time}")
    
    # If only start time is set
    if quiz.start_time and not quiz.end_time:
        if current_time < quiz_start_time:
            return False, f"Quiz has not started yet. Starts at {format_ist_datetime(quiz_start_time)}"
        return True, "Quiz is available"
    
    # If only end time is set
    if not quiz.start_time and quiz.end_time:
        if current_time > quiz_end_time:
            return False, f"Quiz has ended. Ended at {format_ist_datetime(quiz_end_time)}"
        return True, "Quiz is available"
    
    # If both start and end times are set
    if quiz.start_time and quiz.end_time:
        if current_time < quiz_start_time:
            return False, f"Quiz has not started yet. Starts at {format_ist_datetime(quiz_start_time)}"
        elif current_time > quiz_end_time:
            return False, f"Quiz has ended. Ended at {format_ist_datetime(quiz_end_time)}"
        return True, "Quiz is available"
    
    return True, "Quiz is available"

def get_quiz_time_status(quiz, current_time=None):
    """Get detailed time status information for a quiz"""
    if current_time is None:
        current_time = get_ist_datetime_for_db()
    
    is_available, message = is_quiz_available(quiz, current_time)
    
    return {
        'is_available': is_available,
        'message': message,
        'current_time': format_ist_datetime(current_time),
        'quiz_start_time': format_ist_datetime(quiz.start_time),
        'quiz_end_time': format_ist_datetime(quiz.end_time),
        'has_time_restrictions': bool(quiz.start_time or quiz.end_time)
    }

def generate_quiz_for_student(student, title, num_questions=15):
    """
    Generate a personalized quiz for a student based on their knowledge levels.
    Uses adaptive question selection to focus on areas needing improvement while
    also reinforcing strengths.
    """
    # Create the quiz with IST time
    quiz = Quiz(
        title=title,
        description=f"Personalized quiz for {student.first_name} {student.last_name}",
        start_time=get_ist_datetime_for_db(),
        end_time=get_ist_datetime_for_db() + timedelta(days=7),
        duration_minutes=20
    )
    db.session.add(quiz)
    db.session.flush()  # Get the quiz ID without committing yet
    
    # Get questions from the CSV file
    from utils.csv_utils import get_questions_from_csv
    all_questions = get_questions_from_csv()
    
    # Get the student's knowledge levels
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student.id).all()
    
    # Create a dictionary of topics and their knowledge levels
    topic_levels = {kl.topic: kl.score for kl in knowledge_levels}
    
    # Group questions by topic
    topics_questions = {}
    for q in all_questions:
        topic = q.get('Topic', 'Unknown')
        if topic not in topics_questions:
            topics_questions[topic] = []
        topics_questions[topic].append(q)
    
    # Sort topics by knowledge level (prioritize weaker topics)
    sorted_topics = sorted(topic_levels.items(), key=lambda x: x[1])
    
    # Calculate the distribution of questions across topics
    # We'll use the inverse of knowledge level as weight
    # This ensures weaker topics get more questions
    total_weight = sum(1 - score for _, score in sorted_topics) if sorted_topics else 0
    
    if total_weight == 0 or not sorted_topics:
        # If no knowledge levels exist or weights sum to zero,
        # just distribute questions evenly across all topics
        topic_distribution = {topic: max(1, num_questions // len(topics_questions)) 
                             for topic in topics_questions}
    else:
        # Calculate how many questions to allocate to each topic based on weights
        # We invert the knowledge level so lower scores get more questions
        topic_distribution = {}
        remaining_questions = num_questions
        
        for topic, score in sorted_topics:
            # Invert and normalize the score to get a weight
            weight = (1 - score) / total_weight
            
            # Allocate questions proportionally to weight, but ensure at least 1
            # We use max(1, ...) to ensure every topic gets at least one question
            topic_questions = max(1, int(num_questions * weight))
            
            # Don't allocate more than we have left
            topic_questions = min(topic_questions, remaining_questions)
            
            topic_distribution[topic] = topic_questions
            remaining_questions -= topic_questions
        
        # If we have remaining questions due to rounding, assign them to the weakest topics
        if remaining_questions > 0:
            for topic, _ in sorted_topics:
                if remaining_questions <= 0:
                    break
                topic_distribution[topic] += 1
                remaining_questions -= 1
    
    # For topics not in knowledge levels, assign a small number of questions
    unknown_topics = set(topics_questions.keys()) - set(topic_levels.keys())
    if unknown_topics and total_weight > 0:
        # Only assign questions to unknown topics if we have room
        questions_for_unknowns = min(num_questions // 5, len(unknown_topics))
        if questions_for_unknowns > 0:
            # Reduce questions from known topics proportionally
            reduction_factor = (num_questions - questions_for_unknowns) / num_questions
            for topic in topic_distribution:
                topic_distribution[topic] = max(1, int(topic_distribution[topic] * reduction_factor))
            
            # Distribute remaining questions to unknown topics
            for topic in unknown_topics:
                topic_distribution[topic] = max(1, questions_for_unknowns // len(unknown_topics))
    
    # Select questions for each topic
    selected_questions = []
    for topic, num_topic_questions in topic_distribution.items():
        if topic in topics_questions and len(topics_questions[topic]) > 0:
            # Get topic questions
            topic_qs = topics_questions[topic]
            
            # If we have knowledge level for this topic, select questions of appropriate difficulty
            if topic in topic_levels:
                # Sort questions by weight (difficulty)
                try:
                    # Try to sort by weight as float
                    sorted_topic_qs = sorted(topic_qs, 
                                            key=lambda q: float(q.get('Question Weight', 1.0)))
                except (ValueError, TypeError):
                    # If conversion fails, use default order
                    sorted_topic_qs = topic_qs
                
                # Determine which part of the difficulty spectrum to sample from
                knowledge_score = topic_levels[topic]
                if knowledge_score < 0.4:
                    # For low knowledge, focus on easier questions
                    # Take from the first 60% of the difficulty range
                    difficulty_range = sorted_topic_qs[:int(len(sorted_topic_qs) * 0.6)]
                elif knowledge_score < 0.7:
                    # For medium knowledge, focus on medium difficulty
                    # Take from the middle 60% of the difficulty range
                    start_idx = int(len(sorted_topic_qs) * 0.2)
                    end_idx = int(len(sorted_topic_qs) * 0.8)
                    difficulty_range = sorted_topic_qs[start_idx:end_idx]
                else:
                    # For high knowledge, focus on harder questions
                    # Take from the last 60% of the difficulty range
                    difficulty_range = sorted_topic_qs[int(len(sorted_topic_qs) * 0.4):]
                
                # Select questions from the appropriate difficulty range
                num_to_select = min(num_topic_questions, len(difficulty_range))
                if num_to_select > 0:
                    selected_questions.extend(random.sample(difficulty_range, num_to_select))
            else:
                # For unknown knowledge level, select random questions
                num_to_select = min(num_topic_questions, len(topic_qs))
                if num_to_select > 0:
                    selected_questions.extend(random.sample(topic_qs, num_to_select))
    
    # If we still don't have enough questions, add random ones from all topics
    if len(selected_questions) < num_questions:
        # Flatten the list of all remaining questions
        all_qs = [q for topic_qs in topics_questions.values() for q in topic_qs 
                 if q not in selected_questions]
        
        # Select random questions from the remaining pool
        remaining = num_questions - len(selected_questions)
        if len(all_qs) > remaining:
            selected_questions.extend(random.sample(all_qs, remaining))
        else:
            selected_questions.extend(all_qs)
    
    # Limit to the desired number of questions
    selected_questions = selected_questions[:num_questions]
    
    # Shuffle the questions to mix topics
    random.shuffle(selected_questions)
    
    # Create Question objects for each selected question
    for q_data in selected_questions:
        # Parse the options
        options = [
            q_data.get('Answer 1', ''),
            q_data.get('Answer 2', ''),
            q_data.get('Answer 3', ''),
            q_data.get('Answer 4', '')
        ]
        
        # Parse the correct answer (1-based index)
        try:
            correct_answer = int(q_data.get('Correct Answer', '1'))
        except (ValueError, TypeError):
            correct_answer = 1  # Default to first option
        
        # Get weight or use default
        try:
            weight = float(q_data.get('Question Weight', 1.0))
        except (ValueError, TypeError):
            weight = 1.0
        
        # FIX: Ensure topic is properly extracted from CSV data
        topic = q_data.get('Topic', '')
        if not topic or topic.strip() == '':
            # If no topic in CSV, try alternative column names
            topic = q_data.get('topic', q_data.get('TOPIC', q_data.get('Subject', 'Unknown')))
        
        print(f"DEBUG: Creating question with topic: '{topic}' from CSV data: {q_data.get('Topic', 'NOT_FOUND')}")
        
        # Create the question
        question = Question(
            quiz_id=quiz.id,
            text=q_data.get('Question Text', ''),
            option_1=options[0] if len(options) > 0 else '',
            option_2=options[1] if len(options) > 1 else '',
            option_3=options[2] if len(options) > 2 else '',
            option_4=options[3] if len(options) > 3 else '',
            correct_answer=correct_answer,
            weight=weight,
            topic=topic,  # Make sure this is set correctly
            source_qid=q_data.get('QID', '')
        )
        db.session.add(question)
    
    # Create the student quiz assignment
    student_quiz = StudentQuiz(
        student_id=student.id,
        quiz_id=quiz.id,
        status='uncompleted'
    )
    db.session.add(student_quiz)
    
    # Commit all changes
    db.session.commit()
    
    return quiz

def get_quiz_performance_summary(student_id):
    """Generate a summary of the student's quiz performance over time"""
    # Get all completed quizzes for the student
    student_quizzes = StudentQuiz.query.filter_by(
        student_id=student_id,
        status='completed'
    ).order_by(StudentQuiz.end_time).all()
    
    if not student_quizzes:
        return {
            'total_quizzes': 0,
            'average_score': 0,
            'topic_performance': {},
            'progress_over_time': []
        }
    
    # Calculate overall statistics
    total_quizzes = len(student_quizzes)
    average_score = sum(sq.score for sq in student_quizzes if sq.score is not None) / total_quizzes
    
    # Calculate topic-based performance
    topic_performance = {}
    
    for sq in student_quizzes:
        # Get all answers for this quiz
        answers = StudentAnswer.query.filter_by(student_quiz_id=sq.id).all()
        
        for answer in answers:
            # Get the question
            question = Question.query.get(answer.question_id)
            if not question or not question.topic:
                continue
            
            # Update topic performance
            topic = question.topic
            if topic not in topic_performance:
                topic_performance[topic] = {
                    'total_questions': 0,
                    'correct_answers': 0,
                    'score': 0
                }
            
            topic_performance[topic]['total_questions'] += 1
            if answer.is_correct:
                topic_performance[topic]['correct_answers'] += 1
    
    # Calculate score for each topic
    for topic in topic_performance:
        if topic_performance[topic]['total_questions'] > 0:
            topic_performance[topic]['score'] = (
                topic_performance[topic]['correct_answers'] / 
                topic_performance[topic]['total_questions']
            )
    
    # Calculate progress over time with IST formatting
    progress_over_time = []
    for sq in student_quizzes:
        if sq.score is not None and sq.end_time is not None:
            # Format date in IST
            ist_date = sq.end_time  # Assume stored time is already in IST
            progress_over_time.append({
                'date': ist_date.strftime('%Y-%m-%d'),
                'score': sq.score
            })
    
    return {
        'total_quizzes': total_quizzes,
        'average_score': average_score,
        'topic_performance': topic_performance,
        'progress_over_time': progress_over_time
    }

def score_quiz(student_quiz_id):
    """Score a completed quiz and update the student's knowledge levels"""
    # Get the student quiz
    student_quiz = StudentQuiz.query.get(student_quiz_id)
    if not student_quiz:
        raise ValueError(f"Student quiz with ID {student_quiz_id} not found")
    
    print(f"DEBUG: Scoring quiz for student_quiz_id: {student_quiz_id}")
    print(f"DEBUG: Student ID: {student_quiz.student_id}")
    
    # Get all answers for this quiz
    answers = StudentAnswer.query.filter_by(student_quiz_id=student_quiz_id).all()
    print(f"DEBUG: Found {len(answers)} answers for this quiz")
    
    # Calculate score
    total_points = 0
    max_points = 0
    topics_found = set()
    
    for answer in answers:
        # Get the question
        question = Question.query.get(answer.question_id)
        if not question:
            print(f"DEBUG: Question {answer.question_id} not found")
            continue
        
        print(f"DEBUG: Question {question.id} - Topic: '{question.topic}' - Weight: {question.weight}")
        if question.topic:
            topics_found.add(question.topic)
        
        # Add points if correct
        if answer.is_correct:
            total_points += question.weight
        
        max_points += question.weight
    
    print(f"DEBUG: Topics found in quiz: {topics_found}")
    print(f"DEBUG: Total points: {total_points}, Max points: {max_points}")
    
    # Calculate score as percentage
    score = (total_points / max_points * 100) if max_points > 0 else 0
    
    # Update student quiz record with IST time
    student_quiz.status = 'completed'
    student_quiz.end_time = get_ist_datetime_for_db()
    student_quiz.score = score
    
    print(f"DEBUG: Quiz score calculated: {score}")
    
    db.session.commit()
    print(f"DEBUG: Quiz record updated and committed")
    
    # Update knowledge levels with detailed logging
    try:
        from services.ml_service import update_knowledge_levels
        print(f"DEBUG: Updating knowledge levels for student {student_quiz.student_id}")
        
        # Check if there are any completed quizzes before update
        completed_quizzes_before = StudentQuiz.query.filter_by(
            student_id=student_quiz.student_id,
            status='completed'
        ).count()
        print(f"DEBUG: Total completed quizzes for student: {completed_quizzes_before}")
        
        # Check existing knowledge levels before update
        existing_levels_before = KnowledgeLevel.query.filter_by(
            student_id=student_quiz.student_id
        ).count()
        print(f"DEBUG: Existing knowledge level records before update: {existing_levels_before}")
        
        update_knowledge_levels(student_quiz.student_id)
        
        # Check knowledge levels after update
        existing_levels_after = KnowledgeLevel.query.filter_by(
            student_id=student_quiz.student_id
        ).count()
        print(f"DEBUG: Knowledge level records after update: {existing_levels_after}")
        
        # Print all knowledge levels for this student
        all_levels = KnowledgeLevel.query.filter_by(student_id=student_quiz.student_id).all()
        for kl in all_levels:
            print(f"DEBUG: Knowledge Level - Topic: {kl.topic}, Score: {kl.score}, Level: {kl.level}")
        
        print(f"DEBUG: Knowledge levels updated successfully")
    except Exception as e:
        print(f"ERROR: Error updating knowledge levels: {e}")
        import traceback
        traceback.print_exc()
        # Don't let knowledge level update failure prevent quiz scoring
        pass
    
    return score

def get_topic_statistics():
    """Get statistics about topics in the question pool"""
    from utils.csv_utils import get_questions_from_csv
    all_questions = get_questions_from_csv()
    
    # Count questions by topic
    topic_counts = {}
    
    for q in all_questions:
        topic = q.get('Topic', 'Unknown')
        if topic not in topic_counts:
            topic_counts[topic] = 0
        topic_counts[topic] += 1
    
    # Get statistics about each topic
    topic_stats = []
    for topic, count in topic_counts.items():
        # Get questions for this topic
        topic_questions = [q for q in all_questions if q.get('Topic') == topic]
        
        # Calculate average question weight (difficulty)
        weights = []
        for q in topic_questions:
            try:
                weight = float(q.get('Question Weight', 1.0))
                weights.append(weight)
            except (ValueError, TypeError):
                pass
        
        avg_weight = sum(weights) / len(weights) if weights else 1.0
        
        topic_stats.append({
            'topic': topic,
            'count': count,
            'avg_weight': avg_weight
        })
    
    # Sort by count descending
    topic_stats.sort(key=lambda x: x['count'], reverse=True)
    
    return topic_stats

def get_recommended_quizzes_for_student(student_id, limit=3):
    """Get recommended quizzes for a student based on their knowledge levels"""
    # Get the student's knowledge levels
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    # If no knowledge levels exist, recommend quizzes with foundational topics
    if not knowledge_levels:
        # Just create a general quiz with a mix of topics
        return [{
            'title': 'Initial Assessment Quiz',
            'description': 'A quiz to assess your initial knowledge level across various topics.',
            'topics': ['Various topics'],
            'recommended_reason': 'Get started with your learning journey'
        }]
    
    # Identify weak topics (those with low scores)
    weak_topics = [kl.topic for kl in knowledge_levels if kl.score < 0.5]
    
    # Identify topics that need reinforcement (medium scores)
    reinforcement_topics = [kl.topic for kl in knowledge_levels if 0.5 <= kl.score < 0.8]
    
    # Get topic statistics to find topic relationships
    topic_stats = get_topic_statistics()
    all_topics = [ts['topic'] for ts in topic_stats]
    
    # Generate recommendations
    recommendations = []
    
    # Recommendation 1: Focus on weak topics
    if weak_topics:
        topics_to_focus = weak_topics[:3]  # Focus on up to 3 weak topics
        recommendations.append({
            'title': f"Strengthen Your Understanding of {topics_to_focus[0]}",
            'description': f"A quiz focused on improving your knowledge of {', '.join(topics_to_focus)}.",
            'topics': topics_to_focus,
            'recommended_reason': 'Address knowledge gaps in these areas'
        })
    
    # Recommendation 2: Reinforce medium topics
    if reinforcement_topics:
        topics_to_reinforce = reinforcement_topics[:3]  # Reinforce up to 3 topics
        recommendations.append({
            'title': f"Reinforce Your Knowledge of {topics_to_reinforce[0]}",
            'description': f"A quiz to strengthen your understanding of {', '.join(topics_to_reinforce)}.",
            'topics': topics_to_reinforce,
            'recommended_reason': 'Solidify your knowledge in these areas'
        })
    
    # Recommendation 3: Explore new topics
    known_topics = [kl.topic for kl in knowledge_levels]
    unexplored_topics = [topic for topic in all_topics if topic not in known_topics]
    
    if unexplored_topics:
        topics_to_explore = unexplored_topics[:3]  # Explore up to 3 new topics
        recommendations.append({
            'title': f"Explore {topics_to_explore[0]}",
            'description': f"A quiz to introduce you to {', '.join(topics_to_explore)}.",
            'topics': topics_to_explore,
            'recommended_reason': 'Expand your knowledge to new areas'
        })
    
    # If we still need more recommendations, add a mixed quiz
    if len(recommendations) < limit:
        # Get all topics sorted by score (lowest first)
        all_known_topics = [(kl.topic, kl.score) for kl in knowledge_levels]
        all_known_topics.sort(key=lambda x: x[1])
        
        mixed_topics = [topic for topic, _ in all_known_topics[:5]]
        
        recommendations.append({
            'title': "Mixed Topics Quiz",
            'description': "A quiz covering a mix of topics to improve your overall knowledge.",
            'topics': mixed_topics,
            'recommended_reason': 'Balanced practice across multiple areas'
        })
    
    # Limit to the requested number of recommendations
    return recommendations[:limit]