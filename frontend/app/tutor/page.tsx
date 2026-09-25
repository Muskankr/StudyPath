"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getLearningState,
  sendTutorMessage,
  generateTutorPractice,
  submitTutorPractice,
} from "@/lib/api";

// ============================================================
// TYPES
// ============================================================

type Topic = {
  id: number;
  subject: string;
  name: string;
  mastery: number;
  confidence: number;
  calibration_gap: number;
  category: string;
  priority: number;
  attempts_count: number;
  last_score: number;
  recommendation: string;
};

type PracticeQuestion = {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  concept: string;
};

type PracticeData = {
  topic: string;
  difficulty: string;
  question: PracticeQuestion;
};

type PracticeResult = {
  correct: boolean;
  score: number;
  mastery: number;
  confidence: number;
  calibration_gap: number;
  category: string;
  recommendation: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

// ============================================================
// TUTOR PAGE
// ============================================================

export default function TutorPage() {
  const [studentId, setStudentId] = useState<number | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] =
    useState<Topic | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [practice, setPractice] =
    useState<PracticeData | null>(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [confidence, setConfidence] = useState(70);

  const [submittingPractice, setSubmittingPractice] =
    useState(false);

  const [practiceResult, setPracticeResult] =
    useState<PracticeResult | null>(null);

  const [practiceError, setPracticeError] = useState("");

  // ==========================================================
  // LOAD STUDENT
  // ==========================================================

  useEffect(() => {
    const storedStudentId =
      localStorage.getItem("studentId");

    if (!storedStudentId) {
      setLoading(false);
      return;
    }

    const id = Number(storedStudentId);

    if (!Number.isFinite(id) || id <= 0) {
      setLoading(false);
      return;
    }

    setStudentId(id);

    loadLearningState(id);
  }, []);

  // ==========================================================
  // LOAD LEARNING STATE
  // ==========================================================

  async function loadLearningState(id: number) {
    try {
      setLoading(true);

      const data = await getLearningState(id);

      const loadedTopics: Topic[] =
        data.topics || [];

      setTopics(loadedTopics);

      if (loadedTopics.length > 0) {
        const recommendedTopic =
          loadedTopics.find(
            (topic) =>
              topic.id ===
              data.next_best_action?.topic_id
          );

        setSelectedTopic(
          recommendedTopic ||
            [...loadedTopics].sort(
              (a, b) => b.priority - a.priority
            )[0]
        );
      }
    } catch (error) {
      console.error(
        "Failed to load learning state:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // SEND TUTOR MESSAGE
  // ==========================================================

  async function handleSendMessage() {
    if (
      !input.trim() ||
      !studentId ||
      !selectedTopic ||
      sending
    ) {
      return;
    }

    const message = input.trim();

    setInput("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    try {
      setSending(true);

      const response = await sendTutorMessage({
        student_id: studentId,
        topic_id: selectedTopic.id,
        message,
      });

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.response,
        },
      ]);
    } catch (error) {
      console.error(
        "Tutor message failed:",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't respond right now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ==========================================================
  // GENERATE PRACTICE
  // ==========================================================

  async function handleGeneratePractice() {
    if (!studentId || !selectedTopic) {
      return;
    }

    try {
      setPracticeError("");
      setPracticeResult(null);
      setSelectedAnswer(null);

      const data = await generateTutorPractice({
        student_id: studentId,
        topic_id: selectedTopic.id,
      });

      setPractice(data);
    } catch (error) {
      console.error(
        "Practice generation failed:",
        error
      );

      setPracticeError(
        error instanceof Error
          ? error.message
          : "Unable to generate a practice question."
      );
    }
  }

  // ==========================================================
  // SUBMIT PRACTICE
  // ==========================================================

  async function handleSubmitPractice() {
    if (
      !studentId ||
      !selectedTopic ||
      !practice ||
      selectedAnswer === null ||
      submittingPractice
    ) {
      return;
    }

    try {
      setSubmittingPractice(true);
      setPracticeError("");

      const result = await submitTutorPractice({
        student_id: studentId,
        topic_id: selectedTopic.id,
        selected_answer: selectedAnswer,
        correct_answer:
          practice.question.correct_answer,
        confidence,
      });

      setPracticeResult(result);

      // ------------------------------------------------------
      // UPDATE SELECTED TOPIC
      // ------------------------------------------------------

      setSelectedTopic((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          mastery: result.mastery,
          confidence: result.confidence,
          calibration_gap:
            result.calibration_gap,
          category: result.category,
          last_score: result.score,
          attempts_count:
            previous.attempts_count + 1,
          recommendation:
            result.recommendation,
        };
      });

      // ------------------------------------------------------
      // UPDATE TOPIC LIST
      // ------------------------------------------------------

      setTopics((previous) =>
        previous.map((topic) =>
          topic.id === selectedTopic.id
            ? {
                ...topic,
                mastery: result.mastery,
                confidence:
                  result.confidence,
                calibration_gap:
                  result.calibration_gap,
                category:
                  result.category,
                last_score:
                  result.score,
                attempts_count:
                  topic.attempts_count + 1,
                recommendation:
                  result.recommendation,
              }
            : topic
        )
      );
    } catch (error) {
      console.error(
        "Practice submission failed:",
        error
      );

      setPracticeError(
        error instanceof Error
          ? error.message
          : "Unable to submit your answer."
      );
    } finally {
      setSubmittingPractice(false);
    }
  }

  // ==========================================================
  // CHANGE TOPIC
  // ==========================================================

  function handleTopicChange(topic: Topic) {
    setSelectedTopic(topic);

    setMessages([]);
    setPractice(null);
    setPracticeResult(null);
    setSelectedAnswer(null);
    setPracticeError("");
    setConfidence(70);
  }

  // ==========================================================
  // CATEGORY LABEL
  // ==========================================================

  function getCategoryLabel(category: string) {
    return category
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  // ==========================================================
  // CATEGORY STYLE
  // ==========================================================

  function getCategoryClass(category: string) {
    if (category === "critical_gap") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    if (category === "overconfidence") {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }

    if (category === "underconfidence") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    if (category === "mastered") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">
          Loading your learning profile...
        </div>
      </main>
    );
  }

  // ==========================================================
  // NO STUDENT
  // ==========================================================

  if (!studentId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Student profile not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please complete your onboarding first.
          </p>

          <Link
            href="/"
            className="inline-block mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Go to StudyPath
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ======================================================
          NAVBAR
      ======================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-slate-900"
          >
            StudyPath
            <span className="text-indigo-600">
              AI
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            ADAPTIVE AI TUTOR
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Learn with your personal AI tutor
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Your tutor adapts explanations and
            practice to your current mastery,
            confidence, and learning state.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* ==================================================
              TOPIC SIDEBAR
          =================================================== */}

          <aside className="bg-white border border-slate-200 rounded-2xl p-4 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Your topics
            </p>

            {topics.length > 0 ? (
              <div className="space-y-2">
                {topics.map((topic, index) => (
                  <button
                    key={`${topic.id}-${index}`}
                    onClick={() =>
                      handleTopicChange(topic)
                    }
                    className={`w-full text-left rounded-xl px-3 py-3 transition ${
                      selectedTopic?.id === topic.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {topic.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {Math.round(topic.mastery)}%
                      mastery
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No topics available.
              </p>
            )}
          </aside>

          {/* ==================================================
              MAIN
          =================================================== */}

          <section className="space-y-6">
            {selectedTopic && (
              <>
                {/* ============================================
                    LEARNING STATE
                ============================================= */}

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Current learning state
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {selectedTopic.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedTopic.subject}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryClass(
                        selectedTopic.category
                      )}`}
                    >
                      {getCategoryLabel(
                        selectedTopic.category
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Mastery
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {Math.round(
                          selectedTopic.mastery
                        )}
                        %
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Confidence
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {Math.round(
                          selectedTopic.confidence
                        )}
                        %
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        Calibration gap
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedTopic.calibration_gap >
                        0
                          ? "+"
                          : ""}
                        {Math.round(
                          selectedTopic.calibration_gap
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                {/* ============================================
                    AI TUTOR
                ============================================= */}

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-slate-900">
                      AI Tutor
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Ask anything about{" "}
                      {selectedTopic.name}.
                    </p>
                  </div>

                  <div className="p-6 min-h-[280px]">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center h-[220px]">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl">
                          ✦
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-900">
                          What would you like to learn?
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 max-w-md">
                          Ask for an explanation,
                          example, misconception check,
                          or practice problem.
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 mt-5">
                          {[
                            `Explain ${selectedTopic.name} simply`,
                            "Give me an example",
                            "What mistakes should I avoid?",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() =>
                                setInput(prompt)
                              }
                              className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(
                          (message, index) => (
                            <div
                              key={`${message.role}-${index}`}
                              className={`flex ${
                                message.role ===
                                "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                                  message.role ===
                                  "user"
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          )
                        )}

                        {sending && (
                          <div className="text-sm text-slate-400">
                            Tutor is thinking...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-200">
                    <div className="flex gap-3">
                      <textarea
                        value={input}
                        onChange={(event) =>
                          setInput(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Ask about ${selectedTopic.name}...`}
                        rows={2}
                        className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />

                      <button
                        onClick={handleSendMessage}
                        disabled={
                          sending ||
                          !input.trim()
                        }
                        className="self-end rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {sending
                          ? "..."
                          : "Send"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ============================================
                    ADAPTIVE PRACTICE
                ============================================= */}

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        Adaptive practice
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        Test your understanding
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Practice difficulty is selected
                        from your current mastery.
                      </p>
                    </div>

                    <button
                      onClick={
                        handleGeneratePractice
                      }
                      className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      {practice
                        ? "New Question"
                        : "Generate Practice"}
                    </button>
                  </div>

                  <div className="p-6">
                    {!practice && (
                      <div className="py-8 text-center">
                        <div className="text-3xl">
                          📝
                        </div>

                        <p className="mt-3 font-semibold text-slate-800">
                          Ready for a quick check?
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          StudyPath will generate a
                          question based on your current
                          learning state.
                        </p>
                      </div>
                    )}

                    {practice && (
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-5">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {practice.difficulty
                              .charAt(0)
                              .toUpperCase() +
                              practice.difficulty.slice(
                                1
                              )}{" "}
                            difficulty
                          </span>

                          <span className="text-xs text-slate-400">
                            {practice.question.concept}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold leading-7 text-slate-900">
                          {practice.question.question}
                        </h3>

                        <div className="mt-5 space-y-3">
                          {practice.question.options.map(
                            (
                              option,
                              index
                            ) => {
                              const isSelected =
                                selectedAnswer ===
                                index;

                              const isCorrect =
                                !!practiceResult &&
                                practice.question
                                  .correct_answer ===
                                  index;

                              const isWrong =
                                !!practiceResult &&
                                isSelected &&
                                !practiceResult.correct;

                              return (
                                <button
                                  key={index}
                                  disabled={
                                    !!practiceResult
                                  }
                                  onClick={() =>
                                    setSelectedAnswer(
                                      index
                                    )
                                  }
                                  className={`w-full text-left rounded-xl border p-4 transition ${
                                    isCorrect
                                      ? "border-emerald-400 bg-emerald-50"
                                      : isWrong
                                      ? "border-red-400 bg-red-50"
                                      : isSelected
                                      ? "border-indigo-400 bg-indigo-50"
                                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    <span className="font-semibold text-slate-500">
                                      {String.fromCharCode(
                                        65 + index
                                      )}
                                    </span>

                                    <span className="text-sm text-slate-800">
                                      {option}
                                    </span>
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>

                        {/* CONFIDENCE */}

                        {!practiceResult && (
                          <div className="mt-7">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  How confident are you?
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                  This helps StudyPath
                                  measure calibration.
                                </p>
                              </div>

                              <span className="text-lg font-bold text-indigo-600">
                                {confidence}%
                              </span>
                            </div>

                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={confidence}
                              onChange={(event) =>
                                setConfidence(
                                  Number(
                                    event.target.value
                                  )
                                )
                              }
                              className="w-full mt-4"
                            />

                            <div className="flex justify-between text-xs text-slate-400">
                              <span>
                                Not confident
                              </span>
                              <span>
                                Very confident
                              </span>
                            </div>

                            <button
                              onClick={
                                handleSubmitPractice
                              }
                              disabled={
                                selectedAnswer ===
                                  null ||
                                submittingPractice
                              }
                              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                            >
                              {submittingPractice
                                ? "Updating learning state..."
                                : "Submit Answer"}
                            </button>
                          </div>
                        )}

                        {/* RESULT */}

                        {practiceResult && (
                          <div
                            className={`mt-6 rounded-2xl border p-5 ${
                              practiceResult.correct
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-red-200 bg-red-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">
                                {practiceResult.correct
                                  ? "✓"
                                  : "!"}
                              </div>

                              <div>
                                <h3 className="font-bold text-slate-900">
                                  {practiceResult.correct
                                    ? "Correct!"
                                    : "Not quite."}
                                </h3>

                                <p className="mt-1 text-sm text-slate-600">
                                  {
                                    practice.question
                                      .explanation
                                  }
                                </p>
                              </div>
                            </div>

                            {/* RESULT STATS */}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                              <div className="rounded-xl bg-white/70 p-3">
                                <p className="text-xs text-slate-500">
                                  Score
                                </p>

                                <p className="mt-1 font-bold text-slate-900">
                                  {
                                    practiceResult.score
                                  }
                                  %
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/70 p-3">
                                <p className="text-xs text-slate-500">
                                  Mastery
                                </p>

                                <p className="mt-1 font-bold text-slate-900">
                                  {Math.round(
                                    practiceResult.mastery
                                  )}
                                  %
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/70 p-3">
                                <p className="text-xs text-slate-500">
                                  Confidence
                                </p>

                                <p className="mt-1 font-bold text-slate-900">
                                  {Math.round(
                                    practiceResult.confidence
                                  )}
                                  %
                                </p>
                              </div>

                              <div className="rounded-xl bg-white/70 p-3">
                                <p className="text-xs text-slate-500">
                                  Gap
                                </p>

                                <p className="mt-1 font-bold text-slate-900">
                                  {practiceResult.calibration_gap >
                                  0
                                    ? "+"
                                    : ""}
                                  {Math.round(
                                    practiceResult.calibration_gap
                                  )}
                                  %
                                </p>
                              </div>
                            </div>

                            {/* NEW LEARNING STATE */}

                            <div className="mt-4 rounded-xl bg-white/70 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                New learning state
                              </p>

                              <p className="mt-1 font-semibold text-slate-900">
                                {getCategoryLabel(
                                  practiceResult.category
                                )}
                              </p>

                              <p className="mt-2 text-sm text-slate-600">
                                {
                                  practiceResult.recommendation
                                }
                              </p>
                            </div>

                            {/* ACTIONS */}

                            <div className="mt-5 flex flex-col sm:flex-row gap-3">
                              <Link
                                href="/dashboard"
                                className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                              >
                                View Updated Dashboard →
                              </Link>

                              <button
                                onClick={
                                  handleGeneratePractice
                                }
                                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
                              >
                                Practice Again
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ERROR */}

                        {practiceError && (
                          <p className="mt-4 text-sm text-red-600">
                            {practiceError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}