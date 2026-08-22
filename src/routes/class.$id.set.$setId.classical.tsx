import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
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
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tellBack, setTellBack] = useState("");
  const [recited, setRecited] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void Promise.all([getClassById({ data: classId }), getStudySetById({ data: setId })]).then(([c, s]) => {
      setCls(c);
      setSet(s);
    });
  }, [classId, setId]);

  const classical = set?.notes?.classical as ClassicalPackage | undefined;

  const cards = classical?.socraticCards || [];
  const card = cards[cardIndex];

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
        <div className="mx-auto max-w-lg rounded-xl border border-amber-200/40 bg-amber-50/80 p-6 text-center dark:bg-amber-950/30">
          <p className="font-serif text-lg text-amber-950 dark:text-amber-50">No classical package yet</p>
          <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">
            Return to the chapter list and open Classical Mode from the laurel icon to generate The Conspectus.
          </p>
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
      <Link to="/class/$id" params={{ id: classId }} className="mb-3 inline-block text-sm text-teal hover:underline">
        ← Back to class
      </Link>

      <div className="mb-4 overflow-hidden rounded-xl border border-amber-200/30">
        <div
          className="bg-cover bg-center px-4 py-5 text-white"
          style={{ backgroundImage: "linear-gradient(rgba(20,12,4,0.72), rgba(20,12,4,0.82)), url(/roman-columns.jpg)" }}
        >
          <p className="text-[10px] font-semibold tracking-[0.2em] text-amber-200 uppercase">Classical Education</p>
          <h1 className="font-serif text-xl sm:text-2xl">{set.name}</h1>
          <p className="text-xs text-white/75">
            {cls.code} · The Conspectus · Orator · Socratic Tutor · Commonplace
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-amber-800 text-amber-50" : "bg-bg text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "conspectus" && <ConspectusView classical={classical} tellBack={tellBack} setTellBack={setTellBack} />}
      {tab === "orator" && <OratorView classical={classical} />}
      {tab === "socratic" && (
        <SocraticView
          cards={cards}
          card={card}
          index={cardIndex}
          flipped={flipped}
          onFlip={() => setFlipped((v) => !v)}
          onPrev={() => {
            setFlipped(false);
            setCardIndex((i) => Math.max(0, i - 1));
          }}
          onNext={() => {
            setFlipped(false);
            setCardIndex((i) => Math.min(cards.length - 1, i + 1));
          }}
        />
      )}
      {tab === "commonplace" && (
        <CommonplaceView
          classical={classical}
          recited={recited}
          onToggle={(id) => setRecited((prev) => ({ ...prev, [id]: !prev[id] }))}
        />
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface mb-4 rounded-xl p-4 sm:p-5">
      <h2 className="mb-3 font-serif text-base font-semibold text-amber-900 dark:text-amber-100">{title}</h2>
      {children}
    </section>
  );
}

function ConspectusView({
  classical,
  tellBack,
  setTellBack,
}: {
  classical: ClassicalPackage;
  tellBack: string;
  setTellBack: (v: string) => void;
}) {
  const topics = classical.conspectus.fiveCommonTopics;
  return (
    <div>
      <Section title="Memory-work">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {classical.conspectus.memoryWork.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </Section>

      <Section title="Clean outline">
        <div className="space-y-3">
          {classical.conspectus.outline.map((block, i) => (
            <div key={i}>
              <div className="text-sm font-semibold">{block.heading}</div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg/90">
                {block.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Logic page">
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
            <div key={label} className="rounded-lg border border-border bg-bg p-3">
              <div className="text-[11px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">{label}</div>
              <p className="mt-1 text-sm">{value || "—"}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tell-back (narration)">
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
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-amber-700"
        />
        <p className="mt-2 text-[11px] text-muted">Scoring against sequence and the “why” will come in the next pass.</p>
      </Section>

      {classical.conspectus.lociMap.length > 0 && (
        <Section title="Loci map">
          <div className="grid gap-2 sm:grid-cols-2">
            {classical.conspectus.lociMap.map((row, i) => (
              <div key={i} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">{row.locus}</div>
                <div>{row.item}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {classical.fromMemoryOutline.length > 0 && (
        <Section title="From-memory outline">
          <p className="mb-3 text-xs text-muted">Reconstruct without looking. Skeleton only.</p>
          {classical.fromMemoryOutline.map((block, i) => (
            <div key={i} className="mb-3">
              <div className="text-sm font-semibold">{block.heading}</div>
              <div className="mt-1 space-y-2">
                {Array.from({ length: block.blankBullets || 3 }).map((_, j) => (
                  <div key={j} className="h-8 rounded border border-dashed border-border bg-bg/50" />
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function OratorView({ classical }: { classical: ClassicalPackage }) {
  return (
    <div>
      <Section title="Recitation track">
        <p className="mb-2 text-xs text-muted">Grammar layer — speak slowly and precisely.</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{classical.orator.recitationScript}</p>
      </Section>
      <Section title="Narration track">
        <p className="mb-2 text-xs text-muted">Story and argument — include the why.</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{classical.orator.narrationScript}</p>
      </Section>
    </div>
  );
}

function SocraticView({
  cards,
  card,
  index,
  flipped,
  onFlip,
  onPrev,
  onNext,
}: {
  cards: ClassicalPackage["socraticCards"];
  card?: ClassicalPackage["socraticCards"][number];
  index: number;
  flipped: boolean;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!card) {
    return <p className="text-sm text-muted">No Socratic cards in this package.</p>;
  }
  const typeLabel =
    card.type === "recite"
      ? "Recite"
      : card.type === "explain"
        ? "Explain in your own words"
        : card.type === "dialectic"
          ? "Why / compare / what follows"
          : "Locus";
  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Card {index + 1} of {cards.length} · {typeLabel}
      </p>
      <button
        type="button"
        onClick={onFlip}
        className="card-surface flex min-h-48 w-full flex-col items-center justify-center rounded-xl p-6 text-center"
      >
        <div className="mb-2 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">{typeLabel}</div>
        <p className="text-base font-medium">{flipped ? card.back : card.front}</p>
        {card.locus && <p className="mt-3 text-xs text-muted">Locus: {card.locus}</p>}
        <p className="mt-4 text-[11px] text-muted">{flipped ? "Model answer" : "Tap to reveal"}</p>
      </button>
      <div className="mt-3 flex justify-between gap-2">
        <Button variant="secondary" onClick={onPrev} disabled={index === 0}>
          Previous
        </Button>
        <Button variant="secondary" onClick={onNext} disabled={index >= cards.length - 1}>
          Next
        </Button>
      </div>
    </div>
  );
}

function CommonplaceView({
  classical,
  recited,
  onToggle,
}: {
  classical: ClassicalPackage;
  recited: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <Section title="Commonplace extracts">
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
      </Section>
      <Section title="Recitation queue">
        <p className="mb-3 text-xs text-muted">Mark when said from memory — not merely flipped.</p>
        <ul className="space-y-2">
          {classical.recitationQueue.map((item) => (
            <li key={item.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(recited[item.id])}
                onChange={() => onToggle(item.id)}
              />
              <div>
                <div className="text-[10px] font-semibold text-muted uppercase">{item.kind}</div>
                <div className="text-sm">{item.text}</div>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
