# admin_side/services/guidance_service.py
from models.ProgressModel import KnowledgeLevel, StudentQuiz, StudentAnswer
from models.QuizModel import Question
from models.UserModel import Student
import numpy as np
from collections import defaultdict
from datetime import datetime
import math
from flask import current_app
import logging

# Set up logging
logger = logging.getLogger(__name__)

def generate_personalized_guidance(student_id):
    """
    Generate personalized guidance for a student based on their knowledge levels,
    quiz history, and learning patterns.
    
    Returns a structured guidance object with:
    - Topic-specific recommendations
    - Overall learning path
    - Learning milestones
    - Recommended next steps
    """
    try:
        # Get the student
        student = Student.query.get(student_id)
        if not student:
            logger.error(f"Student with ID {student_id} not found")
            return None
            
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
        
        # Calculate overall level
        scores = [kl.score for kl in knowledge_levels]
        overall_score = np.mean(scores) if scores else 0.5
        
        if overall_score < 0.4:
            overall_level = 'Low'
        elif overall_score < 0.7:
            overall_level = 'Normal'
        else:
            overall_level = 'High'
        
        # Define topic prerequisites (which topics are foundational for others)
        # This information would ideally come from your curriculum design
        topic_prerequisites = {
            'SDLC': [],  # Foundational topic with no prerequisites
            'Agile': ['SDLC'],  # Requires understanding of SDLC
            'OSI Model': [],  # Foundational topic for networking
            'Network Engineering': ['OSI Model'],
            'Software Engineering': ['SDLC', 'Agile']
        }
        
        # Generate topic guidance
        topic_guidance = generate_topic_guidance(knowledge_levels, topic_prerequisites)
        
        # Generate learning path
        learning_path = {
            'level': overall_level,
            'description': get_level_description(overall_level),
            'milestones': generate_learning_milestones(overall_level, knowledge_levels, topic_prerequisites)
        }
        
        # Generate recommended next steps based on quiz history
        #next_steps = generate_next_steps(student_id, knowledge_levels)
        
        return {
            'topicGuidance': topic_guidance,
            'learningPath': learning_path
        }
    
    except Exception as e:
        logger.error(f"Error generating guidance: {str(e)}")
        # Return basic guidance in case of error
        return {
            'topicGuidance': [],
            'learningPath': {
                'level': 'Normal',
                'description': 'An error occurred while generating your personalized guidance.',
                'milestones': get_default_milestones('Normal')
            }
        }

def generate_topic_guidance(knowledge_levels, topic_prerequisites):
    """
    Generate topic-specific guidance based on knowledge levels and topic relationships.
    Considers topic interdependencies and learning sequence.
    """
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
    
    return topic_guidance

def generate_learning_milestones(level, knowledge_levels, topic_prerequisites):
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

def generate_next_steps(student_id, knowledge_levels):
    """
    Generate recommended next steps for the student based on their
    knowledge levels and quiz history.
    """
    # Get student quiz history
    student_quizzes = StudentQuiz.query.filter_by(student_id=student_id).order_by(StudentQuiz.created_at.desc()).all()
    
    next_steps = []
    
    # Recommend taking a quiz if none have been taken
    if not student_quizzes:
        next_steps.append({
            'type': 'quiz',
            'title': 'Take Your First Quiz',
            'description': 'Start your learning journey by completing a quiz to assess your knowledge.',
            'link': '/students/quizzes'
        })
        return next_steps
    
    # Recommend more quizzes if few have been taken
    if len(student_quizzes) < 3:
        next_steps.append({
            'type': 'quiz',
            'title': 'Take More Quizzes',
            'description': 'Complete more quizzes to get a better assessment of your knowledge.',
            'link': '/students/quizzes'
        })
    
    # Find lowest scoring topics
    knowledge_dict = {kl.topic: kl for kl in knowledge_levels}
    sorted_topics = sorted(knowledge_dict.items(), key=lambda x: x[1].score)
    
    if sorted_topics:
        weakest_topic = sorted_topics[0][0]
        next_steps.append({
            'type': 'focus',
            'title': f'Focus on {weakest_topic}',
            'description': f'This is currently your weakest topic. Dedicate extra time to improving in this area.',
            'link': f'/resources/{weakest_topic.lower().replace(" ", "-")}'
        })
    
    # Recommend reviewing recent quiz mistakes
    recent_incorrect_answers = StudentAnswer.query.join(StudentQuiz).filter(
        StudentQuiz.student_id == student_id,
        StudentAnswer.is_correct == False
    ).order_by(StudentAnswer.created_at.desc()).limit(5).all()
    
    if recent_incorrect_answers:
        question_ids = [answer.question_id for answer in recent_incorrect_answers]
        questions = Question.query.filter(Question.id.in_(question_ids)).all()
        topics = set(q.topic for q in questions if q.topic)
        
        if topics:
            topic_list = ', '.join(list(topics)[:3])
            next_steps.append({
                'type': 'review',
                'title': 'Review Recent Mistakes',
                'description': f'Focus on understanding the concepts you missed in recent quizzes, particularly in {topic_list}.',
                'link': '/students/quizzes'
            })
    
    return next_steps

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