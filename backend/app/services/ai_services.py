````python
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

# OpenAI is optional during development and deployment.
client = OpenAI(api_key=API_KEY) if API_KEY else None


def _require_client():
    """Return the OpenAI client or explain how to enable AI features."""
    if client is None:
        raise RuntimeError(
            "AI features are currently disabled because "
            "OPENAI_API_KEY is not configured. "
            "Configure it in the backend environment to enable them."
        )
    return client


def generate_questions(
    subject: str,
    topic: str,
    difficulty: str = "medium",
    count: int = 5,
):
    ai_client = _require_client()

    prompt = f"""
You are an expert educational assessment designer.

Generate {count} multiple-choice questions for:

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

Return ONLY valid JSON in this format:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer": 0,
      "explanation": "...",
      "concept": "..."
    }}
  ]
}}

Rules:
- Generate exactly {count} questions.
- Each question must have exactly four options.
- correct_answer must be an integer from 0 to 3.
- Questions must test understanding and relate to the given topic.
- Explanations should be short and educational.
- Questions must be appropriate for a college student.
- Do not include markdown; return only the JSON object.
"""

    response = ai_client.responses.create(
        model=MODEL,
        input=prompt,
    )

    text = response.output_text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError(f"AI returned invalid JSON: {error}") from error

    if not isinstance(result, dict):
        raise ValueError("AI response must be a JSON object.")

    questions = result.get("questions")

    if not isinstance(questions, list):
        raise ValueError("AI response does not contain a valid questions list.")

    if len(questions) != count:
        raise ValueError(
            f"Expected {count} questions, but received {len(questions)}."
        )

    for index, question in enumerate(questions):
        if not isinstance(question, dict):
            raise ValueError(f"Question {index + 1} is invalid.")

        required_fields = (
            "question",
            "options",
            "correct_answer",
            "explanation",
            "concept",
        )

        for field in required_fields:
            if field not in question:
                raise ValueError(
                    f"Question {index + 1} is missing '{field}'."
                )

        if not isinstance(question["options"], list) or len(question["options"]) != 4:
            raise ValueError(
                f"Question {index + 1} must have exactly four options."
            )

        answer = question["correct_answer"]
        if type(answer) is not int or answer not in (0, 1, 2, 3):
            raise ValueError(
                f"Question {index + 1} has an invalid correct_answer."
            )

    return result


def generate_learning_insight(
    student_name: str,
    topic: str,
    mastery: float,
    confidence: float,
    category: str,
):
    ai_client = _require_client()

    prompt = f"""
You are an educational AI coach.

Student: {student_name}
Topic: {topic}
Mastery: {mastery}%
Confidence: {confidence}%
Learning category: {category}

Write a concise personalized learning insight.
Explain what the result means, what the student should do next,
and why that action was selected.
Maximum 100 words. Do not exaggerate.
"""

    response = ai_client.responses.create(
        model=MODEL,
        input=prompt,
    )

    return response.output_text.strip()
````
