import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KidsMascot, useKidsMascot } from "@/components/kids-mascot";
import { getClassById, getStudySetById } from "@/lib/data";
import type { ClassRecord, SpatialPanel, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/spatial")({
  component: SpatialPage,
});

function SpatialPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [index, setIndex] = useState(0);
  const { name: mascotName } = useKidsMascot();

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  if (!set || !cls) {
    return (
      <AppShell title="Spatial Learning">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const panels: SpatialPanel[] = set.notes?.spatialLearning || [];
  const panel = panels[index];

  return (
    <AppShell title={`Spatial – ${set.name}`}>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="text-xs text-muted">{cls.code}</div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <KidsMascot size="md" />
        <div>
          <p className="font-semibold text-fg">{mascotName} says: look and learn!</p>
          <p className="text-xs text-muted">Spatial Learning turns big ideas into simple cartoon steps.</p>
        </div>
      </div>

      {panels.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          No spatial cartoons for this chapter yet. Generate the chapter again in Kids Mode to create them.
        </div>
      ) : (
        <div className="mx-auto max-w-lg">
          <div className="rounded-3xl border-4 border-teal/30 bg-gradient-to-b from-white to-bg p-5 shadow-sm dark:from-card dark:to-bg">
            <div className="mb-3 text-center text-6xl" aria-hidden>
              {panel.emoji || "🌟"}
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-fg">{panel.title}</h2>
            <p className="mb-4 text-center text-base leading-relaxed text-fg/90">{panel.caption}</p>
            <div className="rounded-2xl bg-bg/80 px-4 py-3 text-sm text-muted">
              <span className="font-semibold text-fg">Picture this: </span>
              {panel.visualDescription}
            </div>
            <p className="mt-4 text-center text-xs text-muted">
              Panel {index + 1} of {panels.length}
            </p>
          </div>
          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium disabled:opacity-40"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              disabled={index >= panels.length - 1}
              onClick={() => setIndex((i) => Math.min(panels.length - 1, i + 1))}
            >
              Next
            </button>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {panels.map((p, i) => (
              <button
                key={p.id || i}
                type="button"
                onClick={() => setIndex(i)}
                className={`rounded-xl border px-3 py-2 text-left text-sm ${
                  i === index ? "border-teal bg-teal/10" : "border-border bg-card"
                }`}
              >
                <span className="mr-1">{p.emoji}</span>
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
