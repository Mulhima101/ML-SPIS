from app import create_app, db
from models.UserModel import Professor
from sqlalchemy import text

app = create_app()

def migrate_database():
    """Migrate database schema to add new columns"""
    with app.app_context():
        try:
            # Check if columns already exist
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'quizzes' 
                AND COLUMN_NAME IN ('professor_id', 'module_id')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            if 'professor_id' not in existing_columns:
                print("Adding professor_id column...")
                db.session.execute(text("ALTER TABLE quizzes ADD COLUMN professor_id INT"))
                db.session.commit()
            
            if 'module_id' not in existing_columns:
                print("Adding module_id column...")
                db.session.execute(text("ALTER TABLE quizzes ADD COLUMN module_id INT"))
                db.session.commit()
            
            # Set default professor for existing quizzes
            if 'professor_id' not in existing_columns:
                # Get the first professor or create a default one
                professor = Professor.query.first()
                if not professor:
                    print("No professors found. Creating default professor...")
                    professor = Professor(
                        email='admin@system.com',
                        first_name='System',
                        last_name='Admin',
                        honorifics='Dr.',
                        faculty='System'
                    )
                    professor.set_password('admin123')
                    db.session.add(professor)
                    db.session.commit()
                
                print(f"Setting default professor_id to {professor.id} for existing quizzes...")
                db.session.execute(text(f"UPDATE quizzes SET professor_id = {professor.id} WHERE professor_id IS NULL"))
                db.session.commit()
                
                # Add NOT NULL constraint and foreign key
                print("Adding constraints...")
                db.session.execute(text("ALTER TABLE quizzes MODIFY COLUMN professor_id INT NOT NULL"))
                db.session.execute(text("""
                    ALTER TABLE quizzes 
                    ADD CONSTRAINT fk_quizzes_professor_id 
                    FOREIGN KEY (professor_id) REFERENCES professors(id)
                """))
                db.session.commit()
            
            print("Database migration completed successfully!")
            
        except Exception as e:
            print(f"Migration failed: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    migrate_database()
