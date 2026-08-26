import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getTeacherAssessmentById, getTeacherClassById } from "@/lib/data";
import type { StudentResult, TeacherAssessment, TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/class/$id/assessment/$assessmentId")({
  component: AssessmentAnalyticsPage,
});

function statusStyle(status: string) {
  if (status === "Strong") return "bg-emerald-50 text-emerald-700";
  if (status === "On Track") return "bg-teal-50 text-teal-700";
  if (status === "Needs Support") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function barColor(avg: number) {
  if (avg >= 80) return "bg-emerald-500";
  if (avg >= 70) return "bg-teal-500";
  if (avg >= 65) return "bg-amber-500";
  return "bg-red-500";
}

function AssessmentAnalyticsPage() {
  const { id, assessmentId } = Route.useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [asg, setAsg] = useState<TeacherAssessment | null>(null);
  const [student, setStudent] = useState<StudentResult | null>(null);

  useEffect(() => {
    void Promise.all([
      getTeacherClassById({ data: id }),
      getTeacherAssessmentById({ data: assessmentId }),
    ]).then(([c, a]) => {
      setCls(c);
      setAsg(a);
    });
  }, [id, assessmentId]);

  if (!cls || !asg) {
    return (
      <AppShell title="Analytics">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const topics = [...(asg.topicScores || [])].sort((a, b) => b.average - a.average);
  const highest = topics[0];
  const lowest = topics.length ? topics[topics.length - 1] : null;
  const atRisk = asg.results.filter((r) => r.score < 65).length;

  if (student) {
    return (
      <AppShell
        title="Student Summary"
        right={
          <div className="flex gap-2">
            <Button variant="secondary" className="text-xs" onClick={() => window.print()}>
              Print for Student
            </Button>
            <Button className="text-xs" onClick={() => setStudent(null)}>
              Back to Analytics
            </Button>
          </div>
        }
      >
        <button type="button" className="mb-3 text-sm text-teal hover:underline" onClick={() => setStudent(null)}>
          ← Analytics
        </button>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-fg">{student.studentName}</h2>
          <p className="mt-1 text-sm text-muted">
            {cls.name}
            {cls.courseLevel ? ` – ${cls.courseLevel}` : ""} · {asg.name} · Score: {student.score}% (
            {student.pointsEarned}/{student.pointsPossible})
            {cls.schoolName ? ` · ${cls.schoolName}` : ""}
          </p>

          <h3 className="mt-5 text-sm font-semibold text-fg">What You Missed</h3>
          <div className="mt-2 space-y-2">
            {(student.missed?.length ? student.missed : [{ question: "No specific missed items recorded.", correct: "—" }]).map(
              (m, i) => (
                <div key={i} className="rounded-lg border-l-4 border-red-300 bg-red-50/80 px-3 py-2 text-sm">
                  <p className="font-medium text-fg">{m.question}</p>
                  {m.studentAnswer && <p className="text-xs text-muted">Your answer: {m.studentAnswer}</p>}
                  <p className="text-emerald-700">Correct: {m.correct}</p>
                </div>
              ),
            )}
          </div>

          <h3 className="mt-5 text-sm font-semibold text-fg">What You Need to Focus On</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {(student.focusAreas?.length ? student.focusAreas : ["Review the topics marked above."]).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-semibold text-fg">Study Tips for Next Time</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {(student.studyTips?.length ? student.studyTips : ["Practice similar problems before the next assessment."]).map(
              (f, i) => (
                <li key={i}>{f}</li>
              ),
            )}
          </ul>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Analytics – ${asg.name}`}
      right={
        <span className="text-xs text-muted">
          {cls.name} · {asg.results.length} student{asg.results.length === 1 ? "" : "s"}
        </span>
      }
    >
      <Link to="/teacher/class/$id" params={{ id }} className="mb-3 inline-block text-sm text-teal hover:underline">
        ← {cls.name}
      </Link>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Class Average" value={`${Math.round(asg.classAverage)}%`} />
        <Stat
          label="Highest Topic"
          value={highest?.topic || "—"}
          sub={highest ? `${Math.round(highest.average)}% avg` : undefined}
        />
        <Stat
          label="Lowest Topic"
          value={lowest?.topic || "—"}
          sub={lowest ? `${Math.round(lowest.average)}% avg` : undefined}
        />
        <Stat label="At Risk" value={String(atRisk)} sub="Below 65%" valueClass="text-red-600" />
      </div>

      {topics.length > 0 && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold text-fg">Performance by Topic</h3>
          <div className="space-y-2.5">
            {topics.map((t) => (
              <div key={t.topic} className="grid grid-cols-[140px_1fr_40px] items-center gap-2 text-sm">
                <span className="truncate text-fg">{t.topic}</span>
                <div className="h-3 overflow-hidden rounded-full bg-bg">
                  <div
                    className={`h-full rounded-full ${barColor(t.average)}`}
                    style={{ width: `${Math.min(100, Math.max(4, t.average))}%` }}
                  />
                </div>
                <span className="text-right text-xs font-semibold">{Math.round(t.average)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-800">Strengths</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-900/90">
            {(asg.strengths.length ? asg.strengths : ["—"]).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Topics That Need Attention</h3>
          <ul className="space-y-2 text-sm text-amber-900/90">
            {(asg.needs.length ? asg.needs : [{ topic: "—", note: "No gaps flagged" }]).map((n, i) => (
              <li key={i}>
                <span className="font-semibold">{n.topic}</span>
                {n.note ? ` – ${n.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold text-fg">Students – Click for Individual Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/60 text-[11px] tracking-wide text-muted uppercase">
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {asg.results.map((r) => (
                <tr
                  key={r.studentName}
                  className="cursor-pointer border-b border-border/70 hover:bg-bg"
                  onClick={() => setStudent(r)}
                >
                  <td className="px-4 py-3 font-medium text-fg">{r.studentName}</td>
                  <td className="px-4 py-3">{r.score}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-teal">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
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
      <div className={`mt-1 text-xl font-bold text-fg ${valueClass || ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}
