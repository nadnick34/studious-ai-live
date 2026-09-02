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
      "Your masterclass for every class. Gather what the course already gave you and study it in more than one way.",
    does: [
      "Compile notes, PDFs, photos, scans, and lecture audio into one study packet.",
      "Read comprehensive notes, listen while you work out, flip flash cards, and take a quiz.",
      "Classical mode, assignment check, Practicum & Prep, and college comparison when you need them.",
    ],
    how: [
      "Create an account and set Student in your profile.",
      "Add a class and a chapter.",
      "Upload notes, photos, or audio, then generate.",
      "Study the packet. Combine chapters for a midterm or final.",
    ],
    icon: (
      <svg viewBox="0 0 64 64" className="mx-auto h-12 w-12" fill="none" stroke="#e8d7a8" strokeWidth="1.6">
        <path d="M8 28 L32 16 L56 28 L32 40 Z" />
        <path d="M16 32 v10 c8 6 24 6 32 0 V32" />
        <path d="M50 30 v14" />
        <path d="M50 44 h4" />
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
      <svg viewBox="0 0 64 64" className="mx-auto h-12 w-12" fill="none" stroke="#e8d7a8" strokeWidth="1.6">
        <path d="M32 14 c4 8 6 12 6 16 a6 6 0 1 1 -12 0 c0-4 2-8 6-16 Z" />
        <path d="M26 36 c-8 2 -12 8 -12 14 h36 c0-6-4-12-12-14" />
        <path d="M22 28 h20" />
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
      <svg viewBox="0 0 64 64" className="mx-auto h-12 w-12" fill="none" stroke="#e8d7a8" strokeWidth="1.6">
        <rect x="10" y="24" width="44" height="28" rx="3" />
        <path d="M22 24 v-4 a10 6 0 0 1 20 0 v4" />
        <path d="M10 34 h44" />
      </svg>
    ),
  },
];

const glass =
  "border border-[#e8d7a8]/35 bg-[rgba(12,18,32,0.28)] shadow-[inset_0_1px_0_rgba(232,215,168,0.28),0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-[10px]";

function Landing() {
  const { user } = useCurrentUserState();
  const [showOverview, setShowOverview] = useState(false);
  const [edition, setEdition] = useState<(typeof EDITIONS)[number] | null>(null);

  if (user) return <RoleHomeRedirect />;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#2a2018] text-[#f4ead6]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/20" aria-hidden />

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-4 py-10">
        <section className={`w-full max-w-3xl rounded-[28px] px-6 py-10 text-center sm:px-14 sm:py-12 ${glass}`}>
          <img src="/hero-mark.png" alt="" className="mx-auto h-[4.25rem] w-auto sm:h-20" />
          <h1 className="mt-5 font-serif text-[1.85rem] leading-[1.12] font-semibold text-[#f4ead6] sm:text-[2.6rem]">
            Your masterclass
            <br className="hidden sm:block" /> for every class
          </h1>
          <p className="mt-4 font-serif text-xl italic text-[#e8d7a8] sm:text-2xl">
            <span className="mx-3 inline-block h-px w-8 align-middle bg-[#e8d7a8]/50" />
            Get Studious!
            <span className="mx-3 inline-block h-px w-8 align-middle bg-[#e8d7a8]/50" />
          </p>
          <p className="mx-auto mt-4 max-w-lg text-[13px] leading-relaxed text-[#f4ead6]/85 sm:text-sm">
            Notes, lectures, and photos become one study place: a packet you can read, hear, quiz, and master.
          </p>
          <button
            type="button"
            onClick={() => setShowOverview(true)}
            className="mt-2 text-xs tracking-wide text-[#e8d7a8]/85 underline decoration-[#e8d7a8]/40 underline-offset-4"
          >
            More info
          </button>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#c9a24a] px-8 text-sm font-semibold text-[#1a1510] hover:bg-[#e8d7a8]"
            >
              Login →
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e8d7a8]/70 px-8 text-sm font-semibold text-[#e8d7a8] hover:bg-[#e8d7a8]/10"
            >
              Create Path →
            </Link>
          </div>
        </section>

        <div className="mt-5 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {EDITIONS.map((ed) => (
            <button
              key={ed.id}
              type="button"
              onClick={() => setEdition(ed)}
              className={`rounded-2xl px-4 py-6 text-center transition hover:border-[#e8d7a8]/60 ${glass}`}
            >
              {ed.icon}
              <h2 className="mt-3 font-serif text-lg text-[#f4ead6]">{ed.name}</h2>
              <p className="mt-1 text-[12px] text-[#e8d7a8]/80">{ed.tag}</p>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-[10px] tracking-[0.14em] text-[#e8d7a8]/70">
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
            It does not write papers for you. It is built so the content is learned — reading, listening, reciting,
            testing — not so a test is merely passed.
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
          <div className="flex gap-2 pt-1">
            <Link to="/signup" className="inline-flex min-h-10 items-center rounded-lg bg-teal px-4 text-sm font-semibold text-white">
              Create Path
            </Link>
            <Link to="/login" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm">
              Login
            </Link>
          </div>
        </InfoModal>
      )}
    </div>
  );
}
