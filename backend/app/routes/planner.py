from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Subject
from ..services.learning_engine import (
    calculate_calibration_gap,
    classify_topic,
    calculate_priority,
    get_recommendation,
)
from ..services.planner import generate_daily_plan


router = APIRouter(
    prefix="/planner",
    tags=["Adaptive Planner"],
)


@router.get("/{student_id}")
def get_daily_plan(
    student_id: int,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # GET SUBJECTS
    # --------------------------------------------------------

    subjects = (
        db.query(Subject)
        .filter(Subject.student_id == student_id)
        .all()
    )

    topics = []

    # --------------------------------------------------------
    # BUILD TOPIC LEARNING STATE
    # --------------------------------------------------------

    for subject in subjects:

        for topic in subject.topics:

            mastery = float(
                topic.mastery or 0
            )

            confidence = float(
                topic.confidence or 0
            )

            gap = calculate_calibration_gap(
                mastery,
                confidence,
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
                    "name": topic.name,
                    "mastery": mastery,
                    "confidence": confidence,
                    "calibration_gap": gap,
                    "category": category,
                    "priority": priority,
                    "recommendation": get_recommendation(
                        mastery,
                        confidence,
                    ),
                }
            )

    # --------------------------------------------------------
    # GENERATE PLAN
    # --------------------------------------------------------

    plan = generate_daily_plan(
        student,
        topics,
    )

    return {
        "student_id": student.id,
        "student_name": student.name,
        "daily_hours": student.daily_hours,
        "exam_date": student.exam_date,
        **plan,
    }