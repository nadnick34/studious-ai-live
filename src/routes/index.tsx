import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoModal } from "@/components/info-modal";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RoleHomeRedirect } from "@/components/role-home-redirect";
import { isThemePlaying, playLandingTheme, stopTheme } from "@/lib/theme-audio";

export const Route = createFileRoute("/")({ component: Landing });

const glass =
  "border border-[#f0e2b8]/45 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md";

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
    <div className="relative min-h-dvh overflow-x-hidden bg-[#4a3a2a] text-[#f4ead6]">
      <button
        type="button"
        onClick={() => setMuted((v) => !v)}
        className="absolute right-3 top-3 z-20 rounded-full border border-[#f0e2b8]/40 bg-black/30 px-3 py-1 text-[11px] tracking-wide text-[#e8d7a8] hover:bg-black/45"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center brightness-125 contrast-105 saturate-110"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#3b2a18]/15" aria-hidden />

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center gap-3 px-3 py-4 sm:gap-5 sm:px-4 sm:py-10">
        <section className={`w-full max-w-3xl rounded-2xl px-4 py-4 text-center sm:rounded-[28px] sm:px-14 sm:py-12 ${glass}`}>
          <p className="font-serif text-[11px] font-semibold tracking-[0.22em] text-[#e8d7a8] sm:text-sm">STUDIOUS AI</p>
          <img src="/hero-mark.png" alt="" className="mx-auto mt-1 h-12 w-auto sm:mt-3 sm:h-20" />
          <h1 className="mt-2 font-serif text-[1.35rem] leading-[1.12] font-semibold text-[#f7f0dc] sm:mt-5 sm:text-[2.6rem]">
            Your masterclass for every class
          </h1>
          <p className="mt-1 font-serif text-base italic text-[#e8d7a8] sm:mt-4 sm:text-2xl">Get Studious!</p>
          <p className="mx-auto mt-1 hidden max-w-lg text-sm leading-relaxed text-[#f4ead6]/90 sm:mt-4 sm:block">
            Notes, lectures, and photos become one study place: a packet you can read, hear, quiz, and master.
          </p>
          <button
            type="button"
            onClick={() => setShowOverview(true)}
            className="mt-1 text-[11px] tracking-wide text-[#e8d7a8] underline decoration-[#e8d7a8]/50 underline-offset-4 sm:mt-2 sm:text-xs"
          >
            More info
          </button>
          <div className="mx-auto mt-3 grid w-full max-w-xs grid-cols-2 gap-2 sm:mt-8 sm:max-w-md sm:gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#c9a24a] px-3 text-xs font-semibold text-[#1a1510] hover:bg-[#e8d7a8] sm:h-11 sm:text-sm"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e8d7a8] px-3 text-xs font-semibold text-[#e8d7a8] hover:bg-[#e8d7a8]/10 sm:h-11 sm:text-sm"
            >
              Create Path
            </Link>
          </div>
        </section>

        <p className="mt-1 pb-[env(safe-area-inset-bottom)] sm:mt-6 text-center text-[9px] tracking-[0.12em] text-[#e8d7a8]/80 sm:mt-8 sm:text-[10px]">
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
            Built for mastery, not just tests. It does not write papers for you. You read, listen, recite, and check
            yourself until the material is actually learned.
          </p>
        </InfoModal>
      )}
    </div>
  );
}
