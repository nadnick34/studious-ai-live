import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { InfoModal } from "@/components/info-modal";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RoleHomeRedirect } from "@/components/role-home-redirect";

export const Route = createFileRoute("/")({ component: Landing });

const EDITIONS: {
  id: "student" | "teacher" | "professional";
  name: string;
  tag: string;
  title: string;
  summary: string;
  does: string[];
  how: string[];
  icon: ReactNode;
}[] = [
  {
    id: "student",
    name: "Student",
    tag: "Academic excellence",
    title: "Student edition",
    summary:
      "Your masterclass for every class. Gather what the course already gave you and study it in more than one way. Built for mastery, not just tests.",
    does: [
      "Compile notes, PDFs, photos, scans, and lecture audio into one study packet.",
      "Read comprehensive notes, listen while you work out, flip flash cards, and take a quiz.",
      "Assignment Assistant: upload the instructions and/or finished work. Get a review of what to do, an assessment of the completed work (what looks good and what to fix), and Extra Mile suggestions. Print or share that feedback as a PDF.",
      "Classical mode, Practicum & Prep, and college comparison when you need them.",
    ],
    how: [
      "Create an account and set Student in your profile.",
      "Add a class and a chapter.",
      "Upload notes, photos, or audio, then generate.",
      "Use Assignment Assistant from the class menu when you have homework to plan or check.",
      "Study the packet. Combine chapters for a midterm or final.",
    ],
    icon: (
      <svg viewBox="0 0 64 64" className="mx-auto h-9 w-9 sm:h-12 sm:w-12" fill="none" stroke="#e8d7a8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 28 L32 14 L56 28 L32 42 Z" />
        <path d="M18 33 v9 c7 5 21 5 28 0 v-9" />
        <path d="M50 31 v16" />
        <path d="M50 47 h5" />
      </svg>
    ),
  },
  {
    id: "teacher",
    name: "Teacher",
    tag: "Inspire & educate",
    title: "Teacher edition",
    summary: "Less time grading stacks. More time seeing who understood the lesson and who did not.",
    does: [
      "Keep a roster, class average, and per-student picture of strengths and gaps.",
      "Upload a test key and a batch of student work; map scores back to the roster.",
      "Scriptorium writes study guides, quizzes, and tests. Prep tracks an exam without tying it to one section.",
    ],
    how: [
      "Create an account and set Teacher in your profile.",
      "Add a class and roster.",
      "Use Scan tests when you have a key and a stack.",
      "Open Scriptorium or Prep when you need materials or a coverage plan.",
    ],
    icon: (
      <svg viewBox="0 0 64 64" className="mx-auto h-9 w-9 sm:h-12 sm:w-12" fill="none" stroke="#e8d7a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 18 v8" />
        <path d="M32 18 c6-1 10 3 11 8" />
        <path d="M24 26 c-8 2-12 10-12 18 c0 10 7 16 20 16 c13 0 20-6 20-16 c0-8-4-16-12-18 c-2 6-8 6-16 0 Z" />
      </svg>
    ),
  },
  {
    id: "professional",
    name: "Professional",
    tag: "Advance your career",
    title: "Professional edition",
    summary: "Meetings and projects in a quieter charcoal skin — notes, owners, and dates in one place.",
    does: [
      "Log meetings by type with agenda, attendees, and files.",
      "Get notes, focus items, and action items with who owes what.",
      "Group meetings into a project with a Gantt you can print.",
    ],
    how: [
      "Create an account and set Professional in your profile.",
      "Add a meeting. Upload the invite or agenda if you have it.",
      "Generate the packet, then check action items.",
      "Open Projects to group work and watch the timeline.",
    ],
    icon: (
      <svg viewBox="0 0 64 64" className="mx-auto h-9 w-9 sm:h-12 sm:w-12" fill="none" stroke="#e8d7a8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="24" width="44" height="28" rx="3" />
        <path d="M24 24 v-5 a8 5 0 0 1 16 0 v5" />
        <path d="M10 34 h44" />
      </svg>
    ),
  },
];

const glass =
  "border border-[#f0e2b8]/45 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md";

function Landing() {
  const { user } = useCurrentUserState();
  const [showOverview, setShowOverview] = useState(false);
  const [edition, setEdition] = useState<(typeof EDITIONS)[number] | null>(null);

  if (user) return <RoleHomeRedirect />;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#4a3a2a] text-[#f4ead6]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center brightness-125 contrast-105 saturate-110"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#3b2a18]/15" aria-hidden />

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center gap-3 px-3 py-4 sm:gap-5 sm:px-4 sm:py-10">
        <section className={`w-full max-w-3xl rounded-2xl px-4 py-4 text-center sm:rounded-[28px] sm:px-14 sm:py-12 ${glass}`}>
          <p className="font-serif text-[11px] font-semibold tracking-[0.22em] text-[#e8d7a8] sm:text-sm">STUDIOUS AI</p>
          <img src="/hero-mark.png" alt="" className="mx-auto mt-1 h-12 w-auto sm:mt-3 sm:h-20" />
          <h1 className="mt-2 font-serif text-[1.35rem] leading-[1.12] font-semibold text-[#f7f0dc] sm:mt-5 sm:text-[2.6rem]">
            Your masterclass for every class
          </h1>
          <p className="mt-1 font-serif text-base italic text-[#e8d7a8] sm:mt-4 sm:text-2xl">Get Studious!</p>
          <p className="mx-auto mt-1 hidden max-w-lg text-sm leading-relaxed text-[#f4ead6]/90 sm:mt-4 sm:block">
            Notes, lectures, and photos become one study place: a packet you can read, hear, quiz, and master.
          </p>
          <button
            type="button"
            onClick={() => setShowOverview(true)}
            className="mt-1 text-[11px] tracking-wide text-[#e8d7a8] underline decoration-[#e8d7a8]/50 underline-offset-4 sm:mt-2 sm:text-xs"
          >
            More info
          </button>
          <div className="mx-auto mt-3 grid w-full max-w-xs grid-cols-2 gap-2 sm:mt-8 sm:max-w-md sm:gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#c9a24a] px-3 text-xs font-semibold text-[#1a1510] hover:bg-[#e8d7a8] sm:h-11 sm:text-sm"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e8d7a8] px-3 text-xs font-semibold text-[#e8d7a8] hover:bg-[#e8d7a8]/10 sm:h-11 sm:text-sm"
            >
              Create Path
            </Link>
          </div>
        </section>

        <div className="grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-3">
          {EDITIONS.map((ed) => (
            <button
              key={ed.id}
              type="button"
              onClick={() => setEdition(ed)}
              className={`rounded-xl px-1.5 py-3 text-center sm:rounded-2xl sm:px-4 sm:py-6 ${glass}`}
            >
              {ed.icon}
              <h2 className="mt-1 font-serif text-[12px] text-[#f7f0dc] sm:mt-3 sm:text-lg">{ed.name}</h2>
              <p className="mt-0.5 hidden text-[12px] text-[#e8d7a8]/85 sm:block">{ed.tag}</p>
            </button>
          ))}
        </div>

        <p className="mt-1 pb-[env(safe-area-inset-bottom)] sm:mt-6 text-center text-[9px] tracking-[0.12em] text-[#e8d7a8]/80 sm:mt-8 sm:text-[10px]">
          created by The Nickersonian Institute for Excellence
        </p>
      </main>

      {showOverview && (
        <InfoModal title="What Studious AI is" onClose={() => setShowOverview(false)}>
          <p>
            Studious AI is an organization and learning tool. Material arrives as notes, photos, slides, audio, and
            PDFs. The app puts those in one place and turns them into tools you can actually study with.
          </p>
          <p>
            Built for mastery, not just tests. It does not write papers for you. You read, listen, recite, and check
            yourself until the material is actually learned.
          </p>
        </InfoModal>
      )}

      {edition && (
        <InfoModal title={edition.title} onClose={() => setEdition(null)}>
          <p>{edition.summary}</p>
          <p className="font-medium text-fg">What it does</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            {edition.does.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="font-medium text-fg">How to use it</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted">
            {edition.how.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm">
              Login
            </Link>
            <Link to="/signup" className="inline-flex h-10 items-center justify-center rounded-lg bg-teal text-sm font-semibold text-white">
              Create Path
            </Link>
          </div>
        </InfoModal>
      )}
    </div>
  );
}
