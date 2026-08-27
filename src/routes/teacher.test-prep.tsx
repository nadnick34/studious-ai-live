import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { generateTestPrepLesson, generateTestPrepPlan } from "@/lib/ai";
import { getProfile, getTeacherToolState, listTeacherClasses, saveTeacherToolState } from "@/lib/data";
import { TEST_FOCUS_OPTIONS, type TeacherClass } from "@/lib/types";

export const Route = createFileRoute("/teacher/test-prep")({
  component: TestPrepPage,
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

type CardState = {
  testFocus: string;
  plan: Plan | null;
  checked: Record<string, boolean>;
  lastRefreshed?: string;
  log: Lesson[];
};

function statusClass(s?: string) {
  if (s === "Ahead of Schedule") return "bg-emerald-50 text-emerald-800";
  if (s === "On Pace") return "bg-teal-50 text-teal-800";
  if (s === "Needs Focus") return "bg-amber-50 text-amber-800";
  if (s === "Behind Schedule") return "bg-red-50 text-red-800";
  return "bg-bg text-muted";
}

function storeKey(classId: string) {
  return `studious-testprep-card:${classId}`;
}

function loadCard(classId: string): CardState {
  try {
    const raw = localStorage.getItem(storeKey(classId));
    if (raw) {
      const parsed = JSON.parse(raw) as CardState;
      return { testFocus: "ACT", plan: null, checked: {}, log: [], ...parsed, log: parsed.log || [] };
    }
  } catch {
    /* ignore */
  }
  return { testFocus: "ACT", plan: null, checked: {}, log: [] };
}

function saveCard(classId: string, state: CardState) {
  localStorage.setItem(storeKey(classId), JSON.stringify(state));
}

function daysSince(iso?: string) {
  if (!iso) return 999;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 999;
  return (Date.now() - t) / 86400000;
}

function TestPrepPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [printTarget, setPrintTarget] = useState<"teacher" | "student" | "both">("both");

  useEffect(() => {
    void Promise.all([listTeacherClasses(), getProfile(), getTeacherToolState().catch(() => null)]).then(
      ([cls, profile, tools]) => {
        const list = (cls || []).filter((c) => !c.archived);
        setClasses(list);
        const remote = (tools?.testPrepCards || {}) as Record<string, CardState>;
        const next: Record<string, CardState> = {};
        for (const c of list) {
          next[c.id] = remote[c.id] ? { ...loadCard(c.id), ...remote[c.id], log: remote[c.id].log || [] } : loadCard(c.id);
          saveCard(c.id, next[c.id]);
        }
        setCards(next);
        setStateName(profile.state || "");
        setSchoolType(profile.educationApproach || list[0]?.schoolType || "");
      },
    );
  }, []);

  function patchCard(classId: string, partial: Partial<CardState>) {
    setCards((prev) => {
      const cur = prev[classId] || loadCard(classId);
      const nextCard = { ...cur, ...partial };
      saveCard(classId, nextCard);
      const all = { ...prev, [classId]: nextCard };
      void saveTeacherToolState({ data: { testPrepCards: all } }).catch(() => {});
      return all;
    });
  }

  const openClass = classes.find((c) => c.id === openId) || null;
  const openCard = openId ? cards[openId] : null;

  function openChecklist(cls: TeacherClass) {
    const card = cards[cls.id] || loadCard(cls.id);
    if (!card.plan) {
      void loadPlan(cls, true);
      return;
    }
    setOpenId(cls.id);
    setLesson(null);
  }

  async function loadPlan(cls: TeacherClass, thenOpen = false) {
    const card = cards[cls.id] || loadCard(cls.id);
    setBusyId(cls.id);
    setError(null);
    try {
      const result = (await generateTestPrepPlan({
        data: {
          state: stateName,
          schoolType: schoolType || cls.schoolType,
          gradeLevel: cls.gradeLevel,
          subject: cls.subject,
          testFocus: card.testFocus,
          className: cls.name,
          today: new Date().toISOString().slice(0, 10),
        },
      })) as Plan;
      patchCard(cls.id, { plan: result, lastRefreshed: new Date().toISOString() });
      if (thenOpen) setOpenId(cls.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the plan");
    } finally {
      setBusyId(null);
    }
  }

  function toggleCheck(classId: string, topicId: string) {
    const card = cards[classId];
    if (!card) return;
    patchCard(classId, { checked: { ...card.checked, [topicId]: !card.checked[topicId] } });
  }

  async function generateRow(cls: TeacherClass, topic: Topic) {
    setRowBusy(topic.id);
    setError(null);
    try {
      const result = (await generateTestPrepLesson({
        data: {
          state: stateName,
          schoolType: schoolType || cls.schoolType,
          gradeLevel: cls.gradeLevel,
          subject: cls.subject,
          testFocus: cards[cls.id]?.testFocus || "ACT",
          className: cls.name,
          unchecked: [`${topic.label}${topic.detail ? ` — ${topic.detail}` : ""}`],
        },
      })) as Lesson;
      const entry: Lesson = {
        ...result,
        topicId: topic.id,
        topicLabel: topic.label,
        at: new Date().toISOString(),
      };
      setLesson(entry);
      const card = cards[cls.id] || loadCard(cls.id);
      patchCard(cls.id, {
        checked: { ...card.checked, [topic.id]: true },
        log: [entry, ...(card.log || [])].slice(0, 40),
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

  if (openClass && openCard) {
    return (
      <AppShell title="Test Prep checklist">
        <div className="mx-auto max-w-4xl space-y-5">
          <button type="button" className="print:hidden text-sm text-teal hover:underline" onClick={() => setOpenId(null)}>
            ← Back to dashboard
          </button>
          <div className="print:hidden flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-fg">
                {openClass.name} · {openClass.subject}
              </h2>
              <p className="text-sm text-muted">
                {openCard.testFocus}
                {openClass.gradeLevel ? ` · ${openClass.gradeLevel}` : ""}
                {stateName ? ` · ${stateName}` : ""}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(openCard.plan?.status)}`}>
              {openCard.plan?.status || "No plan"}
            </span>
          </div>
          {error && <p className="print:hidden text-sm text-red">{error}</p>}

          {openCard.plan && (
            <section className="print:hidden rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted">{openCard.plan.windowNote}</p>
              {openCard.plan.statusWhy && <p className="mt-2 text-sm">{openCard.plan.statusWhy}</p>}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-teal"
                  style={{
                    width: `${
                      openCard.plan.topics?.length
                        ? Math.round(
                            (openCard.plan.topics.filter((t) => openCard.checked[t.id]).length /
                              openCard.plan.topics.length) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-fg">Still to cover</h4>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {(openCard.plan.toCover || []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <h4 className="mt-5 text-sm font-semibold text-fg">Coverage checklist</h4>
              <ul className="mt-2 divide-y divide-border">
                {(openCard.plan.topics || []).map((t) => {
                  const done = Boolean(openCard.checked[t.id]);
                  return (
                    <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                      <label className="flex min-w-0 flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={done}
                          onChange={() => toggleCheck(openClass.id, t.id)}
                        />
                        <span>
                          <span className={`block text-sm ${done ? "text-muted line-through" : "text-fg"}`}>{t.label}</span>
                          {t.detail && <span className="block text-xs text-muted">{t.detail}</span>}
                        </span>
                      </label>
                      <Button
                        className={
                          done
                            ? "min-h-9 bg-slate-100 text-slate-400 shadow-none hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-500"
                            : "min-h-9"
                        }
                        variant={done ? "secondary" : "primary"}
                        disabled={rowBusy === t.id}
                        onClick={() => void generateRow(openClass, t)}
                      >
                        {rowBusy === t.id ? "Writing…" : "Generate lesson"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {lesson && <LessonDocs lesson={lesson} printTarget={printTarget} onPrint={printLesson} onEmail={emailLesson} />}

          <section className="print:hidden rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-fg">Generated lessons</h3>
            <p className="text-xs text-muted">Click a row to reopen it.</p>
            {(openCard.log || []).length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing generated for this class yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {openCard.log.map((item, i) => (
                  <li key={`${item.at}-${i}`}>
                    <button
                      type="button"
                      className="flex w-full flex-wrap items-baseline justify-between gap-2 py-2 text-left text-sm hover:bg-bg"
                      onClick={() => setLesson(item)}
                    >
                      <span className="font-medium text-fg">{item.topicLabel || item.teacherGuide?.title || "Lesson"}</span>
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
    <AppShell title="Test Prep">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Teacher edition</p>
          <h2 className="text-xl font-semibold text-fg">Test Prep dashboard</h2>
          <p className="mt-1 text-sm text-muted">
            Click a class box to open its checklist. Refresh only when you want a new plan.{" "}
            {stateName || "Add State in Profile"}
            {schoolType ? ` · ${schoolType}` : ""}.
          </p>
        </div>
        {error && <p className="text-sm text-red">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.length === 0 && <p className="text-sm text-muted">Create a class first.</p>}
          {classes.map((cls) => {
            const card = cards[cls.id] || loadCard(cls.id);
            const topics = card.plan?.topics || [];
            const done = topics.filter((t) => card.checked[t.id]).length;
            const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
            const stale = daysSince(card.lastRefreshed) > 30;
            return (
              <article
                key={cls.id}
                className="cursor-pointer rounded-2xl border border-border bg-card p-4 hover:border-teal"
                onClick={() => openChecklist(cls)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-fg">{cls.name}</h3>
                    <p className="text-xs text-muted">
                      {cls.subject}
                      {cls.gradeLevel ? ` · ${cls.gradeLevel}` : ""}
                    </p>
                  </div>
                  {card.plan?.status && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(card.plan.status)}`}>
                      {card.plan.status}
                    </span>
                  )}
                </div>
                <label className="mt-3 block text-[11px] text-muted" onClick={(e) => e.stopPropagation()}>
                  Test in focus
                  <select
                    className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm text-fg"
                    value={card.testFocus}
                    onChange={(e) => patchCard(cls.id, { testFocus: e.target.value })}
                  >
                    {TEST_FOCUS_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
                  <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {topics.length ? `${done}/${topics.length} covered` : "No plan yet"}
                  {(card.log || []).length ? ` · ${(card.log || []).length} lesson(s)` : ""}
                </p>
                <div className="mt-3 flex items-end justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <p className="flex items-center gap-1 text-[11px] text-muted">
                    {stale && <span title="Plan older than 30 days">⚠️</span>}
                    {card.lastRefreshed ? `Refreshed ${new Date(card.lastRefreshed).toLocaleDateString()}` : "Never refreshed"}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="text-xs" disabled={busyId === cls.id} onClick={() => void loadPlan(cls)}>
                      {busyId === cls.id ? "Loading…" : "Refresh plan"}
                    </Button>
                    <Button className="text-xs" onClick={() => openChecklist(cls)}>
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
                {(ex.steps || []).map((x) => (
                  <li key={x}>{x}</li>
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
              <ol className="mt-1 list-decimal pl-5 text-sm">
                {(lesson.teacherGuide.wordProblem.steps || []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
              {lesson.teacherGuide.wordProblem.answer && (
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Answer. </span>
                  {lesson.teacherGuide.wordProblem.answer}
                </p>
              )}
            </div>
          )}
          {!!lesson.teacherGuide.terms?.length && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Key terms</h4>
              <table className="mt-1 w-full text-left text-sm">
                <tbody>
                  {lesson.teacherGuide.terms.map((r) => (
                    <tr key={r.term} className="border-b border-border align-top">
                      <td className="py-1 pr-3 font-medium">{r.term}</td>
                      <td className="py-1">{r.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {!!lesson.teacherGuide.examples?.length && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Examples</h4>
              <ul className="list-disc pl-5 text-sm">
                {lesson.teacherGuide.examples.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </>
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
          {!!lesson.studentSummary.resources?.length && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Extra resources</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {lesson.studentSummary.resources.map((r) => (
                  <li key={r.title}>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                        {r.title}
                      </a>
                    ) : (
                      r.title
                    )}
                    {r.note ? ` — ${r.note}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
          {!!lesson.studentSummary.testTips?.length && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Test taking tips</h4>
              <ul className="list-disc pl-5 text-sm">
                {lesson.studentSummary.testTips.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </>
          )}
        </article>
      )}
    </div>
  );
}
