import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    branch = Column(String, nullable=True)
    current_semester = Column(String, default="Semester 1")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("QuizHistory", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("ProgressTracking", back_populates="user", cascade="all, delete-orphan")
    semester_statuses = relationship("SemesterStatus", back_populates="user", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    branch = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    difficulty = Column(String, default="Medium")  # Easy, Medium, Hard
    target_hours = Column(Float, default=2.0)
    marks = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subjects")
    documents = relationship("Document", back_populates="subject")
    quizzes = relationship("QuizHistory", back_populates="subject", cascade="all, delete-orphan")
    progress = relationship("ProgressTracking", back_populates="subject", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)  # Nullable if syllabus covers many subjects
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # "syllabus", "notes", "marks"
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    subject = relationship("Subject", back_populates="documents")


class StudyPlan(Base):
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam_date = Column(String, nullable=True)
    study_hours_per_day = Column(Float, default=3.0)
    learning_goal = Column(String, default="Pass exam")  # "Pass exam", "Improve CGPA", "Placement preparation"
    plan_json = Column(Text, nullable=False)  # Stores JSON array of daily/weekly study details
    semester = Column(String, default="Semester 3", nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="study_plans")


class QuizHistory(Base):
    __tablename__ = "quiz_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    quiz_title = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    answers_json = Column(Text, nullable=False)  # Stores detailed student selections and explanations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="quizzes")
    subject = relationship("Subject", back_populates="quizzes")


class ProgressTracking(Base):
    __tablename__ = "progress_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic_name = Column(String, nullable=False)
    status = Column(String, default="pending")  # "completed", "pending"
    score = Column(Integer, nullable=True)  # Latest quiz score on this topic if applicable
    study_streak = Column(Integer, default=0)
    last_studied_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="progress")
    subject = relationship("Subject", back_populates="progress")


class SemesterStatus(Base):
    __tablename__ = "semester_statuses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester = Column(String, nullable=False)
    status = Column(String, default="active")  # "active", "completed"
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="semester_statuses")
