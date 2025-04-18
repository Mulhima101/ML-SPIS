import os

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///mlspis.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret key for session management
    SECRET_KEY = 'your-secret-key-change-in-production'
    
    # JWT configuration
    JWT_SECRET_KEY = 'your-jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # CSV file path
    QUESTION_POOL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'MLSPIS Question Pool  Question Pool.csv')