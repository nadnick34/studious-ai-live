import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getClassById, getStudySetById } from "@/lib/data";
import type { ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/terms")({ component: KeyTermsPage });

function KeyTermsPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  const cards = set?.flashcards || [];
  const tables = (set?.slides || []).filter((s) => s.table?.rows?.length);

  return (
    <AppShell title="Key Terms">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal">
          {cls?.name || "Class"}
        </Link>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
      <h1 className="text-xl font-bold tracking-wide text-fg">{set?.name || "Key terms"}</h1>
      <p className="mt-1 text-sm text-muted">Definitions and the concepts they belong to. The notes stay the full study text.</p>
      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <article key={card.id} className="rounded-xl border border-border bg-card px-4 py-3">
            <h2 className="font-bold text-fg">{card.term}</h2>
            <p className="mt-1 text-sm leading-6 text-fg/90">{card.definition}</p>
          </article>
        ))}
        {!cards.length && <p className="text-sm text-muted">No key terms were stored for this chapter yet.</p>}
      </div>
      {tables.map((slide) => (
        <section key={slide.id} className="mt-6">
          <h2 className="mb-2 font-bold text-fg">{slide.title}</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {(slide.table?.headers || []).map((h) => (
                    <th key={h} className="border-b border-border px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(slide.table?.rows || []).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-border px-3 py-2 align-top">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </AppShell>
  );
}
