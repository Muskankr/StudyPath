from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Subject, Topic
from ..services.learning_engine import (
    calculate_calibration_gap,
    classify_topic,
    calculate_priority,
    get_recommendation,
)
from ..services.ai_services import generate_learning_insight


router = APIRouter(
    prefix="/learning-state",
    tags=["Learning State"],
)


@router.get("/learning-insight/{student_id}/{topic_id}")
def learning_insight(
    student_id: int,
    topic_id: int,
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

    topic = (
    db.query(Topic)
    .join(Subject)
    .filter(
        Topic.id == topic_id,
        Subject.student_id == student_id,
    )
    .first()
)

    if not topic:
        raise HTTPException(
            status_code=404,
            detail="Topic not found.",
        )

    mastery = float(topic.mastery or 0)
    confidence = float(topic.confidence or 0)

    category = classify_topic(
        mastery,
        confidence,
    )

    try:
        insight = generate_learning_insight(
            student_name=student.name,
            topic=topic.name,
            mastery=mastery,
            confidence=confidence,
            category=category,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Insight generation failed: {error}",
        )

    return {
        "topic_id": topic.id,
        "topic": topic.name,
        "mastery": mastery,
        "confidence": confidence,
        "category": category,
        "insight": insight,
    } 


@router.get("/{student_id}")
def get_learning_state(
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
    # GET ALL SUBJECTS
    # --------------------------------------------------------

    subjects = (
        db.query(Subject)
        .filter(Subject.student_id == student_id)
        .all()
    )

    topics_data = []

    # --------------------------------------------------------
    # PROCESS EVERY TOPIC
    # --------------------------------------------------------

    for subject in subjects:

        for topic in subject.topics:

            mastery = float(topic.mastery or 0)
            confidence = float(topic.confidence or 0)

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

            recommendation = get_recommendation(
                mastery,
                confidence,
            )

            topics_data.append(
                {
                    "id": topic.id,
                    "subject": subject.name,
                    "name": topic.name,

                    "mastery": mastery,
                    "confidence": confidence,

                    "calibration_gap": gap,

                    "category": category,

                    "priority": priority,

                    "attempts_count": topic.attempts_count,

                    "last_score": topic.last_score,

                    "recommendation": recommendation,
                }
            )

    # --------------------------------------------------------
    # HANDLE NO TOPICS
    # --------------------------------------------------------

    if not topics_data:
        return {
            "student_id": student.id,
            "student_name": student.name,
            "overall_mastery": 0,
            "overall_confidence": 0,
            "topics": [],
            "next_best_action": None,
        }

    # --------------------------------------------------------
    # OVERALL METRICS
    # --------------------------------------------------------

    overall_mastery = round(
        sum(
            topic["mastery"]
            for topic in topics_data
        )
        / len(topics_data),
        2,
    )

    overall_confidence = round(
        sum(
            topic["confidence"]
            for topic in topics_data
        )
        / len(topics_data),
        2,
    )

    # --------------------------------------------------------
    # FIND HIGHEST PRIORITY TOPIC
    # --------------------------------------------------------

    next_topic = max(
        topics_data,
        key=lambda topic: topic["priority"],
    )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {
        "student_id": student.id,
        "student_name": student.name,

        "overall_mastery": overall_mastery,
        "overall_confidence": overall_confidence,

        "topics": topics_data,

        "next_best_action": {
            "topic_id": next_topic["id"],
            "subject": next_topic["subject"],
            "topic": next_topic["name"],
            "category": next_topic["category"],
            "priority": next_topic["priority"],
            "recommendation": next_topic["recommendation"],
        },
    }


