# admin_side/services/knowledge_service.py
from models.ProgressModel import KnowledgeLevel, StudentQuiz, StudentAnswer
from models.QuizModel import Question
from app import db
import numpy as np
from collections import defaultdict
from datetime import datetime, timedelta
import math

def determine_knowledge_level(score):
    """
    Determine a student's knowledge level based on their score
    Following the formula in ML-SPIS Model Data Processing:
    - Low: Overall Score < 0.5
    - Normal: 0.5 <= Overall Score < 0.8
    - High: Overall Score >= 0.8
    """
    if score < 0.5:
        return 'Low'
    elif score < 0.8:
        return 'Normal'
    else:
        return 'High'

def calculate_topic_score(correct_answers, total_questions):
    """
    Calculate a topic score based on correct answers and total questions
    Following the formula: Topic Score = Correct Answers in Topic ÷ Total Questions in Topic
    """
    if total_questions == 0:
        return 0.0
    return correct_answers / total_questions

def calculate_overall_score(topic_scores, topic_weights):
    """
    Calculate overall score based on weighted topic scores
    Following the formula: Overall Score = ∑(Topic Score × Topic Weight) / ∑Topic Weight
    """
    if not topic_scores or sum(topic_weights.values()) == 0:
        return 0.0
    
    weighted_sum = sum(topic_scores[topic] * topic_weights.get(topic, 1.0) 
                      for topic in topic_scores)
    weight_sum = sum(topic_weights.get(topic, 1.0) for topic in topic_scores)
    
    return weighted_sum / weight_sum

def update_student_knowledge_levels(student_id):
    """
    Update a student's knowledge levels based on their quiz performance
    This uses a time-weighted approach where recent quizzes have more influence
    """
    # Get all completed quizzes for this student
    student_quizzes = StudentQuiz.query.filter_by(
        student_id=student_id,
        status='completed'
    ).order_by(StudentQuiz.end_time.desc()).all()
    
    if not student_quizzes:
        return
    
    # Track performance by topic with time decay
    topic_performance = defaultdict(lambda: {
        'correct': 0, 
        'total': 0, 
        'weighted_correct': 0, 
        'weighted_total': 0
    })
    
    # Get the most recent quiz time for time decay calculation
    latest_quiz_time = student_quizzes[0].end_time or datetime.utcnow()
    
    # Process all completed quizzes
    for sq in student_quizzes:
        # Skip quizzes without completion time
        if not sq.end_time:
            continue
            
        # Calculate time decay factor (more recent quizzes have higher weight)
        # We use a 30-day half-life for quiz relevance
        days_since_completion = (latest_quiz_time - sq.end_time).days
        time_decay_factor = math.exp(-0.023 * days_since_completion)  # ~30-day half-life
        
        # Process answers for this quiz
        answers = StudentAnswer.query.filter_by(student_quiz_id=sq.id).all()
        
        for answer in answers:
            # Get the question to determine its topic
            question = Question.query.get(answer.question_id)
            if not question or not question.topic:
                continue
            
            topic = question.topic
            question_weight = question.weight
            
            # Update raw counts (no time decay)
            if answer.is_correct:
                topic_performance[topic]['correct'] += 1
            topic_performance[topic]['total'] += 1
            
            # Update weighted counts (with time decay)
            if answer.is_correct:
                topic_performance[topic]['weighted_correct'] += question_weight * time_decay_factor
            topic_performance[topic]['weighted_total'] += question_weight * time_decay_factor
    
    # Calculate and update knowledge levels for each topic
    for topic, perf in topic_performance.items():
        if perf['weighted_total'] > 0:
            # Calculate score using time-weighted performance
            score = perf['weighted_correct'] / perf['weighted_total']
            
            # Determine knowledge level based on score
            level = determine_knowledge_level(score)
            
            # Update or create knowledge level record
            knowledge_level = KnowledgeLevel.query.filter_by(
                student_id=student_id,
                topic=topic
            ).first()
            
            if knowledge_level:
                # Apply smoothing to prevent abrupt changes (70% new score, 30% old score)
                alpha = 0.7
                smoothed_score = alpha * score + (1 - alpha) * knowledge_level.score
                knowledge_level.score = smoothed_score
                knowledge_level.level = determine_knowledge_level(smoothed_score)
            else:
                # Create new knowledge level record
                knowledge_level = KnowledgeLevel(
                    student_id=student_id,
                    topic=topic,
                    score=score,
                    level=level
                )
                db.session.add(knowledge_level)
    
    # Commit changes to database
    db.session.commit()

def get_student_knowledge_summary(student_id):
    """
    Get a summary of a student's knowledge levels across all topics
    Returns overall level and score along with detailed topic information
    """
    # Get all knowledge levels for this student
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    if not knowledge_levels:
        return {
            'overall': {
                'level': 'Normal',  # Default level
                'score': 0.5       # Default score
            },
            'topics': []
        }
    
    # Look for overall knowledge level record
    overall_kl = KnowledgeLevel.query.filter_by(
        student_id=student_id,
        topic='OVERALL'
    ).first()
    
    if overall_kl:
        overall_level = overall_kl.level
        overall_score = overall_kl.score
    else:
        # Fallback: calculate from topic averages
        topic_levels = [kl for kl in knowledge_levels if kl.topic != 'OVERALL']
        if topic_levels:
            scores = [kl.score for kl in topic_levels]
            overall_score = sum(scores) / len(scores)
            overall_level = determine_knowledge_level(overall_score)
        else:
            overall_score = 0.5
            overall_level = 'Normal'
    
    return {
        'overall': {
            'level': overall_level,
            'score': overall_score
        },
        'topics': [
            {
                'topic': kl.topic,
                'level': kl.level,
                'score': kl.score
            }
            for kl in knowledge_levels if kl.topic != 'OVERALL'  # Exclude overall from topic list
        ]
    }

def get_weak_topics(student_id, threshold=0.5):
    """
    Get a list of topics where the student's knowledge level is below the threshold
    """
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    weak_topics = [
        {
            'topic': kl.topic,
            'score': kl.score,
            'level': kl.level
        }
        for kl in knowledge_levels if kl.score < threshold
    ]
    
    # Sort by score (lowest first)
    weak_topics.sort(key=lambda x: x['score'])
    
    return weak_topics

def get_knowledge_progress(student_id):
    """
    Get a student's knowledge progress over time
    """
    # Get all student quizzes in chronological order
    student_quizzes = StudentQuiz.query.filter_by(
        student_id=student_id,
        status='completed'
    ).order_by(StudentQuiz.end_time).all()
    
    if not student_quizzes:
        return []
    
    # Track knowledge levels at each quiz completion
    knowledge_history = []
    
    # Process quizzes chronologically
    topic_scores = defaultdict(lambda: {'correct': 0, 'total': 0})
    topic_weights = {}
    
    for i, sq in enumerate(student_quizzes):
        if not sq.end_time:
            continue
            
        # Get all answers for this quiz
        answers = StudentAnswer.query.filter_by(student_quiz_id=sq.id).all()
        
        # Update topic scores with this quiz's results
        for answer in answers:
            question = Question.query.get(answer.question_id)
            if not question or not question.topic:
                continue
                
            topic = question.topic
            topic_weights[topic] = question.weight
            
            if answer.is_correct:
                topic_scores[topic]['correct'] += 1
            topic_scores[topic]['total'] += 1
        
        # Calculate current knowledge levels
        current_levels = {}
        for topic, scores in topic_scores.items():
            if scores['total'] > 0:
                score = scores['correct'] / scores['total']
                current_levels[topic] = {
                    'score': score,
                    'level': determine_knowledge_level(score)
                }
        
        # Calculate overall score
        topic_score_dict = {t: s['correct']/s['total'] if s['total'] > 0 else 0 
                           for t, s in topic_scores.items()}
        overall_score = calculate_overall_score(topic_score_dict, topic_weights)
        
        # Add to history
        knowledge_history.append({
            'date': sq.end_time.strftime('%Y-%m-%d'),
            'quiz_id': sq.quiz_id,
            'overall_score': overall_score,
            'overall_level': determine_knowledge_level(overall_score),
            'topic_levels': current_levels
        })
    
    return knowledge_history