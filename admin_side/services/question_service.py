# admin_side/services/question_service.py
import random
from datetime import datetime, timedelta
from models.QuizModel import Quiz, Question
from models.ProgressModel import KnowledgeLevel, StudentQuiz
from app import db
from utils.csv_utils import get_questions_from_csv

def filter_questions_by_topic(questions, topic):
    """
    Filter questions by topic
    """
    return [q for q in questions if q.get('Topic', '') == topic]

def filter_questions_by_difficulty(questions, difficulty_range):
    """
    Filter questions by difficulty (weight)
    difficulty_range should be a tuple of (min_weight, max_weight)
    """
    min_weight, max_weight = difficulty_range
    return [q for q in questions if min_weight <= float(q.get('Question Weight', 1.0)) <= max_weight]

def select_questions_by_knowledge_level(questions, knowledge_level):
    """
    Select questions appropriate for a given knowledge level
    """
    # Sort questions by weight (difficulty)
    try:
        sorted_questions = sorted(questions, key=lambda q: float(q.get('Question Weight', 1.0)))
    except (ValueError, TypeError):
        # If conversion fails, use default order
        sorted_questions = questions
    
    # Determine which difficulty range to use based on knowledge level
    if knowledge_level == 'Low':
        # For low knowledge, focus on easier questions (first 60% of the range)
        end_idx = int(len(sorted_questions) * 0.6)
        selected_range = sorted_questions[:end_idx]
    elif knowledge_level == 'Normal':
        # For normal knowledge, focus on medium difficulty (middle 60%)
        start_idx = int(len(sorted_questions) * 0.2)
        end_idx = int(len(sorted_questions) * 0.8)
        selected_range = sorted_questions[start_idx:end_idx]
    else:  # High
        # For high knowledge, focus on harder questions (last 60% of the range)
        start_idx = int(len(sorted_questions) * 0.4)
        selected_range = sorted_questions[start_idx:]
    
    return selected_range if selected_range else sorted_questions

def get_topic_distribution_by_knowledge(knowledge_levels, num_questions=15):
    """
    Determine how many questions to select from each topic based on student's knowledge levels
    Allocates more questions to weaker topics
    """
    # Sort topics by knowledge level (prioritize weaker topics)
    sorted_topics = sorted([(kl.topic, kl.score) for kl in knowledge_levels], key=lambda x: x[1])
    
    # Calculate weights (inverse of knowledge score)
    total_inverse_weight = sum(1 - score for _, score in sorted_topics)
    
    # Initialize distribution
    topic_distribution = {}
    remaining_questions = num_questions
    
    # Allocate questions based on inverse weights
    for topic, score in sorted_topics:
        # Invert and normalize the score to get a weight
        weight = (1 - score) / total_inverse_weight if total_inverse_weight > 0 else 1/len(sorted_topics)
        
        # Allocate questions proportionally to weight, but ensure at least 1
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
    
    return topic_distribution

def create_personalized_quiz(student_id, title, description=None, num_questions=15):
    """
    Create a personalized quiz for a student based on their knowledge levels
    """
    # Get student's knowledge levels
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    # Get question pool from CSV
    all_questions = get_questions_from_csv()
    
    # Create new quiz
    quiz = Quiz(
        title=title,
        description=description or f"Personalized quiz based on your knowledge profile",
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(days=7),  # Available for 7 days
        duration_minutes=20  # Default 20 minutes
    )
    
    db.session.add(quiz)
    db.session.flush()  # Get quiz ID without committing yet
    
    selected_questions = []
    
    # If student has knowledge levels, use them to personalize the quiz
    if knowledge_levels:
        # Get question distribution by topic
        topic_distribution = get_topic_distribution_by_knowledge(knowledge_levels, num_questions)
        
        # Group questions by topic
        topic_questions = {}
        for q in all_questions:
            topic = q.get('Topic', 'Unknown')
            if topic not in topic_questions:
                topic_questions[topic] = []
            topic_questions[topic].append(q)
        
        # Select questions for each topic
        for topic, count in topic_distribution.items():
            if topic in topic_questions and topic_questions[topic]:
                # Get topic questions
                available_questions = topic_questions[topic]
                
                # Get knowledge level for this topic
                topic_level = next((kl.level for kl in knowledge_levels if kl.topic == topic), 'Normal')
                
                # Select questions appropriate for this level
                level_questions = select_questions_by_knowledge_level(available_questions, topic_level)
                
                # Randomly select the requested number
                num_to_select = min(count, len(level_questions))
                if num_to_select > 0:
                    selected_questions.extend(random.sample(level_questions, num_to_select))
    else:
        # If no knowledge levels yet, select random questions from various topics
        topics = set(q.get('Topic', 'Unknown') for q in all_questions)
        topics = [t for t in topics if t != 'Unknown']
        
        # Try to balance questions across topics
        questions_per_topic = max(1, num_questions // len(topics)) if topics else num_questions
        
        for topic in topics:
            topic_qs = [q for q in all_questions if q.get('Topic', '') == topic]
            if topic_qs:
                num_to_select = min(questions_per_topic, len(topic_qs))
                if num_to_select > 0:
                    selected_questions.extend(random.sample(topic_qs, num_to_select))
                    
        # If we still don't have enough, add random questions
        if len(selected_questions) < num_questions:
            remaining = num_questions - len(selected_questions)
            remaining_questions = [q for q in all_questions if q not in selected_questions]
            if remaining_questions and remaining > 0:
                num_to_select = min(remaining, len(remaining_questions))
                selected_questions.extend(random.sample(remaining_questions, num_to_select))
    
    # Limit to the desired number and shuffle
    selected_questions = selected_questions[:num_questions]
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
            topic=q_data.get('Topic', ''),
            source_qid=q_data.get('QID', '')
        )
        db.session.add(question)
    
    # Create the student quiz record
    student_quiz = StudentQuiz(
        student_id=student_id,
        quiz_id=quiz.id,
        status='uncompleted'
    )
    db.session.add(student_quiz)
    
    # Commit all changes
    db.session.commit()
    
    return quiz

def get_topic_statistics():
    """
    Get statistics about the question pool
    """
    all_questions = get_questions_from_csv()
    
    # Count questions by topic
    topic_counts = {}
    topic_weights = {}
    
    for q in all_questions:
        topic = q.get('Topic', 'Unknown')
        
        # Count topics
        if topic not in topic_counts:
            topic_counts[topic] = 0
            topic_weights[topic] = []
            
        topic_counts[topic] += 1
        
        # Track weights
        try:
            weight = float(q.get('Question Weight', 1.0))
            topic_weights[topic].append(weight)
        except (ValueError, TypeError):
            pass
    
    # Calculate statistics for each topic
    topic_stats = []
    for topic in topic_counts:
        weights = topic_weights[topic]
        avg_weight = sum(weights) / len(weights) if weights else 1.0
        
        topic_stats.append({
            'topic': topic,
            'question_count': topic_counts[topic],
            'avg_difficulty': avg_weight,
            'min_difficulty': min(weights) if weights else 1.0,
            'max_difficulty': max(weights) if weights else 1.0
        })
    
    return topic_stats

def get_missing_topics(student_id):
    """
    Identify topics that exist in the question pool but the student hasn't been tested on
    """
    # Get all topics in the question pool
    topic_stats = get_topic_statistics()
    all_topics = [stat['topic'] for stat in topic_stats if stat['topic'] != 'Unknown']
    
    # Get topics the student has knowledge levels for
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    known_topics = [kl.topic for kl in knowledge_levels]
    
    # Find missing topics
    missing_topics = [topic for topic in all_topics if topic not in known_topics]
    
    # Get statistics for the missing topics
    missing_topic_stats = [stat for stat in topic_stats if stat['topic'] in missing_topics]
    
    return missing_topic_stats