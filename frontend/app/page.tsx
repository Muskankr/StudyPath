import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-950">

      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-xl font-bold">
            StudyPath<span className="text-indigo-600">.</span>
          </h1>

          <Link
            href="/onboarding"
            className="rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      </nav>


      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="max-w-4xl">

          <div className="mb-6 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            AI-powered adaptive learning
          </div>

          <h2 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Stop following static
            <span className="text-indigo-600">
              {" "}study plans.
            </span>
          </h2>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-600">
            StudyPath learns your strengths, weaknesses and confidence
            to continuously personalize what you should learn next.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <Link
              href="/onboarding"
              className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white hover:bg-indigo-700"
            >
              Build My Learning Path →
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-300 px-7 py-3.5 font-semibold hover:bg-gray-50"
            >
              View Demo
            </Link>

          </div>
        </div>


        <div className="mt-20 grid gap-5 md:grid-cols-3">

          <Feature
            number="01"
            title="Assess"
            description="Understand what you know before creating a plan."
          />

          <Feature
            number="02"
            title="Adapt"
            description="Your learning path changes based on your performance."
          />

          <Feature
            number="03"
            title="Improve"
            description="Target weak topics instead of wasting time on mastered ones."
          />

        </div>

      </section>

    </main>
  );
}


function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-7">
      <p className="text-sm font-bold text-indigo-600">
        {number}
      </p>

      <h3 className="mt-5 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-gray-600">
        {description}
      </p>
    </div>
  );
}