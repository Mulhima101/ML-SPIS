# admin_side/services/ml_service.py
from models.ProgressModel import KnowledgeLevel, StudentQuiz, StudentAnswer
from models.QuizModel import Question
from app import db
import numpy as np
from collections import defaultdict
from sklearn.metrics import f1_score
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime, timedelta
import math
import pickle
import os
from flask import current_app

# Load the ML model and label encoder
def load_ml_model():
    """Load the trained model and label encoder for knowledge level prediction"""
    try:
        model_path = os.path.join(current_app.root_path, 'models', 'best_student_classifier.pkl')
        encoder_path = os.path.join(current_app.root_path, 'models', 'label_encoder.pkl')
        
        # Check if files exist
        if not os.path.exists(model_path) or not os.path.exists(encoder_path):
            current_app.logger.warning("ML model files not found, using fallback rule-based approach")
            return None, None
        
        # Try to load with different protocols to handle version issues
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            
            with open(encoder_path, 'rb') as f:
                label_encoder = pickle.load(f)
                
            return model, label_encoder
        except (UnicodeDecodeError, ValueError) as e:
            current_app.logger.warning(f"Error loading ML model (protocol issue): {e}")
            # Try with older protocol
            with open(model_path, 'rb') as f:
                model = pickle.load(f, encoding='latin1')
            
            with open(encoder_path, 'rb') as f:
                label_encoder = pickle.load(f, encoding='latin1')
                
            return model, label_encoder
            
    except Exception as e:
        # Fallback to rule-based approach if model files not found or corrupted
        current_app.logger.warning(f"ML model loading failed: {e}, using fallback rule-based approach")
        return None, None

def calculate_student_average_score(student_id):
    """Calculate the average quiz score for a student"""
    completed_quizzes = StudentQuiz.query.filter_by(
        student_id=student_id,
        status='completed'
    ).all()
    
    if not completed_quizzes:
        return 0.0
    
    total_score = sum(quiz.score for quiz in completed_quizzes if quiz.score is not None)
    return total_score / len(completed_quizzes)

def determine_knowledge_level_with_model(student_id):
    """Determine knowledge level using the ML model based on average quiz scores"""
    # Calculate average quiz score
    avg_score = calculate_student_average_score(student_id)
    
    # Convert to 0-1 scale by dividing by 100
    model_input = avg_score / 100.0
    
    # Load ML model
    model, label_encoder = load_ml_model()
    
    if model is not None and label_encoder is not None:
        try:
            # Use the ML model to predict
            prediction = model.predict([[model_input]])[0]
            level = label_encoder.inverse_transform([prediction])[0]
            
            # Map model output to our expected format
            level_mapping = {
                'low': 'Low',
                'medium': 'Normal',
                'high': 'High'
            }
            return level_mapping.get(level.lower(), 'Normal')
        except Exception as e:
            current_app.logger.error(f"Error using ML model: {e}")
            # Fall back to rule-based approach
            pass
    
    # Fallback rule-based approach (matches the model logic you described)
    if model_input < 0.5:
        return 'Low'
    elif model_input < 0.8:
        return 'Normal'
    else:
        return 'High'

def determine_knowledge_level(score):
    """Determine knowledge level based on score with more nuanced thresholds"""
    if score < 0.4:
        return 'Low'
    elif score < 0.7:
        return 'Normal'
    else:
        return 'High'

def update_knowledge_levels(student_id):
    """
    Update a student's knowledge levels based on their quiz answers.
    Now uses ML model for overall level determination.
    """
    print(f"DEBUG ML: Starting knowledge level update for student {student_id}")
    
    try:
        # Get all student quiz attempts
        student_quizzes = StudentQuiz.query.filter_by(
            student_id=student_id,
            status='completed'
        ).order_by(StudentQuiz.end_time.desc()).all()
        
        print(f"DEBUG ML: Found {len(student_quizzes)} completed quizzes")
        
        if not student_quizzes:
            print("DEBUG ML: No completed quizzes found, returning")
            return
        
        # Create a dictionary to track performance by topic
        topic_performance = defaultdict(lambda: {'correct': 0, 'total': 0, 'weighted_correct': 0, 'weighted_total': 0})
        
        # Get the most recent quiz completion time
        latest_quiz_time = student_quizzes[0].end_time if student_quizzes[0].end_time else datetime.utcnow()
        print(f"DEBUG ML: Latest quiz time: {latest_quiz_time}")
        
        # Process all completed quizzes with time decay
        for sq in student_quizzes:
            print(f"DEBUG ML: Processing quiz {sq.id} with end_time: {sq.end_time}")
            
            # Skip quizzes without completion time
            if not sq.end_time:
                print(f"DEBUG ML: Skipping quiz {sq.id} - no end_time")
                continue
                
            # Calculate time decay factor (more recent quizzes have higher weight)
            # We use a 30-day half-life for quiz relevance
            days_since_completion = (latest_quiz_time - sq.end_time).days
            time_decay_factor = math.exp(-0.023 * days_since_completion)  # ~30-day half-life
            print(f"DEBUG ML: Time decay factor for quiz {sq.id}: {time_decay_factor}")
            
            # Get all answers for this quiz
            answers = StudentAnswer.query.filter_by(student_quiz_id=sq.id).all()
            print(f"DEBUG ML: Found {len(answers)} answers for quiz {sq.id}")
            
            for answer in answers:
                # Get the question
                question = Question.query.get(answer.question_id)
                if not question:
                    print(f"DEBUG ML: Question {answer.question_id} not found")
                    continue
                    
                if not question.topic or question.topic.strip() == '':
                    print(f"DEBUG ML: Question {question.id} has no topic assigned (topic='{question.topic}')")
                    continue
                
                # Update topic performance with time decay applied
                topic = question.topic.strip()  # Remove any whitespace
                question_weight = question.weight or 1.0  # Default weight if None
                
                print(f"DEBUG ML: Processing answer for topic '{topic}' - correct: {answer.is_correct}, weight: {question_weight}")
                
                # Record raw score (no time decay)
                if answer.is_correct:
                    topic_performance[topic]['correct'] += 1
                topic_performance[topic]['total'] += 1
                
                # Record weighted score (with time decay)
                if answer.is_correct:
                    topic_performance[topic]['weighted_correct'] += question_weight * time_decay_factor
                topic_performance[topic]['weighted_total'] += question_weight * time_decay_factor
        
        print(f"DEBUG ML: Topic performance calculated: {dict(topic_performance)}")
        
        # If no topics were found, create a fallback overall record
        if not topic_performance:
            print("DEBUG ML: No topics found in any questions, creating fallback overall knowledge level")
            avg_score = calculate_student_average_score(student_id)
            overall_score = avg_score / 100.0
            overall_level = determine_knowledge_level_with_model(student_id)
            
            # Create overall knowledge level record
            overall_knowledge_level = KnowledgeLevel.query.filter_by(
                student_id=student_id,
                topic='OVERALL'
            ).first()
            
            if overall_knowledge_level:
                overall_knowledge_level.score = overall_score
                overall_knowledge_level.level = overall_level
            else:
                overall_knowledge_level = KnowledgeLevel(
                    student_id=student_id,
                    topic='OVERALL',
                    score=overall_score,
                    level=overall_level
                )
                db.session.add(overall_knowledge_level)
            
            db.session.commit()
            print("DEBUG ML: Created fallback overall knowledge level")
            return
        
        # Process topic-specific knowledge levels
        for topic, perf in topic_performance.items():
            if perf['weighted_total'] > 0:
                # Calculate weighted score (0.0 to 1.0)
                score = perf['weighted_correct'] / perf['weighted_total']
                
                # Calculate raw score (for comparison)
                raw_score = perf['correct'] / perf['total'] if perf['total'] > 0 else 0
                
                # Apply a smoothing function to make transitions between levels more gradual
                # This helps prevent frequent fluctuations between levels
                level = determine_knowledge_level(score)
                
                print(f"DEBUG ML: Topic '{topic}' - Score: {score:.3f}, Level: {level}")
                
                # Update or create knowledge level record
                knowledge_level = KnowledgeLevel.query.filter_by(
                    student_id=student_id,
                    topic=topic
                ).first()
                
                if knowledge_level:
                    print(f"DEBUG ML: Updating existing knowledge level for topic '{topic}'")
                    # Apply smoothing to the score update (blend old and new scores)
                    # This gives more stability to the knowledge level over time
                    alpha = 0.7  # Weight for new score (0.7 means 70% new score, 30% old score)
                    smoothed_score = alpha * score + (1 - alpha) * knowledge_level.score
                    knowledge_level.score = smoothed_score
                    knowledge_level.level = determine_knowledge_level(smoothed_score)
                else:
                    print(f"DEBUG ML: Creating new knowledge level for topic '{topic}'")
                    knowledge_level = KnowledgeLevel(
                        student_id=student_id,
                        topic=topic,
                        score=score,
                        level=determine_knowledge_level(score)
                    )
                    db.session.add(knowledge_level)
        
        # NOW ADD OVERALL KNOWLEDGE LEVEL USING ML MODEL
        # Calculate overall knowledge level using ML model
        try:
            overall_level = determine_knowledge_level_with_model(student_id)
            avg_score = calculate_student_average_score(student_id)
            overall_score = avg_score / 100.0
            
            print(f"DEBUG ML: Overall level: {overall_level}, Overall score: {overall_score}")
            
            # Update or create overall knowledge level record
            overall_knowledge_level = KnowledgeLevel.query.filter_by(
                student_id=student_id,
                topic='OVERALL'  # Special topic name for overall knowledge level
            ).first()
            
            if overall_knowledge_level:
                print("DEBUG ML: Updating existing overall knowledge level")
                # Apply smoothing for overall score too
                alpha = 0.7
                smoothed_overall_score = alpha * overall_score + (1 - alpha) * overall_knowledge_level.score
                overall_knowledge_level.score = smoothed_overall_score
                overall_knowledge_level.level = overall_level
            else:
                print("DEBUG ML: Creating new overall knowledge level")
                overall_knowledge_level = KnowledgeLevel(
                    student_id=student_id,
                    topic='OVERALL',
                    score=overall_score,
                    level=overall_level
                )
                db.session.add(overall_knowledge_level)
        except Exception as e:
            print(f"DEBUG ML: Error calculating overall level: {e}")
        
        try:
            db.session.commit()
            print("DEBUG ML: Successfully committed knowledge level changes to database")
        except Exception as e:
            print(f"ERROR ML: Failed to commit changes: {e}")
            db.session.rollback()
            raise
            
    except Exception as e:
        print(f"ERROR ML: Unexpected error in update_knowledge_levels: {e}")
        import traceback
        traceback.print_exc()
        raise

def get_personalized_guidance(student_id):
    """
    Generate personalized guidance for a student based on their knowledge levels.
    Now uses ML model for overall level determination.
    """
    # Get knowledge levels
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    # If no knowledge levels exist, return default guidance
    if not knowledge_levels:
        return {
            'topicGuidance': [],
            'learningPath': {
                'level': 'Normal',
                'description': 'Complete some quizzes to get personalized guidance.',
                'milestones': get_default_milestones('Normal')
            }
        }
    
    # Use ML model to determine overall level
    overall_level = determine_knowledge_level_with_model(student_id)
    
    # Define topic prerequisites (which topics are foundational for others)
    # This information would typically come from domain experts or curriculum design
    topic_prerequisites = {
        'SDLC': [],  # Foundational topic with no prerequisites
        'Agile': ['SDLC'],  # Requires understanding of SDLC
        'OSI Model': [],  # Foundational topic for networking
        'Network Engineering': ['OSI Model'],
        'Software Engineering': ['SDLC', 'Agile']
        # Add more topic relationships as needed
    }
    
    # Get knowledge levels as a dictionary for easier lookup
    knowledge_dict = {kl.topic: kl for kl in knowledge_levels}
    
    # Generate topic guidance
    topic_guidance = []
    for kl in knowledge_levels:
        # Skip topics with high mastery unless explicitly requested
        if kl.level == 'High' and len(knowledge_levels) > 3:
            continue
            
        # Calculate if prerequisites are satisfied
        prerequisites_satisfied = True
        missing_prerequisites = []
        
        if kl.topic in topic_prerequisites:
            for prereq in topic_prerequisites[kl.topic]:
                if prereq not in knowledge_dict or knowledge_dict[prereq].level == 'Low':
                    prerequisites_satisfied = False
                    missing_prerequisites.append(prereq)
        
        guidance = {
            'topic': kl.topic,
            'score': kl.score,
            'status': kl.level.lower(),
            'recommendations': []
        }
        
        # Add recommendations based on level and prerequisites
        if not prerequisites_satisfied:
            # Recommend focusing on prerequisites first
            guidance['recommendations'].append({
                'type': 'prerequisite',
                'title': 'Focus on Prerequisites',
                'description': f"Before advancing in {kl.topic}, strengthen your understanding of: {', '.join(missing_prerequisites)}.",
                'link': '/resources/prerequisites'
            })
        
        if kl.level == 'Low':
            guidance['recommendations'].append({
                'type': 'resource',
                'title': 'Fundamentals',
                'description': f'Review the basic concepts of {kl.topic} to build a solid foundation.',
                'link': f'/resources/{kl.topic.lower().replace(" ", "-")}/fundamentals'
            })
            guidance['recommendations'].append({
                'type': 'practice',
                'title': 'Basic Practice',
                'description': f'Complete basic exercises to reinforce your understanding of {kl.topic}.',
                'link': f'/practice/{kl.topic.lower().replace(" ", "-")}/basic'
            })
        elif kl.level == 'Normal':
            guidance['recommendations'].append({
                'type': 'resource',
                'title': 'Advanced Concepts',
                'description': f'Explore more advanced concepts in {kl.topic} to deepen your knowledge.',
                'link': f'/resources/{kl.topic.lower().replace(" ", "-")}/advanced'
            })
            guidance['recommendations'].append({
                'type': 'practice',
                'title': 'Challenging Exercises',
                'description': f'Tackle more challenging problems in {kl.topic} to test your skills.',
                'link': f'/practice/{kl.topic.lower().replace(" ", "-")}/intermediate'
            })
        else:  # High
            guidance['recommendations'].append({
                'type': 'resource',
                'title': 'Expert Resources',
                'description': f'Study expert-level materials on {kl.topic} to master the subject.',
                'link': f'/resources/{kl.topic.lower().replace(" ", "-")}/expert'
            })
            guidance['recommendations'].append({
                'type': 'goal',
                'title': 'Knowledge Sharing',
                'description': f'Consider sharing your knowledge of {kl.topic} with peers or in online forums.',
                'link': '/community'
            })
        
        topic_guidance.append(guidance)
    
    # Sort by priority (lowest scores first, but prerequisites before their dependent topics)
    def get_priority_score(topic_guidance_item):
        topic = topic_guidance_item['topic']
        score = topic_guidance_item['score']
        
        # Check if this topic is a prerequisite for any other topics
        is_prerequisite_for = 0
        for t, prereqs in topic_prerequisites.items():
            if topic in prereqs:
                is_prerequisite_for += 1
                
        # Lower score and being a prerequisite increases priority
        return score - (is_prerequisite_for * 0.1)
    
    topic_guidance.sort(key=get_priority_score)
    
    # Generate personalized learning path
    return {
        'topicGuidance': topic_guidance,
        'learningPath': {
            'level': overall_level,
            'description': get_level_description(overall_level),
            'milestones': get_milestones(overall_level, knowledge_levels, topic_prerequisites)
        }
    }

def get_level_description(level):
    """Generate a personalized level description based on the knowledge level."""
    if level == 'Low':
        return "Your current knowledge level is Low. This personalized learning path will help you build a strong foundation of core concepts before moving to more advanced topics."
    elif level == 'Normal':
        return "Your current knowledge level is Normal. This personalized learning path will help you strengthen your weak areas and advance to a High knowledge level."
    else:  # High
        return "Your current knowledge level is High. This personalized learning path will help you maintain your expertise and explore advanced topics in your field."

def get_default_milestones(level):
    """Get default milestones for students with no quiz history."""
    if level == 'Low':
        return [
            {
                'title': 'Start Your Learning Journey',
                'description': 'Complete your first quiz to begin receiving personalized guidance.',
                'isCompleted': False
            },
            {
                'title': 'Build Core Knowledge',
                'description': 'Focus on understanding fundamental concepts across all topics.',
                'isCompleted': False
            }
        ]
    elif level == 'Normal':
        return [
            {
                'title': 'Expand Your Knowledge',
                'description': 'Complete quizzes to identify and strengthen your knowledge gaps.',
                'isCompleted': False
            },
            {
                'title': 'Practice Regularly',
                'description': 'Take quizzes consistently to reinforce your learning.',
                'isCompleted': False
            }
        ]
    else:  # High
        return [
            {
                'title': 'Demonstrate Your Knowledge',
                'description': 'Complete quizzes to showcase your expertise and identify any remaining gaps.',
                'isCompleted': False
            },
            {
                'title': 'Advanced Learning',
                'description': 'Explore advanced topics and concepts in your field.',
                'isCompleted': False
            }
        ]

def get_milestones(level, knowledge_levels, topic_prerequisites):
    """
    Generate personalized milestones based on knowledge level and topic performance.
    This function creates targeted, actionable learning goals.
    """
    milestones = []
    
    # Convert knowledge levels to a dictionary for easier lookup
    knowledge_dict = {kl.topic: kl for kl in knowledge_levels}
    
    if level == 'Low':
        # Focus on foundational topics first
        foundational_topics = [topic for topic, prereqs in topic_prerequisites.items() if not prereqs]
        weak_foundational_topics = [topic for topic in foundational_topics 
                                  if topic in knowledge_dict and knowledge_dict[topic].level == 'Low']
        
        if weak_foundational_topics:
            milestones.append({
                'title': 'Master Foundation Topics',
                'description': f"Focus on strengthening your knowledge of: {', '.join(weak_foundational_topics)}.",
                'isCompleted': False
            })
        
        milestones.append({
            'title': 'Regular Practice',
            'description': 'Complete at least 5 quizzes to build your knowledge across all topics.',
            'isCompleted': False
        })
        
        milestones.append({
            'title': 'Focus on Weak Areas',
            'description': 'Pay special attention to topics with the lowest scores in your knowledge profile.',
            'isCompleted': False
        })
        
    elif level == 'Normal':
        # Identify topics that are prerequisites for others but still weak
        important_prerequisite_topics = []
        for topic, prereqs in topic_prerequisites.items():
            for prereq in prereqs:
                if prereq in knowledge_dict and knowledge_dict[prereq].level != 'High':
                    important_prerequisite_topics.append(prereq)
        
        if important_prerequisite_topics:
            unique_topics = list(set(important_prerequisite_topics))
            milestones.append({
                'title': 'Strengthen Key Prerequisites',
                'description': f"Focus on improving these important foundation topics: {', '.join(unique_topics)}.",
                'isCompleted': False
            })
        
        # Find any topics below 70% score
        below_threshold_topics = [kl.topic for kl in knowledge_levels if kl.score < 0.7]
        if below_threshold_topics:
            milestones.append({
                'title': 'Reach 70% in All Topics',
                'description': f"Work to improve your scores in: {', '.join(below_threshold_topics)}.",
                'isCompleted': False
            })
        
        milestones.append({
            'title': 'Apply Concepts',
            'description': 'Practice applying theoretical knowledge to more complex scenarios.',
            'isCompleted': False
        })
        
    else:  # High
        # For high performers, focus on maintaining expertise and helping others
        milestones.append({
            'title': 'Maintain Mastery',
            'description': 'Continue regular practice to maintain your high level of knowledge.',
            'isCompleted': False
        })
        
        # Find any topics below 85% score (even high performers have room to improve)
        below_expert_topics = [kl.topic for kl in knowledge_levels if kl.score < 0.85]
        if below_expert_topics:
            milestones.append({
                'title': 'Reach Expert Level',
                'description': f"Push for excellence in: {', '.join(below_expert_topics)}.",
                'isCompleted': False
            })
        
        milestones.append({
            'title': 'Peer Teaching',
            'description': 'Share your knowledge with peers to reinforce your understanding.',
            'isCompleted': False
        })
    
    # Always include an "explore new topics" milestone
    covered_topics = set(kl.topic for kl in knowledge_levels)
    all_topics = set(topic_prerequisites.keys())
    new_topics = all_topics - covered_topics
    
    if new_topics:
        milestones.append({
            'title': 'Explore New Topics',
            'description': f"Branch out to new areas such as: {', '.join(list(new_topics)[:3])}.",
            'isCompleted': False
        })
    
    return milestones