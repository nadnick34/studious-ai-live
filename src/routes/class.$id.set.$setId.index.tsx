import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KidsOwlBanner } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { getClassById, getStudySetById } from "@/lib/data";
import type { ClassRecord, NotesSection, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/")({ component: NotesPage });

function NotesPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  if (!set || !cls) {
    return (
      <AppShell title="Study notes">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const sections = set.notes?.sections || [];

  return (
    <AppShell
      title={set.name}
      right={
        <Button variant="secondary" className="print-hidden min-h-10 text-xs" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      }
    >
      <div className="print-hidden mb-5 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <span className="text-xs text-muted">{cls.code}</span>
      </div>

      <div className="print-hidden mx-auto max-w-3xl">
        <KidsOwlBanner message="Read the notes carefully. Tap Spatial for the comic story!" />
      </div>

      <div className="notes-sheet mx-auto max-w-3xl rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <div className="mb-1 flex items-start justify-between gap-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">Comprehensive Study Notes</span>
          <span className="shrink-0 text-[10px] text-muted">Studious AI</span>
        </div>
        <h1 className="mt-2 text-xl leading-tight font-bold text-fg sm:text-2xl">{set.notes.title}</h1>
        <p className="mt-1 mb-2 text-sm text-muted">{set.notes.subtitle}</p>
        <p className="mb-6 text-[11px] text-muted">
          {cls.code} · {set.name}
          {set.sourceFiles?.length ? ` · Sources: ${set.sourceFiles.join(", ")}` : ""}
        </p>
        <div className="space-y-7">
          {sections.map((sec, i) => (
            <SectionBlock key={i} section={sec} index={i} />
          ))}
        </div>
        {set.notes.otherResources?.length > 0 && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="mb-3 text-sm font-semibold text-fg">Other Resources</h2>
            <ul className="space-y-1.5">
              {set.notes.otherResources.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-fg">
                  <span className="shrink-0 text-teal">→</span>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                      {r.title}
                    </a>
                  ) : (
                    <span>{r.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="print-hidden mt-8 flex flex-wrap justify-center gap-3 border-t border-border pt-6">
          <Link to="/class/$id/set/$setId/audio" params={{ id: classId, setId }} className="text-sm font-medium text-sky-600 hover:underline">
            Audio
          </Link>
          <span className="text-border">|</span>
          <Link to="/class/$id/set/$setId/flashcards" params={{ id: classId, setId }} className="text-sm font-medium text-amber-700 hover:underline">
            Flash cards
          </Link>
          <span className="text-border">|</span>
          <Link to="/class/$id/set/$setId/quiz" params={{ id: classId, setId }} className="text-sm font-medium text-violet-600 hover:underline">
            Quiz
          </Link>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border pt-6">
          <img src="/logo.png" alt="Studious AI" className="h-8 w-auto" />
          <p className="text-[10px] text-muted">Your masterclass for every class</p>
        </div>
      </div>
    </AppShell>
  );
}

function SectionBlock({ section, index }: { section: NotesSection; index: number }) {
  const layout = section.layout || (section.table ? "table" : section.columns?.length ? "two-column" : "stack");
  return (
    <div>
      <h2 className="mb-2 flex items-baseline gap-2 text-sm font-bold text-fg">
        <span className="text-xs font-semibold text-teal">{index + 1}.</span>
        {section.heading}
      </h2>
      {section.body && <p className="mb-3 text-sm leading-relaxed text-fg">{section.body}</p>}
      {layout === "two-column" && section.columns && section.columns.length >= 2 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {section.columns.map((col, i) => (
            <div key={i} className="rounded-lg border border-border bg-bg p-3">
              <div className="mb-2 text-xs font-semibold text-teal">{col.title}</div>
              <ul className="space-y-1">
                {(col.bullets || []).map((b, j) => (
                  <li key={j} className="flex gap-1.5 text-[13px] leading-snug text-fg">
                    <span className="shrink-0 text-teal">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : layout === "table" && section.table ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-bg">
                {section.table.headers.map((h, i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold text-fg">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-0 even:bg-bg">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 align-top text-fg">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {(section.bullets || []).map((b, j) => (
            <li key={j} className="flex gap-2 text-sm leading-snug text-fg">
              <span className="mt-1 shrink-0 text-teal">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {layout !== "stack" && section.bullets && section.bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {section.bullets.map((b, j) => (
            <li key={j} className="flex gap-2 text-sm leading-snug text-fg">
              <span className="mt-1 shrink-0 text-teal">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {section.reference && <p className="mt-2 text-[11px] text-muted italic">Source: {section.reference}</p>}
    </div>
  );
}
