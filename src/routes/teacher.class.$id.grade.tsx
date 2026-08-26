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
  const [points, setPoints] = useState("50");
  const [blank, setBlank] = useState<CapturedFile[]>([]);
  const [key, setKey] = useState<CapturedFile[]>([]);
  const [scans, setScans] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getTeacherClassById({ data: id }).then(setCls);
  }, [id]);

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

  async function run() {
    if (!cls) return;
    if (!name.trim()) {
      setError("Assessment name is required.");
      return;
    }
    if (!scans.length && !key.length && !blank.length) {
      setError("Upload at least the student tests (and ideally blank test + answer key).");
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
        `BLANK / TEST FORM:\n${await labelGroup(blank)}\n\nANSWER KEY:\n${await labelGroup(key)}\n\nSTUDENT SCANS:\n${await labelGroup(scans)}\n\nCOMBINED:\n${extracted.text || ""}`;

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

  if (!cls) {
    return (
      <AppShell title="Scan / Upload Tests">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Scan / Upload Tests"
      right={
        <span className="text-xs text-muted">
          {cls.name}
          {cls.courseLevel ? ` – ${cls.courseLevel}` : ""}
        </span>
      }
    >
      <Link to="/teacher/class/$id" params={{ id }} className="mb-3 inline-block text-sm text-teal hover:underline">
        ← {cls.name}
      </Link>

      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Upload assessment batch</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-muted">
            Assessment Name
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Quiz 4 – Genetics"
              disabled={busy}
            />
          </label>
          <label className="block text-xs text-muted">
            Assessment Type
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={type}
              onChange={(e) => setType(e.target.value as AssessmentType)}
              disabled={busy}
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Topics Covered
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Mendelian genetics, Punnett squares"
              disabled={busy}
            />
          </label>
          <label className="block text-xs text-muted">
            Total Points
            <input
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <UploadBlock title="1. Blank Test (optional)" hint="PDF of the original assessment">
            <CaptureBar items={blank} onChange={setBlank} disabled={busy} />
          </UploadBlock>
          <UploadBlock title="2. Answer Key" hint="PDF or document with correct answers / rubric">
            <CaptureBar items={key} onChange={setKey} disabled={busy} />
          </UploadBlock>
          <UploadBlock title="3. Student Tests (batch scan)" hint="Single PDF of the full class set, or multiple files">
            <CaptureBar items={scans} onChange={setScans} disabled={busy} />
          </UploadBlock>
        </div>

        {status && <p className="mt-3 text-xs text-teal">{status}</p>}
        {error && <p className="mt-3 text-sm text-red">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => void navigate({ to: "/teacher/class/$id", params: { id } })}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void run()}>
            {busy ? "Grading…" : "Grade & Analyze"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function UploadBlock({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-bg/50 p-3">
      <div className="mb-1 text-sm font-medium text-fg">{title}</div>
      <div className="mb-2 text-xs text-muted">{hint}</div>
      {children}
    </div>
  );
}
