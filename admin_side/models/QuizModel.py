from datetime import datetime
from sqlalchemy import text
from app import db

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    professor_id = db.Column(db.Integer, db.ForeignKey('professors.id'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=True)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=20)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade="all, delete-orphan")
    student_quizzes = db.relationship('StudentQuiz', backref='quiz', lazy=True, cascade="all, delete-orphan")
    module = db.relationship('Module', back_populates='quizzes', lazy=True)
    
    def to_dict(self):
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'professor_id': self.professor_id,
            'module_id': self.module_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'created_at': self.created_at.isoformat()
        }
        
        # Include module name if module relationship is loaded
        if hasattr(self, 'module') and self.module:
            result['module_name'] = self.module.name
        else:
            result['module_name'] = None
            
        return result

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='multiple_choice')
    option_1 = db.Column(db.Text, nullable=False)
    option_2 = db.Column(db.Text, nullable=False)
    option_3 = db.Column(db.Text, nullable=False)
    option_4 = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Integer, nullable=False)  # 0, 1, 2, or 3 (0-based index)
    explanation = db.Column(db.Text)
    points = db.Column(db.Float, default=1.0)
    weight = db.Column(db.Float, default=1.0)
    topic = db.Column(db.String(100))
    source_qid = db.Column(db.String(50))  # Original QID from CSV
    
    # Relationships
    student_answers = db.relationship('StudentAnswer', backref='question', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_answer=False, include_metadata=True):
        result = {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'text': self.text,
            'question_type': self.question_type,
            'options': [
                self.option_1,
                self.option_2,
                self.option_3,
                self.option_4
            ],
            'topic': self.topic,
            'points': self.points
        }
        
        if include_answer:
            result.update({
                'correct_answer': self.correct_answer,
                'explanation': self.explanation,
                'weight': self.weight,
                'source_qid': self.source_qid
            })
        
        if include_metadata:
            # Filter out empty options for cleaner response
            result['options'] = [opt for opt in result['options'] if opt.strip()]
            result['has_explanation'] = bool(self.explanation)
            
        return result