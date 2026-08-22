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
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div
          className="relative border-b border-amber-400/50 bg-white px-6 py-8 dark:bg-card"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.93), rgba(255,255,255,0.95)), url(/roman-columns.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative flex flex-col items-center text-center">
            <img
              src="/plato-bust.jpg"
              alt="Bust of Plato"
              className="mb-4 h-32 w-32 rounded-full object-cover shadow-[0_0_0_2px_rgba(212,175,55,0.55)] sm:h-36 sm:w-36"
            />
            <img src="/classical-wreath.jpg" alt="" className="mb-3 h-10 w-auto opacity-90" />
            <p className="mb-1 text-[10px] font-semibold tracking-[0.22em] text-amber-800 uppercase dark:text-amber-200">
              Classical Education
            </p>
            <h2 className="mb-1 font-serif text-2xl font-semibold text-fg">Returning to antiquity…</h2>
            <p className="mb-3 font-serif text-base italic text-amber-900/90 dark:text-amber-100/90">Para te trivio!</p>
            <p className="mb-5 max-w-sm text-xs text-muted">
              {busy
                ? "Preparing The Conspectus, Orator’s Companion, Socratic Tutor, and Commonplace…"
                : hasClassical
                  ? `Open the classical path for ${set.name}.`
                  : `Generate a classical study notebook for ${set.name}.`}
            </p>
            {error && <p className="mb-3 max-w-sm rounded-lg bg-red-50 px-3 py-2 text-xs text-red dark:bg-red-950/40">{error}</p>}
            <div className="flex gap-2">
              {!busy && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border bg-bg px-4 py-2 text-sm text-fg hover:bg-card"
                >
                  Close
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void enter()}
                className="rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-70 dark:bg-amber-900/40 dark:text-amber-50"
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

export function ClassicalModeIcon({ className = "size-5" }: { className?: string }) {
  return <img src="/classical-wreath.jpg" alt="" className={className} />;
}
