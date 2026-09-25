from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import QuizAttempt, Student, Topic
from ..services.learning_engine import (
    calculate_mastery,
    classify_topic,
    calculate_priority,
    get_recommendation,
)

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"],
)


class QuizSubmit(BaseModel):
    student_id: int
    topic_id: int
    score: float
    confidence: float


@router.post("/submit")
def submit_quiz(
    data: QuizSubmit,
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

    if not 0 <= data.score <= 100:
        raise HTTPException(
            status_code=400,
            detail="Score must be between 0 and 100.",
        )

    if not 0 <= data.confidence <= 100:
        raise HTTPException(
            status_code=400,
            detail="Confidence must be between 0 and 100.",
        )

    new_mastery = calculate_mastery(
        topic.mastery,
        data.score,
    )

    topic.mastery = new_mastery
    topic.confidence = data.confidence
    topic.last_score = data.score
    topic.attempts_count += 1

    attempt = QuizAttempt(
        student_id=data.student_id,
        topic=topic.name,
        score=data.score,
        confidence=data.confidence,
    )

    db.add(attempt)
    db.commit()
    db.refresh(topic)

    category = classify_topic(
        topic.mastery,
        topic.confidence,
    )

    priority = calculate_priority(
        topic.mastery,
        topic.confidence,
    )

    recommendation = get_recommendation(
        topic.mastery,
        topic.confidence,
    )

    return {
        "message": "Quiz result processed.",
        "topic": topic.name,
        "mastery": topic.mastery,
        "confidence": topic.confidence,
        "category": category,
        "priority": priority,
        "recommendation": recommendation,
    }


@router.get("/topics/{student_id}")
def get_topics(
    student_id: int,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    result = []

    for subject in student.subjects:
        for topic in subject.topics:
            result.append(
                {
                    "id": topic.id,
                    "subject": subject.name,
                    "name": topic.name,
                    "mastery": topic.mastery,
                    "confidence": topic.confidence,
                    "category": classify_topic(
                        topic.mastery,
                        topic.confidence,
                    ),
                    "priority": calculate_priority(
                        topic.mastery,
                        topic.confidence,
                    ),
                }
            )

    return result