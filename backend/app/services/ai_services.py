
import json
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
# Backward compatibility for existing services.
MODEL = GEMINI_MODEL

# Allow the backend to start even when AI is not configured.
client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if GEMINI_API_KEY
    else None
)


def _require_client():
    """Return the Gemini client or raise a clear configuration error."""
    if client is None:
        raise RuntimeError(
            "AI features are disabled because GEMINI_API_KEY "
            "is not configured."
        )
    return client


def _generate_text(prompt: str) -> str:
    """Generate text using the configured Gemini model."""
    ai_client = _require_client()

    response = ai_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    text = response.text

    if not text or not text.strip():
        raise ValueError("Gemini returned an empty response.")

    return text.strip()


def _parse_json_response(text: str) -> dict:
    """Parse a JSON object, tolerating optional Markdown code fences."""
    text = text.strip()

    if text.startswith("```"):
        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"AI returned invalid JSON: {error}"
        ) from error

    if not isinstance(result, dict):
        raise ValueError("AI response must be a JSON object.")

    return result


def generate_questions(
    subject: str,
    topic: str,
    difficulty: str = "medium",
    count: int = 5,
):
    """Generate and validate multiple-choice assessment questions."""

    if not isinstance(subject, str) or not subject.strip():
        raise ValueError("Subject must not be empty.")

    if not isinstance(topic, str) or not topic.strip():
        raise ValueError("Topic must not be empty.")

    if not isinstance(difficulty, str) or not difficulty.strip():
        raise ValueError("Difficulty must not be empty.")

    if type(count) is not int or not 1 <= count <= 20:
        raise ValueError(
            "Question count must be an integer between 1 and 20."
        )

    prompt = f"""
You are an expert educational assessment designer.

Generate exactly {count} multiple-choice questions for:
Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

Return only a valid JSON object in this format:
{{
  "questions": [
    {{
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": 0,
      "explanation": "Short explanation",
      "concept": "Concept tested"
    }}
  ]
}}

Rules:
- Generate exactly {count} questions.
- Each question must have exactly four options.
- correct_answer must be an integer from 0 to 3.
- Test understanding, not just memorization.
- Keep questions relevant to the topic and appropriate
  for college students.
- Ensure exactly one option is correct per question.
- Do not include Markdown or text outside the JSON object.
"""

    response_text = _generate_text(prompt)
    result = _parse_json_response(response_text)

    questions = result.get("questions")

    if not isinstance(questions, list):
        raise ValueError(
            "AI response does not contain a valid questions list."
        )

    if len(questions) != count:
        raise ValueError(
            f"Expected {count} questions, but received {len(questions)}."
        )

    required_fields = (
        "question",
        "options",
        "correct_answer",
        "explanation",
        "concept",
    )

    for index, question in enumerate(questions):
        label = f"Question {index + 1}"

        if not isinstance(question, dict):
            raise ValueError(f"{label} must be a JSON object.")

        for field in required_fields:
            if field not in question:
                raise ValueError(f"{label} is missing '{field}'.")

        for field in ("question", "explanation", "concept"):
            value = question[field]

            if not isinstance(value, str) or not value.strip():
                raise ValueError(
                    f"{label} field '{field}' must be non-empty text."
                )

        options = question["options"]

        if (
            not isinstance(options, list)
            or len(options) != 4
            or not all(
                isinstance(option, str) and option.strip()
                for option in options
            )
        ):
            raise ValueError(
                f"{label} must have exactly four non-empty text options."
            )

        answer = question["correct_answer"]

        if type(answer) is not int or answer not in (0, 1, 2, 3):
            raise ValueError(
                f"{label} has an invalid correct_answer."
            )

    return result


def generate_learning_insight(
    student_name: str,
    topic: str,
    mastery: float,
    confidence: float,
    category: str,
):
    """Generate a concise, personalized learning insight."""

    prompt = f"""
You are an educational AI coach.

Student: {student_name}
Topic: {topic}
Mastery: {mastery}%
Confidence: {confidence}%
Learning category: {category}

Write a concise personalized learning insight explaining:
1. What the result means.
2. What the student should do next.
3. Why that action was selected.

Use at most 100 words. Be supportive and do not exaggerate.
"""

    return _generate_text(prompt)
