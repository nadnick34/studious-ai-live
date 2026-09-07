import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CaptureBar, capturedToPayloads, type CapturedFile } from "@/components/capture-bar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { adviseFantasyPick, extractMaterials, gradeFantasyTeam, parseFantasyRules } from "@/lib/ai";
import { getTeacherToolState, saveTeacherToolState } from "@/lib/data";
import {
  DEFAULT_SCORING,
  STARTER_BOARD,
  isMine,
  matchPlayer,
  rankAvailable,
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
  scoringType: string;
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
  draftType: "Live Standard Draft",
  scoringType: "PPR",
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

function scoringLine(s: Scoring, scoringType: string) {
  return `${scoringType}. Pass ${s.passYdsPerPoint} yds/pt, pass TD ${s.passTd}, INT ${s.int}, rush ${s.rushYdsPerPoint} yds/pt, rush TD ${s.rushTd}, rec ${s.recYdsPerPoint} yds/pt, rec TD ${s.recTd}, rec ${s.reception}`;
}

function applyScoringType(type: string, s: Scoring): Scoring {
  const next = { ...s };
  if (type === "Standard") next.reception = 0;
  if (type === "Half-PPR") next.reception = 0.5;
  if (type === "PPR") next.reception = 1;
  if (type === "0.5 PPR / 1.5 TE Premium") next.reception = 0.5;
  return next;
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
  const [applied, setApplied] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  const takenNames = useMemo(() => new Set(d.picks.map((p) => p.name.toLowerCase())), [d.picks]);
  const available = useMemo(
    () => STARTER_BOARD.filter((p) => !takenNames.has(p.name.toLowerCase())),
    [takenNames],
  );
  const myPlayers = useMemo(
    () => STARTER_BOARD.filter((p) => d.mine.some((n) => n.toLowerCase() === p.name.toLowerCase())),
    [d.mine],
  );
  const rankOpts = { scoringType: d.scoringType, draftType: d.draftType, overall: d.overall, teams: d.teams };
  const preview20 = useMemo(
    () => rankAvailable(available, myPlayers, d.scoring, { ...rankOpts, limit: 20 }),
    [available, myPlayers, d.scoring, d.scoringType, d.draftType, d.overall, d.teams],
  );
  const live10 = useMemo(
    () => rankAvailable(available, myPlayers, d.scoring, { ...rankOpts, limit: 10 }),
    [available, myPlayers, d.scoring, d.scoringType, d.draftType, d.overall, d.teams],
  );
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
  }, [d.phase, d.overall, d.pickSeconds]);

  useEffect(() => {
    if (d.phase !== "draft" || paused) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [d.phase, paused, d.overall]);

  function patch(p: Partial<DraftState>) {
    setD((cur) => ({ ...cur, ...p }));
  }

  async function loadRules() {
    if (!files.length) return;
    setBusy(true);
    setApplied([]);
    try {
      const payloads = await capturedToPayloads(files);
      const extracted = await extractMaterials({ data: { files: payloads } });
      const text = extracted.text.slice(0, 12000);
      const parsed = await parseFantasyRules({ data: { text } });
      const next: Partial<DraftState> = { rulesText: text };
      const changed: string[] = [];
      const take = (label: string, fromDoc: unknown, current: unknown, apply: () => void) => {
        if (fromDoc === null || fromDoc === undefined || fromDoc === "") return;
        if (String(fromDoc) === String(current)) return;
        apply();
        changed.push(`${label}: ${current} → ${fromDoc}`);
      };
      take("Year", parsed.year, d.year, () => {
        next.year = Number(parsed.year);
      });
      take("Draft type", parsed.draftType, d.draftType, () => {
        next.draftType = String(parsed.draftType);
      });
      take("Scoring type", parsed.scoringType, d.scoringType, () => {
        next.scoringType = String(parsed.scoringType);
      });
      take("Selection", parsed.selection, d.selection, () => {
        next.selection = parsed.selection as "snake" | "linear";
      });
      take("Teams", parsed.teams, d.teams, () => {
        next.teams = Number(parsed.teams);
      });
      take("Pick position", parsed.mySlot, d.mySlot, () => {
        next.mySlot = Number(parsed.mySlot);
      });
      take("Seconds per pick", parsed.pickSeconds, d.pickSeconds, () => {
        next.pickSeconds = Number(parsed.pickSeconds);
      });
      take("Rounds", parsed.rounds, d.rounds, () => {
        next.rounds = Number(parsed.rounds);
      });
      if (parsed.scoring && typeof parsed.scoring === "object") {
        const scoring = { ...d.scoring };
        (Object.keys(d.scoring) as (keyof Scoring)[]).forEach((k) => {
          const v = (parsed.scoring as Record<string, number>)[k];
          if (typeof v === "number" && !Number.isNaN(v) && v !== d.scoring[k]) {
            scoring[k] = v;
            changed.push(`${k}: ${d.scoring[k]} → ${v}`);
          }
        });
        next.scoring = scoring;
        if (next.scoringType) next.scoring = applyScoringType(next.scoringType, scoring);
      } else if (parsed.scoringType) {
        next.scoring = applyScoringType(String(parsed.scoringType), d.scoring);
      }
      patch(next);
      setApplied(changed.length ? changed : parsed.note ? [parsed.note] : ["Rules saved. No setting differences found."]);
    } catch {
      setApplied(["Could not read the upload. Settings left as entered."]);
    } finally {
      setBusy(false);
    }
  }

  async function refreshAdvice(next = d, pool = available, limit = 10) {
    setBusy(true);
    const dataLimit = limit;
    try {
      const res = await adviseFantasyPick({
        data: {
          year: next.year,
          teams: next.teams,
          snake: next.selection === "snake",
          mySlot: next.mySlot,
          overall: next.overall,
          scoring: scoringLine(next.scoring, next.scoringType),
          rules: next.rulesText,
          myTeam: next.mine,
          taken: next.picks.map((p) => p.name),
          available: pool.map((p) => `${p.adp}. ${p.name} ${p.pos} ${p.team}`),
          limit,
        },
      });
      if (Array.isArray(res?.picks) && res.picks.length) setAdvice(res.picks.slice(0, dataLimit));
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
          scoring: scoringLine(d.scoring, d.scoringType),
          myTeam: d.mine,
          available: available.map((p) => `${p.name} ${p.pos}`),
        },
      });
      setGrade(g as typeof grade);
    } finally {
      setBusy(false);
    }
  }

  function decorate(list: FantasyPlayer[]) {
    const whyBy = new Map(advice.map((a) => [a.name.toLowerCase(), a.why]));
    return list.map((player) => ({
      player,
      why: whyBy.get(player.name.toLowerCase()) || "ADP, scoring, and roster need",
    }));
  }
  const shownSetup = decorate(preview20);
  const shownLive = decorate(live10);

  return (
    <AppShell title="Fantasy Draft Assistant">
      <div className="relative -mx-4 min-h-[calc(100dvh-6rem)] overflow-hidden bg-black px-4 py-4 text-white sm:-mx-6 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url('/field-bg.png')" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />
        <div className="relative mx-auto max-w-3xl space-y-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/50 uppercase">Sports</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Fantasy Draft Assistant</h2>
          <p className="mt-1 text-sm text-white/70">Fast board. Ranked names. Log picks as they go.</p>
        </div>

        {d.phase === "setup" && (
          <section className="space-y-3 rounded-2xl border border-white/20 bg-black/70 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Year" value={String(d.year)} onChange={(v) => patch({ year: Number(v) || d.year })} />
              <label className="block text-xs text-white/60">
                Draft type
                <select className="mt-1 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-sm text-white" value={d.draftType} onChange={(e) => patch({ draftType: e.target.value, selection: e.target.value.includes("Salary") ? "linear" : d.selection })}>
                  {[
                    "Live Standard Draft",
                    "Live Salary Cap Draft",
                    "Offline Draft",
                    "Autopick Draft",
                    "Mock Draft",
                    "Redraft",
                    "Keeper",
                    "Dynasty",
                    "Best Ball",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-white/60">
                Scoring type
                <select
                  className="mt-1 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-sm text-white"
                  value={d.scoringType}
                  onChange={(e) => {
                    const scoringType = e.target.value;
                    patch({ scoringType, scoring: applyScoringType(scoringType, d.scoring) });
                  }}
                >
                  {[
                    "Standard",
                    "Half-PPR",
                    "PPR",
                    "0.5 PPR / 1.5 TE Premium",
                    "Superflex",
                    "IDP",
                    "Death / Guillotine",
                    "Head-to-Head Points",
                    "Head-to-Head Category",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-white/60">
                Selection
                <select className="mt-1 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-sm text-white" value={d.selection} onChange={(e) => patch({ selection: e.target.value as "snake" | "linear" })}>
                  <option value="snake">Snake</option>
                  <option value="linear">Linear / salary cap clock</option>
                </select>
              </label>
              <Field label="Teams" value={String(d.teams)} onChange={(v) => patch({ teams: Math.min(16, Math.max(4, Number(v) || 12)) })} />
              <Field label="My pick position" value={String(d.mySlot)} onChange={(v) => patch({ mySlot: Math.min(d.teams, Math.max(1, Number(v) || 1)) })} />
              <Field label="Seconds per pick" value={String(d.pickSeconds)} onChange={(v) => patch({ pickSeconds: Math.max(15, Number(v) || 90) })} />
              <Field label="Rounds" value={String(d.rounds)} onChange={(v) => patch({ rounds: Math.min(20, Math.max(8, Number(v) || 15)) })} />
              <label className="block text-xs text-white/60">
                Draft time
                <input type="datetime-local" className="mt-1 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-sm text-white" value={d.draftTime} onChange={(e) => patch({ draftTime: e.target.value })} />
              </label>
            </div>
            <p className="text-xs font-semibold text-white/60">Points</p>
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
            <p className="text-xs text-white/60">Upload a photo or screenshot of league rules / positions / scoring.</p>
            <CaptureBar items={files} onChange={setFiles} disabled={busy} />
            {files.length > 0 && (
              <Button variant="secondary" disabled={busy} onClick={() => void loadRules()}>
                {busy ? "Reading…" : "Read rules into draft"}
              </Button>
            )}
            {applied.length > 0 && (
              <ul className="rounded-lg border border-teal/40 bg-teal/10 px-3 py-2 text-[11px] text-fg">
                {applied.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
            {d.rulesText && <p className="line-clamp-4 text-[11px] text-white/55">{d.rulesText}</p>}
            <Board title="Top 20 available (pre-draft)" rows={shownSetup} />
            <Button
              onClick={() => {
                patch({ phase: "draft", overall: 1, picks: [], mine: [] });
                setAdvice([]);
                void refreshAdvice({ ...d, phase: "draft", overall: 1, picks: [], mine: [] }, STARTER_BOARD, 10);
              }}
            >
              Start draft
            </Button>
          </section>
        )}

        {d.phase === "draft" && (
          <section className="space-y-3">
            <div className={`rounded-2xl border p-4 ${mineNow ? "border-white bg-white/15" : "border-white/20 bg-black/70"}`}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Round {round} · Overall {d.overall} · Slot {slot}
                  </p>
                  <p className="text-lg font-semibold text-white">{mineNow ? "Your pick" : `On the clock: slot ${slot}`}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl text-white">
                    {paused ? "PAUSED" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
                  </p>
                  <button type="button" className="mt-1 text-[11px] uppercase tracking-wide text-white/70 underline" onClick={() => setPaused((v) => !v)}>
                    {paused ? "Resume" : "Pause"}
                  </button>
                </div>
              </div>
            </div>

            <Board
              title="Top 10 available"
              rows={shownLive}
              onMine={(p) => logPick(p, true)}
              onTaken={(p) => logPick(p, false)}
            />

            <div className="rounded-2xl border border-white/20 bg-black/70 p-4">
              <p className="mb-2 text-xs font-semibold text-white/60">Log a pick</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEntry();
                  }}
                  placeholder="Player name"
                  className="min-w-0 flex-1 rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-sm text-white"
                />
                <label className="flex items-center gap-1 text-xs text-white/60">
                  <input type="checkbox" checked={asMine || mineNow} onChange={(e) => setAsMine(e.target.checked)} />
                  Mine
                </label>
                <Button onClick={submitEntry}>Log</Button>
              </div>
              <p className="mt-1 text-[11px] text-white/55">Type the name taken off the board. Check Mine when you drafted him.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-black/70 p-4">
                <p className="text-xs font-semibold text-white/60">My team ({d.mine.length})</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {d.mine.length === 0 && <li className="text-muted">—</li>}
                  {d.mine.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/70 p-4">
                <p className="text-xs font-semibold text-white/60">Last picks</p>
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
          <section className="space-y-3 rounded-2xl border border-white/20 bg-black/70 p-4">
            <h3 className="font-semibold text-white">Post-draft grade</h3>
            <p className="text-3xl font-semibold text-white">{grade?.grade || (busy ? "…" : "—")}</p>
            <p className="text-sm text-white/90">{grade?.summary}</p>
            <Need title="Needs" items={grade?.needs} />
            <Need title="Trade for" items={grade?.trades} />
            <Need title="Waiver / still out there" items={grade?.pickups} />
            <p className="text-xs font-semibold text-white/60">Your roster</p>
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
      </div>
    </AppShell>
  );
}

function Board({
  title,
  rows,
  onMine,
  onTaken,
}: {
  title: string;
  rows: { player: FantasyPlayer; why: string }[];
  onMine?: (p: FantasyPlayer) => void;
  onTaken?: (p: FantasyPlayer) => void;
}) {
  const actions = Boolean(onMine && onTaken);
  return (
    <div className="rounded-2xl border border-white/35 bg-black/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{title}</p>
      <ol className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <li key={row.player.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/40 px-3 py-2">
            <div className="min-w-0">
              <p className="font-medium text-white">
                {i + 1}. {row.player.name}{" "}
                <span className="text-xs text-white/55">
                  {row.player.pos} · {row.player.team}
                </span>
              </p>
              <p className="text-[11px] text-white/50">{row.why}</p>
            </div>
            {actions && (
              <div className="flex shrink-0 gap-1.5">
                <button type="button" className="h-9 rounded-md bg-white px-2 text-xs font-semibold text-black" onClick={() => onMine?.(row.player)}>
                  My Pick
                </button>
                <button type="button" className="h-9 rounded-md border border-white/40 px-2 text-xs font-semibold text-white" onClick={() => onTaken?.(row.player)}>
                  Taken
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-white/60">
      {label}
      <input className="mt-1 w-full rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-sm text-white text-white" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Need({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-white/60">{title}</p>
      <ul className="list-disc pl-5 text-sm">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
