import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
      "Add a class (syllabus if you have it) and a chapter.",
      "Upload notes, photos, or audio, then generate.",
      "Study the packet. Combine chapters for a midterm or final.",
    ],
  },
  {
    id: "teacher",
    name: "Teacher",
    tag: "Inspire & educate",
    title: "Teacher edition",
    summary:
      "Less time grading stacks. More time seeing who understood the lesson and who did not.",
    does: [
      "Keep a roster, class average, and per-student picture of strengths and gaps.",
      "Upload a test key and a batch of student work; map scores back to the roster.",
      "Scriptorium writes study guides, quizzes, and tests. Prep tracks an exam without tying it to one section.",
    ],
    how: [
      "Create an account and set Teacher in your profile.",
      "Add a class and roster (or upload the syllabus packet).",
      "Use Scan tests when you have a key and a stack.",
      "Open Scriptorium or Prep when you need materials or a coverage plan.",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tag: "Advance your work",
    title: "Professional edition",
    summary:
      "Meetings and projects in a quieter charcoal skin — notes, owners, and dates in one place.",
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
  },
];

function Landing() {
  const { user } = useCurrentUserState();
  const [showOverview, setShowOverview] = useState(false);
  const [edition, setEdition] = useState<(typeof EDITIONS)[number] | null>(null);

  if (user) return <RoleHomeRedirect />;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#120e0a] text-cream">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#0b1220]/60" aria-hidden />

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-4 py-10">
        <section className="w-full max-w-3xl rounded-3xl border border-[#e8d7a8]/25 bg-[#0b1220]/45 px-6 py-10 text-center shadow-[inset_1px_1px_0_rgba(232,215,168,0.18),0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-12 sm:py-12">
          <img src="/hero-mark.png" alt="" className="mx-auto h-16 w-auto sm:h-[4.25rem]" />
          <p className="mt-2 font-serif text-2xl font-semibold tracking-[0.2em] text-[#e8d7a8] sm:text-3xl">STUDIOUS</p>
          <h1 className="mt-5 font-serif text-[1.7rem] leading-[1.15] font-semibold text-[#f4ead6] sm:text-4xl">
            Your masterclass for every class.
          </h1>
          <p className="mt-3 font-serif text-xl italic text-[#e8d7a8] sm:text-2xl">Get Studious!</p>
          <p className="mx-auto mt-4 max-w-lg text-[13px] leading-relaxed text-cream/80 sm:text-sm">
            Notes, lectures, and photos become one study place: a packet you can read, hear, quiz, and master.
          </p>
          <button
            type="button"
            onClick={() => setShowOverview(true)}
            className="mt-2 text-xs tracking-wide text-[#e8d7a8]/80 underline decoration-[#e8d7a8]/35 underline-offset-4"
          >
            More info
          </button>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#e8d7a8] px-8 text-sm font-semibold text-[#1a1510] hover:bg-[#f4ead6]"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#e8d7a8]/70 px-8 text-sm font-semibold text-[#e8d7a8] hover:bg-[#e8d7a8]/10"
            >
              Create Path
            </Link>
          </div>
        </section>

        <div className="mt-6 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {EDITIONS.map((ed) => (
            <button
              key={ed.id}
              type="button"
              onClick={() => setEdition(ed)}
              className="rounded-2xl border border-[#e8d7a8]/25 bg-[#0b1220]/45 px-4 py-5 text-center shadow-[inset_1px_1px_0_rgba(232,215,168,0.14)] backdrop-blur-xl hover:border-[#e8d7a8]/50 hover:bg-[#0b1220]/60"
            >
              <h2 className="font-serif text-base font-semibold text-[#e8d7a8]">{ed.name}</h2>
              <p className="mt-1 text-[11px] text-cream/65">{ed.tag}</p>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-[10px] tracking-[0.12em] text-[#e8d7a8]/55">
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
            <Link
              to="/signup"
              className="inline-flex min-h-10 items-center rounded-lg bg-teal px-4 text-sm font-semibold text-white"
            >
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
