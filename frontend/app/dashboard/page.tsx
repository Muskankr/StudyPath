"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getDailyPlan,
  getLearningState,
  getProgress,
  getLearningInsight,
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

type LearningState = {
  student_id: number;
  student_name: string;
  overall_mastery: number;
  overall_confidence: number;
  topics: Topic[];

  next_best_action: {
    topic_id: number;
    subject: string;
    topic: string;
    category: string;
    priority: number;
    recommendation: string;
  } | null;
};

type DailySession = {
  topic_id: number;
  subject: string;
  topic: string;
  minutes: number;
  activity: string;
  category: string;
  priority: number;
};

type DailyPlan = {
  student_id: number;
  student_name: string;
  daily_hours: number;
  exam_date: string | null;
  total_minutes: number;
  days_until_exam: number | null;
  sessions: DailySession[];
};

type Attempt = {
  attempt_number: number;
  topic: string;
  score: number;
  confidence: number;
  date: string | null;
};

type Performance = {
  trend: string;
  score_change: number;
  total_attempts: number;
};

type ProgressData = {
  attempt_history: Attempt[];
  performance: Performance;
};

// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  const [data, setData] =
    useState<LearningState | null>(null);

  const [plan, setPlan] =
    useState<DailyPlan | null>(null);

  const [progress, setProgress] =
    useState<ProgressData | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const studentId =
      localStorage.getItem("studentId");

    if (!studentId) {
      setError(
        "No student profile found. Please complete onboarding."
      );

      return;
    }

    const id = Number(studentId);

    if (!Number.isFinite(id) || id <= 0) {
      setError(
        "Invalid student profile. Please complete onboarding again."
      );

      return;
    }

    Promise.all([
      getLearningState(id),
      getDailyPlan(id),
      getProgress(id),
    ])
      .then(
        ([
          learningState,
          dailyPlan,
          progressData,
        ]) => {
          setData(learningState);
          setPlan(dailyPlan);
          setProgress(progressData);
        }
      )
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard."
        );
      });
  }, []);

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-950">
            Dashboard unavailable
          </h1>

          <p className="mt-3 leading-7 text-gray-600">
            {error}
          </p>

          <Link
            href="/onboarding"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Create Profile
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <p className="text-center text-gray-500">
          Loading your learning profile...
        </p>
      </main>
    );
  }

  const nextAction =
    data.next_best_action;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ======================================================
          NAVBAR
      ======================================================= */}

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-950">
            StudyPath
            <span className="text-indigo-600">.</span>
          </h1>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/quiz"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Take Assessment
            </Link>

            <Link
              href="/profile"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Learning Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* ====================================================
            HEADER
        ===================================================== */}

        <div>
          <p className="text-sm font-medium text-indigo-600">
            Your adaptive learning dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Good evening, {data.student_name} 👋
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            StudyPath adapts your learning path based on
            your performance and confidence.
          </p>
        </div>

        {/* ====================================================
            STATS
        ===================================================== */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          <Stat
            title="Overall mastery"
            value={`${data.overall_mastery}%`}
          />

          <Stat
            title="Confidence"
            value={`${data.overall_confidence}%`}
          />

          <Stat
            title="Topics tracked"
            value={`${data.topics.length}`}
          />
        </div>

        {/* ====================================================
            NEXT BEST ACTION
        ===================================================== */}

        {nextAction && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white">
            <div className="border-b border-indigo-100 bg-indigo-50 px-6 py-4 md:px-7">
              <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                ✨ Next Best Action
              </p>
            </div>

            <div className="flex flex-col justify-between gap-8 p-6 md:flex-row md:p-7">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-gray-500">
                  {nextAction.subject}
                </p>

                <h3 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">
                  {nextAction.topic}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    text={formatCategory(
                      nextAction.category
                    )}
                  />

                  <Badge
                    text={`Priority ${nextAction.priority}`}
                  />
                </div>

                <p className="mt-5 leading-7 text-gray-600">
                  {nextAction.recommendation}
                </p>
              </div>

              <div className="flex items-center">
                <Link
                  href="/tutor"
                  className="rounded-xl bg-gray-950 px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                >
                  Practice with AI Tutor →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
      ✦
    </div>

    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
        Adaptive Learning Insight
      </p>

      <h3 className="mt-1 text-lg font-bold text-slate-900">
        Your learning pattern
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        StudyPath continuously compares your
        demonstrated mastery with your confidence
        to decide what you should study next.
      </p>
    </div>
  </div>
</div>

        {/* ====================================================
            TODAY'S ADAPTIVE PLAN
        ===================================================== */}

        {plan && (
          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  Personalized study plan
                </p>

                <h3 className="mt-1 text-2xl font-bold text-gray-950">
                  Today&apos;s Adaptive Plan
                </h3>

                <p className="mt-2 max-w-2xl leading-7 text-gray-500">
                  Your study time is allocated according
                  to your current learning needs.
                </p>
              </div>

              <div className="text-sm text-gray-500">
                {plan.total_minutes} minutes planned

                {plan.days_until_exam !== null && (
                  <span className="ml-2">
                    • {plan.days_until_exam} days until exam
                  </span>
                )}
              </div>
            </div>

            {plan.sessions.length > 0 ? (
              <div className="mt-5 space-y-4">
                {plan.sessions.map(
                  (session, index) => (
                    <div
                      key={`${session.topic_id}-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-6"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white">
                            {index + 1}
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">
                              {session.subject}
                            </p>

                            <h4 className="mt-1 text-lg font-bold text-gray-950">
                              {session.topic}
                            </h4>

                            <p className="mt-1 text-sm leading-6 text-gray-600">
                              {session.activity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-950">
                              {session.minutes}
                            </p>

                            <p className="text-xs text-gray-500">
                              minutes
                            </p>
                          </div>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            Priority {session.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
                No study sessions are available yet.
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            LEARNING PROGRESS
        ===================================================== */}

        {progress && (
          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  Performance tracking
                </p>

                <h3 className="mt-1 text-2xl font-bold text-gray-950">
                  Your Progress
                </h3>

                <p className="mt-2 max-w-2xl leading-7 text-gray-500">
                  StudyPath tracks how your performance
                  changes across assessments.
                </p>
              </div>

              <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500">
                {progress.performance.total_attempts}{" "}
                assessment
                {progress.performance.total_attempts !== 1
                  ? "s"
                  : ""}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 md:p-7">
              {progress.attempt_history.length >= 2 ? (
                <>
                  {/* TREND SUMMARY */}

                  <div className="flex flex-col justify-between gap-5 md:flex-row">
                    <div>
                      <p className="text-sm text-gray-500">
                        Performance trend
                      </p>

                      <h4 className="mt-1 text-2xl font-bold capitalize text-gray-950">
                        {formatCategory(
                          progress.performance.trend
                        )}
                      </h4>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500">
                        Change since first attempt
                      </p>

                      <p
                        className={`mt-1 text-2xl font-bold ${
                          progress.performance.score_change > 0
                            ? "text-emerald-600"
                            : progress.performance.score_change < 0
                              ? "text-red-600"
                              : "text-gray-950"
                        }`}
                      >
                        {progress.performance.score_change > 0
                          ? "+"
                          : ""}
                        {progress.performance.score_change}%
                      </p>
                    </div>
                  </div>

                  {/* SCORE BAR CHART */}

                  <div className="mt-8">
                    <div className="flex min-h-56 items-end gap-3 overflow-x-auto border-b border-gray-200 pb-0">
                      {progress.attempt_history.map(
                        (attempt) => {
                          const safeScore = Math.min(
                            Math.max(attempt.score, 0),
                            100
                          );

                          const barHeight =
                            Math.max(
                              safeScore * 1.6,
                              8
                            );

                          return (
                            <div
                              key={attempt.attempt_number}
                              className="flex min-w-14 flex-1 flex-col items-center justify-end gap-2"
                            >
                              <span className="text-xs font-semibold text-gray-700">
                                {safeScore}%
                              </span>

                              <div
                                className="w-full max-w-12 rounded-t-lg bg-indigo-600 transition"
                                style={{
                                  height: `${barHeight}px`,
                                }}
                                aria-label={`Attempt ${attempt.attempt_number}: ${safeScore}%`}
                              />

                              <span className="pb-2 text-xs text-gray-500">
                                #{attempt.attempt_number}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* ATTEMPT DETAILS */}

                  <div className="mt-6 space-y-3">
                    {progress.attempt_history.map(
                      (attempt) => (
                        <div
                          key={`detail-${attempt.attempt_number}`}
                          className="flex flex-col justify-between gap-2 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              Attempt #{attempt.attempt_number}
                            </p>

                            <p className="text-sm text-gray-500">
                              {attempt.topic}
                            </p>
                          </div>

                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600">
                              Score:{" "}
                              <strong className="text-gray-900">
                                {attempt.score}%
                              </strong>
                            </span>

                            <span className="text-gray-600">
                              Confidence:{" "}
                              <strong className="text-gray-900">
                                {attempt.confidence}%
                              </strong>
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-lg font-semibold text-gray-950">
                    Complete another assessment to see your progress.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    StudyPath will compare your future
                    performance with your earlier attempts.
                  </p>

                  <Link
                    href="/quiz"
                    className="mt-5 inline-block rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Take Assessment →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ====================================================
            LEARNING STATE
        ===================================================== */}

        <section className="mt-8">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Adaptive insights
            </p>

            <h3 className="mt-1 text-2xl font-bold text-gray-950">
              Your Learning State
            </h3>

            <p className="mt-2 max-w-2xl leading-7 text-gray-500">
              These insights explain how StudyPath interprets
              your mastery and confidence.
            </p>
          </div>

          {data.topics.length > 0 ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {data.topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
              No topics have been added to your learning
              profile yet.
            </div>
          )}
        </section>

        {/* ====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 md:p-7">
          <h3 className="text-xl font-bold text-gray-950">
            How StudyPath adapts
          </h3>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Step
              number="1"
              title="Assess"
              text="AI generates questions based on your topic and difficulty."
            />

            <Step
              number="2"
              title="Calibrate"
              text="StudyPath compares your performance with your confidence."
            />

            <Step
              number="3"
              title="Adapt"
              text="The system prioritizes what you should learn next."
            />
          </div>
        </section>
      </section>
    </main>
  );
}

// ============================================================
// STAT COMPONENT
// ============================================================

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-gray-950">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// TOPIC CARD
// ============================================================

function TopicCard({
  topic,
}: {
  topic: Topic;
}) {
  const mastery = Math.min(
    Math.max(topic.mastery, 0),
    100
  );

  const confidence = Math.min(
    Math.max(topic.confidence, 0),
    100
  );

  const gap = topic.calibration_gap;

  const isOverconfident = gap >= 20;
  const isUnderconfident = gap <= -20;
  const isCritical = mastery < 40;

  let insightTitle =
    "Balanced learning state";

  let insightText =
    "Your confidence and demonstrated performance are reasonably aligned.";

  if (isCritical) {
    insightTitle =
      "Knowledge gap detected";

    insightText =
      "Your current mastery is low. Focus on fundamentals before moving to harder questions.";
  } else if (isOverconfident) {
    insightTitle =
      "Confidence is ahead of performance";

    insightText =
      "You feel more confident than your recent performance suggests. Review your mistakes and test the underlying concepts.";
  } else if (isUnderconfident) {
    insightTitle =
      "You may know more than you think";

    insightText =
      "Your demonstrated performance is higher than your confidence. More practice can help build confidence.";
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {topic.subject}
          </p>

          <h4 className="mt-1 text-xl font-bold text-gray-950">
            {topic.name}
          </h4>
        </div>

        <Badge
          text={formatCategory(topic.category)}
        />
      </div>

      {/* MASTERY */}

      <div className="mt-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Mastery
          </span>

          <span className="font-semibold text-gray-900">
            {mastery}%
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-indigo-600"
            style={{
              width: `${mastery}%`,
            }}
          />
        </div>
      </div>

      {/* CONFIDENCE */}

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            Confidence
          </span>

          <span className="font-semibold text-gray-900">
            {confidence}%
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-gray-950"
            style={{
              width: `${confidence}%`,
            }}
          />
        </div>
      </div>

      {/* CALIBRATION GAP */}

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">
              Confidence gap
            </p>

            <p className="mt-1 text-lg font-bold text-gray-950">
              {gap > 0 ? `+${gap}%` : `${gap}%`}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">
              Attempts
            </p>

            <p className="mt-1 font-semibold text-gray-950">
              {topic.attempts_count}
            </p>
          </div>
        </div>
      </div>

      {/* INSIGHT */}

      <div className="mt-5 border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-gray-950">
          {insightTitle}
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {insightText}
        </p>
      </div>

      {/* RECOMMENDATION */}

      <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Recommended next step
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-700">
          {topic.recommendation}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// BADGE COMPONENT
// ============================================================

function Badge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      {text}
    </span>
  );
}

// ============================================================
// STEP COMPONENT
// ============================================================

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600">
        {number}
      </div>

      <div>
        <p className="font-semibold text-gray-950">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-500">
          {text}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CATEGORY FORMATTER
// ============================================================

function formatCategory(
  category: string
): string {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}