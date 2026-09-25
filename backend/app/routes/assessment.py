from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Topic, QuizAttempt
from ..services.ai_services import generate_questions
from ..services.learning_engine import (
    calculate_mastery,
    calculate_confidence,
    calculate_calibration_gap,
    classify_topic,
    get_recommendation,
)


router = APIRouter(
    prefix="/assessment",
    tags=["AI Assessment"],
)


# ============================================================
# GENERATE ASSESSMENT
# ============================================================

class AssessmentRequest(BaseModel):
    student_id: int
    topic_id: int
    difficulty: str = "medium"
    count: int = 5


@router.post("/generate")
def generate_assessment(
    data: AssessmentRequest,
    db: Session = Depends(get_db),
):
    # Find student
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

    # Find topic
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

    # Find subject through relationship
    subject = topic.subject

    try:
        result = generate_questions(
            subject=subject.name,
            topic=topic.name,
            difficulty=data.difficulty,
            count=data.count,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {error}",
        )

    return {
        "student_id": student.id,
        "topic_id": topic.id,
        "subject": subject.name,
        "topic": topic.name,
        "difficulty": data.difficulty,
        "questions": result["questions"],
    }


# ============================================================
# SUBMIT ADAPTIVE ASSESSMENT
# ============================================================

class AssessmentSubmitRequest(BaseModel):
    student_id: int
    topic_id: int
    score: float
    confidence: float


@router.post("/submit")
def submit_assessment(
    data: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # FIND TOPIC
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # VALIDATE SCORE AND CONFIDENCE
    # --------------------------------------------------------

    score = max(0, min(100, data.score))
    confidence = max(0, min(100, data.confidence))

    # --------------------------------------------------------
    # GET PREVIOUS LEARNING STATE
    # --------------------------------------------------------

    old_mastery = float(topic.mastery or 0)
    old_confidence = float(topic.confidence or 0)

    # --------------------------------------------------------
    # CALCULATE NEW MASTERY
    # --------------------------------------------------------

    mastery = calculate_mastery(
        old_mastery,
        score,
    )

    # --------------------------------------------------------
    # CALCULATE NEW CONFIDENCE
    # --------------------------------------------------------

    new_confidence = calculate_confidence(
        old_confidence,
        confidence,
    )

    # --------------------------------------------------------
    # CALCULATE CALIBRATION GAP
    # --------------------------------------------------------

    gap = calculate_calibration_gap(
        mastery,
        new_confidence,
    )

    # --------------------------------------------------------
    # CLASSIFY LEARNING STATE
    # --------------------------------------------------------

    category = classify_topic(
        mastery,
        new_confidence,
    )

    # --------------------------------------------------------
    # GENERATE RECOMMENDATION
    # --------------------------------------------------------

    recommendation = get_recommendation(
        mastery,
        new_confidence,
    )

    # --------------------------------------------------------
    # UPDATE TOPIC
    # --------------------------------------------------------

    topic.mastery = mastery
    topic.confidence = new_confidence
    topic.attempts_count += 1
    topic.last_score = score

    # --------------------------------------------------------
    # SAVE ASSESSMENT ATTEMPT
    # --------------------------------------------------------

    attempt = QuizAttempt(
        student_id=student.id,
        topic=topic.name,
        score=score,
        confidence=confidence,
    )

    db.add(attempt)

    # --------------------------------------------------------
    # SAVE EVERYTHING
    # --------------------------------------------------------

    db.commit()
    db.refresh(topic)

    # --------------------------------------------------------
    # RETURN ADAPTIVE RESULT
    # --------------------------------------------------------

    return {
        "student_id": student.id,
        "topic_id": topic.id,
        "topic": topic.name,

        "score": score,

        "mastery": mastery,

        "confidence": new_confidence,

        "calibration_gap": gap,

        "category": category,

        "recommendation": recommendation,
    }