import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-5.6-luna",
)


if not API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY is missing. "
        "Add it to backend/.env"
    )


client = OpenAI(
    api_key=API_KEY
)


def generate_questions(
    subject: str,
    topic: str,
    difficulty: str = "medium",
    count: int = 5,
):
    prompt = f"""
You are an expert educational assessment designer.

Generate {count} multiple-choice questions for:

Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

The questions should test actual understanding,
not memorization.

Return ONLY valid JSON.

Required format:

{{
  "questions": [
    {{
      "question": "...",
      "options": [
        "...",
        "...",
        "...",
        "..."
      ],
      "correct_answer": 0,
      "explanation": "...",
      "concept": "..."
    }}
  ]
}}

Rules:

- Generate exactly {count} questions.
- Each question must have exactly four options.
- correct_answer must be an integer: 0, 1, 2, or 3.
- No trick questions.
- Explanations should be short and educational.
- Questions must be appropriate for a college student.
- Questions must be directly related to the given topic.
- Do not include markdown.
- Return only the JSON object.
"""

    response = client.responses.create(
        model=MODEL,
        input=prompt,
    )

    text = response.output_text.strip()

    # Remove markdown code fences if the model adds them.
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"AI returned invalid JSON: {error}"
        )

    # Validate top-level structure.
    if not isinstance(result, dict):
        raise ValueError(
            "AI response must be a JSON object."
        )

    questions = result.get("questions")

    if not isinstance(questions, list):
        raise ValueError(
            "AI response does not contain a valid questions list."
        )

    if len(questions) != count:
        raise ValueError(
            f"Expected {count} questions, "
            f"but received {len(questions)}."
        )

    # Validate every question.
    for index, question in enumerate(questions):

        if not isinstance(question, dict):
            raise ValueError(
                f"Question {index + 1} is invalid."
            )

        required_fields = [
            "question",
            "options",
            "correct_answer",
            "explanation",
            "concept",
        ]

        for field in required_fields:
            if field not in question:
                raise ValueError(
                    f"Question {index + 1} is missing "
                    f"'{field}'."
                )

        if not isinstance(question["options"], list):
            raise ValueError(
                f"Question {index + 1} options are invalid."
            )

        if len(question["options"]) != 4:
            raise ValueError(
                f"Question {index + 1} must have exactly "
                f"four options."
            )

        correct_answer = question["correct_answer"]

        if not isinstance(correct_answer, int):
            raise ValueError(
                f"Question {index + 1} correct_answer "
                f"must be an integer."
            )

        if correct_answer not in [0, 1, 2, 3]:
            raise ValueError(
                f"Question {index + 1} has an invalid "
                f"correct_answer."
            )

    return result

def generate_learning_insight(
    student_name: str,
    topic: str,
    mastery: float,
    confidence: float,
    category: str,
):
    prompt = f"""
You are an educational AI coach.

Student:
{student_name}

Topic:
{topic}

Mastery:
{mastery}%

Confidence:
{confidence}%

Learning category:
{category}

Write a concise personalized learning insight.

Explain:
1. What the result means.
2. What the student should do next.
3. Why that action was selected.

Maximum 100 words.
Do not exaggerate.
"""

    response = client.responses.create(
        model=MODEL,
        input=prompt,
    )

    return response.output_text.strip()