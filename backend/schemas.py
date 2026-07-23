from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    branch: Optional[str] = None
    current_semester: Optional[str] = "Semester 1"
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str


# --- Subject Schemas ---
class SubjectCreate(BaseModel):
    name: str
    branch: Optional[str] = None
    semester: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    target_hours: Optional[float] = 2.0
    marks: Optional[float] = None

class SubjectOut(BaseModel):
    id: int
    user_id: int
    name: str
    branch: Optional[str] = None
    semester: Optional[str] = None
    difficulty: str
    target_hours: float
    marks: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SemesterStatusCreate(BaseModel):
    semester: str
    status: str = "active"

class SemesterStatusOut(BaseModel):
    id: int
    user_id: int
    semester: str
    status: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Document Schemas ---
class DocumentOut(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int] = None
    name: str
    file_path: str
    doc_type: str
    file_size: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# --- Planner Schemas ---
class PersonalizationRequest(BaseModel):
    semester: str
    branch: str
    subjects: List[str]
    previous_marks: Dict[str, float]  # e.g. {"Maths": 85.0}
    exam_date: str
    study_hours_per_day: float
    learning_goal: str  # "Pass exam", "Improve CGPA", "Placement preparation"

class StudyPlanDay(BaseModel):
    day: str  # e.g., "Monday" or "Day 1"
    tasks: List[str]
    subject_priorities: Dict[str, str]  # e.g., {"Maths": "High"}
    hours_allocated: Dict[str, float]

class StudyPlanResponse(BaseModel):
    exam_date: str
    study_hours_per_day: float
    learning_goal: str
    timetable: List[dict]  # Custom structured items for easy rendering
    weekly_goals: List[str]
    revision_schedule: List[str]


# --- Notes Schemas ---
class NotesRequest(BaseModel):
    subject_id: int
    topic: Optional[str] = None  # Generate notes for a specific topic or full subject

class NotesResponse(BaseModel):
    subject_name: str
    topic_name: str
    easy_notes: str  # Markdown text explaining notes
    bullet_summary: List[str]
    key_concepts: List[str]
    important_formulas: List[str]
    exam_topics: List[str]


# --- Quiz Schemas ---
class QuizRequest(BaseModel):
    subject_id: int
    topic: Optional[str] = None
    num_questions: Optional[int] = 5

class QuizQuestion(BaseModel):
    id: int
    question: str
    question_type: str  # "MCQ", "Short", "Long"
    options: Optional[List[str]] = None  # MCQs options
    correct_answer: str
    explanation: Optional[str] = None

class QuizResponse(BaseModel):
    subject_name: str
    quiz_title: str
    questions: List[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    subject_id: int
    quiz_title: str
    score: int
    total_questions: int
    answers: List[dict]  # Stores [{"question_id": 1, "student_answer": "A", "is_correct": true}]

class QuizHistoryOut(BaseModel):
    id: int
    subject_id: Optional[int] = None
    quiz_title: str
    score: int
    total_questions: int
    answers_json: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Progress Schemas ---
class ProgressOut(BaseModel):
    completed_topics: List[str]
    pending_topics: List[str]
    quiz_scores: List[dict]  # [{"quiz_title": "...", "score": 80}]
    study_streak: int
    percentage_complete: float

class ProgressUpdate(BaseModel):
    subject_id: int
    topic_name: str
    status: str  # "completed", "pending"


# --- Chat Schemas ---
class ChatRequest(BaseModel):
    message: str
    subject_id: Optional[int] = None
    conversation_history: Optional[List[Dict[str, str]]] = []  # [{"role": "user", "content": "..."}]
