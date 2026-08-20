import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getClassById, getStudySetById } from "@/lib/data";
import type { ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/flashcards")({ component: FlashCardsPage });

function FlashCardsPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"study" | "print">("study");
  const [reversed, setReversed] = useState(false);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  if (!set || !cls) {
    return (
      <AppShell title="Flash cards">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const cards = set.flashcards || [];
  const card = cards[index];
  const total = cards.length;

  if (total === 0) {
    return (
      <AppShell title="Flash cards">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="mt-16 text-center text-muted">No flash cards for this set yet.</div>
      </AppShell>
    );
  }

  const frontLabel = reversed ? "Definition" : "Term";
  const backLabel = reversed ? "Term" : "Definition";
  const frontText = reversed ? card.definition : card.term;
  const backText = reversed ? card.term : card.definition;

  return (
    <AppShell
      title={`Flash cards – ${set.name}`}
      right={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant={reversed ? "primary" : "secondary"}
            className="min-h-10 text-xs"
            onClick={() => { setReversed((r) => !r); setFlipped(false); }}
          >
            Flip first side
          </Button>
          <Button variant={mode === "study" ? "primary" : "secondary"} className="min-h-10 text-xs" onClick={() => setMode("study")}>
            Study
          </Button>
          <Button variant={mode === "print" ? "primary" : "secondary"} className="min-h-10 text-xs" onClick={() => setMode("print")}>
            List
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="text-xs text-muted">{cls.code}</div>
      </div>

      {mode === "study" ? (
        <div className="mx-auto max-w-md">
          <div className="mb-3 text-center text-xs text-muted">
            Card {index + 1} of {total} · Tap to flip
          </div>
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="flex min-h-[220px] w-full items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-md"
          >
            <div>
              <div className="mb-2 text-[10px] tracking-wide text-muted uppercase">{flipped ? backLabel : frontLabel}</div>
              <div className="text-lg leading-relaxed font-semibold text-fg">{flipped ? backText : frontText}</div>
            </div>
          </button>
          <div className="mt-5 flex justify-between gap-2">
            <Button variant="secondary" onClick={() => { setFlipped(false); setIndex((i) => (i - 1 + total) % total); }}>
              Previous
            </Button>
            <Button onClick={() => { setFlipped(false); setIndex((i) => (i + 1) % total); }}>Next</Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="print-hidden mb-4 flex items-center justify-between">
            <p className="text-sm text-muted">Print-friendly list</p>
            <Button onClick={() => window.print()}>Print</Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">{set.name} — Flash cards</h2>
            </div>
            <div className="divide-y divide-border">
              {cards.map((c, i) => (
                <div key={c.id} className="grid grid-cols-1 gap-2 px-5 py-3.5 sm:grid-cols-[1fr_2fr]">
                  <div className="text-sm font-semibold">{i + 1}. {c.term}</div>
                  <div className="text-sm">{c.definition}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
