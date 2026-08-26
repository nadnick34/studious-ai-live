import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getTeacherClassById, getTeacherClassStats, listTeacherAssessments } from "@/lib/data";
import type { TeacherAssessment, TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/class/$id/student/$studentId")({
  component: StudentDetailPage,
});

function StudentDetailPage() {
  const { id, studentId } = Route.useParams();
  const name = decodeURIComponent(studentId);
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getTeacherClassStats>> | null>(null);

  useEffect(() => {
    void Promise.all([
      getTeacherClassById({ data: id }),
      listTeacherAssessments({ data: id }),
      getTeacherClassStats({ data: id }),
    ]).then(([c, a, s]) => {
      setCls(c);
      setAssessments(a);
      setStats(s);
    });
  }, [id]);

  const student = stats?.students.find((s) => s.name === name);
  const results = useMemo(() => {
    const rows: { assessment: string; score: number; status: string; focus: string[]; tips: string[]; missed: { question: string; correct: string }[] }[] = [];
    for (const a of assessments) {
      const r = a.results.find((x) => x.studentName === name);
      if (r) {
        rows.push({
          assessment: a.name,
          score: r.score,
          status: r.status,
          focus: r.focusAreas || [],
          tips: r.studyTips || [],
          missed: r.missed || [],
        });
      }
    }
    return rows;
  }, [assessments, name]);

  const topicHits = new Map<string, number[]>();
  for (const a of assessments) {
    for (const t of a.topicScores || []) {
      // approximate: if student score near topic, skip; use focus areas instead
    }
  }
  const focusAll = [...new Set(results.flatMap((r) => r.focus))];
  const tipsAll = [...new Set(results.flatMap((r) => r.tips))];
  const achievements: string[] = [];
  if ((student?.average || 0) >= 85) achievements.push("Strong overall average");
  if (results.length >= 2) {
    const recent = results.slice(0, 3).map((r) => r.score);
    if (recent.length >= 2 && recent[0] >= recent[recent.length - 1]) {
      achievements.push("Improving or steady trend on recent assessments");
    }
  }
  if ((student?.status === "Strong" || student?.status === "On Track") && achievements.length === 0) {
    achievements.push("On track with class expectations");
  }

  const strongest = assessments[0]?.topicScores?.slice().sort((a, b) => b.average - a.average)[0];
  const weakest = assessments[0]?.topicScores?.slice().sort((a, b) => a.average - b.average)[0];

  if (!cls) {
    return (
      <AppShell title="Student">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

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
      <Link to="/teacher/class/$id" params={{ id }} className="mb-3 inline-block text-sm text-teal hover:underline">
        ← {cls.name}
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-fg">{name}</h2>
          <p className="text-sm text-muted">
            Grade {cls.gradeLevel || "—"} · Overall Average: {student?.average ?? "—"}%
          </p>
        </div>
        {student && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              student.status === "Needs Support"
                ? "bg-amber-100 text-amber-800"
                : student.status === "At Risk"
                  ? "bg-red-100 text-red-800"
                  : student.status === "Strong"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-teal-100 text-teal-800"
            }`}
          >
            {student.status}
          </span>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Overall Avg" value={`${student?.average ?? "—"}%`} />
        <MiniStat label="Last Quiz" value={student?.lastQuiz != null ? `${student.lastQuiz}%` : "—"} />
        <MiniStat
          label="Strongest"
          value={strongest?.topic || "—"}
          sub={strongest ? `${Math.round(strongest.average)}%` : undefined}
        />
        <MiniStat
          label="Weakest"
          value={weakest?.topic || "—"}
          sub={weakest ? `${Math.round(weakest.average)}%` : undefined}
        />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-800">Achievements</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-900/90">
            {(achievements.length ? achievements : ["Keep collecting evidence from graded sets"]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Focus Areas</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/90">
            {(focusAll.length ? focusAll : ["Grade an assessment to generate focus areas"]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold text-fg">Assessment history</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>{r.assessment}</span>
                <span className="font-semibold">
                  {r.score}% · {r.status}
                </span>
              </div>
            ))}
          </div>
          {tipsAll.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-muted uppercase">Study tips</h4>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {tipsAll.slice(0, 6).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold text-fg">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}
