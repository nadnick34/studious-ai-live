import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoModal } from "@/components/info-modal";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RoleHomeRedirect } from "@/components/role-home-redirect";
import { isThemePlaying, playLandingTheme, stopTheme } from "@/lib/theme-audio";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user } = useCurrentUserState();
  const [showOverview, setShowOverview] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (user || muted) {
      stopTheme();
      return;
    }
    playLandingTheme();
    const kick = () => {
      if (!isThemePlaying()) playLandingTheme();
    };
    window.addEventListener("pointerdown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      stopTheme();
    };
  }, [user, muted]);

  if (user) return <RoleHomeRedirect />;

  return (
    <div className="relative min-h-dvh bg-white text-fg">
      <button
        type="button"
        onClick={() => setMuted((v) => !v)}
        className="absolute right-4 top-4 z-20 rounded-full border border-border px-3 py-1 text-[11px] text-muted"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <img src="/logo.png" alt="Studious AI" className="h-28 w-auto" />
        <h1 className="mt-4 text-3xl font-bold leading-tight text-fg">Your masterclass for every class</h1>
        <p className="mt-3 text-lg text-muted">Get Studious!</p>
        <button type="button" onClick={() => setShowOverview(true)} className="mt-3 text-sm text-teal underline underline-offset-4">
          More info
        </button>
        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white">
            Login
          </Link>
          <Link to="/signup" className="inline-flex h-12 items-center justify-center rounded-xl border border-border text-sm font-semibold text-fg">
            Create Path
          </Link>
        </div>
        <p className="mt-10 text-[10px] tracking-[0.12em] text-muted">created by The Nickersonian Institute for Excellence</p>
      </main>
      {showOverview && (
        <InfoModal title="What Studious AI is" onClose={() => setShowOverview(false)}>
          <p>Notes, photos, scans, and lecture audio go in one place. Studious turns them into notes, key terms, cards, and a quiz.</p>
          <p>Built for mastery, not just tests. It does not write the paper for you.</p>
        </InfoModal>
      )}
    </div>
  );
}
