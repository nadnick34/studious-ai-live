import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { generateTestPrepLesson, generateTestPrepPlan } from "@/lib/ai";
import { getProfile, getTeacherToolState, saveTeacherToolState } from "@/lib/data";
import { PREP_SUBJECTS, STUDENT_TEST_GROUPS } from "@/lib/types";

export const Route = createFileRoute("/teacher/test-prep")({
  component: TeacherPrepPage,
});

type Topic = { id: string; label: string; detail?: string; priority?: string };
type Plan = {
  windowNote?: string;
  status?: string;
  statusWhy?: string;
  toCover?: string[];
  topics?: Topic[];
};
type Lesson = {
  topicId?: string;
  topicLabel?: string;
  at?: string;
  teacherGuide?: {
    title?: string;
    minutes?: string;
    narrative?: string;
    objective?: string;
    talkTrack?: string[];
    boardExample?: { prompt?: string; steps?: string[]; answer?: string };
    boardExamples?: { prompt?: string; steps?: string[]; answer?: string }[];
    wordProblem?: { prompt?: string; steps?: string[]; answer?: string };
    terms?: { term: string; definition: string }[];
    examples?: string[];
    pitfalls?: string[];
    checks?: string[];
  };
  studentSummary?: {
    title?: string;
    narrative?: string;
    keyIdeas?: string[];
    terms?: { term: string; definition: string }[];
    examples?: string[];
    resources?: { title: string; url?: string; note?: string }[];
    testTips?: string[];
  };
};
type Track = {
  id: string;
  subject: string;
  testName: string;
  createdAt: string;
  lastRefreshed?: string;
  plan: Plan | null;
  checked: Record<string, boolean>;
  log: Lesson[];
  archived?: boolean;
};

function statusClass(s?: string) {
  if (s === "Ahead of Schedule") return "bg-emerald-50 text-emerald-800";
  if (s === "On Pace") return "bg-teal-50 text-teal-800";
  if (s === "Needs Focus") return "bg-amber-50 text-amber-800";
  if (s === "Behind Schedule") return "bg-red-50 text-red-800";
  return "bg-bg text-muted";
}

function daysSince(iso?: string) {
  if (!iso) return 999;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 999 : (Date.now() - t) / 86400000;
}

function TeacherPrepPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSubject, setNewSubject] = useState("Mathematics");
  const [newTest, setNewTest] = useState("ACT");
  const [showArchived, setShowArchived] = useState(false);
  const [stateName, setStateName] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [showList, setShowList] = useState(true);
  const [printTarget, setPrintTarget] = useState<"teacher" | "student" | "both">("both");

  useEffect(() => {
    void Promise.all([getProfile(), getTeacherToolState().catch(() => null)]).then(([profile, tools]) => {
      setStateName(profile.state || "");
      setSchoolType(profile.educationApproach || "");
      const remote = Array.isArray(tools?.teacherPrepTracks) ? (tools!.teacherPrepTracks as Track[]) : [];
      setTracks(remote);
    });
  }, []);

  function persist(next: Track[]) {
    setTracks(next);
    void saveTeacherToolState({ data: { teacherPrepTracks: next } }).catch(() => {});
  }

  function updateTrack(id: string, partial: Partial<Track>) {
    persist(tracks.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }

  const open = tracks.find((t) => t.id === openId) || null;
  const visible = tracks.filter((t) => (showArchived ? t.archived : !t.archived));

  async function addTrack() {
    const track: Track = {
      id: `${Date.now()}`,
      subject: newSubject,
      testName: newTest,
      createdAt: new Date().toISOString(),
      plan: null,
      checked: {},
      log: [],
    };
    persist([track, ...tracks]);
    setAdding(false);
    setOpenId(track.id);
    setBusy(true);
    try {
      const plan = (await generateTestPrepPlan({
        data: {
          state: stateName,
          schoolType,
          subject: newSubject,
          testFocus: newTest,
          className: `${newSubject} · ${newTest}`,
          today: new Date().toISOString().slice(0, 10),
        },
      })) as Plan;
      persist([{ ...track, plan, lastRefreshed: new Date().toISOString() }, ...tracks]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plan");
    } finally {
      setBusy(false);
    }
  }

  async function refreshNamed(track: Track) {
    setBusy(true);
    setError(null);
    try {
      const plan = (await generateTestPrepPlan({
        data: {
          state: stateName,
          schoolType,
          subject: track.subject,
          testFocus: track.testName,
          className: `${track.subject} · ${track.testName}`,
          today: new Date().toISOString().slice(0, 10),
        },
      })) as Plan;
      updateTrack(track.id, { plan, lastRefreshed: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh");
    } finally {
      setBusy(false);
    }
  }

  async function generateRow(track: Track, topic: Topic) {
    setRowBusy(topic.id);
    setError(null);
    try {
      const result = (await generateTestPrepLesson({
        data: {
          state: stateName,
          schoolType,
          subject: track.subject,
          testFocus: track.testName,
          className: `${track.subject} · ${track.testName}`,
          unchecked: [`${topic.label}${topic.detail ? ` — ${topic.detail}` : ""}`],
        },
      })) as Lesson;
      const entry: Lesson = { ...result, topicId: topic.id, topicLabel: topic.label, at: new Date().toISOString() };
      setLesson(entry);
      setShowList(false);
      updateTrack(track.id, {
        checked: { ...track.checked, [topic.id]: true },
        log: [entry, ...track.log].slice(0, 40),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not write the lesson");
    } finally {
      setRowBusy(null);
    }
  }

  function printLesson(which: "teacher" | "student" | "both") {
    setPrintTarget(which);
    setTimeout(() => window.print(), 50);
  }

  function emailLesson() {
    if (!lesson?.studentSummary) return;
    const title = lesson.studentSummary.title || "Test Prep Summary";
    const ideas = (lesson.studentSummary.keyIdeas || []).map((x) => `• ${x}`).join("\n");
    const body = `${title}\n\n${lesson.studentSummary.narrative || ""}\n\n${ideas}`.slice(0, 1800);
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  if (open) {
    return (
      <AppShell title="Prep">
        <div className="mx-auto max-w-4xl space-y-5">
          <button type="button" className="print:hidden text-sm text-teal hover:underline" onClick={() => setOpenId(null)}>
            ← Prep dashboard
          </button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-fg">
                {open.subject} · {open.testName}
              </h2>
              <p className="text-sm text-muted">{[schoolType, stateName].filter(Boolean).join(" · ")}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(open.plan?.status)}`}>
              {open.plan?.status || "No plan"}
            </span>
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <div className="print:hidden flex flex-wrap justify-end gap-2">
            <Button variant="secondary" className="text-xs" disabled={busy} onClick={() => void refreshNamed(open)}>
              {busy ? "Refreshing…" : "Refresh plan"}
            </Button>
            {lesson && (
              <Button variant="secondary" className="text-xs" onClick={() => setShowList((v) => !v)}>
                {showList ? "Hide checklist" : "Show checklist"}
              </Button>
            )}
          </div>
          {open.plan && showList && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted">{open.plan.windowNote}</p>
              {open.plan.statusWhy && <p className="mt-2 text-sm">{open.plan.statusWhy}</p>}
              <h4 className="mt-4 text-sm font-semibold">Still to cover</h4>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {(open.plan.toCover || []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <h4 className="mt-5 text-sm font-semibold">Coverage checklist</h4>
              <ul className="mt-2 divide-y divide-border">
                {(open.plan.topics || []).map((topic) => {
                  const done = Boolean(open.checked[topic.id]);
                  return (
                    <li key={topic.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                      <label className="flex min-w-0 flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={done}
                          onChange={() =>
                            updateTrack(open.id, { checked: { ...open.checked, [topic.id]: !open.checked[topic.id] } })
                          }
                        />
                        <span>
                          <span className={`block text-sm ${done ? "text-muted line-through" : "text-fg"}`}>{topic.label}</span>
                          {topic.detail && <span className="block text-xs text-muted">{topic.detail}</span>}
                        </span>
                      </label>
                      <Button
                        className={done ? "min-h-9 bg-slate-100 text-slate-400 shadow-none hover:bg-slate-100" : "min-h-9"}
                        variant={done ? "secondary" : "primary"}
                        disabled={rowBusy === topic.id}
                        onClick={() => void generateRow(open, topic)}
                      >
                        {rowBusy === topic.id ? "Writing…" : "Generate lesson"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {lesson && (
            <LessonDocs lesson={lesson} printTarget={printTarget} onPrint={printLesson} onEmail={emailLesson} />
          )}

          <section className="print:hidden rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Generated lessons</h3>
            {open.log.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {open.log.map((item) => (
                  <li key={item.at}>
                    <button
                      type="button"
                      className="flex w-full justify-between gap-2 py-2 text-left text-sm"
                      onClick={() => {
                        setLesson(item);
                        setShowList(false);
                      }}
                    >
                      <span className="font-medium">{item.topicLabel || item.teacherGuide?.title}</span>
                      <span className="text-xs text-muted">{item.at ? new Date(item.at).toLocaleString() : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Prep">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Teacher edition</p>
            <h2 className="text-xl font-semibold text-fg">Prep</h2>
            <p className="mt-1 text-sm text-muted">
              Add a subject and an exam. Cards are not tied to a class. Generate still includes the Teacher’s Guide.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? "Active cards" : "Archived"}
            </Button>
            <Button onClick={() => setAdding(true)}>Add New Prep</Button>
          </div>
        </div>

        {adding && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-muted">
                Subject
                <select
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                >
                  {PREP_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted">
                Test
                <select
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                  value={newTest}
                  onChange={(e) => setNewTest(e.target.value)}
                >
                  {STUDENT_TEST_GROUPS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.tests.map((test) => (
                        <option key={test} value={test}>
                          {test}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button disabled={busy} onClick={() => void addTrack()}>
                {busy ? "Adding…" : "Create"}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          {visible.length === 0 && (
            <p className="text-sm text-muted">
              {showArchived ? "No archived cards." : "No prep cards yet. Add a subject and a test."}
            </p>
          )}
          {visible.map((track) => {
            const topics = track.plan?.topics || [];
            const done = topics.filter((x) => track.checked[x.id]).length;
            const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
            const stale = daysSince(track.lastRefreshed) > 30;
            return (
              <article
                key={track.id}
                className="cursor-pointer rounded-2xl border border-border bg-card p-4 hover:border-teal"
                onClick={() => {
                  setLesson(null);
                  setShowList(true);
                  setOpenId(track.id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-fg">{track.testName}</h3>
                    <p className="text-xs text-muted">{track.subject}</p>
                  </div>
                  {track.plan?.status && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(track.plan.status)}`}>
                      {track.plan.status}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
                  <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {topics.length ? `${done}/${topics.length} covered` : "No plan yet"}
                  {track.log.length ? ` · ${track.log.length} lesson(s)` : ""}
                </p>
                <div className="mt-3 flex items-end justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <p className="flex items-center gap-1 text-[11px] text-muted">
                    {stale && <span title="Plan older than 30 days">⚠️</span>}
                    {track.lastRefreshed ? `Refreshed ${new Date(track.lastRefreshed).toLocaleDateString()}` : "Never refreshed"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => updateTrack(track.id, { archived: !track.archived })}
                    >
                      {track.archived ? "Restore" : "Archive"}
                    </Button>
                    <Button className="text-xs" onClick={() => setOpenId(track.id)}>
                      Checklist
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function LessonDocs({
  lesson,
  printTarget,
  onPrint,
  onEmail,
}: {
  lesson: Lesson;
  printTarget: "teacher" | "student" | "both";
  onPrint: (w: "teacher" | "student" | "both") => void;
  onEmail: () => void;
}) {
  const boards =
    lesson.teacherGuide?.boardExamples && lesson.teacherGuide.boardExamples.length
      ? lesson.teacherGuide.boardExamples
      : lesson.teacherGuide?.boardExample
        ? [lesson.teacherGuide.boardExample]
        : [];
  return (
    <div className="space-y-4">
      <div className="print:hidden flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => onPrint("teacher")}>
          Print teacher guide
        </Button>
        <Button variant="secondary" onClick={() => onPrint("student")}>
          Print student summary
        </Button>
        <Button variant="secondary" onClick={() => onPrint("both")}>
          Print / save PDF both
        </Button>
        <Button variant="secondary" onClick={onEmail}>
          Email group
        </Button>
      </div>
      {(printTarget === "teacher" || printTarget === "both") && lesson.teacherGuide && (
        <article className="rounded-2xl border border-border bg-card p-6 print:border-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Teacher’s Guide</p>
          <h3 className="mt-1 text-xl font-semibold text-fg">{lesson.teacherGuide.title}</h3>
          <p className="text-sm text-muted">{lesson.teacherGuide.minutes || "5–10"} minutes</p>
          {lesson.teacherGuide.narrative && <p className="mt-3 text-sm leading-relaxed">{lesson.teacherGuide.narrative}</p>}
          {lesson.teacherGuide.objective && (
            <p className="mt-3 text-sm">
              <span className="font-semibold">Objective. </span>
              {lesson.teacherGuide.objective}
            </p>
          )}
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
          {boards.map((ex, i) => (
            <div key={i} className="mt-4">
              <h4 className="text-sm font-semibold">Board example {i + 1}</h4>
              <p className="text-sm">{ex.prompt}</p>
              <ol className="mt-1 list-decimal pl-5 text-sm">
                {(ex.steps || []).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {ex.answer && (
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Answer. </span>
                  {ex.answer}
                </p>
              )}
            </div>
          ))}
          {lesson.teacherGuide.wordProblem?.prompt && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Word problem</h4>
              <p className="text-sm">{lesson.teacherGuide.wordProblem.prompt}</p>
            </div>
          )}
        </article>
      )}
      {(printTarget === "student" || printTarget === "both") && lesson.studentSummary && (
        <article className="rounded-2xl border border-border bg-card p-6 print:border-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Student Test Prep Summary</p>
          <h3 className="mt-1 text-xl font-semibold text-fg">{lesson.studentSummary.title}</h3>
          {lesson.studentSummary.narrative && <p className="mt-3 text-sm leading-relaxed">{lesson.studentSummary.narrative}</p>}
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
          {!!lesson.studentSummary.resources?.length && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Extra resources</h4>
              <ul className="list-disc pl-5 text-sm">
                {lesson.studentSummary.resources.map((r) => (
                  <li key={r.title}>
                    {r.url ? (
                      <a href={r.url} className="text-teal hover:underline" target="_blank" rel="noreferrer">
                        {r.title}
                      </a>
                    ) : (
                      r.title
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      )}
    </div>
  );
}
