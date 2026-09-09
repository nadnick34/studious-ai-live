import { useEffect, useState } from "react";
import {
  BookOpen,
  Camera,
  ClipboardCheck,
  FileUp,
  FolderPlus,
  GraduationCap,
  Layers,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getProfile } from "@/lib/data";
import { playTheme, stopTheme } from "@/lib/theme-audio";

type Slide = {
  id: string;
  kicker: string;
  title: string;
  why: string;
  points: string[];
  icon: typeof BookOpen;
  motion: "welcome" | "profile" | "upload" | "study" | "homework" | "guide";
  diveTitle: string;
  dive: { heading: string; items: string[] }[];
};

const ADULT: Slide[] = [
  {
    id: "welcome",
    kicker: "Welcome",
    title: "Studious is your study desk",
    why: "Use it whenever class material is scattered — notes, photos, slides, audio, and homework — and you want one place that turns that pile into something you can actually study.",
    points: [
      "Keep every course in its own class folder.",
      "Drop in whatever you already have. You do not have to type it again.",
      "Get notes, listen-along audio, flash cards, and a quiz from the same upload.",
    ],
    icon: Sparkles,
    motion: "welcome",
    diveTitle: "What Studious is for",
    dive: [
      {
        heading: "Use it when",
        items: [
          "You took messy notes in class and want them cleaned up.",
          "You photographed the board or a textbook page.",
          "You have a lecture recording and no time to re-listen at a desk.",
          "A chapter is coming on a test and the material lives in three different files.",
        ],
      },
      {
        heading: "What it is not",
        items: [
          "It does not write your papers or take the test for you.",
          "It organizes, explains, and quizzes so you master the course.",
        ],
      },
    ],
  },
  {
    id: "profile",
    kicker: "Profile",
    title: "Set your profile first",
    why: "The profile is the control panel. School, grade, and student vs teacher change colors, tools, and how hard generated material is.",
    points: [
      "Tap your name or photo in the left bar to open Profile.",
      "Pick school colors, grade or college year, and student / teacher.",
      "Kid profiles (age 9 and under) get a simpler layout and friendlier language.",
    ],
    icon: UserRound,
    motion: "profile",
    diveTitle: "How the profile drives the app",
    dive: [
      {
        heading: "What to fill in",
        items: [
          "School or custom colors so the app matches your campus.",
          "Education level and classification (freshman, 8th grade, and so on).",
          "State and school type if you will use Prep / test tracks.",
          "A photo is optional. Initials show if you skip it.",
        ],
      },
      {
        heading: "Why it matters",
        items: [
          "Prep checklists and reading lists follow grade and date.",
          "Kid mode changes type, colors, and how notes are written.",
          "Teacher vs student sends you to a different home screen.",
        ],
      },
    ],
  },
  {
    id: "upload",
    kicker: "Classes & chapters",
    title: "Make a class, then feed it a chapter",
    why: "A class is the course. A chapter is one unit — Chapter 3, Week 2, or Tuesday’s lecture. Upload first. Generate second.",
    points: [
      "Classes → New class. Name, code, professor, syllabus if you have one.",
      "Open the class → New chapter. Name it clearly (Chapter 2 – Cells).",
      "Upload PDF, photo, scan, slides, or lecture audio. Then tap Generate.",
    ],
    icon: FolderPlus,
    motion: "upload",
    diveTitle: "What you can upload, and when",
    dive: [
      {
        heading: "Good uploads",
        items: [
          "Typed or handwritten notes, even a phone photo of a notebook.",
          "Syllabus and assignment sheets (dates show on the class card).",
          "Textbook pages or a chapter PDF.",
          "PowerPoint / slides and photos of the board.",
          "Lecture audio or a voice memo from class.",
        ],
      },
      {
        heading: "Tips",
        items: [
          "Clear, well-lit photos read better than dark or tilted shots.",
          "Long lectures work better if you also have slides or notes.",
          "Do not hit Generate with an empty chapter — add at least one file.",
          "You can add more files later and generate again.",
        ],
      },
    ],
  },
  {
    id: "study",
    kicker: "Study",
    title: "Use every mode — they teach differently",
    why: "The packet is for mastery. Pick the mode that matches how you learn that day.",
    points: [
      "Notes — read the organized study sheet (print if you want).",
      "Audio — play it walking, driving, or in the gym.",
      "Flash cards and Quiz — test yourself. Classical mode if you want narration and memory work.",
    ],
    icon: BookOpen,
    motion: "study",
    diveTitle: "How to study with what it makes",
    dive: [
      {
        heading: "A simple weekly loop",
        items: [
          "Day of class: upload notes or audio that night.",
          "Next morning: listen to the audio once.",
          "Before the next lecture: flip cards, then take the quiz.",
          "Before a test: Study Guide across the chapters you marked.",
        ],
      },
      {
        heading: "Modes people forget",
        items: [
          "Focus Mode — ask it to go deeper on the one section you missed.",
          "Classical (laurel) — tell-back, outline from memory, Socratic cards.",
          "Print / PDF on notes when you want paper.",
        ],
      },
    ],
  },
  {
    id: "homework",
    kicker: "Homework",
    title: "Assignment Assist before and after you work",
    why: "Use it when you are stuck on directions, or when you want a second look before you turn something in.",
    points: [
      "Open the class menu (three dots) → Assignment Assist.",
      "Upload the blank sheet, your finished work, or both in the same box.",
      "Read Review, Completed Work Assessment, then Extra Mile.",
    ],
    icon: ClipboardCheck,
    motion: "homework",
    diveTitle: "When to use Assignment Assist",
    dive: [
      {
        heading: "Before you start",
        items: [
          "Upload only the instructions. The Review tells you what is being asked, with a short how-to and an example.",
          "Assessment will say TBD until you add finished work.",
        ],
      },
      {
        heading: "After you finish",
        items: [
          "Add the completed page. Assessment flags what looks right and the exact items to fix.",
          "Extra Mile is extra polish. It will say N/A on a simple fill-in sheet.",
          "Print or Share only the feedback — not the original worksheet.",
        ],
      },
    ],
  },
  {
    id: "guide",
    kicker: "Guide & Prep",
    title: "Bundle units. Track the long game.",
    why: "Study Guide is for midterms and finals. Practicum & Prep is for ACT/SAT-style tests and life skills that are not tied to one class.",
    points: [
      "On a class card, tap Study Guide. Check chapters and assignment returns to include.",
      "Type anything to leave out in Exclusions.",
      "Open Prep in the left bar for test checklists and Real World skills.",
    ],
    icon: Layers,
    motion: "guide",
    diveTitle: "Study Guide and Prep in practice",
    dive: [
      {
        heading: "Study Guide",
        items: [
          "Select Chapter 1–4 plus any graded homework you want in the review.",
          "Exclude a guest lecture or a unit the professor said is not on the test.",
          "Generate one packet instead of flipping through six chapters.",
        ],
      },
      {
        heading: "Practicum & Prep",
        items: [
          "Add a card for ACT, SAT, or another test. Check items off as you cover them.",
          "Generate a short lesson from an unchecked row when you need a push.",
          "Real World covers things school skips: banking, schedules, basic safety.",
          "Replay this tour anytime from an Info (i) button.",
        ],
      },
    ],
  },
];

const KIDS: Slide[] = ADULT.map((s, idx) => {
  const kid: Slide[] = [
    {
      ...s,
      id: "welcome",
      kicker: "Hi",
      title: "This is your study buddy",
      why: "Bring class papers and pictures here. We turn them into notes and practice.",
      points: ["One folder per subject.", "Add a chapter when you get new pages.", "Then read, listen, and try the quiz."],
      diveTitle: "What we do together",
      dive: [
        { heading: "Good things to add", items: ["A photo of your notes.", "A homework page.", "A page from the book."] },
        { heading: "Remember", items: ["This helps you learn. You still do the thinking."] },
      ],
    },
    {
      ...s,
      kicker: "Profile",
      title: "Your backpack",
      why: "Profile holds your name, colors, and kid mode.",
      points: ["Tap the circle with your picture or initials.", "A grown-up can help change school or grade."],
      diveTitle: "Your backpack",
      dive: [{ heading: "Inside Profile", items: ["Your photo or initials.", "Boy or girl colors.", "Ask before changing school."] }],
    },
    {
      ...s,
      kicker: "Classes",
      title: "A class is a folder",
      why: "Math in one folder. Reading in another. Keep them separate.",
      points: ["Tap New class.", "Open it and add a chapter.", "Upload a picture, then Generate."],
      diveTitle: "Adding work",
      dive: [
        { heading: "You can add", items: ["A photo of the page.", "A PDF from a grown-up.", "A scan of the worksheet."] },
        { heading: "Then", items: ["Wait for notes, cards, and a quiz."] },
      ],
    },
    {
      ...s,
      kicker: "Study",
      title: "Read, listen, practice",
      why: "Use more than one way so it sticks.",
      points: ["Read the notes.", "Listen if you want.", "Flip cards. Try the quiz."],
      diveTitle: "Ways to practice",
      dive: [{ heading: "Pick one each day", items: ["Notes.", "Audio.", "Cards.", "Quiz."] }],
    },
    {
      ...s,
      kicker: "Homework",
      title: "Need a hand?",
      why: "Assignment Assist looks at the page and your answers.",
      points: ["Upload the worksheet.", "Add your finished page if you have it.", "Read what to fix."],
      diveTitle: "Homework help",
      dive: [{ heading: "What you will see", items: ["What the page is asking.", "What looks good.", "What to fix."] }],
    },
    {
      ...s,
      kicker: "Guide",
      title: "Study Guide and Prep",
      why: "Study Guide stacks chapters. Prep is extra practice.",
      points: ["Use Study Guide before a big test.", "Prep is in the left bar."],
      diveTitle: "Bigger tests",
      dive: [{ heading: "Before a test", items: ["Pick the chapters you studied.", "Generate one packet."] }],
    },
  ];
  return kid[idx];
});

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

function Motion({ kind }: { kind: Slide["motion"] }) {
  if (kind === "upload") {
    return (
      <div className="relative mx-auto h-28 w-44">
        <div className="absolute bottom-2 left-1/2 h-16 w-28 -translate-x-1/2 rounded-xl border-2 border-dashed border-teal/50 bg-teal/5" />
        <FileUp className="absolute bottom-6 left-1/2 size-7 -translate-x-1/2 text-teal" />
        <div className="tut-float absolute left-6 top-1 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate shadow">PDF</div>
        <div className="tut-float-delay absolute right-4 top-3 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate shadow">JPG</div>
        <Camera className="tut-float absolute right-8 top-10 size-4 text-teal" />
      </div>
    );
  }
  if (kind === "study") {
    return (
      <div className="flex h-28 items-center justify-center gap-3">
        <div className="tut-pulse rounded-xl border border-border bg-white px-3 py-2 text-center text-[11px] font-semibold text-fg shadow-sm">Notes</div>
        <div className="tut-pulse-delay rounded-xl border border-border bg-white px-3 py-2 text-center text-[11px] font-semibold text-fg shadow-sm">Audio</div>
        <div className="tut-pulse rounded-xl border border-border bg-white px-3 py-2 text-center text-[11px] font-semibold text-fg shadow-sm">Quiz</div>
      </div>
    );
  }
  if (kind === "homework") {
    return (
      <div className="relative mx-auto flex h-28 w-48 items-end justify-center gap-3 pb-2">
        <div className="h-16 w-12 rounded-md border border-border bg-white shadow-sm" />
        <div className="tut-slide h-16 w-12 rounded-md border border-teal/40 bg-teal/10 shadow-sm" />
        <ClipboardCheck className="absolute right-6 top-4 size-6 text-teal" />
      </div>
    );
  }
  return (
    <div className="flex h-24 items-center justify-center">
      <img src="/logo.png" alt="" className="h-16 w-auto" />
    </div>
  );
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
  const [dive, setDive] = useState(false);

  useEffect(() => {
    if (open) {
      setI(0);
      setDive(false);
      playTheme({ loop: true, volume: 0.32 });
    } else {
      stopTheme();
    }
    return () => stopTheme();
  }, [open]);

  if (!open) return null;
  const slide = slides[i];
  const last = i === slides.length - 1;
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/25" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center px-5 pt-4">
          <img src="/logo.png" alt="Studious AI" className="h-8 w-auto" />
        </div>

        <div className="overflow-y-auto px-6 pb-5 pt-2">
          <Motion kind={slide.motion} />
          <div className="mt-1 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-teal/15 text-teal">
              <Icon className="size-4" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">{slide.kicker}</p>
          </div>
          <h2 className="mt-2 font-serif text-[1.45rem] leading-tight text-fg">{slide.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg/80">{slide.why}</p>
          <ul className="mt-3 space-y-2">
            {slide.points.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-snug text-fg/90">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-teal hover:underline"
            onClick={() => setDive(true)}
          >
            Deeper Dive
          </button>
        </div>

        <div className="mt-auto border-t border-border px-6 py-4">
          <div className="mb-3 flex items-center justify-center gap-1.5">
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
            <Button className="ml-auto min-w-[10rem]" onClick={() => (last ? onClose() : setI((n) => n + 1))}>
              {last ? "Let's get studious!" : "Next"}
            </Button>
          </div>
        </div>
      </div>

      {dive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/35" aria-label="Close deeper dive" onClick={() => setDive(false)} />
          <div className="relative z-10 max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">{slide.kicker}</p>
                <h3 className="font-serif text-xl text-fg">{slide.diveTitle}</h3>
              </div>
              <button type="button" className="text-sm text-muted hover:text-fg" onClick={() => setDive(false)}>
                Close
              </button>
            </div>
            <Motion kind={slide.motion} />
            <div className="mt-4 space-y-4">
              {slide.dive.map((block) => (
                <section key={block.heading}>
                  <h4 className="text-sm font-semibold text-fg">{block.heading}</h4>
                  <ul className="mt-1.5 space-y-1.5">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-relaxed text-fg/85">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
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
