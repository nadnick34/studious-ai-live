import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, GraduationCap, Heart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { saveProfile } from "@/lib/data";
import { fetchProfileShared } from "@/lib/profile-cache";
import type { ChildGender, UserProfile } from "@/lib/types";

export const Route = createFileRoute("/welcome")({ component: Welcome });

type Choice = "student" | "child" | "teacher" | "professional";

function Welcome() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [gender, setGender] = useState<ChildGender | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return <div className="grid min-h-dvh place-items-center bg-slate-dark text-sm text-white/80">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" />;

  async function finish(nextChoice: Choice, childGender: ChildGender | null) {
    setSaving(true);
    setError(null);
    const forChild = nextChoice === "child";
    const role = nextChoice === "teacher" ? "teacher" : nextChoice === "professional" ? "professional" : "student";
    const edition = role === "teacher" ? "teacher" : role === "professional" ? "professional" : "student";
    const profile: UserProfile = {
      displayName: user?.displayName || null,
      phone: "",
      smsAlerts: false,
      schoolSelect: "studious",
      role,
      edition,
      setupComplete: true,
      forChild,
      childAge: forChild ? 8 : null,
      childGender: forChild ? childGender : null,
      kidsMode: forChild,
    };
    try {
      await saveProfile({ data: profile });
      await fetchProfileShared(true);
      try {
        localStorage.setItem("studious-show-tutorial", "1");
      } catch {
        /* ignore */
      }
      if (role === "teacher") await navigate({ to: "/teacher" });
      else if (role === "professional") await navigate({ to: "/meetings" });
      else await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that choice.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-dark px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <img src="/logo.png" alt="Studious AI" width={148} height={46} className="h-8 w-auto" />
          <p className="text-xs text-muted">{step === 2 || choice === "child" ? (step === 2 ? "Step 2 of 2" : "Step 1 of 2") : ""}</p>
        </div>
        {step === 1 ? (
          <>
            <h1 className="text-xl font-semibold text-fg">Who will use Studious?</h1>
            <p className="mt-1 text-sm text-muted">This sets up your home screen. You can change it later in your profile.</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChoiceCard
                selected={choice === "student"}
                icon={UserRound}
                title="Student"
                detail="High school or college classes"
                onClick={() => setChoice("student")}
              />
              <ChoiceCard
                selected={choice === "child"}
                icon={Heart}
                title="My child"
                detail="Ages 9 and under, with Kids Mode"
                onClick={() => setChoice("child")}
              />
              <ChoiceCard
                selected={choice === "teacher"}
                icon={GraduationCap}
                title="Teacher"
                detail="Classes, grading, and analytics"
                onClick={() => setChoice("teacher")}
              />
              <ChoiceCard
                selected={choice === "professional"}
                icon={Briefcase}
                title="Professional"
                detail="Meetings, projects, and notes"
                onClick={() => setChoice("professional")}
              />
            </div>
            {choice === "child" && (
              <p className="mt-3 rounded-lg bg-teal/10 px-3 py-2 text-sm text-fg">
                Next you’ll pick an owl. Hoot and Hootie keep buttons big and the words friendly.
              </p>
            )}
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{error}</p>}
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                disabled={!choice || saving}
                onClick={() => {
                  if (choice === "child") setStep(2);
                  else if (choice) void finish(choice, null);
                }}
              >
                {saving ? "Saving…" : "Continue"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-fg">Which owl?</h1>
            <p className="mt-1 text-sm text-muted">This only changes the picture. You can switch it later.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("boy")}
                className={`rounded-xl border p-3 text-center ${gender === "boy" ? "border-teal bg-teal/10" : "border-border"}`}
              >
                <img src="/owl-boy.jpg" alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
                <span className="mt-2 block text-sm font-semibold">Hoot</span>
              </button>
              <button
                type="button"
                onClick={() => setGender("girl")}
                className={`rounded-xl border p-3 text-center ${gender === "girl" ? "border-teal bg-teal/10" : "border-border"}`}
              >
                <img src="/owl-girl.jpg" alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
                <span className="mt-2 block text-sm font-semibold">Hootie</span>
              </button>
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{error}</p>}
            <div className="mt-5 flex items-center justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="button" disabled={!gender || saving} onClick={() => void finish("child", gender)}>
                {saving ? "Saving…" : "Continue"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  icon: typeof UserRound;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left ${selected ? "border-teal bg-teal/10" : "border-border bg-card hover:bg-bg"}`}
    >
      <Icon className="size-5 text-teal" />
      <span className="mt-2 block text-sm font-semibold text-fg">{title}</span>
      <span className="mt-1 block text-xs text-muted">{detail}</span>
    </button>
  );
}
