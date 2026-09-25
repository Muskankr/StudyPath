"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createStudent } from "@/lib/api";


export default function OnboardingPage() {

  const router = useRouter();

  const [name, setName] = useState("");
  const [course, setCourse] = useState("B.Tech CSE");
  const [goal, setGoal] = useState("Score 85%+");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("3");

  const [subjects, setSubjects] = useState(
    "DSA, DBMS, Operating Systems, AI"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");
    setLoading(true);

    try {

      const result = await createStudent({
        name,
        course,
        goal,
        exam_date: examDate,
        daily_hours: Number(dailyHours),
        subjects: subjects
          .split(",")
          .map((subject) => subject.trim())
          .filter(Boolean),
      });

      localStorage.setItem(
        "studentId",
        String(result.student_id)
      );

      router.push("/dashboard");

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">

      <div className="mx-auto max-w-2xl">

        <div className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Step 1
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Build your learning profile
          </h1>

          <p className="mt-3 text-gray-600">
            Tell StudyPath a little about yourself.
            Your learning path will adapt as you progress.
          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >

          <Input
            label="Your name"
            value={name}
            onChange={setName}
            placeholder="e.g. Muskan"
            required
          />


          <Input
            label="Course"
            value={course}
            onChange={setCourse}
            placeholder="e.g. B.Tech CSE"
            required
          />


          <Input
            label="Learning goal"
            value={goal}
            onChange={setGoal}
            placeholder="e.g. Score 85%+"
            required
          />


          <Input
            label="Exam date"
            type="date"
            value={examDate}
            onChange={setExamDate}
            required
          />


          <div>

            <label className="mb-2 block text-sm font-semibold">
              Daily study time
            </label>

            <select
              value={dailyHours}
              onChange={(e) =>
                setDailyHours(e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-600"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="5">5+ hours</option>
            </select>

          </div>


          <div>

            <label className="mb-2 block text-sm font-semibold">
              Subjects
            </label>

            <input
              value={subjects}
              onChange={(e) =>
                setSubjects(e.target.value)
              }
              placeholder="DSA, DBMS, AI"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-600"
              required
            />

            <p className="mt-2 text-xs text-gray-500">
              Separate subjects using commas.
            </p>

          </div>


          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating your profile..."
              : "Create My Learning Path →"}
          </button>

        </form>

      </div>

    </main>
  );
}


function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-600"
      />

    </div>
  );
}