import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings, IS_VERCEL

def get_effective_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        if env_url.startswith("postgres://"):
            return env_url.replace("postgres://", "postgresql://", 1)
        return env_url

    if IS_VERCEL:
        tmp_db = Path("/tmp/learnwise.db")
        root_db = Path(__file__).resolve().parent.parent / "learnwise.db"
        if not tmp_db.exists() and root_db.exists():
            try:
                shutil.copy2(root_db, tmp_db)
            except Exception as e:
                print(f"[DB INIT] Warning: Could not copy seed database to /tmp: {e}")
        return f"sqlite:///{tmp_db}"

    return settings.DATABASE_URL

db_url = get_effective_database_url()

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
