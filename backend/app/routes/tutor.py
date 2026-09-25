from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Topic, QuizAttempt

from ..services.tutor_service import (
    generate_tutor_response,
)

from ..services.ai_services import (
    generate_questions,
)

from ..services.learning_engine import (
    calculate_mastery,
    calculate_confidence,
    calculate_calibration_gap,
    classify_topic,
    get_recommendation,
)


router = APIRouter(
    prefix="/tutor",
    tags=["AI Tutor"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class TutorRequest(BaseModel):
    student_id: int
    topic_id: int
    message: str


# ============================================================
# AI TUTOR CHAT
# ============================================================

@router.post("/chat")
def tutor_chat(
    data: TutorRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.id == data.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # --------------------------------------------------------
    # VALIDATE MESSAGE
    # --------------------------------------------------------

    message = data.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message is too long.",
        )

    # --------------------------------------------------------
    # FIND TOPIC
    # --------------------------------------------------------

    topic = (
        db.query(Topic)
        .filter(
            Topic.id == data.topic_id
        )
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found.",
        )

    # --------------------------------------------------------
    # GENERATE AI RESPONSE
    # --------------------------------------------------------

    try:

        response = generate_tutor_response(
            student_name=student.name,
            topic=topic,
            student_message=message,
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"AI tutor failed: {error}",
        )

    # --------------------------------------------------------
    # RETURN RESPONSE
    # --------------------------------------------------------

    mastery = float(
        topic.mastery or 0
    )

    confidence = float(
        topic.confidence or 0
    )

    category = classify_topic(
        mastery,
        confidence,
    )

    return {
        "student_id": student.id,

        "topic_id": topic.id,

        "topic": topic.name,

        "mastery": mastery,

        "confidence": confidence,

        "category": category,

        "response": response,
    }


# ============================================================
# TUTOR PRACTICE QUESTION
# ============================================================

class TutorPracticeRequest(BaseModel):
    student_id: int
    topic_id: int


@router.post("/practice")
def generate_tutor_practice(
    data: TutorPracticeRequest,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == data.student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    topic = (
        db.query(Topic)
        .filter(Topic.id == data.topic_id)
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found.",
        )

    mastery = float(
        topic.mastery or 0
    )

    if mastery < 40:
        difficulty = "easy"

    elif mastery < 70:
        difficulty = "medium"

    else:
        difficulty = "hard"

    try:
        result = generate_questions(
            subject=topic.subject.name,
            topic=topic.name,
            difficulty=difficulty,
            count=1,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Practice generation failed: {error}",
        )

    question = result["questions"][0]

    return {
        "student_id": student.id,
        "topic_id": topic.id,
        "topic": topic.name,
        "difficulty": difficulty,
        "question": question,
    }

class TutorPracticeSubmitRequest(BaseModel):
    student_id: int
    topic_id: int
    selected_answer: int
    correct_answer: int
    confidence: float


@router.post("/practice/submit")
def submit_tutor_practice(
    data: TutorPracticeSubmitRequest,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(
            Student.id == data.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    topic = (
        db.query(Topic)
        .filter(
            Topic.id == data.topic_id
        )
        .first()
    )

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found.",
        )

    if data.selected_answer not in [0, 1, 2, 3]:
        raise HTTPException(
            status_code=400,
            detail="Invalid answer option.",
        )

    if not 0 <= data.confidence <= 100:
        raise HTTPException(
            status_code=400,
            detail="Confidence must be between 0 and 100.",
        )

    # The frontend sends the generated question's
    # correct answer along with the submission.
    is_correct = data.selected_answer == data.correct_answer

    score = 100.0 if is_correct else 0.0

    old_mastery = float(
        topic.mastery or 0
    )

    old_confidence = float(
        topic.confidence or 0
    )

    new_mastery = calculate_mastery(
        old_mastery,
        score,
    )

    new_confidence = calculate_confidence(
        old_confidence,
        data.confidence,
    )

    gap = calculate_calibration_gap(
        new_mastery,
        new_confidence,
    )

    category = classify_topic(
        new_mastery,
        new_confidence,
    )

    recommendation = get_recommendation(
        new_mastery,
        new_confidence,
    )

    topic.mastery = new_mastery
    topic.confidence = new_confidence
    topic.attempts_count = (
        (topic.attempts_count or 0) + 1
    )
    topic.last_score = score

    attempt = QuizAttempt(
        student_id=student.id,
        topic=topic.name,
        score=score,
        confidence=data.confidence,
    )

    db.add(attempt)
    db.commit()
    db.refresh(topic)

    return {
        "student_id": student.id,
        "topic_id": topic.id,
        "topic": topic.name,
        "correct": is_correct,
        "score": score,
        "mastery": new_mastery,
        "confidence": new_confidence,
        "calibration_gap": gap,
        "category": category,
        "recommendation": recommendation,
    }