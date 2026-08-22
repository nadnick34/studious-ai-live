import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { scoreClassicalWork, speakLecture } from "@/lib/ai";
import { getClassById, getStudySetById } from "@/lib/data";
import type { ClassicalPackage, ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/classical")({
  component: ClassicalPage,
});

type Tab = "conspectus" | "orator" | "socratic" | "commonplace";

function ClassicalPage() {
  const { id: classId, setId } = Route.useParams();
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [set, setSet] = useState<StudySet | null>(null);
  const [tab, setTab] = useState<Tab>("conspectus");
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    void Promise.all([getClassById({ data: classId }), getStudySetById({ data: setId })]).then(([c, s]) => {
      setCls(c);
      setSet(s);
    });
  }, [classId, setId]);

  const classical = set?.notes?.classical as ClassicalPackage | undefined;
  const sourceSummary = useMemo(() => {
    if (!set) return "";
    return (set.notes?.sections || [])
      .map((s) => [s.heading, s.body, ...(s.bullets || [])].filter(Boolean).join(" "))
      .join("\n")
      .slice(0, 10000);
  }, [set]);

  if (!cls || !set) {
    return (
      <AppShell title="Classical Mode">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  if (!classical) {
    return (
      <AppShell title="Classical Mode">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 text-center">
          <img src="/classical-wreath.jpg" alt="" className="mx-auto mb-3 h-12 w-auto" />
          <p className="font-serif text-lg text-fg">No classical package yet</p>
          <p className="mt-2 text-sm text-muted">Open Classical Mode from the chapter list to generate The Conspectus.</p>
          <Link to="/class/$id" params={{ id: classId }} className="mt-4 inline-block text-sm text-teal hover:underline">
            ← Back to class
          </Link>
        </div>
      </AppShell>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "conspectus", label: "The Conspectus" },
    { id: "orator", label: "Orator's Companion" },
    { id: "socratic", label: "Socratic Tutor" },
    { id: "commonplace", label: "Commonplace" },
  ];

  return (
    <AppShell title={`${set.name} · Classical`}>
      <Link to="/class/$id" params={{ id: classId }} className="print-hidden mb-3 inline-block text-sm text-teal hover:underline">
        ← Back to class
      </Link>

      <div className="print-hidden mb-3 rounded-xl border border-border border-l-4 border-l-amber-500 bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/classical-wreath.jpg" alt="" className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-800 uppercase dark:text-amber-200">
                Classical Education
              </p>
              <h1 className="truncate font-serif text-xl text-fg">{set.name}</h1>
              <p className="text-xs text-muted">{cls.code}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="secondary" className="min-h-9 text-xs" onClick={() => window.print()}>
              Print / PDF
            </Button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-border text-sm font-semibold text-amber-800 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-900/30"
              aria-label="About Classical Education"
              title="About Classical Education"
            >
              i
            </button>
          </div>
        </div>
      </div>

      <div className="print-hidden mb-3 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ${
              tab === t.id
                ? "border-amber-500/60 bg-amber-50 text-amber-950 dark:bg-amber-900/30 dark:text-amber-50"
                : "border-border bg-card text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conspectus" && (
        <ConspectusView classical={classical} chapterName={set.name} sourceSummary={sourceSummary} />
      )}
      {tab === "orator" && <OratorView classical={classical} chapterName={set.name} />}
      {tab === "socratic" && <SocraticView classical={classical} chapterName={set.name} />}
      {tab === "commonplace" && <CommonplaceView classical={classical} chapterName={set.name} />}

      {infoOpen && <ClassicalInfoModal onClose={() => setInfoOpen(false)} />}
    </AppShell>
  );
}

function ClassicalInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border border-l-4 border-l-amber-500 bg-card p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/classical-wreath.jpg" alt="" className="h-8 w-auto" />
            <h2 className="font-serif text-lg font-semibold text-fg">Classical Education</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-fg">
            Close
          </button>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-fg/90">
          <p>
            Classical education forms the mind through the <strong>Trivium</strong>: Grammar, Logic, and Rhetoric.
            Students first master the language of a subject, then learn to reason about it, then speak and write with
            clarity and force. The goal is mastery and understanding — not only test performance.
          </p>
          <div>
            <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-100">The Trivium</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>
                <strong className="text-fg">Grammar</strong> — knowledge, definitions, lists, precise wording
              </li>
              <li>
                <strong className="text-fg">Logic (Dialectic)</strong> — why, how, comparison, relationships, argument
              </li>
              <li>
                <strong className="text-fg">Rhetoric</strong> — telling it back, explaining, speaking with order and force
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-100">How each section works</h3>
            <ul className="list-disc space-y-2 pl-5 text-muted">
              <li>
                <strong className="text-fg">The Conspectus</strong> — classical study notebook: memory-work, clean
                outline, logic questions, Five Common Topics, tell-back narration, loci, and from-memory outline.
              </li>
              <li>
                <strong className="text-fg">Orator’s Companion</strong> — two spoken tracks: slow precise recitation
                (grammar) and narrative with the why (rhetoric).
              </li>
              <li>
                <strong className="text-fg">Socratic Tutor</strong> — cards that ask you to recite, explain, compare, and
                reason — not only term → definition.
              </li>
              <li>
                <strong className="text-fg">Commonplace</strong> — striking sentences and a recitation queue so you build
                a store of language and mark what you can say from memory.
              </li>
            </ul>
          </div>
          <p className="text-xs text-muted">
            Practice follows classical habits: narration (tell-back), dialectic questions, invention with the Five Common
            Topics, and recitation from memory.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoldSection({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-base font-semibold text-fg">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

type ScoreResult = {
  score: number;
  summary: string;
  strengths: string[];
  missing: string[];
  whyPresent: boolean;
};

function ConspectusView({
  classical,
  chapterName,
  sourceSummary,
}: {
  classical: ClassicalPackage;
  chapterName: string;
  sourceSummary: string;
}) {
  const topics = classical.conspectus.fiveCommonTopics;
  const [tellBack, setTellBack] = useState("");
  const [tellScore, setTellScore] = useState<ScoreResult | null>(null);
  const [tellBusy, setTellBusy] = useState(false);
  const [outlineAnswers, setOutlineAnswers] = useState<Record<string, string>>({});
  const [outlineScore, setOutlineScore] = useState<ScoreResult | null>(null);
  const [outlineBusy, setOutlineBusy] = useState(false);

  async function scoreTellBack() {
    if (!tellBack.trim()) return;
    setTellBusy(true);
    try {
      const result = await scoreClassicalWork({
        data: {
          mode: "tellback",
          chapterName,
          sourceSummary,
          studentText: tellBack,
          prompts: classical.conspectus.tellBackPrompts,
        },
      });
      setTellScore(result);
    } catch (err) {
      setTellScore({
        score: 0,
        summary: err instanceof Error ? err.message : "Scoring failed",
        strengths: [],
        missing: [],
        whyPresent: false,
      });
    } finally {
      setTellBusy(false);
    }
  }

  async function scoreOutline() {
    const text = classical.fromMemoryOutline
      .map((block, i) => {
        const lines = Array.from({ length: block.blankBullets || 3 })
          .map((_, j) => outlineAnswers[`${i}-${j}`] || "")
          .filter(Boolean);
        return `${block.heading}\n${lines.map((l) => `- ${l}`).join("\n")}`;
      })
      .join("\n\n");
    if (!text.replace(/\s/g, "")) return;
    setOutlineBusy(true);
    try {
      const result = await scoreClassicalWork({
        data: {
          mode: "outline",
          chapterName,
          sourceSummary,
          studentText: text,
        },
      });
      setOutlineScore(result);
    } catch (err) {
      setOutlineScore({
        score: 0,
        summary: err instanceof Error ? err.message : "Scoring failed",
        strengths: [],
        missing: [],
        whyPresent: false,
      });
    } finally {
      setOutlineBusy(false);
    }
  }

  return (
    <div id="classical-conspectus-print">
      <GoldSection title="Memory-work">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {classical.conspectus.memoryWork.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </GoldSection>

      <GoldSection title="Clean outline">
        <div className="space-y-3">
          {classical.conspectus.outline.map((block, i) => (
            <div key={i}>
              <div className="text-sm font-semibold">{block.heading}</div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {block.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GoldSection>

      <GoldSection title="Logic page">
        <p className="mb-2 text-xs font-medium text-muted">Why / how / relationship</p>
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm">
          {classical.conspectus.logicQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
        <p className="mb-2 text-xs font-medium text-muted">Five Common Topics</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["Definition", topics.definition],
              ["Comparison", topics.comparison],
              ["Circumstance", topics.circumstance],
              ["Relationship", topics.relationship],
              ["Testimony", topics.testimony],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border border-l-2 border-l-amber-400 bg-bg p-3">
              <div className="text-[11px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">{label}</div>
              <p className="mt-1 text-sm">{value || "—"}</p>
            </div>
          ))}
        </div>
      </GoldSection>

      <GoldSection
        title="Tell-back (narration)"
        actions={
          <div className="print-hidden flex gap-2">
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => {
                setTellBack("");
                setTellScore(null);
              }}
            >
              Clear / Reset
            </Button>
            <Button className="text-xs" disabled={tellBusy || !tellBack.trim()} onClick={() => void scoreTellBack()}>
              {tellBusy ? "Scoring…" : "AI Score"}
            </Button>
          </div>
        }
      >
        <p className="mb-2 text-xs text-muted">Source locked. Retell without looking back at the notes above.</p>
        <ul className="mb-3 list-disc space-y-1 pl-5 text-sm">
          {classical.conspectus.tellBackPrompts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <textarea
          value={tellBack}
          onChange={(e) => setTellBack(e.target.value)}
          rows={6}
          placeholder="Type your retelling here…"
          className="print-hidden w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-amber-600"
        />
        {tellScore && (
          <div className="mt-3 rounded-lg border border-border bg-bg p-3 text-sm">
            <div className="font-semibold">Score: {tellScore.score}/100</div>
            <p className="mt-1 text-muted">{tellScore.summary}</p>
            {tellScore.strengths.length > 0 && (
              <p className="mt-2 text-xs">
                <span className="font-medium">Strengths:</span> {tellScore.strengths.join("; ")}
              </p>
            )}
            {tellScore.missing.length > 0 && (
              <p className="mt-1 text-xs">
                <span className="font-medium">Missing:</span> {tellScore.missing.join("; ")}
              </p>
            )}
            <p className="mt-1 text-xs">{tellScore.whyPresent ? "The why was present." : "The why was weak or missing."}</p>
          </div>
        )}
      </GoldSection>

      {classical.conspectus.lociMap.length > 0 && (
        <GoldSection title="Loci map">
          <div className="grid gap-2 sm:grid-cols-2">
            {classical.conspectus.lociMap.map((row, i) => (
              <div key={i} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">{row.locus}</div>
                <div>{row.item}</div>
              </div>
            ))}
          </div>
        </GoldSection>
      )}

      {classical.fromMemoryOutline.length > 0 && (
        <GoldSection
          title="From-memory outline"
          actions={
            <div className="print-hidden flex gap-2">
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  setOutlineAnswers({});
                  setOutlineScore(null);
                }}
              >
                Clear / Reset
              </Button>
              <Button className="text-xs" disabled={outlineBusy} onClick={() => void scoreOutline()}>
                {outlineBusy ? "Scoring…" : "AI Score"}
              </Button>
            </div>
          }
        >
          <p className="mb-3 text-xs text-muted">Reconstruct without looking. Type into the blanks.</p>
          {classical.fromMemoryOutline.map((block, i) => (
            <div key={i} className="mb-4">
              <div className="mb-2 text-sm font-semibold">{block.heading}</div>
              <div className="space-y-2">
                {Array.from({ length: block.blankBullets || 3 }).map((_, j) => (
                  <input
                    key={j}
                    value={outlineAnswers[`${i}-${j}`] || ""}
                    onChange={(e) => setOutlineAnswers((prev) => ({ ...prev, [`${i}-${j}`]: e.target.value }))}
                    className="w-full rounded-lg border border-dashed border-border bg-bg px-3 py-2 text-sm outline-none focus:border-amber-600"
                    placeholder={`Point ${j + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
          {outlineScore && (
            <div className="rounded-lg border border-border bg-bg p-3 text-sm">
              <div className="font-semibold">Score: {outlineScore.score}/100</div>
              <p className="mt-1 text-muted">{outlineScore.summary}</p>
              {outlineScore.missing.length > 0 && (
                <p className="mt-1 text-xs">
                  <span className="font-medium">Missing:</span> {outlineScore.missing.join("; ")}
                </p>
              )}
            </div>
          )}
        </GoldSection>
      )}
    </div>
  );
}

function OratorView({ classical, chapterName }: { classical: ClassicalPackage; chapterName: string }) {
  const [busy, setBusy] = useState<"recitation" | "narration" | null>(null);
  const [playing, setPlaying] = useState<"recitation" | "narration" | null>(null);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Partial<Record<"recitation" | "narration", string>>>({});

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(null);
    setPaused(false);
  }

  function pauseAudio() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPaused(true);
    }
  }

  function resumeAudio() {
    if (audioRef.current && audioRef.current.paused) {
      void audioRef.current.play();
      setPaused(false);
    }
  }

  async function play(kind: "recitation" | "narration") {
    const text = kind === "recitation" ? classical.orator.recitationScript : classical.orator.narrationScript;
    if (!text.trim()) return;
    setError(null);

    if (playing === kind && paused) {
      resumeAudio();
      return;
    }
    if (playing === kind && !paused) {
      pauseAudio();
      return;
    }

    stopAudio();
    setBusy(kind);
    try {
      let url = cacheRef.current[kind];
      if (!url) {
        const result = await speakLecture({ data: { text, voice: kind === "recitation" ? "sal" : "eve" } });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        const bytes = Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0));
        url = URL.createObjectURL(new Blob([bytes], { type: result.mime }));
        cacheRef.current[kind] = url;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(null);
        setPaused(false);
      };
      setPlaying(kind);
      setPaused(false);
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playback failed");
      setPlaying(null);
    } finally {
      setBusy(null);
    }
  }

  function trackActions(kind: "recitation" | "narration") {
    const isThis = playing === kind;
    return (
      <div className="print-hidden flex gap-1.5">
        <Button className="text-xs" disabled={busy !== null && busy !== kind} onClick={() => void play(kind)}>
          {busy === kind ? "Generating…" : isThis && !paused ? "Pause" : isThis && paused ? "Resume" : "Play"}
        </Button>
        {isThis && (
          <Button variant="secondary" className="text-xs" onClick={stopAudio}>
            Stop
          </Button>
        )}
      </div>
    );
  }

  return (
    <div id="classical-orator-print">
      {error && <p className="mb-3 text-sm text-red">{error}</p>}
      <GoldSection title="Recitation track" actions={trackActions("recitation")}>
        <p className="mb-2 text-xs text-muted">Grammar layer — speak slowly and precisely.</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{classical.orator.recitationScript}</p>
      </GoldSection>
      <GoldSection title="Narration track" actions={trackActions("narration")}>
        <p className="mb-2 text-xs text-muted">Story and argument — include the why.</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{classical.orator.narrationScript}</p>
      </GoldSection>
    </div>
  );
}

function SocraticView({ classical, chapterName }: { classical: ClassicalPackage; chapterName: string }) {
  const cards = classical.socraticCards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [mode, setMode] = useState<"cards" | "list">("cards");
  const card = cards[index];

  if (!cards.length) {
    return <p className="text-sm text-muted">No Socratic cards in this package.</p>;
  }

  const front = reversed ? card.back : card.front;
  const back = reversed ? card.front : card.back;
  const typeLabel =
    card.type === "recite"
      ? "Recite"
      : card.type === "explain"
        ? "Explain"
        : card.type === "dialectic"
          ? "Why / compare"
          : "Locus";

  return (
    <div id="classical-socratic-print">
      <div className="print-hidden mb-3 flex flex-wrap gap-2">
        <Button variant={mode === "cards" ? "primary" : "secondary"} className="text-xs" onClick={() => setMode("cards")}>
          Cards
        </Button>
        <Button variant={mode === "list" ? "primary" : "secondary"} className="text-xs" onClick={() => setMode("list")}>
          List
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => {
            setReversed((v) => !v);
            setFlipped(false);
          }}
        >
          {reversed ? "Front: answer first" : "Reverse flip"}
        </Button>
      </div>

      {mode === "list" ? (
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={c.id || i} className="rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-3 text-sm">
              <div className="text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">{c.type}</div>
              <div className="mt-1 font-medium">{c.front}</div>
              <div className="mt-1 text-muted">{c.back}</div>
              {c.locus && <div className="mt-1 text-xs text-muted">Locus: {c.locus}</div>}
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Card {index + 1} of {cards.length} · {typeLabel}
            {reversed ? " · reversed" : ""}
          </p>
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-border border-l-4 border-l-amber-500 bg-card p-6 text-center"
          >
            <div className="mb-2 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">{typeLabel}</div>
            <p className="text-base font-medium">{flipped ? back : front}</p>
            {card.locus && <p className="mt-3 text-xs text-muted">Locus: {card.locus}</p>}
            <p className="mt-4 text-[11px] text-muted">{flipped ? "Answer side" : "Tap to flip"}</p>
          </button>
          <div className="mt-3 flex justify-between gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFlipped(false);
                setIndex((i) => Math.max(0, i - 1));
              }}
              disabled={index === 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFlipped(false);
                setIndex((i) => Math.min(cards.length - 1, i + 1));
              }}
              disabled={index >= cards.length - 1}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function CommonplaceView({ classical, chapterName }: { classical: ClassicalPackage; chapterName: string }) {
  const [recited, setRecited] = useState<Record<string, boolean>>({});
  return (
    <div id="classical-commonplace-print">
      <GoldSection title="Commonplace extracts">
        <p className="mb-3 text-xs text-muted">Striking sentences, definitions, and connections to keep.</p>
        <ul className="space-y-2">
          {classical.commonplace.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
              <span className="mr-2 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">
                {item.kind}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </GoldSection>
      <GoldSection title="Recitation queue">
        <p className="mb-3 text-xs text-muted">Mark when said from memory — not merely flipped.</p>
        <ul className="space-y-2">
          {classical.recitationQueue.map((item) => (
            <li key={item.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(recited[item.id])}
                onChange={() => setRecited((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
              />
              <div>
                <div className="text-[10px] font-semibold text-muted uppercase">{item.kind}</div>
                <div className="text-sm">{item.text}</div>
              </div>
            </li>
          ))}
        </ul>
      </GoldSection>
    </div>
  );
}
