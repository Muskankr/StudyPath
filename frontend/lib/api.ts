const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


export async function createStudent(data: {
  name: string;
  course: string;
  goal: string;
  exam_date: string;
  daily_hours: number;
  subjects: string[];
}) {
  const response = await fetch(`${API_URL}/students`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to create student"
    );
  }

  return response.json();
}


export async function getStudent(studentId: number) {
  const response = await fetch(
    `${API_URL}/students/${studentId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch student");
  }

  return response.json();
}


export async function getTopics(studentId: number) {
  const response = await fetch(
    `${API_URL}/quiz/topics/${studentId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch topics");
  }

  return response.json();
}


export async function submitQuiz(data: {
  student_id: number;
  topic_id: number;
  score: number;
  confidence: number;
}) {
  const response = await fetch(
    `${API_URL}/quiz/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to submit quiz"
    );
  }

  return response.json();
}


export async function getProgress(studentId: number) {
  const response = await fetch(
    `${API_URL}/progress/${studentId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch progress");
  }

  return response.json();
}


/* ================================
   ADAPTIVE ASSESSMENT
================================ */


export async function generateAssessment(data: {
  student_id: number;
  topic_id: number;
  difficulty: string;
  count: number;
}) {
  const response = await fetch(
    `${API_URL}/assessment/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to generate assessment"
    );
  }

  return response.json();
}


export async function submitAdaptiveQuiz(data: {
  student_id: number;
  topic_id: number;
  score: number;
  confidence: number;
}) {
  const response = await fetch(
    `${API_URL}/assessment/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to submit adaptive assessment"
    );
  }

  return response.json();
}

export async function getLearningState(studentId: number) {
  const response = await fetch(
    `${API_URL}/learning-state/${studentId}`
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to fetch learning state"
    );
  }

  return response.json();
}

export async function getDailyPlan(studentId: number) {
  const response = await fetch(
    `${API_URL}/planner/${studentId}`
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to fetch daily plan"
    );
  }

  return response.json();
}


export async function sendTutorMessage(data: {
  student_id: number;
  topic_id: number;
  message: string;
}) {
  const response = await fetch(
    `${API_URL}/tutor/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Failed to contact AI tutor"
    );
  }

  return response.json();
}

export async function generateTutorPractice(data: {
  student_id: number;
  topic_id: number;
}) {
  const response = await fetch(
    `${API_URL}/tutor/practice`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

const detail =
  typeof error.detail === "string"
    ? error.detail
    : Array.isArray(error.detail)
      ? error.detail
          .map((item: any) => {
            if (typeof item === "string") {
              return item;
            }

            if (item?.msg) {
              return item.msg;
            }

            return JSON.stringify(item);
          })
          .join(", ")
      : error.detail
        ? JSON.stringify(error.detail)
        : "Failed to generate practice question";

throw new Error(detail);
  }

  return response.json();
}

export async function submitTutorPractice(
  data: {
    student_id: number;
    topic_id: number;
    selected_answer: number;
    correct_answer: number;
    confidence: number;
  }
) {
  const response = await fetch(
    `${API_URL}/tutor/practice/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail ||
        "Failed to submit practice"
    );
  }

  return response.json();
}

export async function getLearningInsight(
  studentId: number,
  topicId: number
) {
  const response = await fetch(
    `${API_URL}/learning-insight/${studentId}/${topicId}`
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail ||
        "Failed to load learning insight"
    );
  }

  return response.json();
}