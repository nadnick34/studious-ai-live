import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KidsMascot, useKidsMascot } from "@/components/kids-mascot";
import { getClassById, getProfile, getStudySetById, updateStudySet } from "@/lib/data";
import { generateSpatialImages } from "@/lib/ai";
import type { ClassRecord, SpatialPanel, SpatialStory, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/spatial")({
  component: SpatialPage,
});

function normalizeStory(raw: StudySet["notes"]["spatialLearning"]): SpatialStory | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return { title: "Concept pictures", panels: raw.slice(0, 2), questions: [] };
  }
  return {
    title: raw.title || "Concept pictures",
    panels: (raw.panels || []).slice(0, 2),
    questions: [],
    videoUrl: raw.videoUrl,
  };
}

function SpatialPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const { name: mascotName, src: owlSrc, gender } = useKidsMascot();
  const [imgBusy, setImgBusy] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  const story = useMemo(() => (set ? normalizeStory(set.notes?.spatialLearning) : null), [set]);
  const panels = story?.panels || [];
  const missingImages = panels.some((p) => !p.imageUrl);

  useEffect(() => {
    if (!set || !story || !panels.length) return;
    if (!missingImages) return;
    let cancelled = false;
    void (async () => {
      setImgBusy(true);
      setMediaError(null);
      try {
        const profile = await getProfile();
        const result = await generateSpatialImages({
          data: { story, childGender: profile.childGender || gender },
        });
        if (cancelled) return;
        if (!result.ok) {
          setMediaError(result.error);
          return;
        }
        const notes = { ...set.notes, spatialLearning: result.story };
        await updateStudySet({ data: { id: set.id, patch: { notes } } });
        if (!cancelled) setSet({ ...set, notes });
      } catch (err) {
        if (!cancelled) setMediaError(err instanceof Error ? err.message : "Could not generate pictures");
      } finally {
        if (!cancelled) setImgBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set?.id, missingImages, panels.length]);

  if (!set || !cls) {
    return (
      <AppShell title="Spatial Learning">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Spatial – ${set.name}`}>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="text-xs text-muted">{cls.code}</div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <KidsMascot size="md" />
        <div>
          <p className="font-semibold text-fg">{mascotName} shows the big ideas</p>
          <p className="text-xs text-muted">
            One or two concept cartoons that explain the key ideas and how to use them.
          </p>
        </div>
      </div>

      {!story || panels.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          No concept cartoons for this chapter yet. Generate the chapter again in Kids Mode to create them.
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-5">
          <h2 className="text-center font-serif text-xl font-semibold text-fg">{story.title}</h2>

          {(missingImages || imgBusy) && (
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 text-center">
              <div className="mb-2 flex justify-center">
                <KidsMascot size="sm" />
              </div>
              <p className="text-sm font-medium text-fg">
                {imgBusy ? `${mascotName} is drawing the concept pictures…` : "Preparing pictures…"}
              </p>
              <p className="mt-1 text-xs text-muted">This runs automatically.</p>
            </div>
          )}

          {mediaError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">
              {mediaError}
            </p>
          )}

          {panels.map((panel, i) => (
            <ConceptComic key={panel.id || i} panel={panel} owlSrc={owlSrc} mascotName={mascotName} index={i} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ConceptComic({
  panel,
  owlSrc,
  mascotName,
  index,
}: {
  panel: SpatialPanel;
  owlSrc: string;
  mascotName: string;
  index: number;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border-4 border-slate-800/80 bg-white shadow-sm dark:border-border dark:bg-card">
      <div className="border-b border-border bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <img src={owlSrc} alt={mascotName} className="h-10 w-10 rounded-full object-cover object-top" />
          <div>
            <p className="text-xs text-muted">Concept {index + 1}</p>
            <h3 className="text-sm font-bold text-fg">{panel.title}</h3>
          </div>
          <span className="ml-auto text-2xl" aria-hidden>
            {panel.emoji || "💡"}
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        {panel.imageUrl ? (
          <img
            src={panel.imageUrl}
            alt={panel.title}
            className="mb-3 w-full rounded-xl border border-border object-cover"
          />
        ) : (
          <div className="mb-3 rounded-xl bg-gradient-to-br from-sky-50 to-amber-50 px-3 py-8 text-center dark:from-sky-950/30 dark:to-amber-950/20">
            <p className="text-4xl" aria-hidden>
              {panel.emoji || "📖"}
            </p>
            <p className="mt-2 text-xs text-muted">{panel.visualDescription}</p>
          </div>
        )}
        {panel.owlSays && (
          <div className="mb-2 rounded-xl rounded-tl-none border border-border bg-bg px-3 py-2 text-sm italic text-fg">
            “{panel.owlSays}”
          </div>
        )}
        <p className="text-sm leading-relaxed text-fg/90">{panel.caption}</p>
      </div>
    </article>
  );
}
