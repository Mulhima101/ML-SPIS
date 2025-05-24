# admin_side/config.py
import os
from dotenv import load_dotenv 
from urllib.parse import quote_plus
import secrets

# Load environment variables
load_dotenv()

class Config:
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = quote_plus(os.getenv('DB_PASSWORD', ''))
    DB_HOST = os.getenv('DB_HOST')
    DB_NAME = os.getenv('DB_NAME')
    
    SQLALCHEMY_DATABASE_URI = f'mysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = 86400
    
    QUESTION_POOL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'MLSPIS Question Pool  Question Pool.csv')