from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, QuizAttempt
from ..services.learning_engine import (
    calculate_priority,
    classify_topic,
    get_recommendation,
)


router = APIRouter(
    prefix="/progress",
    tags=["Progress"],
)


@router.get("/{student_id}")
def get_progress(
    student_id: int,
    db: Session = Depends(get_db),
):
    # ========================================================
    # FIND STUDENT
    # ========================================================

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

    # ========================================================
    # TOPIC LEARNING STATE
    # ========================================================

    topics = []

    for subject in student.subjects:

        for topic in subject.topics:

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

            priority = calculate_priority(
                mastery,
                confidence,
            )

            topics.append(
                {
                    "id": topic.id,
                    "subject": subject.name,
                    "topic": topic.name,
                    "mastery": mastery,
                    "confidence": confidence,
                    "category": category,
                    "priority": priority,
                    "recommendation": get_recommendation(
                        mastery,
                        confidence,
                    ),
                }
            )

    # ========================================================
    # OVERALL METRICS
    # ========================================================

    if topics:

        overall_mastery = round(
            sum(
                topic["mastery"]
                for topic in topics
            )
            / len(topics),
            1,
        )

        overall_confidence = round(
            sum(
                topic["confidence"]
                for topic in topics
            )
            / len(topics),
            1,
        )

    else:

        overall_mastery = 0
        overall_confidence = 0

    # ========================================================
    # PRIORITY TOPICS
    # ========================================================

    priority_topics = sorted(
        topics,
        key=lambda topic: topic["priority"],
        reverse=True,
    )

    # ========================================================
    # QUIZ ATTEMPT HISTORY
    # ========================================================

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.student_id == student_id
        )
        .order_by(
            QuizAttempt.created_at.asc()
        )
        .all()
    )

    attempt_history = []

    for index, attempt in enumerate(
        attempts,
        start=1,
    ):

        attempt_history.append(
            {
                "attempt_number": index,
                "topic": attempt.topic,
                "score": float(
                    attempt.score or 0
                ),
                "confidence": float(
                    attempt.confidence or 0
                ),
                "date": (
                    attempt.created_at.isoformat()
                    if attempt.created_at
                    else None
                ),
            }
        )

    # ========================================================
    # PERFORMANCE TREND
    # ========================================================

    if len(attempt_history) >= 2:

        first_score = (
            attempt_history[0]["score"]
        )

        latest_score = (
            attempt_history[-1]["score"]
        )

        score_change = round(
            latest_score - first_score,
            1,
        )

        if score_change > 5:
            performance_trend = "improving"

        elif score_change < -5:
            performance_trend = "declining"

        else:
            performance_trend = "stable"

    else:

        score_change = 0
        performance_trend = "insufficient_data"

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "course": student.course,
            "goal": student.goal,
            "exam_date": student.exam_date,
            "daily_hours": student.daily_hours,
        },

        "overall_mastery": overall_mastery,

        "overall_confidence": overall_confidence,

        "topics": topics,

        "priority_topics": priority_topics[:3],

        "attempt_history": attempt_history,

        "performance": {
            "trend": performance_trend,
            "score_change": score_change,
            "total_attempts": len(
                attempt_history
            ),
        },
    }