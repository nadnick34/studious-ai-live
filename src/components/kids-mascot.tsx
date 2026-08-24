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
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { src, name } = useKidsMascot();
  const dim = size === "sm" ? "h-12 w-12" : size === "lg" ? "h-24 w-24" : "h-16 w-16";
  return (
    <img
      src={src}
      alt={name}
      className={`${dim} rounded-full object-cover shadow-sm ring-2 ring-white ${className}`}
    />
  );
}
