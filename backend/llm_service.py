import json
import time
import asyncio
from typing import AsyncGenerator, Dict, List, Optional
from backend.config import settings

# Initialize API clients if keys are present
openai_client = None
if settings.OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    except ImportError:
        pass

gemini_client = None
if settings.GEMINI_API_KEY:
    try:
        from openai import OpenAI
        gemini_client = OpenAI(
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    except ImportError:
        pass

anthropic_client = None
if settings.ANTHROPIC_API_KEY:
    try:
        from anthropic import Anthropic
        anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    except ImportError:
        pass

def get_client_and_model():
    """
    Returns (client, model_name, provider) where provider is one of 'gemini', 'openai', 'anthropic', or 'mock'.
    """
    if settings.GEMINI_API_KEY and gemini_client:
        return gemini_client, "gemini-1.5-flash", "gemini"
    elif settings.OPENAI_API_KEY and openai_client:
        return openai_client, "gpt-4o-mini", "openai"
    elif settings.ANTHROPIC_API_KEY and anthropic_client:
        return anthropic_client, "claude-3-haiku-20240307", "anthropic"
    return None, None, "mock"

def parse_json_from_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

# We will support a highly realistic and rich Sandbox Mock generator for all requests.
class LLMService:
    @staticmethod
    def is_mock_enabled() -> bool:
        return not (settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY or settings.GEMINI_API_KEY)

    @classmethod
    async def generate_study_plan(
        cls, 
        semester: str, 
        branch: str, 
        subjects: List[str], 
        previous_marks: Dict[str, float], 
        exam_date: str, 
        study_hours_per_day: float, 
        learning_goal: str,
        syllabus_texts: Optional[Dict[str, str]] = None
    ) -> dict:
        """
        Generates a study plan. If LLM keys exist, calls the LLM.
        Otherwise, returns a beautiful personalized study plan from the mock sandbox.
        """
        if not cls.is_mock_enabled():
            prompt = f"""
            Create a highly detailed, personalized study plan for a student with the following details:
            - Semester: {semester}
            - Branch: {branch}
            - Subjects: {', '.join(subjects)}
            - Previous Marks: {json.dumps(previous_marks)}
            - Exam Date: {exam_date}
            - Available Study Hours Per Day: {study_hours_per_day}
            - Learning Goal: {learning_goal}
            
            Syllabus text snippets provided: {json.dumps(syllabus_texts or {})}
            
            Return a JSON object containing:
            1. "timetable": an array of day objects: [{"day": "Monday", "tasks": ["2 hours on Math: study limits", "1 hour on Physics: mechanics basics"], "subject_priorities": {{"Math": "High", "Physics": "Medium"}}, "hours_allocated": {{"Math": 2, "Physics": 1}}}]
            2. "weekly_goals": a list of weekly milestones.
            3. "revision_schedule": a list of specific revision checkpoints.
            
            Return ONLY the valid JSON structure.
            """
            
            try:
                client, model, provider = get_client_and_model()
                if provider in ("gemini", "openai"):
                    response = client.chat.completions.create(
                        model=model,
                        response_format={"type": "json_object"} if provider == "openai" else None,
                        messages=[
                            {"role": "system", "content": "You are a helpful academic planner assistant. You must return only JSON."},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    return parse_json_from_response(response.choices[0].message.content)
                elif provider == "anthropic":
                    response = client.messages.create(
                        model=model,
                        max_tokens=4000,
                        system="You are a helpful academic planner assistant. You must return only valid JSON.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    return parse_json_from_response(response.content[0].text)
            except Exception as e:
                # Log error and fallback
                print(f"LLM study plan generation error: {e}")

        # Smart Mock Fallback
        # Determine subject priorities based on previous marks (lower marks = higher priority)
        priorities = {}
        allocated_hours = {}
        for sub in subjects:
            marks = previous_marks.get(sub, 70.0)
            if marks < 60:
                priorities[sub] = "High (Critical focus needed due to previous score of " + str(marks) + "%)"
                allocated_hours[sub] = round(study_hours_per_day * 0.5, 1)
            elif marks < 80:
                priorities[sub] = "Medium (Targeting improvement from " + str(marks) + "%)"
                allocated_hours[sub] = round(study_hours_per_day * 0.3, 1)
            else:
                priorities[sub] = "Low (Maintain strong concepts, score: " + str(marks) + "%)"
                allocated_hours[sub] = round(study_hours_per_day * 0.2, 1)

        # Distribute remaining hours if any
        sum_allocated = sum(allocated_hours.values())
        if sum_allocated < study_hours_per_day and len(subjects) > 0:
            allocated_hours[subjects[0]] += round(study_hours_per_day - sum_allocated, 1)

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        timetable = []
        
        # Generate dynamic list of topics to study per day
        topics_pool = {
            "Computer Science": ["Data Structures", "Algorithms", "Database Systems", "Operating Systems", "Networking"],
            "Mechanical": ["Thermodynamics", "Fluid Mechanics", "Machine Design", "CAD/CAM", "Heat Transfer"],
            "Electrical": ["Circuit Theory", "Control Systems", "Power Systems", "Electromagnetics", "Signals & Systems"],
            "Civil": ["Structural Analysis", "Geotechnical Eng", "Concrete Tech", "Hydraulics", "Surveying"],
            "General": ["Mathematics III", "Physics", "Chemistry", "Technical Communication", "Environmental Science"]
        }
        
        branch_topics = topics_pool.get(branch, topics_pool["General"])
        
        for idx, day in enumerate(days):
            day_tasks = []
            day_hours = {}
            day_priorities = {}
            for sub_idx, sub in enumerate(subjects):
                hours = allocated_hours.get(sub, 1.5)
                # Alternate topics based on the day
                topic_idx = (idx + sub_idx) % len(branch_topics)
                topic = branch_topics[topic_idx]
                day_tasks.append(f"Study {sub}: Focus on {topic} for {hours} hrs.")
                day_hours[sub] = hours
                day_priorities[sub] = "High" if "High" in priorities.get(sub, "") else "Medium"
                
            timetable.append({
                "day": day,
                "tasks": day_tasks,
                "subject_priorities": day_priorities,
                "hours_allocated": day_hours
            })

        return {
            "exam_date": exam_date,
            "study_hours_per_day": study_hours_per_day,
            "learning_goal": learning_goal,
            "timetable": timetable,
            "weekly_goals": [
                f"Week 1: Complete 40% of syllabus for core subjects: {', '.join(subjects[:2])}.",
                f"Week 2: Solve previous years' papers for lower scoring subjects.",
                f"Week 3: Deep dive into complex topics and run self-assessments."
            ],
            "revision_schedule": [
                "Every Saturday: Quick 2-hour review of all formulas and definitions studied during the week.",
                "Every Sunday: Self-quiz and concept mapping for 90 minutes.",
                f"3 Days before {exam_date}: Complete simulated full mock exam."
            ],
            "is_mock": True
        }

    @classmethod
    async def generate_notes(cls, subject_name: str, topic_name: str, syllabus_text: Optional[str] = None) -> dict:
        """
        Generates simplified study notes. If LLM keys exist, calls the LLM.
        Otherwise, returns beautiful structured notes from the mock sandbox.
        """
        if not cls.is_mock_enabled():
            prompt = f"""
            Generate comprehensive study notes for:
            - Subject: {subject_name}
            - Topic: {topic_name}
            Syllabus Context (if any): {syllabus_text or 'None'}
            
            Provide the output in JSON format with:
            1. "easy_notes": detailed markdown explanation of the topic. Ensure it contains headers, bold text, and lists.
            2. "bullet_summary": a list of 4-6 bullet-point summaries.
            3. "key_concepts": a list of key concepts.
            4. "important_formulas": a list of equations/formulas.
            5. "exam_topics": a list of highly expected exam questions or topics.
            """
            try:
                client, model, provider = get_client_and_model()
                if provider in ("gemini", "openai"):
                    response = client.chat.completions.create(
                        model=model,
                        response_format={"type": "json_object"} if provider == "openai" else None,
                        messages=[
                            {"role": "system", "content": "You are a top university professor. You must return only JSON."},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    return parse_json_from_response(response.choices[0].message.content)
                elif provider == "anthropic":
                    response = client.messages.create(
                        model=model,
                        max_tokens=4000,
                        system="You are a top university professor. You must return only valid JSON.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    return parse_json_from_response(response.content[0].text)
            except Exception as e:
                print(f"LLM generate_notes error: {e}")

        # Smart Mock Fallback
        notes_md = f"""
# Simplified Guide to {topic_name} in {subject_name}

## 1. Introduction & Overview
{topic_name} is a fundamental pillar of {subject_name}. Understanding this topic requires a clear grasp of its foundational principles, practical architectures, and core mathematical formulas.

### Core Principles
- **Modularity**: Breaking down a complex system into smaller, manageable subsystems.
- **Abstraction**: Hiding background details and only showing essential features to reduce complexity.
- **Efficiency**: Optimizing resources (time, space, power) to run processes optimally.

---

## 2. Key Components & Operations
To understand {topic_name}, we must inspect its three core building blocks:
1. **The Input Module**: Receives raw parameters and checks validity.
2. **The Processing Core**: Runs the main logic, applying transformational equations.
3. **The Output Interface**: Returns the formatted result, handling logs and errors.

> **Professor's Tip**: Students often lose marks by not drawing block diagrams. Always include a simple flow diagram of these modules in your exam answers!
        """
        
        return {
            "subject_name": subject_name,
            "topic_name": topic_name,
            "easy_notes": notes_md,
            "bullet_summary": [
                f"{topic_name} is crucial for solving real-world applications in {subject_name}.",
                "It operates on three main phases: ingestion, computation, and output mapping.",
                "Time complexity optimization is critical for scaling these operations.",
                "Common pitfalls include incorrect boundary condition checks and poor buffer handling."
            ],
            "key_concepts": [
                "Principle of Superposition / Modular decomposition",
                "Ingestion throughput limits",
                "Data mapping and state tracking",
                "Error boundary limits and exception handling"
            ],
            "important_formulas": [
                "T(n) = 2T(n/2) + O(n)  [Master Theorem for Divide & Conquer]",
                "E = mc^2  [Reference Energy Relation]",
                "P = V * I  [Power Allocation formula for electrical subjects]",
                "Efficiency (%) = (Output / Input) * 100"
            ],
            "exam_topics": [
                f"Explain the primary architecture of {topic_name} with a neat block diagram (8 Marks).",
                f"Derive the performance efficiency equation for {subject_name} systems (6 Marks).",
                "Differentiate between modular and monolithic processing (4 Marks)."
            ],
            "is_mock": True
        }

    @classmethod
    async def generate_quiz(cls, subject_name: str, topic_name: str, num_questions: int = 5) -> dict:
        """
        Generates a custom quiz. If LLM keys exist, calls the LLM.
        Otherwise, returns a beautiful interactive quiz from the mock sandbox.
        """
        if not cls.is_mock_enabled():
            prompt = f"""
            Generate a {num_questions}-question quiz for:
            - Subject: {subject_name}
            - Topic: {topic_name}
            
            Provide a mix of Multiple Choice Questions (MCQs), Short Answer, and Long Answer questions.
            Return a JSON object containing:
            1. "subject_name": "{subject_name}"
            2. "quiz_title": "Quiz on {topic_name}"
            3. "questions": an array of objects:
               [
                 {{
                   "id": 1,
                   "question": "The question string",
                   "question_type": "MCQ",
                   "options": ["Option A", "Option B", "Option C", "Option D"],
                   "correct_answer": "Option A",
                   "explanation": "Brief explanation of the answer"
                 }},
                 {{
                   "id": 2,
                   "question": "Short answer question string",
                   "question_type": "Short",
                   "correct_answer": "Expected brief answer key",
                   "explanation": "Criteria for grading"
                 }}
               ]
            """
            try:
                client, model, provider = get_client_and_model()
                if provider in ("gemini", "openai"):
                    response = client.chat.completions.create(
                        model=model,
                        response_format={"type": "json_object"} if provider == "openai" else None,
                        messages=[
                            {"role": "system", "content": "You are a test developer. You must return only JSON."},
                            {"role": "user", "content": prompt}
                        ]
                    )
                    return parse_json_from_response(response.choices[0].message.content)
                elif provider == "anthropic":
                    response = client.messages.create(
                        model=model,
                        max_tokens=4000,
                        system="You are a test developer. You must return only valid JSON.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    return parse_json_from_response(response.content[0].text)
            except Exception as e:
                print(f"LLM generate_quiz error: {e}")

        # Smart Mock Fallback
        questions = [
            {
                "id": 1,
                "question": f"Which of the following describes the main objective of {topic_name}?",
                "question_type": "MCQ",
                "options": [
                    "A) To increase system overhead and execution cost.",
                    "B) To simplify complex processing through abstraction and modularity.",
                    "C) To bypass validation and maximize unchecked uploads.",
                    "D) To limit developer debugging tools."
                ],
                "correct_answer": "B) To simplify complex processing through abstraction and modularity.",
                "explanation": "Abstraction hides complexity, while modularity decomposes systems into manageable blocks, representing the core goals of this topic."
            },
            {
                "id": 2,
                "question": "What is the typical time complexity when searching elements in a balanced modular structure?",
                "question_type": "MCQ",
                "options": [
                    "A) O(1)",
                    "B) O(N)",
                    "C) O(log N)",
                    "D) O(N^2)"
                ],
                "correct_answer": "C) O(log N)",
                "explanation": "Balanced trees or structures allow binary-like cuts in decision pathways, giving O(log N) efficiency."
            },
            {
                "id": 3,
                "question": "True or False: In general systems design, coupling should be maximized and cohesion minimized.",
                "question_type": "MCQ",
                "options": [
                    "A) True",
                    "B) False"
                ],
                "correct_answer": "B) False",
                "explanation": "For maintainable systems, we want loose coupling (low coupling) and high cohesion."
            },
            {
                "id": 4,
                "question": f"Describe the main difference between static and dynamic allocation in {subject_name}.",
                "question_type": "Short",
                "correct_answer": "Static allocation fixes resources at compile time, whereas dynamic allocation adjusts size at runtime.",
                "explanation": "Grade based on mentioning 'compile-time/fixed size' vs 'runtime/flexible size'."
            },
            {
                "id": 5,
                "question": f"Detailed Case Study: Sketch the complete state-diagram for a {topic_name} controller, explaining each transition phase and how race conditions are prevented.",
                "question_type": "Long",
                "correct_answer": "Detailed explanation outlining: states (Idle, Listening, Processing, Success, Error), transition triggers, and synchronization locks (mutexes) to avoid race conditions.",
                "explanation": "Full points require a detailed block diagram sketch and explaining mutex/locks or sync mechanisms."
            }
        ]

        # Slice based on requested questions
        questions = questions[:num_questions]
        
        return {
            "subject_name": subject_name,
            "quiz_title": f"Quiz on {topic_name}",
            "questions": questions,
            "is_mock": True
        }

    @classmethod
    async def chat_assistant_stream(
        cls, 
        message: str, 
        subject_name: Optional[str] = None, 
        history: List[Dict[str, str]] = []
    ) -> AsyncGenerator[str, None]:
        """
        Streams a chat assistant response. If LLM keys exist, streams from LLM.
        Otherwise, streams a mock response word by word using SSE format.
        """
        if not cls.is_mock_enabled():
            try:
                client, model, provider = get_client_and_model()
                if provider in ("gemini", "openai"):
                    messages = [{"role": "system", "content": f"You are LearnWise AI, an expert tutor helping a student in {subject_name or 'their exams'}."}]
                    for hist in history:
                        messages.append({"role": hist["role"], "content": hist["content"]})
                    messages.append({"role": "user", "content": message})
                    
                    response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        stream=True
                    )
                    for chunk in response:
                        if chunk.choices and chunk.choices[0].delta.content:
                            yield chunk.choices[0].delta.content
                    return
                elif provider == "anthropic":
                    system_prompt = f"You are LearnWise AI, an expert tutor helping a student in {subject_name or 'their exams'}."
                    messages = []
                    for hist in history:
                        messages.append({"role": hist["role"], "content": hist["content"]})
                    messages.append({"role": "user", "content": message})
                    
                    with client.messages.stream(
                        model=model,
                        max_tokens=2048,
                        system=system_prompt,
                        messages=messages
                    ) as stream:
                        for text in stream.text_stream:
                            yield text
                    return
            except Exception as e:
                # Log error and fallback
                print(f"LLM chat stream error: {e}")

        # High-quality Mock Stream
        context_phrase = f"regarding **{subject_name}**" if subject_name else "to support your studies"
        mock_response = f"""Hello! I am your **LearnWise Study Assistant**. Here is some detailed guidance {context_phrase}.

To answer your question: *"{message}"*, we should review these standard academic concepts:

### 1. Key Concept Breakdown
- **Core Principle**: Think of this as the foundation. Always start by defining boundaries.
- **Step-by-step Execution**:
  1. *Analysis*: Understand the problem parameters.
  2. *Design*: Draft your solution outline.
  3. *Verification*: Write down sample cases.

### 2. Quick Formula / Tips for the Exam
> **Formula**: $\\text{{Success}} = \\frac{{\\text{{Preparation}} \\times \\text{{Consistency}}}}{{\\text{{Distractions}}}}$

Keep up the great work! Let me know if you want me to generate a **practice quiz** on this topic or write a **summary note**!
"""
        # Stream the mock response character/word by word to simulate real-time AI
        words = mock_response.split(" ")
        for i in range(len(words)):
            yield words[i] + " "
            # Sleep slightly to create standard typing speed
            await asyncio.sleep(0.04)
