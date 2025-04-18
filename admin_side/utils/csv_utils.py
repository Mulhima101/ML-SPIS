import pandas as pd
import os
from config import Config

def get_questions_from_csv():
    """Read and parse questions from the CSV file"""
    csv_path = Config.QUESTION_POOL_PATH
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Question pool CSV file not found at {csv_path}")
    
    # Read CSV file
    df = pd.read_csv(csv_path)
    
    # Convert DataFrame to list of dictionaries
    questions = df.to_dict('records')
    
    return questions

def get_questions_by_topic(topic):
    """Get questions filtered by topic"""
    questions = get_questions_from_csv()
    
    # Filter questions by topic
    filtered = [q for q in questions if q.get('Topic') == topic]
    
    return filtered

def get_question_by_id(qid):
    """Get a specific question by its QID"""
    questions = get_questions_from_csv()
    
    # Find the question with the matching QID
    for q in questions:
        if q.get('QID') == qid:
            return q
    
    return None