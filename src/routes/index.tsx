import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { InfoModal } from "@/components/info-modal";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RoleHomeRedirect } from "@/components/role-home-redirect";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user } = useCurrentUserState();
  const [showOverview, setShowOverview] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);

  if (user) return <RoleHomeRedirect />;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-dark text-cream">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#2c3a47]/55" aria-hidden />

      <header className="relative z-10 flex h-11 shrink-0 items-center justify-end bg-teal px-4 sm:h-12 sm:px-6">
        <button
          type="button"
          onClick={() => setShowOverview(true)}
          className="grid size-9 place-items-center rounded-full border border-white/35 bg-white/15 text-sm font-semibold text-white hover:bg-white/25"
          aria-label="Product overview"
          title="Product overview"
        >
          i
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6 text-center">
        <img src="/hero-mark.png" alt="" className="h-16 w-auto sm:h-20" />
        <p className="mt-1 mb-4 font-serif text-2xl font-semibold tracking-wide sm:text-3xl">Studious AI</p>
        <h1 className="max-w-3xl font-serif text-[1.7rem] leading-[1.15] font-semibold sm:text-4xl">
          Your masterclass for every class.
        </h1>
        <p className="mt-3 font-serif text-xl font-semibold italic text-teal sm:text-2xl">Get Studious!</p>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-cream/80 sm:text-[15px]">
          Turn notes, PDFs, lectures, and photos into one place to learn: study notes, a lecture you can listen to,
          flash cards, and a quiz. Built for mastery — not a shortcut around the work.
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <Link
            to="/signup"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cream px-6 text-sm font-semibold text-slate-dark hover:bg-white sm:w-44"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-teal px-6 text-sm font-semibold text-teal hover:bg-teal hover:text-white sm:w-44"
          >
            Log in
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setShowAppInfo(true)}
          className="mt-4 text-xs font-medium text-cream/70 underline decoration-cream/40 underline-offset-2 hover:text-cream"
        >
          App Info
        </button>
      </main>
      <footer className="relative z-10 px-6 py-3 text-center text-[11px] text-cream/40">
        Notes · Audio · Flash cards · Quiz · Classical
      </footer>

      {showOverview && (
        <InfoModal title="What Studious AI is" onClose={() => setShowOverview(false)}>
          <p>
            Studious AI is an organization and learning tool. People learn in different ways — reading, listening,
            reciting, testing themselves, narrating back — and class material arrives in many forms. This app gathers
            those materials into one place and turns them into study tools you can actually use.
          </p>
          <p className="font-medium text-fg">You can upload almost anything from the course:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Typed notes and OneNote exports</li>
            <li>Handwritten notes, drawings, and scanned pages</li>
            <li>Photos of blackboards and whiteboards</li>
            <li>Audio lectures and transcripts</li>
            <li>Digital PDFs, textbooks chapters, and PowerPoints</li>
            <li>Syllabus files for dates and assignments</li>
            <li>Short videos and other class resources</li>
          </ul>
          <p>
            From those sources, Studious builds comprehensive study notes, listen-while-you-work audio, flash cards, and
            quizzes. Optional Classical mode adds memory-work, narration (tell-back), Socratic practice, and a
            commonplace — habits aimed at mastery, not only test-passing.
          </p>
          <p>
            It does not write papers for you or replace thinking. It organizes the course and helps you learn the
            material deeply across different modes of study.
          </p>
        </InfoModal>
      )}

      {showAppInfo && (
        <InfoModal title="App Info" onClose={() => setShowAppInfo(false)}>
          <p>
            <strong>Studious AI</strong> turns class materials into a study package: notes, audio, flash cards, and a
            quiz — in one place.
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted">
            <li>Create an account and set up your profile (school colors optional).</li>
            <li>Add a class with code, professor, and syllabus if you have them.</li>
            <li>Upload a chapter’s notes, PDFs, photos, or lecture audio.</li>
            <li>Generate materials, then study by reading, listening, cards, or quiz.</li>
            <li>Use Combine for midterms/finals, Custom Focus for weak areas, or Classical mode for deeper practice.</li>
          </ol>
          <p className="text-xs text-muted">Goal: simplicity, organization, and real mastery of the course.</p>
        </InfoModal>
      )}
    </div>
  );
}
