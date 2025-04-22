# admin_side/utils/csv_utils.py
import pandas as pd
import os
from flask import current_app
import csv

def get_questions_from_csv():
    """Read and parse questions from the CSV file"""
    csv_path = current_app.config.get('QUESTION_POOL_PATH')
    
    if not os.path.exists(csv_path):
        # Try alternative path
        csv_path = os.path.join(os.path.dirname(current_app.root_path), 'MLSPIS Question Pool  Question Pool.csv')
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Question pool CSV file not found at {csv_path}")
    
    try:
        # Try pandas read
        df = pd.read_csv(csv_path)
        questions = df.to_dict('records')
    except Exception as e:
        print(f"Error reading CSV with pandas: {str(e)}")
        # Fallback to csv module
        questions = []
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                questions.append(dict(row))
    
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