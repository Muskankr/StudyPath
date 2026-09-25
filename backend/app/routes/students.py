from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Subject, Topic

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


class StudentCreate(BaseModel):
    name: str
    course: str
    goal: str
    exam_date: date
    daily_hours: float
    subjects: list[str]


@router.post("")
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
):
    if not data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    if not data.subjects:
        raise HTTPException(
            status_code=400,
            detail="At least one subject is required.",
        )

    student = Student(
        name=data.name.strip(),
        course=data.course.strip(),
        goal=data.goal.strip(),
        exam_date=data.exam_date,
        daily_hours=data.daily_hours,
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    for subject_name in data.subjects:

        subject = Subject(
            student_id=student.id,
            name=subject_name.strip(),
        )

        db.add(subject)

        # Create starter topics.
        starter_topics = [
            "Fundamentals",
            "Practice",
            "Revision",
        ]

        for topic_name in starter_topics:

            topic = Topic(
                name=topic_name,
                mastery=0,
                confidence=0,
            )

            subject.topics.append(topic)

    db.commit()

    return {
        "message": "Student profile created successfully.",
        "student_id": student.id,
    }


@router.get("/{student_id}")
def get_student(
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

    return {
        "id": student.id,
        "name": student.name,
        "course": student.course,
        "goal": student.goal,
        "exam_date": student.exam_date,
        "daily_hours": student.daily_hours,
        "subjects": [
            {
                "id": subject.id,
                "name": subject.name,
                "topics": [
                    {
                        "id": topic.id,
                        "name": topic.name,
                        "mastery": topic.mastery,
                        "confidence": topic.confidence,
                    }
                    for topic in subject.topics
                ],
            }
            for subject in student.subjects
        ],
    }