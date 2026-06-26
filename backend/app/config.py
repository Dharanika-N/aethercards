import os
from pydantic_settings import BaseSettings
from pymongo import MongoClient

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://127.0.0.1:27017"
    DB_NAME: str = "smart_flashcards"
    SECRET_KEY: str = "supersecretkeyforflashcardgeneratorapp12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENV: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# MongoDB Client Initialization
try:
    # Set serverSelectionTimeoutMS to check connection quickly without hanging
    client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    # Ping database to trigger connection and check if server is active
    client.admin.command('ping')
    db = client[settings.DB_NAME]
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"Local MongoDB connection failed: {e}")
    if settings.ENV == "production":
        print("ERROR: MongoDB connection failed in production. Failing loudly to prevent data loss!")
        raise e
    print("Falling back to in-memory mongomock database...")
    import mongomock
    client = mongomock.MongoClient()
    db = client[settings.DB_NAME]

