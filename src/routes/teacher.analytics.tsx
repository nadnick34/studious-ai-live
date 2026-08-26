import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listAllTeacherAssessments, listTeacherClasses } from "@/lib/data";
import type { TeacherAssessment, TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/analytics")({
  component: TeacherAnalyticsPage,
});

function TeacherAnalyticsPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assessments, setAssessments] = useState<TeacherAssessment[]>([]);

  useEffect(() => {
    void Promise.all([listTeacherClasses(), listAllTeacherAssessments()]).then(([c, a]) => {
      setClasses(c);
      setAssessments(a);
    });
  }, []);

  const avg =
    assessments.length > 0
      ? assessments.reduce((s, a) => s + a.classAverage, 0) / assessments.length
      : 0;

  return (
    <AppShell title="Analytics">
      <p className="mb-4 text-sm text-muted">
        Class and assessment overview. Drill into a class for topic bars and printable student feedback.
      </p>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted">Classes</div>
          <div className="text-2xl font-bold">{classes.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted">Assessments graded</div>
          <div className="text-2xl font-bold">{assessments.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted">Avg class score</div>
          <div className="text-2xl font-bold">{assessments.length ? `${Math.round(avg)}%` : "—"}</div>
        </div>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-fg">Recent assessments</h3>
      <div className="space-y-2">
        {assessments.length === 0 ? (
          <p className="text-sm text-muted">Grade a scanned set from a class to see analytics here.</p>
        ) : (
          assessments.slice(0, 20).map((a) => {
            const cls = classes.find((c) => c.id === a.classId);
            return (
              <Link
                key={a.id}
                to="/teacher/class/$id/assessment/$assessmentId"
                params={{ id: a.classId, assessmentId: a.id }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-teal/40"
              >
                <div>
                  <div className="font-medium text-fg">{a.name}</div>
                  <div className="text-xs text-muted">
                    {cls?.name || "Class"} · {a.type}
                  </div>
                </div>
                <div className="text-lg font-bold">{Math.round(a.classAverage)}%</div>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
