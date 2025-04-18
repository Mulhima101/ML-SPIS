from models.ProgressModel import KnowledgeLevel, StudentQuiz, StudentAnswer
from models.QuizModel import Question
from app import db
import numpy as np
from collections import defaultdict

def update_knowledge_levels(student_id):
    """Update a student's knowledge levels based on their quiz answers"""
    # Get all student quiz attempts
    student_quizzes = StudentQuiz.query.filter_by(
        student_id=student_id,
        status='completed'
    ).all()
    
    # Create a dictionary to track performance by topic
    topic_performance = defaultdict(lambda: {'correct': 0, 'total': 0})
    
    # Process all completed quizzes
    for sq in student_quizzes:
        # Get all answers for this quiz
        answers = StudentAnswer.query.filter_by(student_quiz_id=sq.id).all()
        
        for answer in answers:
            # Get the question
            question = Question.query.get(answer.question_id)
            if not question:
                continue
            
            # Update topic performance
            topic = question.topic
            if answer.is_correct:
                topic_performance[topic]['correct'] += question.weight
            topic_performance[topic]['total'] += question.weight
    
    # Update knowledge levels for each topic
    for topic, perf in topic_performance.items():
        if perf['total'] > 0:
            # Calculate score (0.0 to 1.0)
            score = perf['correct'] / perf['total']
            
            # Determine level
            if score < 0.4:
                level = 'Low'
            elif score < 0.7:
                level = 'Normal'
            else:
                level = 'High'
            
            # Update or create knowledge level record
            knowledge_level = KnowledgeLevel.query.filter_by(
                student_id=student_id,
                topic=topic
            ).first()
            
            if knowledge_level:
                knowledge_level.score = score
                knowledge_level.level = level
            else:
                knowledge_level = KnowledgeLevel(
                    student_id=student_id,
                    topic=topic,
                    score=score,
                    level=level
                )
                db.session.add(knowledge_level)
    
    db.session.commit()

def get_personalized_guidance(student_id):
    """Generate personalized guidance for a student based on their knowledge levels"""
    # Get knowledge levels
    knowledge_levels = KnowledgeLevel.query.filter_by(student_id=student_id).all()
    
    # If no knowledge levels exist, return empty guidance
    if not knowledge_levels:
        return {
            'topicGuidance': [],
            'learningPath': {
                'level': 'Normal',
                'description': 'Complete some quizzes to get personalized guidance.',
                'milestones': []
            }
        }
    
    # Calculate overall level
    scores = [kl.score for kl in knowledge_levels]
    overall_score = np.mean(scores)
    
    if overall_score < 0.4:
        overall_level = 'Low'
    elif overall_score < 0.7:
        overall_level = 'Normal'
    else:
        overall_level = 'High'
    
    # Generate topic guidance
    topic_guidance = []
    for kl in knowledge_levels:
        guidance = {
            'topic': kl.topic,
            'score': kl.score,
            'status': kl.level.lower(),
            'recommendations': []
        }
        
        # Add recommendations based on level
        if kl.level == 'Low':
            guidance['recommendations'].append({
                'type': 'resource',
                'title': 'Fundamentals',
                'description': f'Review the basic concepts of {kl.topic} to build a solid foundation.',
                'link': '/resources/fundamentals'
            })
            guidance['recommendations'].append({
                'type': 'practice',
                'title': 'Basic Practice',
                'description': f'Complete basic exercises to reinforce your understanding of {kl.topic}.',
                'link': '/practice/basic'
            })
        elif kl.level == 'Normal':
            guidance['recommendations'].append({
                'type': 'resource',
                'title': 'Advanced Concepts',
                'description': f'Explore more advanced concepts in {kl.topic} to deepen your knowledge.',
                'link': '/resources/advanced'
            })
            guidance['recommendations'].append({
                'type': 'practice',
                'title': 'Challenging Exercises',
                'description': f'Tackle more challenging problems in {kl.topic} to test your skills.',
                'link': '/practice/intermediate'
            })
        else:  # High
            guidance['recommendations'].append({
                'type': 'resource',
                'title': 'Expert Resources',
                'description': f'Study expert-level materials on {kl.topic} to master the subject.',
                'link': '/resources/expert'
            })
            guidance['recommendations'].append({
                'type': 'goal',
                'title': 'Knowledge Sharing',
                'description': f'Consider sharing your knowledge of {kl.topic} with peers or in online forums.',
                'link': '/community'
            })
        
        topic_guidance.append(guidance)
    
    # Generate learning path
    learning_path = {
        'level': overall_level,
        'description': f'Your current knowledge level is {overall_level}. This personalized learning path will help you improve your knowledge.',
        'milestones': []
    }
    
    # Add milestones based on overall level
    if overall_level == 'Low':
        learning_path['milestones'] = [
            {
                'title': 'Master Fundamentals',
                'description': 'Focus on understanding basic concepts across all topics.',
                'isCompleted': False
            },
            {
                'title': 'Regular Practice',
                'description': 'Complete at least 5 quizzes to build your knowledge.',
                'isCompleted': False
            },
            {
                'title': 'Focus on Weak Areas',
                'description': 'Pay special attention to topics with the lowest scores.',
                'isCompleted': False
            }
        ]
    elif overall_level == 'Normal':
        learning_path['milestones'] = [
            {
                'title': 'Strengthen Knowledge',
                'description': 'Aim to improve your scores in all topics to at least 70%.',
                'isCompleted': False
            },
            {
                'title': 'Apply Concepts',
                'description': 'Work on applying theoretical knowledge to practical problems.',
                'isCompleted': False
            },
            {
                'title': 'Advanced Topics',
                'description': 'Begin exploring more advanced topics and concepts.',
                'isCompleted': False
            }
        ]
    else:  # High
        learning_path['milestones'] = [
            {
                'title': 'Mastery',
                'description': 'Aim for complete mastery across all topics.',
                'isCompleted': False
            },
            {
                'title': 'Specialization',
                'description': 'Consider specializing in areas of particular interest or strength.',
                'isCompleted': False
            },
            {
                'title': 'Peer Teaching',
                'description': 'Share your knowledge with peers to reinforce your understanding.',
                'isCompleted': False
            }
        ]
    
    return {
        'topicGuidance': topic_guidance,
        'learningPath': learning_path
    }