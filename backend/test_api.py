import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base, get_db

# Create an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

# Override get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    # Drop and recreate tables before each test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def test_register_and_login():
    # 1. Register User
    reg_response = client.post("/api/auth/register", json={
        "name": "Test Student",
        "email": "test@university.edu",
        "password": "securepassword"
    })
    assert reg_response.status_code == 200
    assert "access_token" in reg_response.json()
    
    # 2. Login User
    login_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "securepassword"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token != ""

def test_subjects_api():
    # Register and login to get token
    client.post("/api/auth/register", json={
        "name": "Test Student",
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a Subject
    sub_response = client.post("/api/subjects", json={
        "name": "Algorithms",
        "branch": "Computer Science",
        "semester": "Semester 3",
        "difficulty": "Hard",
        "target_hours": 3.0
    }, headers=headers)
    assert sub_response.status_code == 200
    assert sub_response.json()["name"] == "Algorithms"
    
    # Get Subjects list
    list_response = client.get("/api/subjects?semester=Semester 3", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

def test_planner_generation():
    client.post("/api/auth/register", json={
        "name": "Test Student",
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    planner_payload = {
        "semester": "Semester 3",
        "branch": "Computer Science",
        "subjects": ["Algorithms", "Database Systems"],
        "previous_marks": {"Algorithms": 75.0, "Database Systems": 80.0},
        "exam_date": "2026-08-15",
        "study_hours_per_day": 4.0,
        "learning_goal": "Improve CGPA"
    }
    
    response = client.post("/api/planner/generate", json=planner_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "timetable" in data
    assert len(data["timetable"]) == 7  # 7 days of week
    assert "weekly_goals" in data
    assert "revision_schedule" in data

def test_chat_streaming():
    client.post("/api/auth/register", json={
        "name": "Test Student",
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token = token_response.json()["access_token"]
    
    # Chat streaming is an EventSource GET endpoint with token parameter
    response = client.get(f"/api/chat/stream?message=Hello&token={token}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    
    # Check that stream outputs SSE lines
    chunks = []
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode("utf-8") if isinstance(line, bytes) else line
            chunks.append(decoded_line)
    assert len(chunks) > 0
    assert any("start" in chunk for chunk in chunks)


def test_forgot_and_reset_password():
    # 1. Register User
    reg_response = client.post("/api/auth/register", json={
        "name": "Test Student",
        "email": "test@university.edu",
        "password": "securepassword"
    })
    assert reg_response.status_code == 200

    # 2. Forgot Password Request
    forgot_response = client.post("/api/auth/forgot-password", json={
        "email": "test@university.edu"
    })
    assert forgot_response.status_code == 200
    data = forgot_response.json()
    assert "code" in data
    code = data["code"]

    # 3. Reset Password with invalid code
    bad_reset_response = client.post("/api/auth/reset-password", json={
        "email": "test@university.edu",
        "token": "wrongcode",
        "new_password": "newsecurepassword"
    })
    assert bad_reset_response.status_code == 400

    # 4. Reset Password with valid code
    reset_response = client.post("/api/auth/reset-password", json={
        "email": "test@university.edu",
        "token": code,
        "new_password": "newsecurepassword"
    })
    assert reset_response.status_code == 200

    # 5. Try login with old password (should fail)
    old_login_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "securepassword"
    })
    assert old_login_response.status_code == 400

    # 6. Try login with new password (should succeed)
    new_login_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "newsecurepassword"
    })
    assert new_login_response.status_code == 200
    assert "access_token" in new_login_response.json()


def test_semester_workflow():
    # 1. Register & Login
    client.post("/api/auth/register", json={
        "name": "Test Student",
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token_response = client.post("/api/auth/login", json={
        "email": "test@university.edu",
        "password": "securepassword"
    })
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check initial User Profile has default current_semester
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["current_semester"] == "Semester 1"

    # 3. Create Subject in Semester 1 with marks
    sub_res = client.post("/api/subjects", json={
        "name": "Introduction to Programming",
        "branch": "Computer Science",
        "semester": "Semester 1",
        "difficulty": "Easy",
        "target_hours": 2.0,
        "marks": 90.0
    }, headers=headers)
    assert sub_res.status_code == 200
    sub_id = sub_res.json()["id"]
    assert sub_res.json()["marks"] == 90.0

    # 4. Check that subjects are semester-isolated (querying Semester 1 vs Semester 2)
    s1_res = client.get("/api/subjects?semester=Semester 1", headers=headers)
    assert len(s1_res.json()) == 1
    s2_res = client.get("/api/subjects?semester=Semester 2", headers=headers)
    assert len(s2_res.json()) == 0

    # 5. Update Subject marks and hours
    update_res = client.put(f"/api/subjects/{sub_id}", json={
        "name": "Introduction to Programming",
        "difficulty": "Medium",
        "target_hours": 3.0,
        "marks": 95.0
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["marks"] == 95.0
    assert update_res.json()["target_hours"] == 3.0

    # 6. Complete Semester 1 and verify advancement to Semester 2
    complete_res = client.post("/api/semesters/complete", json={
        "semester": "Semester 1",
        "status": "completed"
    }, headers=headers)
    assert complete_res.status_code == 200
    
    # Check that me profile has advanced
    me_res2 = client.get("/api/auth/me", headers=headers)
    assert me_res2.status_code == 200
    assert me_res2.json()["current_semester"] == "Semester 2"

    # Check semester status log exists
    sem_status_res = client.get("/api/semesters", headers=headers)
    assert len(sem_status_res.json()) == 1
    assert sem_status_res.json()[0]["semester"] == "Semester 1"
    assert sem_status_res.json()[0]["status"] == "completed"

    # 7. Delete Subject
    delete_res = client.delete(f"/api/subjects/{sub_id}", headers=headers)
    assert delete_res.status_code == 200
    
    # Check subjects list is empty
    s1_res2 = client.get("/api/subjects?semester=Semester 1", headers=headers)
    assert len(s1_res2.json()) == 0


def test_long_password_auth():
    # Test registration and login with passwords longer than 72 bytes
    very_long_pwd = "A" * 150 + "🚀" * 10
    
    # 1. Register user with 150+ char password
    reg_response = client.post("/api/auth/register", json={
        "name": "Long Password User",
        "email": "longpwd@university.edu",
        "password": very_long_pwd
    })
    assert reg_response.status_code == 200
    assert "access_token" in reg_response.json()

    # 2. Login with the long password
    login_response = client.post("/api/auth/login", json={
        "email": "longpwd@university.edu",
        "password": very_long_pwd
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

    # 3. Forgot & Reset password with long password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "longpwd@university.edu"})
    assert forgot_res.status_code == 200
    code = forgot_res.json()["code"]

    new_long_pwd = "B" * 200
    reset_res = client.post("/api/auth/reset-password", json={
        "email": "longpwd@university.edu",
        "token": code,
        "new_password": new_long_pwd
    })
    assert reset_res.status_code == 200

    # 4. Login with new long password
    new_login_res = client.post("/api/auth/login", json={
        "email": "longpwd@university.edu",
        "password": new_long_pwd
    })
    assert new_login_res.status_code == 200
    assert "access_token" in new_login_res.json()


