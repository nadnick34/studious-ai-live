import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getTeacherClassById, getTeacherClassStats } from "@/lib/data";
import type { TeacherAssessment, TeacherClass } from "@/lib/types";

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

function statusStyle(status: string) {
  if (status === "Strong") return "bg-emerald-50 text-emerald-700";
  if (status === "On Track") return "bg-teal-50 text-teal-700";
  if (status === "Needs Support") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function TeacherClassPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<TeacherClass | null>(null);
  const [stats, setStats] = useState<{
    classAverage: number;
    studentCount: number;
    onTrack: number;
    needSupport: number;
    assessmentCount: number;
    students: RosterRow[];
    assessments: TeacherAssessment[];
  } | null>(null);

  useEffect(() => {
    void Promise.all([getTeacherClassById({ data: id }), getTeacherClassStats({ data: id })]).then(
      ([c, s]) => {
        setCls(c);
        setStats(s);
      },
    );
  }, [id]);

  if (!cls || !stats) {
    return (
      <AppShell title="Class">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${cls.name}${cls.courseLevel ? ` – ${cls.courseLevel}` : ""}`}
      right={
        <span className="text-xs text-muted">
          {stats.studentCount} student{stats.studentCount === 1 ? "" : "s"}
          {cls.schoolType ? ` · ${cls.schoolType.split(" ")[0]}` : ""}
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
            onClick={() => void navigate({ to: "/teacher/class/$id/grade", params: { id } })}
          >
            Scan / Upload Tests
          </Button>
          <Button
            className="text-xs"
            onClick={() => {
              const latest = stats.assessments[0];
              if (latest) {
                void navigate({
                  to: "/teacher/class/$id/assessment/$assessmentId",
                  params: { id, assessmentId: latest.id },
                });
              } else {
                void navigate({ to: "/teacher/analytics" });
              }
            }}
          >
            View Analytics
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Class Average" value={`${stats.classAverage}%`} sub="Last assessments" />
        <StatCard
          label="Students On Track"
          value={String(stats.onTrack)}
          sub={`of ${stats.studentCount || "—"}`}
        />
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
            No students yet. Upload a roster when creating the class, or grade a scanned set to populate results.
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
                    onClick={() =>
                      void navigate({
                        to: "/teacher/class/$id/student/$studentId",
                        params: { id, studentId: encodeURIComponent(s.name) },
                      })
                    }
                  >
                    <td className="px-4 py-3 font-medium text-fg">{s.name}</td>
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
