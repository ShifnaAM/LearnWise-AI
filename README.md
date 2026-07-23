# LearnWise AI – Personalized Learning Recommendation System

LearnWise AI is a modern full-stack web application designed to help college and university students prepare efficiently for exams. It generates personalized study schedules, summaries, simplified revision notes, and targeted practice assessments based on the student's syllabus structure and previous performance.

---

## 🏛️ Application Architecture

```
                 +-----------------------------------+
                 |           React Frontend          |
                 |          (Vite + Tailwind)        |
                 +-----------------+-----------------+
                                   | HTTP / SSE
                                   v
                 +-----------------+-----------------+
                 |          FastAPI Backend          |
                 |          (Python 3.12)            |
                 +--------+-----------------+--------+
                          |                 |
                          v                 v
                 +--------+-------+ +-------+--------+
                 | SQLite Database| |   LLM Gateway  |
                 |  (SQLAlchemy)  | | OpenAI/Claude  |
                 +----------------+ +----------------+
```

---

## 🚀 Key Features

1. **AI Study Planner**: Formulates dynamic timetables adaptively matching target grade goals (Pass, Improve CGPA, Placement).
2. **AI Notes Generator**: Transforms complex PDFs into structured markdown guides, key concepts, and lists of formulas.
3. **AI Interactive Quizzes**: Provides playable assessments (MCQ & written responses) with instant AI-driven explanation keys.
4. **AI doubt assistant**: Streams doubt-clearing replies character-by-character via Server-Sent Events (SSE).
5. **Interactive Trackers**: Allows students to check off topics to automatically update dashboard completeness metrics and study streaks.

---

## 🛠️ Setup Instructions (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.11 or higher)

### 1. Backend Setup
1. Open terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create an `.env` file inside the `backend/` folder:
   ```env
   OPENAI_API_KEY=your-openai-api-key
   # OR
   ANTHROPIC_API_KEY=your-anthropic-api-key
   
   JWT_SECRET=your_super_secret_jwt_key
   ```
   *Note: If no API keys are specified, the system automatically runs in **Sandbox Mock Mode** so all features can still be fully tested.*
5. Run the FastAPI development server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   The API will be available on `http://localhost:8000`.

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   The UI will run on `http://localhost:5173`.

---

## 🐳 Docker Deployment (Docker Compose)

To spin up the entire production-ready stack in unified containers:

1. Create a root `.env` containing your keys (OpenAI, Anthropic, JWT, etc.).
2. Execute the docker-compose command:
   ```bash
   docker-compose up --build
   ```
3. Open `http://localhost` (Port 80) in your browser. The frontend container acts as a web server serving static assets, communicating with the backend container on `http://localhost:8000`.

---

## ☁️ Deployment to AWS App Runner

AWS App Runner provides fully managed container deployments. To host the complete app:

### Step 1: Push Images to Amazon ECR
Create two Amazon ECR repositories (`learnwise-backend` and `learnwise-frontend`) and push the built containers:
```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t learnwise-backend -f docker/Dockerfile.backend .
docker tag learnwise-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/learnwise-backend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/learnwise-backend:latest

docker build -t learnwise-frontend -f docker/Dockerfile.frontend .
docker tag learnwise-frontend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/learnwise-frontend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/learnwise-frontend:latest
```

### Step 2: Configure AWS App Runner Service
1. **Backend Service**:
   - Create a service in AWS App Runner pointing to the `learnwise-backend` ECR image.
   - Configure Port `8000`.
   - Set environment variables (`JWT_SECRET`, `OPENAI_API_KEY`) securely in the App Runner configuration dashboard.
   - Deploy.

2. **Frontend Service**:
   - Create another App Runner service pointing to `learnwise-frontend` ECR image.
   - Configure Port `80`.
   - Set the domain mapping or update `API_BASE_URL` in the React frontend environment settings to point to the live App Runner backend URL.
   - Deploy.
