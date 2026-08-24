import { getProfile } from "@/lib/data";
import { useEffect, useState } from "react";
import type { ChildGender } from "@/lib/types";

export function useKidsMascot() {
  const [gender, setGender] = useState<ChildGender | null>(null);
  const [kidsMode, setKidsMode] = useState(false);
  useEffect(() => {
    void getProfile().then((p) => {
      setKidsMode(Boolean(p.kidsMode));
      setGender(p.childGender || null);
    });
  }, []);
  const src = gender === "girl" ? "/owl-girl.jpg" : "/owl-boy.jpg";
  const name = gender === "girl" ? "Hootie" : "Professor Hoot";
  return { kidsMode, gender, src, name };
}

export function KidsMascot({
  size = "md",
  className = "",
  showName = false,
}: {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  showName?: boolean;
}) {
  const { src, name } = useKidsMascot();
  const dim =
    size === "sm"
      ? "h-12 w-12"
      : size === "lg"
        ? "h-28 w-28"
        : size === "hero"
          ? "h-40 w-40 sm:h-48 sm:w-48"
          : "h-16 w-16";
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-full bg-white object-cover object-top shadow-md ring-4 ring-white`}
      />
      {showName && <p className="mt-2 text-sm font-semibold text-fg">{name}</p>}
    </div>
  );
}

export function KidsOwlBanner({ message }: { message?: string }) {
  const { kidsMode, name } = useKidsMascot();
  if (!kidsMode) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-teal/25 bg-gradient-to-r from-teal/5 to-card px-3 py-2.5">
      <KidsMascot size="md" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">{name} is here to help</p>
        <p className="text-xs text-muted">{message || "Let’s learn something new today!"}</p>
      </div>
    </div>
  );
}
