import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { generateTestPrepLesson, generateTestPrepPlan } from "@/lib/ai";
import { getProfile, listTeacherClasses } from "@/lib/data";
import { TEST_FOCUS_OPTIONS, type TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/test-prep")({
  component: TestPrepPage,
});

type Topic = { id: string; label: string; detail?: string; priority?: string };
type Plan = {
  testFocus?: string;
  subject?: string;
  windowNote?: string;
  status?: string;
  statusWhy?: string;
  toCover?: string[];
  topics?: Topic[];
};
type Lesson = {
  teacherGuide?: {
    title?: string;
    minutes?: string;
    objective?: string;
    talkTrack?: string[];
    boardExample?: { prompt?: string; steps?: string[]; answer?: string };
    pitfalls?: string[];
    checks?: string[];
  };
  studentSummary?: {
    title?: string;
    narrative?: string;
    keyIdeas?: string[];
    terms?: { term: string; definition: string }[];
    examples?: string[];
  };
};

function statusClass(s?: string) {
  if (s === "Ahead of Schedule") return "bg-emerald-50 text-emerald-800";
  if (s === "On Pace") return "bg-teal-50 text-teal-800";
  if (s === "Needs Focus") return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-800";
}

function TestPrepPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [testFocus, setTestFocus] = useState("ACT");
  const [stateName, setStateName] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [printTarget, setPrintTarget] = useState<"teacher" | "student" | "both">("both");

  const selected = classes.find((c) => c.id === classId) || null;
  const subjects = useMemo(() => {
    const set = new Set(classes.map((c) => c.subject).filter(Boolean));
    return [...set];
  }, [classes]);

  useEffect(() => {
    void Promise.all([listTeacherClasses(), getProfile()])
      .then(([cls, profile]) => {
        const list = (cls || []).filter((c) => !c.archived);
        setClasses(list);
        if (list[0]) {
          setClassId(list[0].id);
          setSubject(list[0].subject || "");
        }
        setStateName(profile.state || "");
        setSchoolType(profile.educationApproach || list[0]?.schoolType || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    if (selected.subject) setSubject(selected.subject);
  }, [classId]);

  const storageKey = classId && subject && testFocus ? `studious-testprep:${classId}:${subject}:${testFocus}` : "";

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {});
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  function toggleCheck(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const topics = plan?.topics || [];
  const unchecked = topics.filter((t) => !checked[t.id]);
  const pct = topics.length ? Math.round((topics.filter((t) => checked[t.id]).length / topics.length) * 100) : 0;

  async function loadPlan() {
    if (!subject.trim()) {
      setError("Choose a subject.");
      return;
    }
    setBusy(true);
    setError(null);
    setLesson(null);
    setStatus("Building the coverage plan…");
    try {
      const result = (await generateTestPrepPlan({
        data: {
          state: stateName,
          schoolType: schoolType || selected?.schoolType,
          gradeLevel: selected?.gradeLevel,
          subject: subject.trim(),
          testFocus,
          className: selected?.name,
          today: new Date().toISOString().slice(0, 10),
        },
      })) as Plan;
      setPlan(result);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the plan");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function makeLesson() {
    if (!unchecked.length) {
      setError("Everything on the checklist is marked covered. Uncheck an item first.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Writing the 5–10 minute lesson…");
    try {
      const result = (await generateTestPrepLesson({
        data: {
          state: stateName,
          schoolType: schoolType || selected?.schoolType,
          gradeLevel: selected?.gradeLevel,
          subject: subject.trim(),
          testFocus,
          className: selected?.name,
          unchecked: unchecked.map((t) => `${t.label}${t.detail ? ` — ${t.detail}` : ""}`),
        },
      })) as Lesson;
      setLesson(result);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not write the lesson");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function printLesson(which: "teacher" | "student" | "both") {
    setPrintTarget(which);
    setTimeout(() => window.print(), 50);
  }

  function emailLesson() {
    if (!lesson) return;
    const title = lesson.studentSummary?.title || `${subject} ${testFocus} prep`;
    const ideas = (lesson.studentSummary?.keyIdeas || []).map((x) => `• ${x}`).join("\n");
    const body = `${title}\n\n${lesson.studentSummary?.narrative || ""}\n\n${ideas}`.slice(0, 1800);
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <AppShell title="Test Prep">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="print:hidden">
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Teacher edition</p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-fg">Test Prep</h2>
              <p className="mt-1 text-sm text-muted">
                Coverage for this class, this subject, and one exam. Pace is judged from today’s date and the grade
                level.
              </p>
            </div>
            {plan?.status && (
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(plan.status)}`}>
                {plan.status}
              </span>
            )}
          </div>
        </div>

        <div className="print:hidden grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
          <label className="block text-xs text-muted">
            Class
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              {classes.length === 0 && <option value="">No classes yet</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.gradeLevel ? `· ${c.gradeLevel}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Subject
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Test in focus
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg"
              value={testFocus}
              onChange={(e) => setTestFocus(e.target.value)}
            >
              {TEST_FOCUS_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <p className="sm:col-span-3 text-xs text-muted">
            {stateName ? `${stateName}` : "Add State in Profile"}
            {schoolType ? ` · ${schoolType}` : ""}
            {selected?.gradeLevel ? ` · ${selected.gradeLevel}` : ""}
            {` · ${new Date().toLocaleDateString()}`}
          </p>
          {error && <p className="sm:col-span-3 text-sm text-red">{error}</p>}
          {status && <p className="sm:col-span-3 text-xs text-teal">{status}</p>}
          <div className="sm:col-span-3 flex justify-end">
            <Button disabled={busy || !classId} onClick={() => void loadPlan()}>
              {busy && !lesson ? "Loading…" : "Load coverage plan"}
            </Button>
          </div>
        </div>

        {plan && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-fg">
                  {subject} · {testFocus}
                </h3>
                <p className="text-sm text-muted">{plan.windowNote}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-fg">{pct}%</div>
                <div className="text-[11px] text-muted">checked off</div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
              <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-sm text-fg">{plan.statusWhy}</p>

            <h4 className="mt-5 text-sm font-semibold text-fg">Material still to cover</h4>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {(plan.toCover || []).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>

            <h4 className="mt-5 text-sm font-semibold text-fg">Coverage checklist</h4>
            <ul className="mt-2 divide-y divide-border">
              {topics.map((t) => (
                <li key={t.id} className="flex items-start gap-3 py-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(checked[t.id])}
                    onChange={() => toggleCheck(t.id)}
                  />
                  <div>
                    <p className={`text-sm ${checked[t.id] ? "text-muted line-through" : "text-fg"}`}>{t.label}</p>
                    {t.detail && <p className="text-xs text-muted">{t.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>

            <div className="print:hidden mt-4 flex flex-wrap justify-end gap-2">
              <Button disabled={busy} onClick={() => void makeLesson()}>
                {busy ? "Writing…" : "Generate 5–10 min lesson"}
              </Button>
            </div>
          </section>
        )}

        {lesson && (
          <div className="space-y-4">
            <div className="print:hidden flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => printLesson("teacher")}>
                Print teacher guide
              </Button>
              <Button variant="secondary" onClick={() => printLesson("student")}>
                Print student summary
              </Button>
              <Button variant="secondary" onClick={() => printLesson("both")}>
                Print / save PDF both
              </Button>
              <Button variant="secondary" onClick={emailLesson}>
                Email group
              </Button>
            </div>

            {(printTarget === "teacher" || printTarget === "both") && lesson.teacherGuide && (
              <article className="rounded-2xl border border-border bg-card p-6 print:border-0">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Teacher’s Guide</p>
                <h3 className="mt-1 text-xl font-semibold text-fg">{lesson.teacherGuide.title}</h3>
                <p className="text-sm text-muted">
                  {selected?.name} · {subject} · {testFocus} · {lesson.teacherGuide.minutes || "5–10"} minutes
                </p>
                <p className="mt-3 text-sm">
                  <span className="font-semibold">Objective. </span>
                  {lesson.teacherGuide.objective}
                </p>
                {!!lesson.teacherGuide.talkTrack?.length && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Talk track</h4>
                    <ol className="mt-1 list-decimal pl-5 text-sm">
                      {lesson.teacherGuide.talkTrack.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                  </>
                )}
                {lesson.teacherGuide.boardExample?.prompt && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Board example</h4>
                    <p className="text-sm">{lesson.teacherGuide.boardExample.prompt}</p>
                    <ol className="mt-1 list-decimal pl-5 text-sm">
                      {(lesson.teacherGuide.boardExample.steps || []).map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                    {lesson.teacherGuide.boardExample.answer && (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">Answer. </span>
                        {lesson.teacherGuide.boardExample.answer}
                      </p>
                    )}
                  </>
                )}
                {!!lesson.teacherGuide.pitfalls?.length && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Watch for</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {lesson.teacherGuide.pitfalls.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
                {!!lesson.teacherGuide.checks?.length && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Check for understanding</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {lesson.teacherGuide.checks.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            )}

            {(printTarget === "student" || printTarget === "both") && lesson.studentSummary && (
              <article className="rounded-2xl border border-border bg-card p-6 print:border-0">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Student Test Prep Summary
                </p>
                <h3 className="mt-1 text-xl font-semibold text-fg">{lesson.studentSummary.title}</h3>
                <p className="text-sm text-muted">
                  {subject} · {testFocus}
                  {stateName ? ` · ${stateName}` : ""}
                </p>
                {lesson.studentSummary.narrative && (
                  <p className="mt-3 text-sm leading-relaxed">{lesson.studentSummary.narrative}</p>
                )}
                {!!lesson.studentSummary.keyIdeas?.length && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Key ideas</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {lesson.studentSummary.keyIdeas.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
                {!!lesson.studentSummary.terms?.length && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Key terms</h4>
                    <table className="mt-1 w-full text-left text-sm">
                      <tbody>
                        {lesson.studentSummary.terms.map((r) => (
                          <tr key={r.term} className="border-b border-border align-top">
                            <td className="py-1 pr-3 font-medium">{r.term}</td>
                            <td className="py-1">{r.definition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {!!lesson.studentSummary.examples?.length && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Examples</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {lesson.studentSummary.examples.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
