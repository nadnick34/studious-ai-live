import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { generateClassicalPackage } from "@/lib/ai";
import { updateStudySet } from "@/lib/data";
import type { ClassRecord, StudySet } from "@/lib/types";

type Props = {
  cls: ClassRecord;
  set: StudySet;
  onClose: () => void;
};

function sourceFromSet(set: StudySet) {
  const sections = (set.notes?.sections || [])
    .map((s) => {
      const bits = [s.heading, s.body, ...(s.bullets || [])];
      if (s.table) {
        bits.push(s.table.headers.join(" | "));
        bits.push(...s.table.rows.map((r) => r.join(" | ")));
      }
      return bits.filter(Boolean).join("\n");
    })
    .join("\n\n");
  const attachments = (set.attachments || [])
    .map((a) => `SOURCE ${a.name}\n${a.extractedText || ""}`)
    .join("\n\n");
  return [sections, attachments, set.audioScript || ""].filter(Boolean).join("\n\n");
}

export function ClassicalModeModal({ cls, set, onClose }: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasClassical = Boolean(set.notes?.classical);

  async function enter() {
    setError(null);
    if (hasClassical) {
      await navigate({ to: "/class/$id/set/$setId/classical", params: { id: cls.id, setId: set.id } });
      onClose();
      return;
    }
    setBusy(true);
    try {
      const classical = await generateClassicalPackage({
        data: {
          className: cls.name,
          classCode: cls.code,
          subject: cls.subject,
          setName: set.name,
          sourceText: sourceFromSet(set),
        },
      });
      await updateStudySet({
        data: {
          id: set.id,
          patch: {
            notes: {
              ...set.notes,
              classical,
            },
          },
        },
      });
      await navigate({ to: "/class/$id/set/$setId/classical", params: { id: cls.id, setId: set.id } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Classical Mode");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-amber-200/30 shadow-2xl">
        <div
          className="relative min-h-[420px] bg-cover bg-center px-6 py-8 sm:px-8"
          style={{ backgroundImage: "url(/roman-columns.jpg)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/75" />
          <div className="relative flex flex-col items-center text-center text-white">
            <img
              src="/plato-bust.jpg"
              alt="Bust of Plato"
              className="mb-5 h-36 w-36 rounded-full object-cover shadow-[0_0_0_3px_rgba(251,191,36,0.35)] sm:h-40 sm:w-40"
            />
            <p className="mb-2 text-[10px] font-semibold tracking-[0.25em] text-amber-200/90 uppercase">
              Classical Education
            </p>
            <h2 className="mb-1 font-serif text-2xl font-semibold tracking-wide text-amber-50 sm:text-3xl">
              Returning to antiquity…
            </h2>
            <p className="mb-4 font-serif text-lg italic text-amber-100/95">Para te trivio!</p>
            <p className="mb-5 max-w-sm text-xs text-white/75">
              {busy
                ? "Preparing The Conspectus, Orator’s Companion, Socratic Tutor, and Commonplace for this chapter…"
                : hasClassical
                  ? `Open the classical path for ${set.name}.`
                  : `Generate a classical study notebook for ${set.name}.`}
            </p>
            {error && <p className="mb-3 max-w-sm rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-100">{error}</p>}
            <div className="flex gap-2">
              {!busy && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/25 bg-black/25 px-5 py-2 text-sm text-white/90 hover:bg-black/40"
                >
                  Close
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void enter()}
                className="rounded-full border border-amber-200/40 bg-amber-900/50 px-5 py-2 text-sm font-medium text-amber-50 backdrop-blur hover:bg-amber-900/70 disabled:opacity-70"
              >
                {busy ? "Preparing…" : hasClassical ? "Enter" : "Begin"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClassicalModeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="10" r="3.2" fill="currentColor" opacity="0.9" />
      <path
        d="M12 13.2c-2.2 0-4 1.4-4 2.6V17h8v-1.2c0-1.2-1.8-2.6-4-2.6Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M6.2 8.2c.4-1.6 1.4-2.8 2.4-3.2-.2 1.2.1 2.4.8 3.2-1.2.2-2.3.5-3.2 1ZM17.8 8.2c-.4-1.6-1.4-2.8-2.4-3.2.2 1.2-.1 2.4-.8 3.2 1.2.2 2.3.5 3.2 1Z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M5.5 11.5c.8-1.1 1.8-1.8 2.8-2-.1.9.2 1.8.8 2.4-1.3.3-2.5.7-3.6 1.4ZM18.5 11.5c-.8-1.1-1.8-1.8-2.8-2 .1.9-.2 1.8-.8 2.4 1.3.3 2.5.7 3.6 1.4Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M7.2 15c.9-.7 1.8-1.1 2.6-1.2.1.7.4 1.3.9 1.7-1.2.3-2.4.6-3.5 1.3ZM16.8 15c-.9-.7-1.8-1.1-2.6-1.2-.1.7-.4 1.3-.9 1.7 1.2.3 2.4.6 3.5 1.3Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
