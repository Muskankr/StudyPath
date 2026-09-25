"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProgress } from "@/lib/api";


export default function ProfilePage() {

  const [data, setData] =
    useState<any>(null);


  useEffect(() => {

    const id =
      localStorage.getItem("studentId");

    if (!id) {
      return;
    }

    getProgress(Number(id))
      .then(setData)
      .catch(console.error);

  }, []);


  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading learning profile...
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl justify-between px-6 py-5">

          <Link
            href="/dashboard"
            className="font-bold"
          >
            ← StudyPath
          </Link>

          <span className="text-sm text-gray-500">
            Learning Twin
          </span>

        </div>

      </nav>


      <section className="mx-auto max-w-5xl px-6 py-12">

        <h1 className="text-4xl font-bold">
          {data.student.name}'s Learning Profile
        </h1>

        <p className="mt-3 text-gray-600">
          Your profile evolves as StudyPath observes your learning.
        </p>


        <div className="mt-10 grid gap-5 md:grid-cols-2">

          <ProfileCard
            label="Knowledge mastery"
            value={`${data.overall_mastery}%`}
          />

          <ProfileCard
            label="Confidence"
            value={`${data.overall_confidence}%`}
          />

        </div>


        <div className="mt-8 rounded-2xl border bg-white p-7">

          <h2 className="text-2xl font-bold">
            Topic intelligence
          </h2>

          <div className="mt-6 space-y-4">

            {data.topics.map((topic: any) => (

              <div
                key={topic.id}
                className="rounded-xl border p-5"
              >

                <div className="flex flex-col justify-between gap-3 sm:flex-row">

                  <div>

                    <p className="text-xs font-semibold uppercase text-gray-400">
                      {topic.subject}
                    </p>

                    <h3 className="mt-1 font-bold">
                      {topic.topic}
                    </h3>

                  </div>


                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      topic.category ===
                      "mastered"
                        ? "bg-green-50 text-green-700"
                        : topic.category ===
                          "overconfidence"
                        ? "bg-red-50 text-red-700"
                        : topic.category ===
                          "knowledge_gap"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {topic.category.replace(
                      "_",
                      " "
                    )}
                  </span>

                </div>


                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                  <ProgressBar
                    label="Mastery"
                    value={topic.mastery}
                  />

                  <ProgressBar
                    label="Confidence"
                    value={topic.confidence}
                  />

                </div>


                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {topic.recommendation}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

    </main>
  );
}


function ProfileCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-7">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold text-indigo-600">
        {value}
      </p>

    </div>
  );
}


function ProgressBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>

      <div className="flex justify-between text-sm">

        <span className="text-gray-500">
          {label}
        </span>

        <span className="font-semibold">
          {value}%
        </span>

      </div>

      <div className="mt-2 h-2 rounded-full bg-gray-100">

        <div
          className="h-2 rounded-full bg-indigo-600"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}