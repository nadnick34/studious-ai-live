import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { extractMaterials, gradeTeacherAssessment } from "@/lib/ai";
import {
  applyAssessmentResultsToRoster,
  createTeacherAssessment,
  getTeacherClassById,
  getTeacherClassStats,
  listTeacherAssessments,
} from "@/lib/data";
import {
  ASSESSMENT_TYPES,
  type AssessmentType,
  type TeacherAssessment,
  type TeacherClass,
} from "@/lib/types";

export const Route = createFileRoute("/teacher/class/$id")({
  component: TeacherClassPage,
});

type RosterRow = {
  id: string;
  name: string;
  average: number;
  lastQuiz: number | null;
  status: string;
};

type View = "overview" | "student" | "grade";

function statusStyle(status: string) {
  if (status === "Strong") return "bg-emerald-50 text-emerald-700";
  if (status === "On Track") return "bg-teal-50 text-teal-700";
  if (status === "Needs Support") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function TeacherClassPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("overview");
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    classAverage: number;
    studentCount: number;
    onTrack: number;
    needSupport: number;
    assessmentCount: number;
    students: RosterRow[];
    assessments: TeacherAssessment[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Grade form state
  const [gName, setGName] = useState("");
  const [gType, setGType] = useState<AssessmentType>("Quiz");
  const [gTopics, setGTopics] = useState("");
  const [gPoints, setGPoints] = useState("50");
  const [blank, setBlank] = useState<CapturedFile[]>([]);
  const [keyFiles, setKeyFiles] = useState<CapturedFile[]>([]);
  const [scans, setScans] = useState<CapturedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [c, s, a] = await Promise.all([
      getTeacherClassById({ data: id }),
      getTeacherClassStats({ data: id }),
      listTeacherAssessments({ data: id }),
    ]);
    setCls(c);
    setStats(s);
    setAssessments(a);
  }

  useEffect(() => {
    void reload().catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load class"));
  }, [id]);

  const studentResults = useMemo(() => {
    if (!selectedName) return [];
    const rows: {
      assessment: string;
      assessmentId: string;
      score: number;
      status: string;
      focus: string[];
      tips: string[];
      missed: { question: string; studentAnswer?: string; correct: string }[];
    }[] = [];
    for (const a of assessments) {
      const r = (a.results || []).find((x) => x.studentName === selectedName);
      if (r) {
        rows.push({
          assessment: a.name,
          assessmentId: a.id,
          score: r.score,
          status: r.status,
          focus: r.focusAreas || [],
          tips: r.studyTips || [],
          missed: r.missed || [],
        });
      }
    }
    return rows;
  }, [assessments, selectedName]);

  const selectedRow = stats?.students.find((s) => s.name === selectedName);
  const focusAll = [...new Set(studentResults.flatMap((r) => r.focus))];
  const tipsAll = [...new Set(studentResults.flatMap((r) => r.tips))];
  const achievements: string[] = [];
  if ((selectedRow?.average || 0) >= 85) achievements.push("Strong overall average");
  if (studentResults.length >= 2) {
    const scores = studentResults.map((r) => r.score);
    if (scores[0] >= scores[scores.length - 1]) achievements.push("Improving or steady on recent assessments");
  }
  if (selectedRow && (selectedRow.status === "Strong" || selectedRow.status === "On Track") && !achievements.length) {
    achievements.push("On track with class expectations");
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

  async function runGrade() {
    if (!cls) return;
    if (!gName.trim()) {
      setError("Assessment name is required.");
      return;
    }
    if (!scans.length && !keyFiles.length && !blank.length) {
      setError("Upload the answer key and the student test batch (blank test optional).");
      return;
    }
    if (!keyFiles.length) {
      setError("Upload the official answer key so scores can be checked against correct answers.");
      return;
    }
    if (!scans.length) {
      setError("Upload the student tests batch PDF (all completed tests).");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading blank test, answer key, and student batch…");
    try {
      async function extractLabeled(label: string, items: CapturedFile[]) {
        if (!items.length) return `${label}:\n(none)\n`;
        const payloads = await capturedToPayloads(items);
        const extracted = await extractMaterials({ data: { files: payloads } });
        const names = items.map((i) => i.file.name).join(", ");
        return `${label} (files: ${names}):\n${extracted.text || "(no text extracted)"}\n`;
      }

      const labeled = [
        await extractLabeled("=== BLANK TEST ===", blank),
        await extractLabeled("=== ANSWER KEY (source of truth) ===", keyFiles),
        await extractLabeled("=== STUDENT BATCH (completed tests) ===", scans),
      ].join("\n");

      if (labeled.length < 80) {
        throw new Error("Could not read enough text from the PDFs. Try text-based PDFs or clearer scans.");
      }

      const rosterNames = (stats?.students || []).map((s) => s.name).filter(Boolean);

      setStatus("Matching students to the roster and scoring against the answer key…");
      const graded = await gradeTeacherAssessment({
        data: {
          schoolType: cls.schoolType,
          subject: cls.subject,
          gradeLevel: cls.gradeLevel,
          courseLevel: cls.courseLevel,
          schoolName: cls.schoolName,
          assessmentName: gName.trim(),
          assessmentType: gType,
          topics: gTopics.trim() || "General",
          pointsPossible: Number(gPoints) || 100,
          rosterNames,
          extractedText: labeled,
        },
      });

      const results = Array.isArray(graded.results) ? graded.results : [];
      if (!results.length) {
        throw new Error(
          "No student results were returned. Check that the batch PDF shows student names and marked answers, and that the answer key is readable.",
        );
      }

      setStatus(`Saving results for ${results.length} student(s) and updating roster scores…`);
      const assessment = await createTeacherAssessment({
        data: {
          classId: id,
          name: gName.trim(),
          type: gType,
          topics: gTopics.trim(),
          pointsPossible: Number(gPoints) || 100,
          sourceFiles: [...blank, ...keyFiles, ...scans].map((f) => f.file.name),
          classAverage: Number(graded.classAverage) || 0,
          topicScores: Array.isArray(graded.topicScores) ? graded.topicScores : [],
          strengths: Array.isArray(graded.strengths) ? graded.strengths : [],
          needs: Array.isArray(graded.needs) ? graded.needs : [],
          results,
        },
      });

      await applyAssessmentResultsToRoster({
        data: {
          classId: id,
          results: results.map((r: { studentName: string; score: number }) => ({
            studentName: r.studentName,
            score: r.score,
          })),
        },
      });

      setStatus("Done — opening analytics…");
      setView("overview");
      setBlank([]);
      setKeyFiles([]);
      setScans([]);
      setGName("");
      setGTopics("");
      await reload();
      await navigate({
        to: "/teacher/class/$id/assessment/$assessmentId",
        params: { id, assessmentId: assessment.id },
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Grading failed");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <AppShell title="Class">
        <p className="text-sm text-red">{loadError}</p>
        <Link to="/teacher" className="mt-3 inline-block text-sm text-teal">
          ← Dashboard
        </Link>
      </AppShell>
    );
  }

  if (!cls || !stats) {
    return (
      <AppShell title="Class">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  // —— GRADE VIEW ——
  if (view === "grade") {
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
        <button
          type="button"
          className="mb-3 text-sm text-teal hover:underline"
          onClick={() => {
            setView("overview");
            setError(null);
            setStatus("");
          }}
        >
          ← {cls.name}
        </button>

        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
            Upload assessment batch
          </div>
          <p className="mb-3 text-xs text-muted">
            Upload the blank test (optional), the official answer key, and one PDF of all completed student tests.
            Studious matches names to your roster, scores against the key, updates averages, and builds class and
            individual strengths / focus areas.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted">
              Assessment Name
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                placeholder="Quiz 4 – Genetics"
                disabled={busy}
              />
            </label>
            <label className="block text-xs text-muted">
              Assessment Type
              <select
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={gType}
                onChange={(e) => setGType(e.target.value as AssessmentType)}
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
                value={gTopics}
                onChange={(e) => setGTopics(e.target.value)}
                placeholder="Mendelian genetics, Punnett squares"
                disabled={busy}
              />
            </label>
            <label className="block text-xs text-muted">
              Total Points
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
                value={gPoints}
                onChange={(e) => setGPoints(e.target.value)}
                disabled={busy}
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <UploadBlock title="1. Blank Test (optional)" hint="PDF of the original assessment">
              <CaptureBar items={blank} onChange={setBlank} disabled={busy} />
            </UploadBlock>
            <UploadBlock title="2. Answer Key" hint="PDF or document with correct answers / rubric">
              <CaptureBar items={keyFiles} onChange={setKeyFiles} disabled={busy} />
            </UploadBlock>
            <UploadBlock title="3. Student Tests (batch scan)" hint="Single PDF of the full class set, or multiple files">
              <CaptureBar items={scans} onChange={setScans} disabled={busy} />
            </UploadBlock>
          </div>

          {status && <p className="mt-3 text-xs text-teal">{status}</p>}
          {error && <p className="mt-3 text-sm text-red">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setView("overview");
                setError(null);
                setStatus("");
              }}
            >
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void runGrade()}>
              {busy ? "Grading…" : "Grade & Analyze"}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // —— STUDENT DETAIL ——
  if (view === "student" && selectedName) {
    return (
      <AppShell
        title="Student Detail"
        right={
          <span className="text-xs text-muted">
            {cls.name}
            {cls.courseLevel ? ` – ${cls.courseLevel}` : ""}
          </span>
        }
      >
        <button type="button" className="mb-3 text-sm text-teal hover:underline" onClick={() => { setView("overview"); setSelectedName(null); }}>
          ← {cls.name}
        </button>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-fg">{selectedName}</h2>
            <p className="text-sm text-muted">
              Grade {cls.gradeLevel || "—"} · Overall Average: {selectedRow?.average ?? "—"}%
            </p>
          </div>
          {selectedRow && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedRow.status)}`}>
              {selectedRow.status}
            </span>
          )}
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Overall Avg" value={`${selectedRow?.average ?? "—"}%`} />
          <MiniStat label="Last Quiz" value={selectedRow?.lastQuiz != null ? `${selectedRow.lastQuiz}%` : "—"} />
          <MiniStat label="Assessments" value={String(studentResults.length)} />
          <MiniStat label="Status" value={selectedRow?.status || "—"} />
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-emerald-800">Achievements</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-900/90">
              {(achievements.length ? achievements : ["Grade assessments to build achievement history"]).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
            <h3 className="mb-2 text-sm font-semibold text-amber-800">Focus Areas</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/90">
              {(focusAll.length ? focusAll : ["No focus areas yet — grade a scan set"]).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
        {studentResults.length > 0 ? (
          <div className="space-y-4">
            {studentResults.map((r) => (
              <div key={r.assessmentId} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-fg">{r.assessment}</div>
                  <div className="text-sm">
                    <span className="font-bold">{r.score}%</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${statusStyle(r.status)}`}>{r.status}</span>
                  </div>
                </div>
                {r.missed.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs font-semibold text-muted uppercase">What was missed</div>
                    {r.missed.map((m, i) => (
                      <div key={i} className="rounded-lg border-l-4 border-red-300 bg-red-50/80 px-3 py-2 text-sm">
                        <p className="font-medium">{m.question}</p>
                        {m.studentAnswer && <p className="text-xs text-muted">Answered: {m.studentAnswer}</p>}
                        <p className="text-emerald-700">Correct: {m.correct}</p>
                      </div>
                    ))}
                  </div>
                )}
                {r.tips.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                    {r.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {tipsAll.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Study tips</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {tipsAll.slice(0, 8).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted">
            No graded results for this student yet. Use <strong>Scan / Upload Tests</strong> to grade a class set.
          </p>
        )}
      </AppShell>
    );
  }

  // —— OVERVIEW ——
  return (
    <AppShell
      title={`${cls.name}${cls.courseLevel ? ` – ${cls.courseLevel}` : ""}`}
      right={
        <span className="text-xs text-muted">
          {stats.studentCount} student{stats.studentCount === 1 ? "" : "s"}
          {cls.schoolType ? ` · ${cls.schoolType.split(/[–/]/)[0].trim()}` : ""}
        </span>
      }
    >
      <Link to="/teacher" className="mb-3 inline-block text-sm text-teal hover:underline">
        ← Dashboard
      </Link>

      <div className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">Class overview</div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-fg">
          {cls.name}
          {cls.courseLevel ? ` – ${cls.courseLevel}` : ""}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="text-xs"
            type="button"
            onClick={() => {
              setError(null);
              setStatus("");
              setView("grade");
            }}
          >
            Scan / Upload Tests
          </Button>
          <Button
            className="text-xs"
            type="button"
            onClick={() => {
              const latest = stats.assessments[0];
              if (latest) {
                void navigate({
                  to: "/teacher/class/$id/assessment/$assessmentId",
                  params: { id, assessmentId: latest.id },
                });
              } else {
                setView("grade");
              }
            }}
          >
            View Analytics
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Class Average" value={`${stats.classAverage}%`} sub="Last assessments" />
        <StatCard label="Students On Track" value={String(stats.onTrack)} sub={`of ${stats.studentCount || "—"}`} />
        <StatCard
          label="Need Support"
          value={String(stats.needSupport)}
          sub="Below 75%"
          valueClass={stats.needSupport > 0 ? "text-amber-600" : undefined}
        />
        <StatCard label="Assessments" value={String(stats.assessmentCount)} sub="This term" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold text-fg">Students</h3>
        </div>
        {stats.students.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No students yet. Add a roster when creating the class, or grade a scanned set to populate results.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/60 text-[11px] tracking-wide text-muted uppercase">
                  <th className="px-4 py-2.5 font-semibold">Student</th>
                  <th className="px-4 py-2.5 font-semibold">Avg</th>
                  <th className="px-4 py-2.5 font-semibold">Last quiz</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.students.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-border/70 hover:bg-bg"
                    onClick={() => {
                      setSelectedName(s.name);
                      setView("student");
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-teal">{s.name}</td>
                    <td className="px-4 py-3">{s.average}%</td>
                    <td className="px-4 py-3">{s.lastQuiz != null ? `${s.lastQuiz}%` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats.assessments.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-fg">Recent assessments</h3>
          <div className="space-y-2">
            {stats.assessments.slice(0, 8).map((a) => (
              <button
                key={a.id}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-teal/40"
                onClick={() =>
                  void navigate({
                    to: "/teacher/class/$id/assessment/$assessmentId",
                    params: { id, assessmentId: a.id },
                  })
                }
              >
                <div>
                  <div className="font-medium text-fg">{a.name}</div>
                  <div className="text-xs text-muted">
                    {a.type} · {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-lg font-bold text-fg">{Math.round(a.classAverage)}%</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold text-fg ${valueClass || ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold text-fg">{value}</div>
    </div>
  );
}

function UploadBlock({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-bg/50 p-3">
      <div className="mb-1 text-sm font-medium text-fg">{title}</div>
      <div className="mb-2 text-xs text-muted">{hint}</div>
      {children}
    </div>
  );
}
