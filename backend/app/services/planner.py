from datetime import date, datetime

from ..models import Student


def generate_daily_plan(
    student: Student,
    topics: list,
):
    """
    Generate a personalized daily study plan.

    The plan uses:
    - student's available daily hours
    - exam date
    - topic mastery
    - confidence
    - priority
    """

    daily_minutes = max(
        int(student.daily_hours * 60),
        15,
    )

    # Keep some time available for revision.
    revision_minutes = max(
        10,
        int(daily_minutes * 0.2),
    )

    focused_minutes = daily_minutes - revision_minutes

    # Highest priority topics first.
    sorted_topics = sorted(
        topics,
        key=lambda topic: topic["priority"],
        reverse=True,
    )

    plan = []

    if not sorted_topics:
        return {
            "total_minutes": daily_minutes,
            "sessions": [],
        }

    # --------------------------------------------------------
    # FOCUSED LEARNING
    # --------------------------------------------------------

    focused_topics = sorted_topics[:3]

    if focused_topics:

        base_minutes = max(
            int(focused_minutes / len(focused_topics)),
            10,
        )

        for topic in focused_topics:

            if topic["mastery"] < 40:
                activity = "Review fundamentals"

            elif topic["category"] == "overconfidence":
                activity = "Review mistakes and test concepts"

            elif topic["category"] == "underconfidence":
                activity = "Practice easier questions"

            elif topic["mastery"] < 70:
                activity = "Targeted practice"

            else:
                activity = "Mixed practice"

            plan.append(
                {
                    "topic_id": topic["id"],
                    "subject": topic["subject"],
                    "topic": topic["name"],
                    "minutes": base_minutes,
                    "activity": activity,
                    "category": topic["category"],
                    "priority": topic["priority"],
                }
            )

    # --------------------------------------------------------
    # REVISION
    # --------------------------------------------------------

    revision_topic = sorted_topics[-1]

    plan.append(
        {
            "topic_id": revision_topic["id"],
            "subject": revision_topic["subject"],
            "topic": revision_topic["name"],
            "minutes": revision_minutes,
            "activity": "Spaced revision",
            "category": revision_topic["category"],
            "priority": revision_topic["priority"],
        }
    )

    # --------------------------------------------------------
    # EXAM COUNTDOWN
    # --------------------------------------------------------

    today = date.today()

    if student.exam_date:
        days_remaining = max(
            (student.exam_date - today).days,
            0,
        )
    else:
        days_remaining = None

    return {
        "total_minutes": daily_minutes,
        "days_until_exam": days_remaining,
        "sessions": plan,
    }