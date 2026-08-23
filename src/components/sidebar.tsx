import { Link, useRouterState } from "@tanstack/react-router";
import { Archive, BookOpen, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { cn, initialsFromName } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

const NAV = [
  { to: "/dashboard", label: "Classes", icon: BookOpen, match: (p: string) => p === "/dashboard" || p.startsWith("/class") },
  { to: "/archived", label: "Archived", icon: Archive, match: (p: string) => p.startsWith("/archived") },
  { to: "/profile", label: "Profile", icon: UserRound, match: (p: string) => p.startsWith("/profile") },
];

export function Sidebar({
  userName,
  avatar,
  profile,
  dark,
  onToggleDark,
}: {
  userName: string;
  avatar?: string | null;
  profile?: UserProfile | null;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col bg-slate text-white sm:flex">
      <Link to="/dashboard" className="flex items-center gap-2 px-4 pt-5 pb-4">
        <span className="rounded-lg bg-white px-2 py-1.5">
          <img src="/logo.png" alt="Studious AI" className="h-7 w-auto" />
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-2.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        <button type="button" onClick={onToggleDark} className="flex min-h-11 w-full items-center gap-2 text-sm text-white/75 hover:text-white">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? "Light mode" : "Night mode"}
        </button>
        <Link to="/profile" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-white/15 text-sm font-semibold ring-1 ring-white/20">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initialsFromName(userName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{userName}</span>
            <span className="block text-[11px] capitalize text-white/55">{profile?.role || "student"}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => void signOut("/")}
          className="flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
        <p className="text-[10px] tracking-wide text-white/35">Nickersonian Institute</p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              active ? "text-teal" : "text-muted",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => void signOut("/")}
        className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted"
        aria-label="Sign out"
      >
        <LogOut className="size-5" />
        Sign out
      </button>
    </nav>
  );
}
