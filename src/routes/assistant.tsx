import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { analyzeAssignment, extractMaterials } from "@/lib/ai";
import { createAssignment, listClasses, listStudySets, setAssignmentArchived, updateAssignment } from "@/lib/data";
import { uid } from "@/lib/utils";
import type { AssignmentFeedback, ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/assistant")({ component: AssistantHome });

function AssistantHome() {
  const [title, setTitle] = useState("");
  const [paste, setPaste] = useState("");
  const [captured, setCaptured] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AssignmentFeedback | null>(null);
  const [material, setMaterial] = useState("");
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classId, setClassId] = useState("");
  const [chapters, setChapters] = useState<StudySet[]>([]);
  const [chapterId, setChapterId] = useState("");
  const [filed, setFiled] = useState("");
  const [savedId, setSavedId] = useState("");
  const [archivedNote, setArchivedNote] = useState("");

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

  async function analyze() {
    setBusy(true);
    setError(null);
    setFiled("");
    setStatus("Reading uploads…");
    try {
      let text = paste.trim();
      if (captured.length) {
        const extracted = await extractMaterials({ data: { files: await capturedToPayloads(captured) } });
        text = [text, extracted.text].filter(Boolean).join("\n\n");
      }
      if (!text.trim()) {
        setError("Add the assignment, a photo, a scan, or paste the text.");
        return;
      }
      setStatus("Checking…");
      const feedback = await analyzeAssignment({
        data: {
          className: "Assignment",
          classCode: "",
          subject: "",
          title: title.trim() || "Assignment",
          instructionsText: text.slice(0, 55000),
          workText: text.slice(0, 55000),
          singleMaterial: true,
        },
      });
      setMaterial(text);
      setReport(feedback);
      const asg = await createAssignment({
        data: {
          classId: "unfiled",
          title: title.trim() || "Assignment",
          instructionsText: text.slice(0, 60000),
          sourceFiles: [],
          guidance: null,
        },
      });
      await updateAssignment({
        data: {
          id: asg.id,
          patch: {
            submissions: [{
              id: uid("sub"),
              submittedAt: new Date().toISOString(),
              fileNames: [],
              workText: text.slice(0, 20000),
              feedback,
            }],
          },
        },
      });
      setSavedId(asg.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  async function fileIt() {
    if (!classId || !report) return;
    const chosen = classes.find((c) => c.id === classId);
    const chapter = chapters.find((s) => s.id === chapterId);
    const asg = await createAssignment({
      data: {
        classId,
        title: title.trim() || "Assignment",
        instructionsText: material.slice(0, 60000),
        sourceFiles: chapter ? [chapter.name] : [],
        guidance: null,
      },
    });
    await updateAssignment({
      data: {
        id: asg.id,
        patch: {
          submissions: [{
            id: uid("sub"),
            submittedAt: new Date().toISOString(),
            fileNames: [],
            workText: material.slice(0, 20000),
            feedback: report,
          }],
        },
      },
    });
    setFiled(chapter ? `${chosen?.name} · ${chapter.name}` : chosen?.name || "Saved");
  }

  return (
    <AppShell title="Assignment Assistant">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Assignment material</h2>
        <p className="text-xs text-muted">Add the sheet, a photo, a scan, or the finished work. Class and chapter come after the check.</p>
        <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <CaptureBar items={captured} onChange={setCaptured} disabled={busy} />
        <textarea className="min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Or paste the assignment" value={paste} onChange={(e) => setPaste(e.target.value)} />
        {status && <p className="text-xs text-teal">{status}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button disabled={busy} onClick={() => void analyze()}>{busy ? "Working…" : "Check"}</Button>
      </section>
      {report && (
        <section className="mt-4 space-y-3">
          <Report heading="Review of Assignment" text={report.reviewOfAssignment} />
          <Report heading="Completed Work" text={report.assignmentAssessment} />
          <Report heading="Extra Mile" text={report.extraMile} />
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">File it</h3>
            <label className="mt-3 block text-xs text-muted">Class</label>
            <select className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Choose a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="mt-3 block text-xs text-muted">Chapter</label>
            <select className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" value={chapterId} onChange={(e) => setChapterId(e.target.value)} disabled={!classId}>
              <option value="">Choose a chapter</option>
              {chapters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="mt-3 flex gap-2">
              <Button disabled={!classId} onClick={() => void fileIt()}>File it</Button>
              <Button variant="secondary" disabled={!savedId} onClick={() => void setAssignmentArchived({ data: { id: savedId, archived: true } }).then(() => setArchivedNote("Archived"))}>Archive</Button>
            </div>
            {filed && <p className="mt-2 text-sm text-teal">Filed to {filed}.</p>}
            {archivedNote && <p className="mt-2 text-sm text-muted">{archivedNote}. Find it in Archive.</p>}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Report({ heading, text }: { heading: string; text?: string }) {
  return (
    <article className="rounded-xl border border-border bg-card px-4 py-3">
      <h3 className="font-bold">{heading}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm">{text || "TBD"}</p>
    </article>
  );
}
