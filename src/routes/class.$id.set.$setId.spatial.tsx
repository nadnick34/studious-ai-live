import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KidsMascot, useKidsMascot } from "@/components/kids-mascot";
import { Button } from "@/components/ui/button";
import { generateSpatialImages, generateSpatialVideo } from "@/lib/ai";
import { getClassById, getProfile, getStudySetById, updateStudySet } from "@/lib/data";
import type { ClassRecord, SpatialPanel, SpatialQuestion, SpatialStory, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/spatial")({
  component: SpatialPage,
});

function normalizeStory(raw: StudySet["notes"]["spatialLearning"]): SpatialStory | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return { title: "Picture story", panels: raw, questions: [] };
  }
  return {
    title: raw.title || "Picture story",
    panels: raw.panels || [],
    questions: (raw.questions || []).slice(0, 3),
    videoUrl: raw.videoUrl,
  };
}

function SpatialPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const { name: mascotName, src: owlSrc, gender } = useKidsMascot();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [playingReel, setPlayingReel] = useState(false);
  const [reelIndex, setReelIndex] = useState(0);
  const [imgBusy, setImgBusy] = useState(false);
  const [vidBusy, setVidBusy] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [classId, setId]);

  const story = useMemo(() => (set ? normalizeStory(set.notes?.spatialLearning) : null), [set]);
  const panels = story?.panels || [];
  const questions = story?.questions || [];
  const missingImages = panels.some((p) => !p.imageUrl);

  const allCorrect =
    checked && questions.length === 3 && questions.every((q) => answers[q.id] === q.correctIndex);

  async function persistStory(next: SpatialStory) {
    if (!set) return;
    const notes = { ...set.notes, spatialLearning: next };
    await updateStudySet({ data: { id: set.id, patch: { notes } } });
    setSet({ ...set, notes });
  }

  async function handleGenerateImages() {
    if (!story) return;
    setImgBusy(true);
    setMediaError(null);
    try {
      const profile = await getProfile();
      const result = await generateSpatialImages({
        data: { story, childGender: profile.childGender || gender },
      });
      if (!result.ok) {
        setMediaError(result.error);
        return;
      }
      await persistStory(result.story);
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Could not generate pictures");
    } finally {
      setImgBusy(false);
    }
  }


  // Auto-draw cartoons when the page opens if any panel is missing art
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

  async function handleGenerateVideo() {
    if (!story) return;
    setVidBusy(true);
    setMediaError(null);
    try {
      const profile = await getProfile();
      // Ensure pictures exist first
      let current = story;
      if (current.panels.some((p) => !p.imageUrl)) {
        const imgs = await generateSpatialImages({
          data: { story: current, childGender: profile.childGender || gender },
        });
        if (!imgs.ok) {
          setMediaError(imgs.error);
          return;
        }
        current = imgs.story;
        await persistStory(current);
      }
      const result = await generateSpatialVideo({
        data: { story: current, childGender: profile.childGender || gender },
      });
      if (!result.ok) {
        setMediaError(result.error);
        return;
      }
      await persistStory({ ...current, videoUrl: result.videoUrl });
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : "Could not generate video");
    } finally {
      setVidBusy(false);
    }
  }

  function selectAnswer(q: SpatialQuestion, optionIndex: number) {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  }

  function checkAnswers() {
    if (questions.length < 3) return;
    if (questions.some((q) => answers[q.id] == null)) return;
    setChecked(true);
  }

  function stopReel() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingReel(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function playStoryReel() {
    if (!panels.length) return;
    stopReel();
    setPlayingReel(true);
    setReelIndex(0);
    const first = panels[0];
    speak(`${first.owlSays || ""} ${first.caption || ""}`.trim());
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      if (i >= panels.length) {
        stopReel();
        return;
      }
      setReelIndex(i);
      const p = panels[i];
      speak(`${p.owlSays || ""} ${p.caption || ""}`.trim());
    }, 5500);
  }

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
          <p className="font-semibold text-fg">{mascotName} tells the story</p>
          <p className="text-xs text-muted">
            Read the comic, answer 3 questions, then unlock the short story video.
          </p>
        </div>
      </div>

      {!story || panels.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          No comic story for this chapter yet. Generate the chapter again in Kids Mode to create it.
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-5">
          <h2 className="text-center font-serif text-xl font-semibold text-fg">{story.title}</h2>

          {(missingImages || imgBusy) && (
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 text-center">
              <div className="mb-2 flex justify-center">
                <KidsMascot size="sm" />
              </div>
              <p className="text-sm font-medium text-fg">
                {imgBusy
                  ? `${mascotName} is drawing your cartoons…`
                  : "Preparing story pictures…"}
              </p>
              <p className="mt-1 text-xs text-muted">This runs automatically in the background.</p>
            </div>
          )}

          {mediaError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red dark:bg-red-950/30">
              {mediaError}
            </p>
          )}

          <div className="space-y-4">
            {panels.map((panel, i) => (
              <ComicPanel
                key={panel.id || i}
                panel={panel}
                owlSrc={owlSrc}
                mascotName={mascotName}
                highlight={playingReel && reelIndex === i}
              />
            ))}
          </div>

          <section className="rounded-2xl border-2 border-teal/25 bg-card p-4 sm:p-5">
            <h3 className="mb-1 text-base font-semibold text-fg">3 questions</h3>
            <p className="mb-4 text-xs text-muted">Answer all three correctly to unlock the short story video.</p>
            {questions.length === 0 ? (
              <p className="text-sm text-muted">Questions will appear after the next Kids Mode generation.</p>
            ) : (
              <div className="space-y-5">
                {questions.map((q, qi) => (
                  <div key={q.id || qi}>
                    <p className="mb-2 text-sm font-semibold text-fg">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const selected = answers[q.id] === oi;
                        let style = "border-border hover:border-teal";
                        if (checked) {
                          if (oi === q.correctIndex) style = "border-green-400 bg-green-50 dark:bg-green-950/30";
                          else if (selected) style = "border-red-300 bg-red-50 dark:bg-red-950/30";
                          else style = "border-border opacity-60";
                        } else if (selected) {
                          style = "border-teal bg-teal/10";
                        }
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={checked}
                            onClick={() => selectAnswer(q, oi)}
                            className={`w-full rounded-xl border-2 px-3 py-2.5 text-left text-sm ${style}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!checked ? (
                  <Button
                    className="w-full"
                    disabled={questions.some((q) => answers[q.id] == null)}
                    onClick={checkAnswers}
                  >
                    Check answers
                  </Button>
                ) : allCorrect ? (
                  <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-center dark:bg-green-950/30">
                    <p className="mb-2 font-semibold text-green-800 dark:text-green-200">
                      Great job! {mascotName} is proud of you.
                    </p>
                    {story.videoUrl ? (
                      <div className="space-y-3">
                        <video
                          key={story.videoUrl}
                          src={story.videoUrl}
                          controls
                          playsInline
                          className="mx-auto max-h-72 w-full rounded-xl bg-black"
                        />
                        <Button variant="secondary" onClick={playStoryReel}>
                          Or play comic slideshow
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted">
                          Unlock a short AI cartoon video of this story (takes a couple of minutes).
                        </p>
                        <Button disabled={vidBusy} onClick={() => void handleGenerateVideo()}>
                          {vidBusy ? "Making story video…" : "Generate story video"}
                        </Button>
                        <div>
                          <Button variant="secondary" className="mt-1" onClick={playStoryReel}>
                            Play comic slideshow now
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center dark:bg-amber-950/30">
                    <p className="mb-2 text-sm font-medium text-amber-900 dark:text-amber-100">
                      Not quite — look at the comic again and try once more.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setChecked(false);
                        setAnswers({});
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>

          {playingReel && panels[reelIndex] && (
            <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md px-4 sm:bottom-6">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-xl">
                <p className="text-center text-xs text-muted">
                  Story video · panel {reelIndex + 1} of {panels.length}
                </p>
                <p className="text-center text-sm font-semibold">{panels[reelIndex].title}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function ComicPanel({
  panel,
  owlSrc,
  mascotName,
  highlight,
}: {
  panel: SpatialPanel;
  owlSrc: string;
  mascotName: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border-4 bg-white shadow-sm dark:bg-card ${
        highlight ? "border-teal ring-4 ring-teal/30" : "border-slate-800/80 dark:border-border"
      }`}
    >
      <div className="flex items-stretch">
        <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-slate-200 bg-amber-50 p-2 dark:border-border dark:bg-amber-950/20">
          <img src={owlSrc} alt={mascotName} className="h-14 w-14 rounded-full object-cover object-top" />
          <p className="mt-1 text-center text-[9px] font-semibold text-muted">{mascotName}</p>
        </div>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-fg">{panel.title}</h3>
            <span className="text-2xl" aria-hidden>
              {panel.emoji || "🌟"}
            </span>
          </div>
          {panel.imageUrl ? (
            <img
              src={panel.imageUrl}
              alt={panel.title}
              className="mb-3 w-full rounded-xl border border-border object-cover"
            />
          ) : (
            <div className="mb-3 rounded-xl bg-gradient-to-br from-sky-50 to-amber-50 px-3 py-6 text-center dark:from-sky-950/30 dark:to-amber-950/20">
              <p className="text-4xl" aria-hidden>
                {panel.emoji || "📖"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{panel.visualDescription}</p>
              <p className="mt-1 text-[10px] text-muted">Picture will appear after you generate cartoons</p>
            </div>
          )}
          {panel.owlSays && (
            <div className="mb-2 rounded-xl rounded-tl-none border border-border bg-bg px-3 py-2 text-sm italic text-fg">
              “{panel.owlSays}”
            </div>
          )}
          <p className="text-sm leading-relaxed text-fg/90">{panel.caption}</p>
        </div>
      </div>
    </article>
  );
}
