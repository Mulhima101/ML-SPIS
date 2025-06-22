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
    
    # Improved database connection pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,  # Recycle connections every hour
        'pool_timeout': 30,
        'pool_size': 10,
        'max_overflow': 20,
        'pool_reset_on_return': 'commit',
        'echo': False,
        'connect_args': {
            'connect_timeout': 60,
            'autocommit': True
        }
    }
    
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = 86400