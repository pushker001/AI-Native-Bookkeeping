# backend/app/db/database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load the environment variables
load_dotenv()

# 1. Get the Database URL from the .env file, fallback to sqlite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# 2. Create the engine that talks to Supabase (PostgreSQL) or local SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # Only use connect_args for SQLite!
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

# 3. Create a Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base class that all our future Database Models will inherit from
Base = declarative_base()

def get_db():
    """A helper function to get a database connection for our API routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()