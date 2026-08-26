import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, gradeTeacherAssessment } from "@/lib/ai";
import { createTeacherAssessment, getTeacherClassById } from "@/lib/data";
import { ASSESSMENT_TYPES, type AssessmentType, type TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/class/$id/grade")({
  component: GradePage,
});

function GradePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AssessmentType>("Quiz");
  const [topics, setTopics] = useState("");
  const [points, setPoints] = useState("100");
  const [blank, setBlank] = useState<CapturedFile[]>([]);
  const [key, setKey] = useState<CapturedFile[]>([]);
  const [scans, setScans] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getTeacherClassById({ data: id }).then(setCls);
  }, [id]);

  async function run() {
    if (!cls) return;
    if (!name.trim()) {
      setError("Name this assessment (e.g. Chapter 3 Quiz).");
      return;
    }
    if (!scans.length && !key.length && !blank.length) {
      setError("Upload at least the student scans (and ideally the blank test + answer key).");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading uploads…");
    try {
      const all = [...blank, ...key, ...scans];
      const payloads = await capturedToPayloads(all);
      const extracted = await extractMaterials({ data: { files: payloads } });
      const labeled =
        `BLANK / TEST FORM:\n` +
        (await labelGroup(blank)) +
        `\n\nANSWER KEY:\n` +
        (await labelGroup(key)) +
        `\n\nSTUDENT SCANS:\n` +
        (await labelGroup(scans)) +
        `\n\nCOMBINED EXTRACT:\n` +
        (extracted.text || "");

      setStatus("Grading and building class + student feedback…");
      const graded = await gradeTeacherAssessment({
        data: {
          schoolType: cls.schoolType,
          subject: cls.subject,
          gradeLevel: cls.gradeLevel,
          courseLevel: cls.courseLevel,
          schoolName: cls.schoolName,
          assessmentName: name.trim(),
          assessmentType: type,
          topics: topics.trim() || "General",
          pointsPossible: Number(points) || 100,
          extractedText: labeled,
        },
      });

      const assessment = await createTeacherAssessment({
        data: {
          classId: id,
          name: name.trim(),
          type,
          topics: topics.trim(),
          pointsPossible: Number(points) || 100,
          sourceFiles: extracted.attachments.map((a) => a.name),
          classAverage: Number(graded.classAverage) || 0,
          topicScores: graded.topicScores || [],
          strengths: graded.strengths || [],
          needs: graded.needs || [],
          results: graded.results || [],
        },
      });
      await navigate({
        to: "/teacher/class/$id/assessment/$assessmentId",
        params: { id, assessmentId: assessment.id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
      setBusy(false);
      setStatus("");
    }
  }

  async function labelGroup(items: CapturedFile[]) {
    if (!items.length) return "(none)";
    try {
      const payloads = await capturedToPayloads(items);
      const extracted = await extractMaterials({ data: { files: payloads } });
      return extracted.text || items.map((i) => i.file.name).join(", ");
    } catch {
      return items.map((i) => i.file.name).join(", ");
    }
  }

  if (!cls) {
    return (
      <AppShell title="Grade">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Grade scanned tests">
      <Link to="/teacher/class/$id" params={{ id }} className="mb-4 inline-block text-sm text-teal hover:underline">
        ← {cls.name}
      </Link>
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-sm text-muted">
          Upload the blank test, answer key, and student packet (photos, scans, or PDFs). Results follow school-type
          best practice — not a one-size-fits-all model.
        </p>
        <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Assessment name *" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        <div className="grid grid-cols-2 gap-2">
          <select className="rounded-lg border border-border px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as AssessmentType)} disabled={busy}>
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="Points possible" value={points} onChange={(e) => setPoints(e.target.value)} disabled={busy} />
        </div>
        <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Topics covered (comma-separated)" value={topics} onChange={(e) => setTopics(e.target.value)} disabled={busy} />

        <section className="rounded-xl border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-semibold">1. Blank test / instructions</h3>
          <CaptureBar items={blank} onChange={setBlank} disabled={busy} />
        </section>
        <section className="rounded-xl border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-semibold">2. Answer key</h3>
          <CaptureBar items={key} onChange={setKey} disabled={busy} />
        </section>
        <section className="rounded-xl border border-border bg-card p-3">
          <h3 className="mb-2 text-sm font-semibold">3. Student tests (batch scan)</h3>
          <CaptureBar items={scans} onChange={setScans} disabled={busy} />
        </section>

        {status && <p className="text-xs text-teal">{status}</p>}
        {error && <p className="text-sm text-red">{error}</p>}
        <Button disabled={busy} onClick={() => void run()}>
          {busy ? "Grading…" : "Grade & analyze"}
        </Button>
      </div>
    </AppShell>
  );
}
