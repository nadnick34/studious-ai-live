import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FolderPlus,
  GraduationCap,
  Layers,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getProfile } from "@/lib/data";

type Slide = {
  title: string;
  kicker: string;
  points: string[];
  icon: typeof BookOpen;
  art: "logo" | "owl";
};

const ADULT: Slide[] = [
  {
    kicker: "Welcome",
    title: "Your masterclass for every class",
    points: ["Notes, lectures, photos, and homework in one place.", "Turn a messy pile into a study pack you can use."],
    icon: Sparkles,
    art: "logo",
  },
  {
    kicker: "Profile",
    title: "This page runs the rest of the app",
    points: ["School colors, grade, and role change what you see.", "Update Profile anytime — features follow that setup."],
    icon: UserRound,
    art: "logo",
  },
  {
    kicker: "Classes",
    title: "One class. Then a chapter.",
    points: ["New class → name, code, professor, syllabus.", "New chapter → PDF, photo, scan, or lecture audio.", "Studious builds notes, audio, cards, and a quiz."],
    icon: FolderPlus,
    art: "logo",
  },
  {
    kicker: "Study",
    title: "Learn it. Don’t just pass it.",
    points: ["Read the notes. Listen while you move.", "Flip cards. Take the quiz. Try Classical if you want narration."],
    icon: BookOpen,
    art: "logo",
  },
  {
    kicker: "Homework",
    title: "Assignment Assist has your back",
    points: ["Upload the sheet, your finished work, or both.", "Review → check your work → Extra Mile when it helps."],
    icon: ClipboardCheck,
    art: "logo",
  },
  {
    kicker: "Pull it together",
    title: "Study Guide and Prep",
    points: ["Study Guide groups chapters and assignment returns.", "Use Exclusions to leave something out.", "Practicum & Prep tracks tests and real-world skills."],
    icon: Layers,
    art: "logo",
  },
];

const KIDS: Slide[] = [
  {
    kicker: "Hi there",
    title: "Meet your study buddy",
    points: ["We take class pages and turn them into notes and practice.", "Ready for a quick look around?"],
    icon: Sparkles,
    art: "owl",
  },
  {
    kicker: "Profile",
    title: "Your backpack",
    points: ["Colors and kid mode live in Profile.", "Ask a grown-up if you need to change something."],
    icon: UserRound,
    art: "owl",
  },
  {
    kicker: "Classes",
    title: "A class is a folder",
    points: ["Tap New class for each subject.", "Add a chapter. Snap a picture or upload a page.", "We’ll make a study pack from it."],
    icon: FolderPlus,
    art: "owl",
  },
  {
    kicker: "Study",
    title: "Read, listen, practice",
    points: ["Look at the notes. Listen if you want.", "Flip cards. Try the quiz. Take your time."],
    icon: BookOpen,
    art: "owl",
  },
  {
    kicker: "Homework",
    title: "Need a hand?",
    points: ["Assignment Assist looks at the worksheet.", "It cheers what you got right and shows what to fix."],
    icon: ClipboardCheck,
    art: "owl",
  },
  {
    kicker: "Almost done",
    title: "Study Guide and Prep",
    points: ["Study Guide can bundle chapters together.", "Prep is extra practice for tests and life skills."],
    icon: GraduationCap,
    art: "owl",
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
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex h-[min(640px,92dvh)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:h-auto sm:rounded-3xl">
        <div className="relative h-44 shrink-0 overflow-hidden sm:h-52">
          <img src="/library-bg.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-black/25 to-black/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            {slide.art === "owl" ? (
              <img src="/owl-boy.jpg" alt="" className="h-28 w-28 rounded-full object-cover ring-4 ring-white/80 shadow-lg" />
            ) : (
              <img src="/logo.png" alt="" className="h-20 w-auto drop-shadow-lg" />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-teal/15 text-teal">
              <Icon className="size-4" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">{slide.kicker}</p>
          </div>
          <h2 className="font-serif text-[1.55rem] leading-tight text-fg">{slide.title}</h2>
          <ul className="mt-4 space-y-2.5">
            {slide.points.map((line) => (
              <li key={line} className="flex gap-2.5 text-[15px] leading-snug text-fg/85">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-4 pt-8">
            <div className="flex items-center justify-center gap-1.5">
              {slides.map((_, n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Step ${n + 1}`}
                  onClick={() => setI(n)}
                  className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-teal" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="text-sm text-muted hover:text-fg" onClick={onClose}>
                Skip
              </button>
              {i > 0 && (
                <button type="button" className="text-sm text-muted hover:text-fg" onClick={() => setI((n) => n - 1)}>
                  Back
                </button>
              )}
              <Button className="ml-auto min-w-[9.5rem]" onClick={() => (last ? onClose() : setI((n) => n + 1))}>
                {last ? "Let's get studious!" : "Next"}
              </Button>
            </div>
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
