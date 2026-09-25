from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import relationship

from .database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    course = Column(String, nullable=False)

    goal = Column(String, nullable=False)

    exam_date = Column(Date, nullable=False)

    daily_hours = Column(Float, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    subjects = relationship(
        "Subject",
        back_populates="student",
        cascade="all, delete-orphan",
    )

    attempts = relationship(
        "QuizAttempt",
        back_populates="student",
        cascade="all, delete-orphan",
    )


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
    )

    name = Column(String, nullable=False)

    student = relationship(
        "Student",
        back_populates="subjects",
    )

    topics = relationship(
        "Topic",
        back_populates="subject",
        cascade="all, delete-orphan",
    )


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False,
    )

    name = Column(String, nullable=False)

    mastery = Column(Float, default=0)

    confidence = Column(Float, default=0)

    attempts_count = Column(Integer, default=0)

    last_score = Column(Float, default=0)

    subject = relationship(
        "Subject",
        back_populates="topics",
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False,
    )

    topic = Column(String, nullable=False)

    score = Column(Float, nullable=False)

    confidence = Column(Float, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    student = relationship(
        "Student",
        back_populates="attempts",
    )