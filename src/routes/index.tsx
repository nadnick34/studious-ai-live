import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoModal } from "@/components/info-modal";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RoleHomeRedirect } from "@/components/role-home-redirect";
import { isThemePlaying, playLandingTheme, stopTheme } from "@/lib/theme-audio";

export const Route = createFileRoute("/")({ component: Landing });

function Step({ n, title, detail }: { n: string; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="grid size-8 place-items-center rounded-full bg-teal/15 text-sm font-semibold text-teal">{n}</span>
      <h3 className="mt-3 font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm text-fg/75">{detail}</p>
    </div>
  );
}

function Edition({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold text-fg">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-fg/80">
        {points.map((point) => (
          <li key={point}>• {point}</li>
        ))}
      </ul>
    </div>
  );
}

function Landing() {
  const { user } = useCurrentUserState();
  const [showOverview, setShowOverview] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (user || muted) {
      stopTheme();
      return;
    }
    playLandingTheme();
    const kick = () => {
      if (!isThemePlaying()) playLandingTheme();
    };
    window.addEventListener("pointerdown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      stopTheme();
    };
  }, [user, muted]);

  if (user) return <RoleHomeRedirect />;

  return (
    <div className="relative min-h-dvh bg-white text-fg">
      <button
        type="button"
        onClick={() => setMuted((v) => !v)}
        className="absolute right-4 top-4 z-20 rounded-full border border-border px-3 py-1 text-xs text-fg"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-6 py-16 text-center">
        <img src="/logo.png" alt="Studious AI" width={247} height={77} className="h-[77px] w-[247px] max-w-full" />
        <h1 className="mt-6 text-3xl font-bold leading-tight text-fg sm:text-4xl">Your masterclass for every class</h1>
        <p className="mt-3 max-w-md text-base text-fg/80">Get Studious. Turn class material into notes, audio, flash cards, and quizzes.</p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Link to="/login" className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white">
            Login
          </Link>
          <Link to="/signup" className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-fg">
            Create account
          </Link>
        </div>
        <button type="button" onClick={() => setShowOverview(true)} className="mt-4 text-sm text-teal underline underline-offset-4">
          More info
        </button>
        <section className="mt-14 w-full text-left">
          <h2 className="text-center text-lg font-semibold text-fg">How it works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Step n="1" title="Upload" detail="Slides, PDFs, photos, or a syllabus." />
            <Step n="2" title="Study" detail="Notes, listen-back audio, cards, quizzes." />
            <Step n="3" title="Check" detail="Homework guidance and paper feedback." />
          </div>
        </section>
        <section className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
          <Edition title="Students" points={["Every class in its own folder", "Assignment Assistant and Paper Grade", "Kids Mode with Hoot and Hootie"]} />
          <Edition title="Teachers" points={["Grading lives by your curriculum", "Class analytics at a glance", "Scriptorium for score and handouts"]} />
          <Edition title="Professionals" points={["Meeting notes and action items", "Projects with plans and timelines", "Kept separate from student data"]} />
        </section>
        <p className="mt-12 text-xs text-fg/70">Created by The Nickersonian Institute for Excellence</p>
      </main>
      {showOverview && (
        <InfoModal title="What Studious AI is" onClose={() => setShowOverview(false)}>
          <p>Notes, photos, scans, and lecture audio go in one place. Studious turns them into notes, key terms, cards, and a quiz.</p>
          <p>Built for mastery, not just tests. It does not write the paper for you.</p>
        </InfoModal>
      )}
    </div>
  );
}
