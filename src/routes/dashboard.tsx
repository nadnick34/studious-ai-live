import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, BookOpen, ClipboardCheck, LogOut, NotebookPen, UserRound } from "lucide-react";
import { AppShell, ProfileLink } from "@/components/app-shell";
import { InfoButton, InfoModal } from "@/components/info-modal";
import { signOut } from "@/lib/auth/client";
import { getProfile } from "@/lib/data";

export const Route = createFileRoute("/dashboard")({ component: HomeMenu });

const items = [
  { to: "/classes", label: "Classes", icon: BookOpen },
  { to: "/assistant", label: "Assignment Assistant", icon: ClipboardCheck },
  { to: "/paper-grade", label: "Paper Grade", icon: NotebookPen },
  { to: "/test-prep", label: "Practicum & Prep", icon: ClipboardCheck },
  { to: "/archived", label: "Archive", icon: Archive },
] as const;

function HomeMenu() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(false);
  useEffect(() => {
    void getProfile().then((p) => {
      if (p.role === "professional") void navigate({ to: "/meetings" });
      if (p.role === "teacher") void navigate({ to: "/teacher" });
    });
  }, [navigate]);
  return (
    <AppShell
      title="Studious"
      right={
        <div className="flex items-center gap-1.5">
          <InfoButton onClick={() => setInfo(true)} label="About Studious" />
<ProfileLink />
          <button type="button" onClick={() => void signOut("/")} className="grid size-10 place-items-center rounded-lg border border-border bg-card" aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      }
    >
      <div className="grid h-[calc(100dvh-8.5rem)] grid-rows-5 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 text-xl font-bold text-fg">
              <Icon className="size-7 text-teal" />
              {item.label}
            </Link>
          );
        })}
      </div>
      {info && (
        <InfoModal title="Studious" onClose={() => setInfo(false)}>
          <p>Classes hold your notes, key terms, cards, and quizzes. Assignment Assistant checks a sheet. Paper Grade plans a paper, then checks the draft. Practicum & Prep tracks tests and real-world skills.</p>
        </InfoModal>
      )}
    </AppShell>
  );
}
