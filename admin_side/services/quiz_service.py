import random
from datetime import datetime, timedelta
from models.QuizModel import Quiz, Question
from models.ProgressModel import StudentQuiz
from app import db
from utils.csv_utils import get_questions_from_csv

def generate_quiz_for_student(student, title, num_questions=15):
    """Generate a quiz for a student based on their knowledge levels"""
    # Create the quiz
    quiz = Quiz(
        title=title,
        description=f"Automatically generated quiz for {student.first_name} {student.last_name}",
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(days=7),
        duration_minutes=20
    )
    db.session.add(quiz)
    db.session.flush()  # Get the quiz ID without committing yet
    
    # Get questions from the CSV file
    all_questions = get_questions_from_csv()
    
    # Get the student's knowledge levels
    from models.ProgressModel import KnowledgeLevel
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
    
    selected_questions = []
    
    # First, select questions from topics with low knowledge levels
    weak_topics = [topic for topic, score in topic_levels.items() if score < 0.5]
    for topic in weak_topics:
        if topic in topics_questions and len(topics_questions[topic]) > 0:
            # Get up to 3 questions from each weak topic
            topic_qs = topics_questions[topic]
            num_to_select = min(3, len(topic_qs))
            selected_questions.extend(random.sample(topic_qs, num_to_select))
    
    # If we need more questions, select from all topics
    remaining = num_questions - len(selected_questions)
    if remaining > 0:
        # Flatten the list of all questions
        all_qs = [q for topic_qs in topics_questions.values() for q in topic_qs 
                 if q not in selected_questions]
        
        # Select random questions from the remaining pool
        if len(all_qs) > remaining:
            selected_questions.extend(random.sample(all_qs, remaining))
        else:
            selected_questions.extend(all_qs)
    
    # Limit to the desired number of questions
    selected_questions = selected_questions[:num_questions]
    
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
        correct_answer = int(q_data.get('Correct Answer', '1'))
        
        # Create the question
        question = Question(
            quiz_id=quiz.id,
            text=q_data.get('Question Text', ''),
            option_1=options[0],
            option_2=options[1],
            option_3=options[2],
            option_4=options[3],
            correct_answer=correct_answer,
            weight=float(q_data.get('Question Weight', 1.0)),
            topic=q_data.get('Topic', ''),
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

def calculate_quiz_score(student_quiz_id):
    """Calculate the score for a completed quiz"""
    from models.ProgressModel import StudentQuiz, StudentAnswer
    
    # Get the student quiz
    student_quiz = StudentQuiz.query.get(student_quiz_id)
    if not student_quiz:
        raise ValueError("Student quiz not found")
    
    # Get all answers for this quiz
    answers = StudentAnswer.query.filter_by(student_quiz_id=student_quiz_id).all()
    
    # Calculate score
    total_points = 0
    max_points = 0
    
    for answer in answers:
        # Get the question
        question = answer.question
        
        # Add points if correct
        if answer.is_correct:
            total_points += question.weight
        
        max_points += question.weight
    
    # Calculate percentage score
    if max_points > 0:
        score = (total_points / max_points) * 100
    else:
        score = 0
    
    # Update the student quiz record
    student_quiz.score = score
    db.session.commit()
    
    return score