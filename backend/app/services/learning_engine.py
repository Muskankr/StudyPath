def calculate_mastery(
    old_mastery: float,
    new_score: float,
) -> float:
    """
    Update topic mastery using previous mastery
    and the latest assessment score.
    """

    if old_mastery == 0:
        return round(new_score, 2)

    mastery = (
        old_mastery * 0.6
        + new_score * 0.4
    )

    return round(mastery, 2)


def calculate_confidence(
    old_confidence: float,
    new_confidence: float,
) -> float:
    """
    Update confidence using previous confidence
    and the student's latest self-reported confidence.
    """

    if old_confidence == 0:
        return round(new_confidence, 2)

    confidence = (
        old_confidence * 0.7
        + new_confidence * 0.3
    )

    return round(confidence, 2)


def calculate_calibration_gap(
    mastery: float,
    confidence: float,
) -> float:
    """
    Positive gap = confidence is higher than mastery.
    Negative gap = confidence is lower than mastery.
    """

    return round(
        confidence - mastery,
        2,
    )


def classify_topic(
    mastery: float,
    confidence: float,
) -> str:
    """
    Classify the student's current learning state.
    """

    gap = calculate_calibration_gap(
        mastery,
        confidence,
    )

    if mastery < 40:
        return "critical_gap"

    if gap >= 20:
        return "overconfidence"

    if gap <= -20:
        return "underconfidence"

    if mastery >= 80:
        return "mastered"

    if mastery < 70:
        return "developing"

    return "needs_practice"


def calculate_priority(
    mastery: float,
    confidence: float,
) -> int:
    """
    Calculate how urgently a topic should be studied.
    """

    gap = calculate_calibration_gap(
        mastery,
        confidence,
    )

    priority = 0

    # Low mastery gets higher priority.
    if mastery < 40:
        priority += 60

    elif mastery < 70:
        priority += 40

    elif mastery < 80:
        priority += 20

    # Large calibration mismatch increases priority.
    if abs(gap) >= 30:
        priority += 25

    elif abs(gap) >= 20:
        priority += 15

    return min(
        priority,
        100,
    )


def get_recommendation(
    mastery: float,
    confidence: float,
) -> str:
    """
    Generate a learning recommendation based
    on the student's current learning state.
    """

    category = classify_topic(
        mastery,
        confidence,
    )

    recommendations = {

        "critical_gap": (
            "Review the fundamentals, study worked examples, "
            "complete easy practice questions, then reassess."
        ),

        "overconfidence": (
            "Review the concepts behind your mistakes and "
            "complete misconception-check questions before "
            "taking another assessment."
        ),

        "underconfidence": (
            "Start with easier questions, explain your reasoning, "
            "and gradually move toward medium-difficulty practice "
            "to build confidence."
        ),

        "developing": (
            "Practice the weaker concepts with targeted questions "
            "and then attempt a mixed assessment."
        ),

        "mastered": (
            "Move forward with spaced revision and attempt "
            "a challenging problem to maintain mastery."
        ),

        "needs_practice": (
            "Continue targeted practice on this topic and "
            "take another assessment soon."
        ),
    }

    return recommendations[category]