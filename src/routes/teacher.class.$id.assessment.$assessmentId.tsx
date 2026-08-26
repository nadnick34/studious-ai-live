import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getTeacherAssessmentById, getTeacherClassById } from "@/lib/data";
import type { TeacherAssessment, TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/class/$id/assessment/$assessmentId")({
  component: AssessmentResultsPage,
});

function AssessmentResultsPage() {
  const { id, assessmentId } = Route.useParams();
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [asg, setAsg] = useState<TeacherAssessment | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

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
      <AppShell title="Results">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const student = asg.results.find((r) => r.studentName === selected) || null;

  return (
    <AppShell title={asg.name}>
      <Link to="/teacher/class/$id" params={{ id }} className="mb-4 inline-block text-sm text-teal hover:underline">
        ← {cls.name}
      </Link>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Class average" value={`${Math.round(asg.classAverage)}%`} />
        <Stat label="Students" value={String(asg.results.length)} />
        <Stat label="Type" value={asg.type} />
        <Stat label="Points" value={String(asg.pointsPossible)} />
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 font-semibold text-fg">What landed well</h3>
        <ul className="list-disc pl-5 text-sm">
          {(asg.strengths.length ? asg.strengths : ["—"]).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <h3 className="mb-2 mt-4 font-semibold text-fg">Topics that did not resonate</h3>
        <ul className="space-y-2 text-sm">
          {(asg.needs.length ? asg.needs : [{ topic: "—", note: "No gaps flagged" }]).map((n, i) => (
            <li key={i}>
              <span className="font-medium">{n.topic}</span>
              <span className="text-muted"> — {n.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {asg.topicScores.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold text-fg">Topic performance</h3>
          <div className="space-y-2">
            {asg.topicScores.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{t.topic}</span>
                  <span>{Math.round(t.average)}%</span>
                </div>
                <div className="h-2 rounded bg-bg">
                  <div
                    className="h-2 rounded bg-teal"
                    style={{ width: `${Math.min(100, Math.max(0, t.average))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="mb-2 font-semibold text-fg">Students</h3>
      <div className="mb-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {asg.results.map((r) => (
              <tr
                key={r.studentName}
                className="cursor-pointer border-b border-border/60 hover:bg-bg"
                onClick={() => setSelected(r.studentName)}
              >
                <td className="px-3 py-2 font-medium text-teal">{r.studentName}</td>
                <td className="px-3 py-2">
                  {r.score}% ({r.pointsEarned}/{r.pointsPossible})
                </td>
                <td className="px-3 py-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {student && (
        <div className="rounded-xl border border-border bg-card p-4 print:border-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-fg">{student.studentName} — feedback</h3>
            <button type="button" className="text-xs text-teal" onClick={() => window.print()}>
              Print for student
            </button>
          </div>
          <p className="text-sm">
            Score: <strong>{student.score}%</strong> ({student.pointsEarned}/{student.pointsPossible}) · {student.status}
          </p>
          <h4 className="mt-3 text-xs font-semibold text-muted uppercase">What was missed</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {(student.missed.length ? student.missed : [{ question: "—", correct: "—" }]).map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.question}</span>
                {m.studentAnswer && <span className="text-muted"> (wrote: {m.studentAnswer})</span>}
                <span> → should be: {m.correct}</span>
              </li>
            ))}
          </ul>
          <h4 className="mt-3 text-xs font-semibold text-muted uppercase">Focus next</h4>
          <ul className="list-disc pl-5 text-sm">
            {student.focusAreas.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <h4 className="mt-3 text-xs font-semibold text-muted uppercase">Study tips</h4>
          <ul className="list-disc pl-5 text-sm">
            {student.studyTips.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-lg font-bold text-fg">{value}</div>
    </div>
  );
}
