import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { BottomNav, Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getProfile } from "@/lib/data";
import { brandFromProfile, hydrateBrand, persistBrand } from "@/lib/schools";
import { accountTypeLabel, type UserProfile } from "@/lib/types";

export function AppShell({
  title,
  right,
  children,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <AppShellInner title={title} right={right}>
        {children}
      </AppShellInner>
    </RequireAuth>
  );
}

function AppShellInner({
  title,
  right,
  children,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const user = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("studious-theme");
    const preferDark =
      stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(preferDark);
    document.documentElement.classList.toggle("dark", preferDark);
    hydrateBrand();
    void getProfile()
      .then((p) => {
        setProfile(p);
        const brand = brandFromProfile(p);
        if (brand) persistBrand(brand);
        else hydrateBrand();
        const kids = Boolean(p.kidsMode);
        document.documentElement.classList.toggle("kids-mode", kids);
        document.documentElement.classList.toggle("kids-boy", kids && p.childGender === "boy");
        document.documentElement.classList.toggle("kids-girl", kids && p.childGender === "girl");
        document.documentElement.classList.toggle("professional-mode", p.role === "professional");
        document.documentElement.classList.toggle("teacher-mode", p.role === "teacher");
      })
      .catch(() => hydrateBrand());
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("studious-theme", next ? "dark" : "light");
  }

  const name = user?.displayName || profile?.displayName || "Student";

  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-bg">
      <Sidebar
        userName={name}
        avatar={user?.profileImageUrl || profile?.avatarDataUrl}
        profile={profile}
        dark={dark}
        onToggleDark={toggleDark}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/dashboard" className="shrink-0 sm:hidden">
              <img src="/logo.png" alt="Studious AI" className="h-7 w-auto" />
            </Link>
            <div className="min-w-0 sm:hidden">
              <p className="truncate text-[10px] font-semibold tracking-wide text-muted uppercase">
                {accountTypeLabel(profile)}
              </p>
            </div>
            <h1 className="hidden truncate text-[15px] font-semibold text-fg sm:block">{title || ""}</h1>
          </div>
          <div className="flex max-w-[70%] flex-wrap items-center justify-end gap-2">
            {right}
          </div>
        </header>
        {title && (
          <div className="px-4 pt-3 sm:hidden">
            <h1 className="text-base font-semibold text-fg">{title}</h1>
          </div>
        )}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-8">{children}</main>
      </div>
      <BottomNav role={profile?.role} />
    </div>
  );
}
