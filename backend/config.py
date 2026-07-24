import os
from pydantic_settings import BaseSettings
from typing import Optional

IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "LearnWise AI"
    DATABASE_URL: str = "sqlite:///./learnwise.db"
    
    # JWT Auth Config
    JWT_SECRET: str = "learnwise_secret_key_change_me_in_production_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # LLM API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Upload folder
    UPLOAD_DIR: str = "/tmp/uploads" if IS_VERCEL else "uploads"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings()

# Ensure directories exist if writable
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass
