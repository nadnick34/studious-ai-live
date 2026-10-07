import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listClasses, listStudySets } from "@/lib/data";
import type { ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/assistant")({ component: AssistantHome });

function AssistantHome() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classId, setClassId] = useState("");
  const [chapters, setChapters] = useState<StudySet[]>([]);

  useEffect(() => {
    void listClasses({ data: false }).then(setClasses);
  }, []);

  useEffect(() => {
    if (!classId) {
      setChapters([]);
      return;
    }
    void listStudySets({ data: classId }).then(setChapters);
  }, [classId]);

  return (
    <AppShell title="Assignment Assistant">
      <p className="text-sm text-muted">Check a sheet without opening a chapter. File it to a class, then a chapter.</p>
      <label className="mt-4 block text-xs font-semibold text-muted">Class</label>
      <select className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-3 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Choose a class</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <label className="mt-3 block text-xs font-semibold text-muted">Chapter</label>
      <select className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-3 text-sm" disabled={!classId}>
        <option value="">File after the check</option>
        {chapters.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      {classId ? (
        <Link to="/class/$id/assignments" params={{ id: classId }} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-teal font-semibold text-white">
          Check work
        </Link>
      ) : (
        <p className="mt-4 text-sm text-muted">Choose a class to start. The chapter list is where the check can be filed.</p>
      )}
    </AppShell>
  );
}
