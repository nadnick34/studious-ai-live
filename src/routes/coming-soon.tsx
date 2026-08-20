import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/coming-soon")({ component: ComingSoon });

function ComingSoon() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-dark text-cream">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-dark/60" aria-hidden />
      <div className="relative z-10 h-1 bg-teal" />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <img src="/hero-mark.png" alt="" className="mb-2 h-24 w-auto" />
        <p className="font-serif text-2xl font-semibold">Studious AI</p>
        <span className="mt-2 rounded-full border border-teal-700/40 bg-teal-950/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-teal uppercase">
          Teacher Edition
        </span>
        <h1 className="mt-5 max-w-lg font-serif text-3xl font-semibold sm:text-4xl">Coming Soon!</h1>
        <p className="mt-3 font-serif text-lg italic text-teal">Less grading. More time with the student.</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/78">
          School-aligned assessments, scanned-test grading, and class analytics are on the way.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-cream px-6 text-sm font-semibold text-slate-dark"
        >
          Back to Student Edition
        </Link>
      </main>
    </div>
  );
}
