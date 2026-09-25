"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getTopics,
  generateAssessment,
  submitAdaptiveQuiz,
} from "@/lib/api";


type Topic = {
  id: number;
  subject: string;
  name: string;
  mastery: number;
  confidence: number;
  category: string;
  priority: number;
};


type Question = {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  concept: string;
};


export default function QuizPage() {

  const router = useRouter();

  const [topics, setTopics] =
    useState<Topic[]>([]);

  const [selectedTopic, setSelectedTopic] =
    useState<number | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState<number[]>([]);

  const [confidence, setConfidence] =
    useState(50);

  const [loading, setLoading] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);


  useEffect(() => {

    const studentId =
      localStorage.getItem("studentId");

    if (!studentId) {
      router.push("/onboarding");
      return;
    }

    getTopics(Number(studentId))
      .then(setTopics)
      .catch(console.error);

  }, [router]);


  async function startAssessment() {

    if (!selectedTopic) {
      return;
    }

    const studentId =
      localStorage.getItem("studentId");

    if (!studentId) {
      return;
    }

    setLoading(true);

    try {

      const data =
        await generateAssessment({
          student_id: Number(studentId),
          topic_id: selectedTopic,
          difficulty: "medium",
          count: 5,
        });

      setQuestions(data.questions);
      setCurrentQuestion(0);
      setAnswers([]);
      setFinished(false);

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate assessment."
      );

    } finally {
      setLoading(false);
    }
  }


  function chooseAnswer(index: number) {

    const updated = [
      ...answers,
    ];

    updated[currentQuestion] = index;

    setAnswers(updated);
  }


  async function finishAssessment() {

    if (!selectedTopic) {
      return;
    }

    const studentId =
      localStorage.getItem("studentId");

    if (!studentId) {
      return;
    }


    const correct = questions.filter(
      (question, index) =>
        question.correct_answer ===
        answers[index]
    ).length;


    const score =
      Math.round(
        (correct / questions.length) * 100
      );


    setLoading(true);

    try {

      const data =
        await submitAdaptiveQuiz({
          student_id: Number(studentId),
          topic_id: selectedTopic,
          score,
          confidence,
        });

      setResult({
        ...data,
        score,
        correct,
      });

      setFinished(true);

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit assessment."
      );

    } finally {
      setLoading(false);
    }
  }


  if (finished && result) {

    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">

        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Assessment complete
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Your learning state changed.
            </h1>


            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <Metric
                label="Score"
                value={`${result.score}%`}
              />

              <Metric
                label="Mastery"
                value={`${result.mastery}%`}
              />

              <Metric
                label="Confidence"
                value={`${result.confidence}%`}
              />

            </div>


            <div className="mt-8 rounded-2xl bg-indigo-50 p-6">

              <p className="text-sm font-semibold uppercase text-indigo-600">
                StudyPath insight
              </p>

              <h2 className="mt-2 text-2xl font-bold capitalize">
                {result.category.replace(
                  "_",
                  " "
                )}
              </h2>

              <p className="mt-4 leading-7 text-gray-700">
                {result.recommendation}
              </p>

            </div>


            <div className="mt-8">

              <h2 className="text-xl font-bold">
                What happens next?
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                StudyPath will use this result to
                prioritize your future learning sessions.
                Your next actions are based on your current
                learning state rather than a fixed timetable.
              </p>

            </div>


            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="mt-8 rounded-xl bg-gray-950 px-6 py-3 font-semibold text-white"
            >
              View Adaptive Dashboard →
            </button>

          </div>

        </div>

      </main>
    );
  }


  if (questions.length > 0) {

    const question =
      questions[currentQuestion];

    const isLast =
      currentQuestion ===
      questions.length - 1;


    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">

        <div className="mx-auto max-w-3xl">

          <div className="mb-8 flex justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Question
              </p>

              <p className="text-xl font-bold">
                {currentQuestion + 1} /{" "}
                {questions.length}
              </p>

            </div>


            <div className="text-right">

              <p className="text-sm text-gray-500">
                Topic
              </p>

              <p className="font-semibold">
                {
                  topics.find(
                    (topic) =>
                      topic.id ===
                      selectedTopic
                  )?.name
                }
              </p>

            </div>

          </div>


          <div className="rounded-3xl border bg-white p-8">

            <h1 className="text-2xl font-bold leading-9">
              {question.question}
            </h1>


            <div className="mt-8 space-y-3">

              {question.options.map(
                (option, index) => {

                  const selected =
                    answers[currentQuestion] ===
                    index;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        chooseAnswer(index)
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="mr-3 font-bold">
                        {String.fromCharCode(
                          65 + index
                        )}
                        .
                      </span>

                      {option}
                    </button>
                  );
                }
              )}

            </div>


            {isLast && (

              <div className="mt-10 rounded-2xl bg-gray-50 p-5">

                <label className="flex justify-between font-semibold">

                  <span>
                    How confident were you?
                  </span>

                  <span>
                    {confidence}%
                  </span>

                </label>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(event) =>
                    setConfidence(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="mt-5 w-full"
                />

                <div className="mt-2 flex justify-between text-xs text-gray-400">

                  <span>Not confident</span>

                  <span>Very confident</span>

                </div>

              </div>

            )}


            <button
              disabled={
                answers[currentQuestion] ===
                undefined ||
                loading
              }
              onClick={() => {

                if (isLast) {
                  finishAssessment();
                } else {
                  setCurrentQuestion(
                    currentQuestion + 1
                  );
                }

              }}
              className="mt-8 w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white disabled:opacity-40"
            >
              {loading
                ? "Analyzing..."
                : isLast
                ? "Finish Assessment →"
                : "Next Question →"}
            </button>

          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">

      <div className="mx-auto max-w-2xl">

        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          AI diagnostic
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Let's find your actual weak spots.
        </h1>

        <p className="mt-3 leading-7 text-gray-600">
          StudyPath will generate questions based on
          your selected topic and analyze your performance.
        </p>


        <div className="mt-8 rounded-2xl border bg-white p-7">

          <label className="mb-3 block text-sm font-semibold">
            Select a topic
          </label>

          <select
            value={selectedTopic ?? ""}
            onChange={(event) =>
              setSelectedTopic(
                Number(event.target.value)
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >

            <option value="">
              Choose a topic
            </option>

            {topics.map((topic) => (

              <option
                key={topic.id}
                value={topic.id}
              >
                {topic.subject} — {topic.name}
              </option>

            ))}

          </select>


          <button
            disabled={
              !selectedTopic ||
              loading
            }
            onClick={startAssessment}
            className="mt-6 w-full rounded-xl bg-gray-950 py-3.5 font-semibold text-white disabled:opacity-40"
          >
            {loading
              ? "Generating personalized assessment..."
              : "Start AI Assessment →"}
          </button>

        </div>

      </div>

    </main>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}