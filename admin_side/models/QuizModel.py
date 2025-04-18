from datetime import datetime
from app import db

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=20)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade="all, delete-orphan")
    student_quizzes = db.relationship('StudentQuiz', backref='quiz', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'created_at': self.created_at.isoformat()
        }

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    option_1 = db.Column(db.Text, nullable=False)
    option_2 = db.Column(db.Text, nullable=False)
    option_3 = db.Column(db.Text, nullable=False)
    option_4 = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Integer, nullable=False)  # 1, 2, 3, or 4
    weight = db.Column(db.Float, default=1.0)
    topic = db.Column(db.String(100))
    source_qid = db.Column(db.String(50))  # Original QID from CSV
    
    # Relationships
    student_answers = db.relationship('StudentAnswer', backref='question', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_answer=False):
        result = {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'text': self.text,
            'options': [
                self.option_1,
                self.option_2,
                self.option_3,
                self.option_4
            ],
            'topic': self.topic
        }
        
        if include_answer:
            result['correct_answer'] = self.correct_answer
            result['weight'] = self.weight
            
        return result