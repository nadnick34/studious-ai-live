import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { adviseFantasyPick, extractMaterials, gradeFantasyTeam } from "@/lib/ai";
import { getTeacherToolState, saveTeacherToolState } from "@/lib/data";
import {
  DEFAULT_SCORING,
  STARTER_BOARD,
  isMine,
  localTop3,
  matchPlayer,
  whosePick,
  type FantasyPlayer,
  type Scoring,
} from "@/lib/fantasy";

export const Route = createFileRoute("/sports")({ component: SportsPage });

type Phase = "setup" | "draft" | "review";

type PickRec = { name: string; mine: boolean; overall: number };

type DraftState = {
  year: number;
  draftType: string;
  selection: "snake" | "linear";
  teams: number;
  mySlot: number;
  pickSeconds: number;
  draftTime: string;
  rounds: number;
  scoring: Scoring;
  rulesText: string;
  phase: Phase;
  overall: number;
  picks: PickRec[];
  mine: string[];
};

const empty: DraftState = {
  year: new Date().getFullYear(),
  draftType: "Redraft",
  selection: "snake",
  teams: 12,
  mySlot: 6,
  pickSeconds: 90,
  draftTime: "",
  rounds: 15,
  scoring: { ...DEFAULT_SCORING },
  rulesText: "",
  phase: "setup",
  overall: 1,
  picks: [],
  mine: [],
};

function scoringLine(s: Scoring) {
  return `Pass ${s.passYdsPerPoint} yds/pt, pass TD ${s.passTd}, INT ${s.int}, rush ${s.rushYdsPerPoint} yds/pt, rush TD ${s.rushTd}, rec ${s.recYdsPerPoint} yds/pt, rec TD ${s.recTd}, PPR ${s.reception}`;
}

function SportsPage() {
  const user = useCurrentUser();
  const [d, setD] = useState<DraftState>(empty);
  const [entry, setEntry] = useState("");
  const [asMine, setAsMine] = useState(false);
  const [left, setLeft] = useState(90);
  const [advice, setAdvice] = useState<{ name: string; why: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [grade, setGrade] = useState<{ grade: string; summary: string; needs: string[]; trades: string[]; pickups: string[] } | null>(null);

  const takenNames = useMemo(() => new Set(d.picks.map((p) => p.name.toLowerCase())), [d.picks]);
  const available = useMemo(
    () => STARTER_BOARD.filter((p) => !takenNames.has(p.name.toLowerCase())),
    [takenNames],
  );
  const myPlayers = useMemo(
    () => STARTER_BOARD.filter((p) => d.mine.some((n) => n.toLowerCase() === p.name.toLowerCase())),
    [d.mine],
  );
  const local = useMemo(() => localTop3(available, myPlayers, d.scoring), [available, myPlayers, d.scoring]);
  const snake = d.selection === "snake";
  const mineNow = isMine(d.overall, d.teams, snake, d.mySlot);
  const { round, slot } = whosePick(d.overall, d.teams, snake);

  useEffect(() => {
    if (!user?.id) return;
    void getTeacherToolState()
      .then((tools) => {
        if (tools?.fantasyDraft && typeof tools.fantasyDraft === "object") {
          setD({ ...empty, ...(tools.fantasyDraft as DraftState) });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || d === empty) return;
    const t = window.setTimeout(() => {
      void saveTeacherToolState({ data: { fantasyDraft: d } }).catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [d, user?.id]);

  useEffect(() => {
    if (d.phase !== "draft") return;
    setLeft(d.pickSeconds);
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [d.phase, d.overall, d.pickSeconds]);

  function patch(p: Partial<DraftState>) {
    setD((cur) => ({ ...cur, ...p }));
  }

  async function loadRules() {
    if (!files.length) return;
    setBusy(true);
    try {
      const payloads = await capturedToPayloads(files);
      const extracted = await extractMaterials({ data: { files: payloads } });
      patch({ rulesText: extracted.text.slice(0, 8000) });
    } catch {
      /* keep manual scoring */
    } finally {
      setBusy(false);
    }
  }

  async function refreshAdvice(next = d, pool = available) {
    setBusy(true);
    try {
      const res = await adviseFantasyPick({
        data: {
          year: next.year,
          teams: next.teams,
          snake: next.selection === "snake",
          mySlot: next.mySlot,
          overall: next.overall,
          scoring: scoringLine(next.scoring),
          rules: next.rulesText,
          myTeam: next.mine,
          taken: next.picks.map((p) => p.name),
          available: pool.map((p) => `${p.adp}. ${p.name} ${p.pos} ${p.team}`),
        },
      });
      if (Array.isArray(res?.picks) && res.picks.length) setAdvice(res.picks.slice(0, 3));
    } catch {
      /* local list stays */
    } finally {
      setBusy(false);
    }
  }

  function logPick(player: FantasyPlayer, mine: boolean) {
    const rec: PickRec = { name: player.name, mine, overall: d.overall };
    const picks = [...d.picks, rec];
    const mineNames = mine ? [...d.mine, player.name] : d.mine;
    const overall = d.overall + 1;
    const done = overall > d.teams * d.rounds;
    const next: DraftState = { ...d, picks, mine: mineNames, overall, phase: done ? "review" : "draft" };
    setD(next);
    setEntry("");
    setAsMine(false);
    const pool = available.filter((p) => p.id !== player.id);
    if (!done) void refreshAdvice(next, pool);
  }

  function submitEntry() {
    const player = matchPlayer(entry, available);
    if (!player) return;
    logPick(player, asMine || mineNow);
  }

  async function finish() {
    patch({ phase: "review" });
    setBusy(true);
    try {
      const g = await gradeFantasyTeam({
        data: {
          year: d.year,
          scoring: scoringLine(d.scoring),
          myTeam: d.mine,
          available: available.map((p) => `${p.name} ${p.pos}`),
        },
      });
      setGrade(g as typeof grade);
    } finally {
      setBusy(false);
    }
  }

  const shown = advice.length
    ? advice
        .map((a) => {
          const p = matchPlayer(a.name, available);
          return p ? { player: p, why: a.why } : null;
        })
        .filter(Boolean) as { player: FantasyPlayer; why: string }[]
    : local.map((p) => ({ player: p, why: "Consensus ADP + your roster need" }));

  return (
    <AppShell title="Sports">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Student</p>
          <h2 className="text-xl font-semibold text-fg">Fantasy draft assistant</h2>
          <p className="mt-1 text-sm text-muted">Fast board. Best three available. Log picks as they go.</p>
        </div>

        {d.phase === "setup" && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Year" value={String(d.year)} onChange={(v) => patch({ year: Number(v) || d.year })} />
              <label className="block text-xs text-muted">
                Draft type
                <select className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" value={d.draftType} onChange={(e) => patch({ draftType: e.target.value })}>
                  {["Redraft", "Keeper", "Dynasty", "Best ball"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted">
                Selection
                <select className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" value={d.selection} onChange={(e) => patch({ selection: e.target.value as "snake" | "linear" })}>
                  <option value="snake">Snake</option>
                  <option value="linear">Linear / auction clock</option>
                </select>
              </label>
              <Field label="Teams" value={String(d.teams)} onChange={(v) => patch({ teams: Math.min(16, Math.max(4, Number(v) || 12)) })} />
              <Field label="My pick position" value={String(d.mySlot)} onChange={(v) => patch({ mySlot: Math.min(d.teams, Math.max(1, Number(v) || 1)) })} />
              <Field label="Seconds per pick" value={String(d.pickSeconds)} onChange={(v) => patch({ pickSeconds: Math.max(15, Number(v) || 90) })} />
              <Field label="Rounds" value={String(d.rounds)} onChange={(v) => patch({ rounds: Math.min(20, Math.max(8, Number(v) || 15)) })} />
              <label className="block text-xs text-muted">
                Draft time
                <input type="datetime-local" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" value={d.draftTime} onChange={(e) => patch({ draftTime: e.target.value })} />
              </label>
            </div>
            <p className="text-xs font-semibold text-muted">Points</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["passYdsPerPoint", "Pass yds / pt"],
                  ["passTd", "Pass TD"],
                  ["int", "INT"],
                  ["rushYdsPerPoint", "Rush yds / pt"],
                  ["rushTd", "Rush TD"],
                  ["recYdsPerPoint", "Rec yds / pt"],
                  ["recTd", "Rec TD"],
                  ["reception", "PPR"],
                ] as [keyof Scoring, string][]
              ).map(([k, lab]) => (
                <Field
                  key={k}
                  label={lab}
                  value={String(d.scoring[k])}
                  onChange={(v) => patch({ scoring: { ...d.scoring, [k]: Number(v) } })}
                />
              ))}
            </div>
            <p className="text-xs text-muted">Upload a photo or screenshot of league rules / positions / scoring.</p>
            <CaptureBar items={files} onChange={setFiles} disabled={busy} />
            {files.length > 0 && (
              <Button variant="secondary" disabled={busy} onClick={() => void loadRules()}>
                {busy ? "Reading…" : "Read rules into draft"}
              </Button>
            )}
            {d.rulesText && <p className="line-clamp-4 text-[11px] text-muted">{d.rulesText}</p>}
            <Button
              onClick={() => {
                patch({ phase: "draft", overall: 1, picks: [], mine: [] });
                setAdvice([]);
                void refreshAdvice({ ...d, phase: "draft", overall: 1, picks: [], mine: [] }, STARTER_BOARD);
              }}
            >
              Start draft
            </Button>
          </section>
        )}

        {d.phase === "draft" && (
          <section className="space-y-3">
            <div className={`rounded-2xl border p-4 ${mineNow ? "border-teal bg-teal/10" : "border-border bg-card"}`}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Round {round} · Overall {d.overall} · Slot {slot}
                  </p>
                  <p className="text-lg font-semibold text-fg">{mineNow ? "Your pick" : `On the clock: slot ${slot}`}</p>
                </div>
                <p className={`font-mono text-3xl ${left <= 15 ? "text-red" : "text-fg"}`}>
                  {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-teal/40 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">Best 3 available</p>
              <ol className="mt-2 space-y-2">
                {shown.slice(0, 3).map((row, i) => (
                  <li key={row.player.id} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                    <div>
                      <p className="font-medium text-fg">
                        {i + 1}. {row.player.name}{" "}
                        <span className="text-xs text-muted">
                          {row.player.pos} · {row.player.team}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted">{row.why}</p>
                    </div>
                    <Button className="h-9 text-xs" onClick={() => logPick(row.player, true)}>
                      I take
                    </Button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold text-muted">Log a pick</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEntry();
                  }}
                  placeholder="Player name"
                  className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input type="checkbox" checked={asMine || mineNow} onChange={(e) => setAsMine(e.target.checked)} />
                  Mine
                </label>
                <Button onClick={submitEntry}>Log</Button>
              </div>
              <p className="mt-1 text-[11px] text-muted">Type the name taken off the board. Check Mine when you drafted him.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted">My team ({d.mine.length})</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {d.mine.length === 0 && <li className="text-muted">—</li>}
                  {d.mine.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted">Last picks</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
                  {d.picks.slice(-8).reverse().map((p) => (
                    <li key={p.overall}>
                      {p.overall}. {p.name} {p.mine ? "· you" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => finish()}>
                End draft / grade
              </Button>
              <Button variant="secondary" onClick={() => patch({ phase: "setup" })}>
                Setup
              </Button>
            </div>
          </section>
        )}

        {d.phase === "review" && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold text-fg">Post-draft grade</h3>
            <p className="text-3xl font-semibold text-teal">{grade?.grade || (busy ? "…" : "—")}</p>
            <p className="text-sm text-fg/90">{grade?.summary}</p>
            <Need title="Needs" items={grade?.needs} />
            <Need title="Trade for" items={grade?.trades} />
            <Need title="Waiver / still out there" items={grade?.pickups} />
            <p className="text-xs font-semibold text-muted">Your roster</p>
            <ul className="text-sm">{d.mine.map((n) => <li key={n}>{n}</li>)}</ul>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => void finish()}>
                {busy ? "Grading…" : "Re-grade"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setD(empty);
                  setGrade(null);
                  setAdvice([]);
                }}
              >
                New draft
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <input className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-fg" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Need({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{title}</p>
      <ul className="list-disc pl-5 text-sm">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
