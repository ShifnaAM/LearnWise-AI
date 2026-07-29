import datetime
import json
import os
import shutil
import sys
from pathlib import Path
from typing import List, Dict, Optional, Any

# Ensure workspace root is in sys.path for Vercel deployment
_root_dir = Path(__file__).resolve().parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import passlib.handlers.bcrypt
from sqlalchemy.orm import Session

# Patch passlib's internal bcrypt handler to prevent ValueError: password cannot be longer than 72 bytes
# during CryptContext initialization or password verification/hashing at application startup.
_orig_bcrypt_calc_checksum = passlib.handlers.bcrypt._BcryptCommon._calc_checksum

def _safe_bcrypt_calc_checksum(self, secret):
    if isinstance(secret, str):
        secret = secret.encode("utf-8")
    if isinstance(secret, (bytes, bytearray)):
        secret = secret[:72]
    return _orig_bcrypt_calc_checksum(self, secret)

passlib.handlers.bcrypt._BcryptCommon._calc_checksum = _safe_bcrypt_calc_checksum

from backend.config import settings
from backend.database import engine, Base, get_db
from backend.models import User, Subject, Document, StudyPlan, QuizHistory, ProgressTracking, SemesterStatus
from backend.schemas import (
    UserCreate, UserLogin, UserOut, Token, TokenData,
    ForgotPasswordRequest, ResetPasswordRequest,
    SubjectCreate, SubjectOut, DocumentOut,
    PersonalizationRequest, StudyPlanResponse,
    NotesRequest, NotesResponse,
    QuizRequest, QuizResponse, QuizSubmitRequest, QuizHistoryOut,
    ProgressOut, ProgressUpdate, ChatRequest,
    SemesterStatusCreate, SemesterStatusOut
)
from backend.pdf_parser import extract_text_from_pdf
from backend.llm_service import LLMService

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

# Enable CORS for React Frontend & Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def ensure_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if not path.startswith("/api") and not path.startswith("/openapi") and not path.startswith("/docs"):
        request.scope["path"] = "/api" + path
    response = await call_next(request)
    return response

# Authentication Utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def truncate_password(password: str) -> str:
    """
    Truncate password to maximum 72 bytes UTF-8 encoded to satisfy bcrypt hard limits
    and avoid ValueError: password cannot be longer than 72 bytes.
    """
    if not password:
        return ""
    if isinstance(password, str):
        return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return password

def verify_password(plain_password, hashed_password):
    safe_password = truncate_password(plain_password)
    try:
        return pwd_context.verify(safe_password, hashed_password)
    except Exception:
        import bcrypt
        try:
            return bcrypt.checkpw(safe_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

def get_password_hash(password):
    safe_password = truncate_password(password)
    return pwd_context.hash(safe_password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

# Dependency to get current user from token
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

# Helper to initialize DB with a sample student account and mock data if empty
@app.on_event("startup")
def startup_event():
    # 1. Run dynamic migrations for existing SQLite database
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    
    # Check subjects table
    if "subjects" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("subjects")]
        if "marks" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE subjects ADD COLUMN marks FLOAT DEFAULT NULL"))
                
    # Check users table
    if "users" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("users")]
        if "branch" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN branch VARCHAR(255) DEFAULT NULL"))
        if "current_semester" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN current_semester VARCHAR(255) DEFAULT 'Semester 1'"))

    # Check study_plans table
    if "study_plans" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("study_plans")]
        if "semester" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE study_plans ADD COLUMN semester VARCHAR(255) DEFAULT 'Semester 3'"))

    db = next(get_db())
    try:
        # Create sample user if not exists
        sample_email = "student@learnwise.edu"
        existing_user = db.query(User).filter(User.email == sample_email).first()
        if not existing_user:
            # Pre-computed bcrypt hash for "password123" to avoid password hashing during application startup
            hashed_pwd = "$2b$12$jDQynFnu1crGUW.9Atqq9ellUW4lUraNrgdpszcQOlNIYBstzJm1a"
            sample_user = User(
                name="Alex Mercer",
                email=sample_email,
                password_hash=hashed_pwd,
                branch="Computer Science",
                current_semester="Semester 3"
            )
            db.add(sample_user)
            db.commit()
            db.refresh(sample_user)
            
            # Add sample subjects
            subjects = [
                Subject(user_id=sample_user.id, name="Data Structures & Algorithms", branch="Computer Science", semester="Semester 3", difficulty="Hard", target_hours=3.0, marks=75.0),
                Subject(user_id=sample_user.id, name="Database Management Systems", branch="Computer Science", semester="Semester 3", difficulty="Medium", target_hours=2.0, marks=80.0),
                Subject(user_id=sample_user.id, name="Discrete Mathematics", branch="Computer Science", semester="Semester 3", difficulty="Hard", target_hours=2.5, marks=70.0),
                Subject(user_id=sample_user.id, name="Technical Writing", branch="Computer Science", semester="Semester 3", difficulty="Easy", target_hours=1.0, marks=85.0)
            ]
            db.add_all(subjects)
            db.commit()
            
            # Add initial progress trackers
            for sub in subjects:
                db.add(ProgressTracking(user_id=sample_user.id, subject_id=sub.id, topic_name="Unit 1: Fundamentals", status="completed", study_streak=3))
                db.add(ProgressTracking(user_id=sample_user.id, subject_id=sub.id, topic_name="Unit 2: Intermediate Analysis", status="pending", study_streak=0))
                db.add(ProgressTracking(user_id=sample_user.id, subject_id=sub.id, topic_name="Unit 3: Advanced Applications", status="pending", study_streak=0))
            
            # Add sample quiz history
            quiz_hist = QuizHistory(
                user_id=sample_user.id,
                subject_id=subjects[0].id,
                quiz_title="Quiz on Fundamentals of DSA",
                score=4,
                total_questions=5,
                answers_json=json.dumps([
                    {"question_id": 1, "student_answer": "B", "is_correct": True},
                    {"question_id": 2, "student_answer": "C", "is_correct": True},
                    {"question_id": 3, "student_answer": "A", "is_correct": False},
                    {"question_id": 4, "student_answer": "A", "is_correct": True},
                    {"question_id": 5, "student_answer": "B", "is_correct": True}
                ])
            )
            db.add(quiz_hist)
            db.commit()
    finally:
        db.close()


# --- Authentication API ---

@app.post("/api/auth/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# In-memory store for reset codes
reset_codes: Dict[str, str] = {}

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User with this email does not exist")
    
    import random
    code = f"{random.randint(100000, 999999)}"
    reset_codes[req.email] = code
    print(f"[RESET CODE] Verification code for {req.email} is: {code}")
    return {"message": "Verification code generated successfully", "code": code}

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User with this email does not exist")
    
    saved_code = reset_codes.get(req.email)
    if not saved_code or saved_code != req.token:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    
    # Remove code from memory after successful reset
    reset_codes.pop(req.email, None)
    return {"message": "Password has been reset successfully"}


# --- Subjects API ---

@app.get("/api/subjects", response_model=List[SubjectOut])
def get_subjects(
    semester: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Subject).filter(Subject.user_id == current_user.id)
    target_semester = semester if semester is not None else current_user.current_semester
    if target_semester:
        query = query.filter(Subject.semester == target_semester)
    if branch:
        query = query.filter(Subject.branch == branch)
    return query.all()

@app.post("/api/subjects", response_model=SubjectOut)
def create_subject(subject_in: SubjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Subject).filter(
        Subject.user_id == current_user.id,
        Subject.name == subject_in.name,
        Subject.semester == subject_in.semester
    ).first()
    
    if existing:
        existing.branch = subject_in.branch
        existing.difficulty = subject_in.difficulty
        existing.target_hours = subject_in.target_hours
        existing.marks = subject_in.marks
        db.commit()
        db.refresh(existing)
        return existing
        
    new_subject = Subject(
        user_id=current_user.id,
        name=subject_in.name,
        branch=subject_in.branch,
        semester=subject_in.semester,
        difficulty=subject_in.difficulty,
        target_hours=subject_in.target_hours,
        marks=subject_in.marks
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    # Pre-populate default topics
    db.add(ProgressTracking(user_id=current_user.id, subject_id=new_subject.id, topic_name="Unit 1: Introduction", status="pending"))
    db.add(ProgressTracking(user_id=current_user.id, subject_id=new_subject.id, topic_name="Unit 2: Core Concepts", status="pending"))
    db.add(ProgressTracking(user_id=current_user.id, subject_id=new_subject.id, topic_name="Unit 3: Advanced Topics", status="pending"))
    db.commit()
    
    return new_subject

@app.put("/api/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, subject_in: SubjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject.name = subject_in.name
    if subject_in.branch:
        subject.branch = subject_in.branch
    if subject_in.semester:
        subject.semester = subject_in.semester
    if subject_in.difficulty:
        subject.difficulty = subject_in.difficulty
    if subject_in.target_hours is not None:
        subject.target_hours = subject_in.target_hours
    if subject_in.marks is not None:
        subject.marks = subject_in.marks
        
    db.commit()
    db.refresh(subject)
    return subject

@app.delete("/api/subjects/{subject_id}")
def delete_subject(subject_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted successfully"}

# --- Semesters API ---

@app.get("/api/semesters", response_model=List[SemesterStatusOut])
def get_semester_statuses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SemesterStatus).filter(SemesterStatus.user_id == current_user.id).all()

def get_next_semester(current: str) -> str:
    try:
        parts = current.split()
        if len(parts) == 2 and parts[0] == "Semester":
            num = int(parts[1])
            return f"Semester {num + 1}"
    except Exception:
        pass
    return current

@app.post("/api/semesters/complete")
def complete_semester(req: SemesterStatusCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(SemesterStatus).filter(
        SemesterStatus.user_id == current_user.id,
        SemesterStatus.semester == req.semester
    ).first()
    
    if existing:
        existing.status = "completed"
        existing.completed_at = datetime.datetime.utcnow()
    else:
        existing = SemesterStatus(
            user_id=current_user.id,
            semester=req.semester,
            status="completed",
            completed_at=datetime.datetime.utcnow()
        )
        db.add(existing)
        
    # Advance student's current_semester
    next_sem = get_next_semester(req.semester)
    current_user.current_semester = next_sem
    
    db.commit()
    db.refresh(existing)
    db.refresh(current_user)
    return {"status": existing, "user": current_user}


# --- Documents Upload API ---

@app.post("/api/documents/upload", response_model=DocumentOut)
async def upload_document(
    doc_type: str = Form(...),  # "syllabus", "notes", "marks"
    subject_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Setup path
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_path = os.path.join(user_upload_dir, file.filename)
    
    # Save file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    
    # Store reference in DB
    new_doc = Document(
        user_id=current_user.id,
        subject_id=subject_id,
        name=file.filename,
        file_path=file_path,
        doc_type=doc_type,
        file_size=file_size
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc

@app.get("/api/documents", response_model=List[DocumentOut])
def get_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.user_id == current_user.id).all()


# --- AI Study Planner API ---

@app.post("/api/planner/generate", response_model=StudyPlanResponse)
async def generate_planner(
    req: PersonalizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch text contents from any uploaded syllabus documents
    docs = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.doc_type == "syllabus"
    ).all()
    
    syllabus_texts = {}
    for doc in docs:
        text = extract_text_from_pdf(doc.file_path)
        if text:
            # Simple summary/truncation for LLM context limits
            syllabus_texts[doc.name] = text[:2000]

    # 2. Call LLM Service
    plan_dict = await LLMService.generate_study_plan(
        semester=req.semester,
        branch=req.branch,
        subjects=req.subjects,
        previous_marks=req.previous_marks,
        exam_date=req.exam_date,
        study_hours_per_day=req.study_hours_per_day,
        learning_goal=req.learning_goal,
        syllabus_texts=syllabus_texts
    )
    
    # 3. Synchronize subjects list. Create subjects if they do not exist
    for sub_name in req.subjects:
        existing_subject = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.name == sub_name,
            Subject.semester == req.semester
        ).first()
        if not existing_subject:
            new_sub = Subject(
                user_id=current_user.id,
                name=sub_name,
                branch=req.branch,
                semester=req.semester,
                difficulty="Medium",
                target_hours=round(req.study_hours_per_day / len(req.subjects), 1) if req.subjects else 2.0,
                marks=req.previous_marks.get(sub_name)
            )
            db.add(new_sub)
            db.commit()
            db.refresh(new_sub)
            # Seed default topics
            db.add(ProgressTracking(user_id=current_user.id, subject_id=new_sub.id, topic_name="Unit 1: Introduction", status="pending"))
            db.add(ProgressTracking(user_id=current_user.id, subject_id=new_sub.id, topic_name="Unit 2: Core Concepts", status="pending"))
            db.add(ProgressTracking(user_id=current_user.id, subject_id=new_sub.id, topic_name="Unit 3: Advanced Topics", status="pending"))
            db.commit()
        else:
            if sub_name in req.previous_marks:
                existing_subject.marks = req.previous_marks[sub_name]
                db.commit()

    # 4. Save/Update StudyPlan in DB
    existing_plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.semester == req.semester
    ).first()
    if existing_plan:
        existing_plan.exam_date = req.exam_date
        existing_plan.study_hours_per_day = req.study_hours_per_day
        existing_plan.learning_goal = req.learning_goal
        existing_plan.plan_json = json.dumps(plan_dict)
    else:
        new_plan = StudyPlan(
            user_id=current_user.id,
            semester=req.semester,
            exam_date=req.exam_date,
            study_hours_per_day=req.study_hours_per_day,
            learning_goal=req.learning_goal,
            plan_json=json.dumps(plan_dict)
        )
        db.add(new_plan)
        
    # 5. Update user academic profile
    current_user.current_semester = req.semester
    current_user.branch = req.branch
    db.commit()
    
    return StudyPlanResponse(
        exam_date=req.exam_date,
        study_hours_per_day=req.study_hours_per_day,
        learning_goal=req.learning_goal,
        timetable=plan_dict["timetable"],
        weekly_goals=plan_dict["weekly_goals"],
        revision_schedule=plan_dict["revision_schedule"]
    )

@app.get("/api/planner", response_model=Optional[StudyPlanResponse])
def get_planner(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.semester == current_user.current_semester
    ).first()
    if not plan:
        return None
        
    plan_dict = json.loads(plan.plan_json)
    return StudyPlanResponse(
        exam_date=plan.exam_date,
        study_hours_per_day=plan.study_hours_per_day,
        learning_goal=plan.learning_goal,
        timetable=plan_dict["timetable"],
        weekly_goals=plan_dict["weekly_goals"],
        revision_schedule=plan_dict["revision_schedule"]
    )


# --- AI Notes API ---

@app.post("/api/notes/generate", response_model=NotesResponse)
async def generate_notes(
    req: NotesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == req.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    topic = req.topic or "Overview of Core Syllabus Concepts"
    
    # Check if there is an uploaded note document we can parse
    note_docs = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.subject_id == subject.id,
        Document.doc_type == "notes"
    ).all()
    
    pdf_text = ""
    for doc in note_docs:
        text = extract_text_from_pdf(doc.file_path)
        if text:
            pdf_text += text[:1500]  # Grab a preview of the notes content
            
    notes_dict = await LLMService.generate_notes(
        subject_name=subject.name,
        topic_name=topic,
        syllabus_text=pdf_text if pdf_text else None
    )
    
    return NotesResponse(
        subject_name=notes_dict["subject_name"],
        topic_name=notes_dict["topic_name"],
        easy_notes=notes_dict["easy_notes"],
        bullet_summary=notes_dict["bullet_summary"],
        key_concepts=notes_dict["key_concepts"],
        important_formulas=notes_dict["important_formulas"],
        exam_topics=notes_dict["exam_topics"]
    )


# --- AI Quiz API ---

@app.post("/api/quiz/generate", response_model=QuizResponse)
async def generate_quiz(
    req: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == req.subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    topic = req.topic or "General Concepts"
    
    quiz_dict = await LLMService.generate_quiz(
        subject_name=subject.name,
        topic_name=topic,
        num_questions=req.num_questions or 5
    )
    
    return QuizResponse(
        subject_name=quiz_dict["subject_name"],
        quiz_title=quiz_dict["quiz_title"],
        questions=quiz_dict["questions"]
    )

@app.post("/api/quiz/submit")
def submit_quiz(
    req: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Track Quiz History
    new_history = QuizHistory(
        user_id=current_user.id,
        subject_id=req.subject_id,
        quiz_title=req.quiz_title,
        score=req.score,
        total_questions=req.total_questions,
        answers_json=json.dumps(req.answers)
    )
    db.add(new_history)
    
    # Update Streak and latest score on progress trackers
    trackers = db.query(ProgressTracking).filter(
        ProgressTracking.user_id == current_user.id,
        ProgressTracking.subject_id == req.subject_id
    ).all()
    
    for tracker in trackers:
        tracker.study_streak += 1
        tracker.score = int((req.score / req.total_questions) * 100)
        
    db.commit()
    
    return {"message": "Quiz scores submitted successfully", "score": req.score, "total": req.total_questions}

@app.get("/api/quiz/history", response_model=List[QuizHistoryOut])
def get_quiz_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_subject_ids = [s.id for s in db.query(Subject).filter(
        Subject.user_id == current_user.id,
        Subject.semester == current_user.current_semester
    ).all()]
    if not current_subject_ids:
        return []
    return db.query(QuizHistory).filter(
        QuizHistory.user_id == current_user.id,
        QuizHistory.subject_id.in_(current_subject_ids)
    ).order_by(QuizHistory.created_at.desc()).all()


# --- Progress & Tracking API ---

@app.get("/api/progress", response_model=ProgressOut)
def get_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_subject_ids = [s.id for s in db.query(Subject).filter(
        Subject.user_id == current_user.id,
        Subject.semester == current_user.current_semester
    ).all()]
    
    if not current_subject_ids:
        return ProgressOut(
            completed_topics=[],
            pending_topics=[],
            quiz_scores=[],
            study_streak=0,
            percentage_complete=0.0
        )
        
    progress_items = db.query(ProgressTracking).filter(
        ProgressTracking.user_id == current_user.id,
        ProgressTracking.subject_id.in_(current_subject_ids)
    ).all()
    
    quiz_items = db.query(QuizHistory).filter(
        QuizHistory.user_id == current_user.id,
        QuizHistory.subject_id.in_(current_subject_ids)
    ).all()
    
    completed_topics = [item.topic_name for item in progress_items if item.status == "completed"]
    pending_topics = [item.topic_name for item in progress_items if item.status == "pending"]
    
    quiz_scores = [
        {"quiz_title": quiz.quiz_title, "score": int((quiz.score / quiz.total_questions) * 100)}
        for quiz in quiz_items
    ]
    
    # Streak computation
    study_streak = max([item.study_streak for item in progress_items]) if progress_items else 0
    
    total = len(progress_items)
    percentage_complete = (len(completed_topics) / total * 100) if total > 0 else 0.0
    
    return ProgressOut(
        completed_topics=completed_topics,
        pending_topics=pending_topics,
        quiz_scores=quiz_scores,
        study_streak=study_streak,
        percentage_complete=round(percentage_complete, 2)
    )

@app.post("/api/progress/update")
def update_progress(
    req: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tracker = db.query(ProgressTracking).filter(
        ProgressTracking.user_id == current_user.id,
        ProgressTracking.subject_id == req.subject_id,
        ProgressTracking.topic_name == req.topic_name
    ).first()
    
    if not tracker:
        tracker = ProgressTracking(
            user_id=current_user.id,
            subject_id=req.subject_id,
            topic_name=req.topic_name,
            status=req.status,
            study_streak=1
        )
        db.add(tracker)
    else:
        tracker.status = req.status
        if req.status == "completed":
            tracker.study_streak += 1
            
    db.commit()
    return {"message": "Progress updated successfully"}


# --- Streaming Chat Doubt Assistant (SSE) ---

@app.get("/api/chat/stream")
async def chat_stream(
    message: str = Query(...),
    subject_id: Optional[int] = Query(None),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Streams AI responses in Server-Sent Events (SSE) format.
    Requires token to be passed via query string since EventSource doesn't support headers easily.
    """
    # 1. Verify User Token
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    subject_name = None
    if subject_id:
        sub = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user.id).first()
        if sub:
            subject_name = sub.name

    # 2. Get history from previous chat logs (mocked history context or empty)
    history = []

    # 3. Stream Generator
    async def event_generator():
        try:
            # Yield startup trigger
            yield "event: start\ndata: {}\n\n"
            
            # Fetch streaming output
            async for chunk in LLMService.chat_assistant_stream(
                message=message,
                subject_name=subject_name,
                history=history
            ):
                # SSE lines must start with "data: " and end with "\n\n"
                formatted_chunk = chunk.replace("\n", "\nsubdata: ")
                yield f"data: {json.dumps({'content': formatted_chunk})}\n\n"
                
            yield "event: end\ndata: {}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
