import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user } = useCurrentUserState();
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-dark text-cream">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/library-bg.jpg')" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#2c3a47]/55" aria-hidden />
      <div className="relative z-10 h-1 shrink-0 bg-teal" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-6 text-center">
        <img src="/hero-mark.png" alt="" className="h-16 w-auto sm:h-20" />
        <p className="mt-1 mb-4 font-serif text-2xl font-semibold tracking-wide sm:text-3xl">Studious AI</p>
        <h1 className="max-w-3xl font-serif text-[1.7rem] leading-[1.15] font-semibold sm:text-4xl">
          Your masterclass for every class.
        </h1>
        <p className="mt-3 font-serif text-xl font-semibold italic text-teal sm:text-2xl">Get Studious!</p>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-cream/80 sm:text-[15px]">
          Turn notes, PDFs, lectures, and photos into one place to learn: study notes, a lecture you can listen to,
          flash cards, and a quiz. Built for mastery — not a shortcut around the work.
        </p>
        <div className="mt-6 flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <Link
            to="/signup"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-cream px-6 text-sm font-semibold text-slate-dark hover:bg-white sm:w-44"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-teal px-6 text-sm font-semibold text-teal hover:bg-teal hover:text-white sm:w-44"
          >
            Log in
          </Link>
        </div>
      </main>
      <footer className="relative z-10 px-6 py-3 text-center text-[11px] text-cream/40">
        Notes · Audio · Flash cards · Quiz
      </footer>
    </div>
  );
}
