import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { createTeacherClass, getProfile, listTeacherClasses } from "@/lib/data";
import {
  COURSE_LEVELS,
  SCHOOL_TYPES,
  type CourseLevel,
  type SchoolType,
  type TeacherClass,
} from "@/lib/types";

export const Route = createFileRoute("/teacher")({ component: TeacherDashboard });

function TeacherDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    gradeLevel: "",
    courseLevel: "Regular" as CourseLevel,
    schoolType: "Private Independent" as SchoolType,
    schoolName: "",
  });

  useEffect(() => {
    void getProfile().then((p) => {
      if (p.role !== "teacher") void navigate({ to: "/dashboard" });
      if (p.schoolSelect && p.schoolSelect !== "studious") {
        /* keep defaults */
      }
    });
    void listTeacherClasses().then(setClasses);
  }, [navigate]);

  async function create() {
    if (!form.name.trim() || !form.subject.trim()) {
      setError("Class name and subject are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const c = await createTeacherClass({ data: form });
      setShowForm(false);
      await navigate({ to: "/teacher/class/$id", params: { id: c.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create class");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Teacher Classes"
      right={
        <Button className="min-h-10 text-xs" onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          New class
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Less grading. More time with the student. Create a class, upload blank tests and answer keys, grade scanned class
        sets, and review analytics by school type.
      </p>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-14 text-center text-sm text-muted">
          <GraduationCap className="mx-auto mb-3 size-8 opacity-50" />
          No classes yet. Add your first class to start grading and analytics.
          <div className="mt-4">
            <Button onClick={() => setShowForm(true)}>New class</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              to="/teacher/class/$id"
              params={{ id: c.id }}
              className="rounded-xl border border-border bg-card p-4 hover:border-teal/40"
            >
              <div className="font-semibold text-fg">{c.name}</div>
              <div className="mt-1 text-sm text-muted">
                {c.subject} · Grade {c.gradeLevel || "—"} · {c.courseLevel}
              </div>
              <div className="mt-2 text-xs text-muted">{c.schoolType}</div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold text-fg">New class</h3>
            <div className="mt-3 space-y-2">
              <input className="field" placeholder="Class name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="field" placeholder="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <input className="field" placeholder="Grade level (e.g. 10, 6th)" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} />
              <select className="field" value={form.courseLevel} onChange={(e) => setForm({ ...form, courseLevel: e.target.value as CourseLevel })}>
                {COURSE_LEVELS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              <select className="field" value={form.schoolType} onChange={(e) => setForm({ ...form, schoolType: e.target.value as SchoolType })}>
                {SCHOOL_TYPES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
              <input className="field" placeholder="School name" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
            </div>
            {error && <p className="mt-2 text-sm text-red">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={busy} onClick={() => void create()}>{busy ? "Saving…" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
      <style>{`.field{width:100%;border-radius:0.5rem;border:1px solid var(--border);background:var(--bg);padding:0.55rem 0.75rem;font-size:0.875rem}`}</style>
    </AppShell>
  );
}
