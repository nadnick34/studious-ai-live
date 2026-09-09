import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getProfile } from "@/lib/data";

type Slide = { title: string; body: string[] };

const ADULT: Slide[] = [
  {
    title: "Welcome to Studious",
    body: [
      "This is your masterclass for every class — one place for notes, lectures, photos, and homework.",
      "A few taps from here to a study packet you can actually use.",
    ],
  },
  {
    title: "Your profile drives the tools",
    body: [
      "School colors, grade, and student vs teacher change what you see.",
      "Open Profile anytime to update school, level, and how you study.",
    ],
  },
  {
    title: "Add a class, then a chapter",
    body: [
      "New class → name, code, professor, syllabus if you have it.",
      "Inside the class, New chapter. Upload PDFs, photos, scans, or lecture audio.",
      "Studious reads what you gave it and builds notes, audio, flash cards, and a quiz.",
    ],
  },
  {
    title: "Study to master it",
    body: [
      "Read the notes. Listen while you work out. Flip cards. Take the quiz.",
      "Classical mode is there if you want narration and memory work.",
      "The point is to learn the material — not just survive the test.",
    ],
  },
  {
    title: "Assignment Assist",
    body: [
      "Upload the instructions, your finished work, or both.",
      "You get a review of what to do, a check of what you turned in, and an Extra Mile if it applies.",
    ],
  },
  {
    title: "Study Guide + Prep",
    body: [
      "Study Guide groups chapters and assignment returns into one packet. Use Exclusions to leave something out.",
      "Practicum & Prep is for tests and real-world skills on their own track.",
      "You can replay this tour from any Info (i) button.",
    ],
  },
];

const KIDS: Slide[] = [
  {
    title: "Hi! Let’s get Studious",
    body: [
      "This is your study buddy. We take class stuff and turn it into notes, pictures, and practice.",
      "Ready for a quick tour?",
    ],
  },
  {
    title: "Your profile is your backpack",
    body: [
      "Colors, name, and kid mode live in Profile.",
      "Ask a grown-up if you need to change anything.",
    ],
  },
  {
    title: "A class is a folder",
    body: [
      "Tap New class for each subject.",
      "Then add a chapter. Snap a picture of notes or upload a page.",
      "We’ll make a study pack from it.",
    ],
  },
  {
    title: "How you study",
    body: [
      "Read. Listen. Flip cards. Try the quiz.",
      "Take your time — the goal is to understand, not rush.",
    ],
  },
  {
    title: "Homework help",
    body: [
      "Assignment Assist looks at the worksheet and your answers.",
      "It cheers what you got right and shows what to fix.",
    ],
  },
  {
    title: "Study Guide and Prep",
    body: [
      "Study Guide can bundle chapters together.",
      "Prep is extra practice for tests and life skills.",
      "Tap the i button later if you want this tour again.",
    ],
  },
];

function keyFor(id: string) {
  return `studious-tutorial-${id}`;
}

export function useStudentTutorial() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    void getProfile()
      .then((p) => {
        if (!live) return;
        if (p.role && p.role !== "student") return;
        setKids(Boolean(p.kidsMode || p.forChild || (p.childAge != null && p.childAge <= 9)));
        const seen = localStorage.getItem(keyFor(user.id));
        const fresh = localStorage.getItem("studious-show-tutorial") === "1";
        if (!seen || fresh) {
          setOpen(true);
          try {
            localStorage.removeItem("studious-show-tutorial");
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user?.id]);

  function close() {
    if (user?.id) {
      try {
        localStorage.setItem(keyFor(user.id), "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  return { open, kids, start: () => setOpen(true), close };
}

export function StudentTutorial({
  open,
  kids,
  onClose,
}: {
  open: boolean;
  kids: boolean;
  onClose: () => void;
}) {
  const slides = kids ? KIDS : ADULT;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (open) setI(0);
  }, [open]);
  if (!open) return null;
  const slide = slides[i];
  const last = i === slides.length - 1;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6 ${kids ? "kids-mode" : ""}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal">
          {kids ? "Quick tour" : "Student tour"} · {i + 1}/{slides.length}
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-fg">{slide.title}</h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-fg/90">
          {slide.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button type="button" className="text-xs text-muted hover:text-fg" onClick={onClose}>
            Skip
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <Button variant="secondary" onClick={() => setI((n) => n - 1)}>
                Back
              </Button>
            )}
            <Button onClick={() => (last ? onClose() : setI((n) => n + 1))}>{last ? "Let’s go" : "Next"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialButton({ onClick, kids }: { onClick: () => void; kids?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 w-full rounded-lg border border-teal/40 bg-teal/10 px-3 py-2 text-sm font-medium text-teal hover:bg-teal/20"
    >
      {kids ? "Play the tour again" : "Launch the student tutorial"}
    </button>
  );
}
