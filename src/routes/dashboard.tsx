import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, BookOpen, ClipboardCheck, NotebookPen, Play, Target } from "lucide-react";
import { AppShell, ProfileLink } from "@/components/app-shell";
import { KidsOwlBanner } from "@/components/kids-mascot";
import { StudentTutorial, useStudentTutorial } from "@/components/student-tutorial";
import { getRecentStudy } from "@/lib/data";
import { fetchProfileShared } from "@/lib/profile-cache";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/dashboard")({ component: HomeMenu });

const items = [
  {
    to: "/classes",
    label: "Classes",
    icon: BookOpen,
    tint: "bg-teal/15 text-teal",
    detail: "Upload notes, slides, or photos. Get notes, cards, and quizzes.",
  },
  {
    to: "/assistant",
    label: "Assignment Assistant",
    icon: ClipboardCheck,
    tint: "bg-sky-100 text-sky-700",
    detail: "Stuck on homework or a worksheet? Get step-by-step guidance.",
  },
  {
    to: "/paper-grade",
    label: "Paper Grade",
    icon: NotebookPen,
    tint: "bg-amber-100 text-amber-700",
    detail: "Plan a paper, then check your draft before you turn it in.",
  },
  {
    to: "/test-prep",
    label: "Practicum & Prep",
    icon: Target,
    tint: "bg-violet-100 text-violet-700",
    detail: "Get ready for the ACT, a final, or a real-world skill.",
  },
  {
    to: "/archived",
    label: "Archive",
    icon: Archive,
    tint: "bg-slate-100 text-slate-700",
    detail: "Old classes, checks, and graded papers, saved for later.",
  },
] as const;

function greeting(name: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${hello}, ${name}`;
}

function HomeMenu() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const tutorial = useStudentTutorial();
  const [name, setName] = useState(user?.displayName || "there");
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof getRecentStudy>> | null>(null);

  useEffect(() => {
    void fetchProfileShared().then((p) => {
      if (p.role === "professional") void navigate({ to: "/meetings" });
      if (p.role === "teacher") void navigate({ to: "/teacher" });
      setName(p.displayName || user?.displayName || "there");
    });
    void getRecentStudy()
      .then(setRecent)
      .catch(() => setRecent(null));
  }, [navigate, user?.displayName]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <AppShell title="Home" right={<ProfileLink />}>
      <p className="text-xs text-muted">{today}</p>
      <h2 className="mt-1 text-2xl font-semibold text-fg">{greeting(name)}</h2>
      <div className="mt-4">
        <KidsOwlBanner message="Pick a tile and I’ll study with you." />
      </div>
      {recent && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal text-white">
            <Play className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-teal uppercase">Continue</p>
            <p className="truncate text-sm font-semibold text-fg">
              {recent.className}
              {recent.setName ? ` · ${recent.setName}` : ""}
            </p>
          </div>
          {recent.setId ? (
            <Link
              to="/class/$id/set/$setId"
              params={{ id: recent.classId, setId: recent.setId }}
              className="inline-flex h-11 items-center rounded-lg bg-teal px-4 text-sm font-semibold text-white"
            >
              Continue
            </Link>
          ) : (
            <Link
              to="/class/$id"
              params={{ id: recent.classId }}
              className="inline-flex h-11 items-center rounded-lg bg-teal px-4 text-sm font-semibold text-white"
            >
              Continue
            </Link>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          const wide = item.to === "/archived";
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-h-28 items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-teal/40 ${wide ? "sm:col-span-2" : ""}`}
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.tint}`}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-fg">{item.label}</span>
                <span className="mt-1 block text-sm text-muted">{item.detail}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <StudentTutorial open={tutorial.open} kids={tutorial.kids} onClose={tutorial.close} />
    </AppShell>
  );
}
