import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getTeacherClassById, listTeacherAssessments } from "@/lib/data";
import type { TeacherAssessment, TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/class/$id")({
  component: TeacherClassPage,
});

function TeacherClassPage() {
  const { id } = Route.useParams();
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);

  useEffect(() => {
    void Promise.all([getTeacherClassById({ data: id }), listTeacherAssessments({ data: id })]).then(
      ([c, a]) => {
        setCls(c);
        setAssessments(a);
      },
    );
  }, [id]);

  if (!cls) {
    return (
      <AppShell title="Class">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={cls.name}
      right={
        <Link to="/teacher/class/$id/grade" params={{ id }}>
          <Button className="min-h-10 text-xs">Grade scanned tests</Button>
        </Link>
      }
    >
      <Link to="/teacher" className="mb-4 inline-block text-sm text-teal hover:underline">
        ← Classes
      </Link>
      <div className="mb-5 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="font-semibold text-fg">{cls.name}</div>
        <div className="mt-1 text-muted">
          {cls.subject} · Grade {cls.gradeLevel || "—"} · {cls.courseLevel}
        </div>
        <div className="mt-1 text-xs text-muted">
          {cls.schoolType}
          {cls.schoolName ? ` · ${cls.schoolName}` : ""}
        </div>
      </div>

      <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Assessments</h3>
      {assessments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted">
          No graded sets yet. Upload a blank test, answer key, and student scans to grade.
          <div className="mt-4">
            <Link to="/teacher/class/$id/grade" params={{ id }}>
              <Button>Grade scanned tests</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Link
              key={a.id}
              to="/teacher/class/$id/assessment/$assessmentId"
              params={{ id, assessmentId: a.id }}
              className="block rounded-xl border border-border bg-card p-4 hover:border-teal/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-fg">{a.name}</div>
                  <div className="text-xs text-muted">
                    {a.type} · {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-fg">{Math.round(a.classAverage)}%</div>
                  <div className="text-[10px] text-muted">class avg</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
