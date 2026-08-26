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
  remapResultsToRoster,
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
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
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
  const [allFiles, setAllFiles] = useState<CapturedFile[]>([]);
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

  function namesLikelySame(a: string, b: string) {
    const na = a.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const nb = b.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!na || !nb) return false;
    if (na === nb) return true;
    const ta = na.split(" ");
    const tb = nb.split(" ");
    const lastA = ta[ta.length - 1];
    const lastB = tb[tb.length - 1];
    const firstA = ta[0];
    const firstB = tb[0];
    return lastA === lastB && (firstA === firstB || firstA[0] === firstB[0]);
  }

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
      const r = (a.results || []).find((x) => namesLikelySame(x.studentName, selectedName));
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
    if (!allFiles.length) {
      setError("Upload the answer key and completed student tests (blank test optional) in the box below.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Reading all uploaded files…");
    try {
      const payloads = await capturedToPayloads(allFiles);
      const extracted = await extractMaterials({ data: { files: payloads } });
      const text = (extracted.text || "").trim();
      if (text.length < 40) {
        throw new Error(
          "Could not read enough text from the uploads. Use text-based PDFs when possible, or photo/scan each page clearly.",
        );
      }

      const fileList = allFiles.map((f) => f.file.name).join(", ");
      const labeled =
        `FILES UPLOADED: ${fileList}\n\n` +
        `The following may include a blank test, an official answer key, and/or a multi-student completed-test batch. ` +
        `Identify each type yourself.\n\n` +
        text;

      const rosterNames = (stats?.students || []).map((s) => s.name).filter(Boolean);

      setStatus("Identifying key vs student tests, matching roster, and scoring…");
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

      let results = Array.isArray(graded.results) ? graded.results : [];
      if (!results.length) {
        const hint = (graded as { _rawPreview?: string })._rawPreview;
        throw new Error(
          "No student results came back. Make sure the student batch shows names and answers, and the answer key is included. " +
            (hint ? `Model note: ${hint.slice(0, 180)}` : "Try fewer pages or clearer PDFs."),
        );
      }

      results = await remapResultsToRoster({ data: { classId: id, results } });

      setStatus(`Saving ${results.length} student result(s) and updating roster…`);
      const assessment = await createTeacherAssessment({
        data: {
          classId: id,
          name: gName.trim(),
          type: gType,
          topics: gTopics.trim(),
          pointsPossible: Number(gPoints) || 100,
          sourceFiles: allFiles.map((f) => f.file.name),
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
      setAllFiles([]);
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
            One upload area for everything: blank test, answer key, and the full student batch. AI separates them,
            matches roster names, scores, and fills strengths / focus areas.
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

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-fg">Upload files</div>
            <p className="mb-2 text-xs text-muted">
              Add the blank test, answer key, and completed student tests together (PDFs, photos, or scans). Studious
              figures out which is which, matches names to your roster, scores against the key, and updates averages.
            </p>
            <div className="rounded-xl border border-dashed border-border bg-bg/50 p-3">
              <CaptureBar items={allFiles} onChange={setAllFiles} disabled={busy} />
            </div>
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
    const selectedTest = studentResults.find((r) => r.assessmentId === selectedTestId) || null;
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
        <button
          type="button"
          className="mb-3 text-sm text-teal hover:underline"
          onClick={() => {
            if (selectedTestId) setSelectedTestId(null);
            else {
              setView("overview");
              setSelectedName(null);
            }
          }}
        >
          ← {selectedTestId ? selectedName : cls.name}
        </button>

        {selectedTest ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-fg">{selectedName}</h2>
            <p className="mt-1 text-sm text-muted">
              {selectedTest.assessment} · {selectedTest.score}% · {selectedTest.status}
            </p>
            <h3 className="mt-5 text-sm font-semibold text-fg">What went well</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {(selectedTest.focus.length === 0 && selectedTest.score >= 80
                ? ["Solid performance on this assessment"]
                : selectedTest.score >= 75
                  ? ["Several items correct — keep using the same process"]
                  : ["Review the missed items below and retry similar problems"]
              ).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-semibold text-fg">What you missed</h3>
            <div className="mt-2 space-y-2">
              {(selectedTest.missed.length ? selectedTest.missed : [{ question: "No missed items recorded.", correct: "—" }]).map(
                (m, i) => (
                  <div key={i} className="rounded-lg border-l-4 border-red-300 bg-red-50/80 px-3 py-2 text-sm">
                    <p className="font-medium">{m.question}</p>
                    {m.studentAnswer && <p className="text-xs text-muted">Answered: {m.studentAnswer}</p>}
                    <p className="text-emerald-700">Correct: {m.correct}</p>
                  </div>
                ),
              )}
            </div>
            {selectedTest.focus.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-fg">Focus for this test</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {selectedTest.focus.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
            {selectedTest.tips.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-fg">Study tips</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {selectedTest.tips.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-fg">{selectedName}</h2>
                <p className="text-sm text-muted">
                  Grade {cls.gradeLevel || "—"} · Combined average: {selectedRow?.average ?? "—"}%
                </p>
              </div>
              {selectedRow && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedRow.status)}`}>
                  {selectedRow.status}
                </span>
              )}
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniStat label="Combined Avg" value={`${selectedRow?.average ?? "—"}%`} />
              <MiniStat label="Last Test" value={selectedRow?.lastQuiz != null ? `${selectedRow.lastQuiz}%` : "—"} />
              <MiniStat label="Tests Graded" value={String(studentResults.length)} />
              <MiniStat label="Overall Status" value={selectedRow?.status || "—"} />
            </div>
            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
                <h3 className="mb-2 text-sm font-semibold text-emerald-800">Combined assessment — strengths</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-900/90">
                  {(achievements.length ? achievements : ["Grade more assessments to build a combined picture"]).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">Combined assessment — focus</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/90">
                  {(focusAll.length ? focusAll : ["No focus areas yet — grade a scan set"]).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-semibold text-fg">Assessments — click for this test</h3>
              </div>
              {studentResults.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  No graded tests mapped to this student yet. Upload a batch and grade it to attach scores.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {studentResults.map((r) => (
                    <button
                      key={r.assessmentId}
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-bg"
                      onClick={() => setSelectedTestId(r.assessmentId)}
                    >
                      <div>
                        <div className="font-medium text-fg">{r.assessment}</div>
                        <div className="text-xs text-muted">{r.status}</div>
                      </div>
                      <div className="text-lg font-bold text-fg">{r.score}%</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
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
                      setSelectedTestId(null);
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

