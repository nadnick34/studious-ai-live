import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { generateStudentTestPrepLesson, generateStudentTestPrepPlan } from "@/lib/ai";
import { getProfile, getTeacherToolState, saveTeacherToolState } from "@/lib/data";
import { STUDENT_TEST_GROUPS } from "@/lib/types";

export const Route = createFileRoute("/test-prep")({
  component: StudentTestPrepPage,
});

type Topic = { id: string; label: string; detail?: string; level?: string };
type Plan = {
  status?: string;
  statusWhy?: string;
  windowNote?: string;
  toCover?: string[];
  topics?: Topic[];
};
type Sheet = {
  title?: string;
  narrative?: string;
  keyIdeas?: string[];
  terms?: { term: string; definition: string }[];
  examples?: string[];
  resources?: { title: string; url?: string; note?: string }[];
  testTips?: string[];
};
type Track = {
  id: string;
  testName: string;
  createdAt: string;
  lastRefreshed?: string;
  plan: Plan | null;
  checked: Record<string, boolean>;
  log: { at: string; topicId: string; topicLabel: string; sheet: Sheet }[];
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

function StudentTestPrepPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTest, setNewTest] = useState("ACT");
  const [level, setLevel] = useState("");
  const [klass, setKlass] = useState("");
  const [grade, setGrade] = useState("");
  const [stateName, setStateName] = useState("");
  const [showList, setShowList] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);

  useEffect(() => {
    void Promise.all([getProfile(), getTeacherToolState().catch(() => null)]).then(([profile, tools]) => {
      setLevel(profile.educationLevel || "");
      setKlass(profile.collegeClass || "");
      setGrade(profile.studentGrade || "");
      setStateName(profile.state || "");
      const remote = Array.isArray(tools?.studentTestPrep) ? (tools!.studentTestPrep as Track[]) : [];
      let local: Track[] = [];
      try {
        local = JSON.parse(localStorage.getItem("studious-practicum-tracks") || "[]") as Track[];
      } catch {
        local = [];
      }
      setTracks(remote.length ? remote : local);
    });
  }, []);

  function persist(next: Track[]) {
    setTracks(next);
    try {
      localStorage.setItem("studious-practicum-tracks", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    void saveTeacherToolState({ data: { studentTestPrep: next } }).catch(() => {});
  }

  const open = tracks.find((t) => t.id === openId) || null;

  async function addTrack() {
    const track: Track = {
      id: `${Date.now()}`,
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
      const plan = (await generateStudentTestPrepPlan({
        data: {
          testName: track.testName,
          educationLevel: level,
          collegeClass: klass,
          studentGrade: grade,
          state: stateName,
          today: new Date().toISOString().slice(0, 10),
          createdAt: track.createdAt,
          checkedCount: 0,
        },
      })) as Plan;
      persist([{ ...track, plan, lastRefreshed: new Date().toISOString() }, ...tracks]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load plan");
    } finally {
      setBusy(false);
    }
  }

  function updateTrack(id: string, partial: Partial<Track>) {
    persist(tracks.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }

  async function refreshNamed(track: Track) {
    setBusy(true);
    setError(null);
    try {
      const plan = (await generateStudentTestPrepPlan({
        data: {
          testName: track.testName,
          educationLevel: level,
          collegeClass: klass,
          studentGrade: grade,
          state: stateName,
          today: new Date().toISOString().slice(0, 10),
          createdAt: track.createdAt,
          checkedCount: Object.values(track.checked).filter(Boolean).length,
        },
      })) as Plan;
      persist(tracks.map((x) => (x.id === track.id ? { ...x, plan, lastRefreshed: new Date().toISOString() } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh");
    } finally {
      setBusy(false);
    }
  }

  async function refreshOpen() {
    if (!open) return;
    setBusy(true);
    setError(null);
    try {
      const plan = (await generateStudentTestPrepPlan({
        data: {
          testName: open.testName,
          educationLevel: level,
          collegeClass: klass,
          studentGrade: grade,
          state: stateName,
          today: new Date().toISOString().slice(0, 10),
          createdAt: open.createdAt,
          checkedCount: Object.values(open.checked).filter(Boolean).length,
        },
      })) as Plan;
      updateTrack(open.id, { plan, lastRefreshed: new Date().toISOString() });
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
      const result = (await generateStudentTestPrepLesson({
        data: {
          testName: track.testName,
          educationLevel: level,
          collegeClass: klass,
          studentGrade: grade,
          state: stateName,
          topic: `${topic.label}${topic.detail ? ` — ${topic.detail}` : ""}`,
        },
      })) as Sheet;
      setSheet(result);
      setShowList(false);
      updateTrack(track.id, {
        checked: { ...track.checked, [topic.id]: true },
        log: [
          { at: new Date().toISOString(), topicId: topic.id, topicLabel: topic.label, sheet: result },
          ...track.log,
        ].slice(0, 40),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate");
    } finally {
      setRowBusy(null);
    }
  }

  if (open) {
    return (
      <AppShell title="Practicum">
        <div className="mx-auto max-w-3xl space-y-5">
          <button type="button" className="print:hidden text-sm text-teal hover:underline" onClick={() => setOpenId(null)}>
            ← Dashboard
          </button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-fg">{open.testName}</h2>
              <p className="text-sm text-muted">
                {[level, grade, klass, stateName].filter(Boolean).join(" · ") || "Set education level and grade in Profile"}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(open.plan?.status)}`}>
              {open.plan?.status || "No plan"}
            </span>
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <div className="print:hidden flex justify-end">
            <Button variant="secondary" className="text-xs" disabled={busy} onClick={() => void refreshOpen()}>
              {busy ? "Refreshing…" : "Refresh plan"}
            </Button>
          </div>
          {sheet && (
            <div className="print:hidden flex justify-end">
              <Button variant="secondary" className="text-xs" onClick={() => setShowList((v) => !v)}>
                {showList ? "Hide checklist" : "Show checklist"}
              </Button>
            </div>
          )}
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
                {(open.plan.topics || []).map((t) => {
                  const done = Boolean(open.checked[t.id]);
                  return (
                    <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                      <label className="flex min-w-0 flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={done}
                          onChange={() =>
                            updateTrack(open.id, { checked: { ...open.checked, [t.id]: !open.checked[t.id] } })
                          }
                        />
                        <span>
                          <span className={`block text-sm ${done ? "text-muted line-through" : "text-fg"}`}>{t.label}</span>
                          {t.detail && <span className="block text-xs text-muted">{t.detail}</span>}
                        </span>
                      </label>
                      <Button
                        className={
                          done
                            ? "min-h-9 bg-slate-100 text-slate-400 shadow-none hover:bg-slate-100"
                            : "min-h-9"
                        }
                        variant={done ? "secondary" : "primary"}
                        disabled={rowBusy === t.id}
                        onClick={() => void generateRow(open, t)}
                      >
                        {rowBusy === t.id ? "Writing…" : "Generate"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {sheet && (
            <article className="rounded-2xl border border-border bg-card p-6">
              <div className="print:hidden mb-3 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => window.print()}>
                  Print / save PDF
                </Button>
              </div>
              <h3 className="text-xl font-semibold text-fg">{sheet.title}</h3>
              {sheet.narrative && <p className="mt-3 text-sm leading-relaxed">{sheet.narrative}</p>}
              {!!sheet.keyIdeas?.length && (
                <>
                  <h4 className="mt-4 text-sm font-semibold">Key ideas</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {sheet.keyIdeas.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
              {!!sheet.terms?.length && (
                <>
                  <h4 className="mt-4 text-sm font-semibold">Key terms</h4>
                  <table className="mt-1 w-full text-left text-sm">
                    <tbody>
                      {sheet.terms.map((r) => (
                        <tr key={r.term} className="border-b border-border align-top">
                          <td className="py-1 pr-3 font-medium">{r.term}</td>
                          <td className="py-1">{r.definition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {!!sheet.examples?.length && (
                <>
                  <h4 className="mt-4 text-sm font-semibold">Examples</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {sheet.examples.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
              {!!sheet.resources?.length && (
                <>
                  <h4 className="mt-4 text-sm font-semibold">Extra resources</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {sheet.resources.map((r) => (
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
              {!!sheet.testTips?.length && (
                <>
                  <h4 className="mt-4 text-sm font-semibold">Test taking tips</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {sheet.testTips.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          )}

          <section className="print:hidden rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Generated sheets</h3>
            {open.log.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {open.log.map((item) => (
                  <li key={item.at}>
                    <button
                      type="button"
                      className="flex w-full justify-between gap-2 py-2 text-left text-sm"
                      onClick={() => setSheet(item.sheet)}
                    >
                      <span className="font-medium">{item.topicLabel}</span>
                      <span className="text-xs text-muted">{new Date(item.at).toLocaleString()}</span>
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
    <AppShell title="Practicum">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Student</p>
            <h2 className="text-xl font-semibold text-fg">Practicum</h2>
            <p className="mt-1 text-sm text-muted">
              Add Real World life skills or an exam you are preparing for. Pace uses your education level
              {klass ? ` (${klass})` : ""} and what you have checked off.
            </p>
          </div>
          <Button onClick={() => setAdding(true)}>Add practicum</Button>
        </div>

        {adding && (
          <div className="rounded-2xl border border-border bg-card p-4">
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
          {tracks.length === 0 && !adding && (
            <p className="text-sm text-muted">Nothing yet. Add Real World, or an exam such as ACT, GRE, or NCLEX.</p>
          )}
          {tracks.map((track) => {
            const topics = track.plan?.topics || [];
            const done = topics.filter((t) => track.checked[t.id]).length;
            const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
            const stale = daysSince(track.lastRefreshed) > 30;
            return (
              <article
                key={track.id}
                className="cursor-pointer rounded-2xl border border-border bg-card p-4 hover:border-teal"
                onClick={() => {
                  setSheet(null);
                  setShowList(true);
                  setOpenId(track.id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-fg">{track.testName}</h3>
                    <p className="text-xs text-muted">{[level, grade, klass].filter(Boolean).join(" · ") || "Set grade in Profile"}</p>
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
                      disabled={busy}
                      onClick={() => {
                        setOpenId(track.id);
                        void refreshNamed(track);
                      }}
                    >
                      Refresh plan
                    </Button>
                    <Button
                      className="text-xs"
                      onClick={() => {
                        setSheet(null);
                        setShowList(true);
                        setOpenId(track.id);
                      }}
                    >
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
