import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getClassById, getStudySetById } from "@/lib/data";
import { speakLecture } from "@/lib/ai";
import type { ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/audio")({ component: AudioPage });

function AudioPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  async function ensureAudio(): Promise<string | null> {
    if (audioUrl) return audioUrl;
    if (!set?.audioScript) {
      setError("No lecture script available for this set.");
      return null;
    }
    setLoadingAudio(true);
    setError(null);
    try {
      const result = await speakLecture({ data: { text: set.audioScript, voice: "eve" } });
      if (!result.ok) {
        setError(result.error);
        setLoadingAudio(false);
        return null;
      }
      const bytes = Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mime }));
      setAudioUrl(url);
      setLoadingAudio(false);
      return url;
    } catch (err) {
      setLoadingAudio(false);
      setError(err instanceof Error ? err.message : "Audio generation failed");
      return null;
    }
  }

  async function handlePlayPause() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    let url = audioUrl;
    if (!url) {
      url = await ensureAudio();
      if (!url) return;
      el.src = url;
      await new Promise<void>((resolve) => {
        el.onloadeddata = () => resolve();
        el.load();
      });
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setError("Playback failed. Check device sound and try again.");
      setPlaying(false);
    }
  }

  function formatTime(sec: number) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (!set || !cls) {
    return (
      <AppShell title="Audio">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Audio – ${set.name}`}>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="text-xs text-muted">{cls.code}</div>
      </div>
      <div className="mx-auto max-w-md">
        <div className="card-surface rounded-xl p-8 text-center">
          <h2 className="mb-1 font-semibold text-fg">{set.name}</h2>
          <p className="mb-6 text-xs text-muted">AI lecture audio</p>
          <audio
            ref={audioRef}
            preload="none"
            onTimeUpdate={(e) => {
              const a = e.currentTarget;
              setCurrentTime(a.currentTime);
              if (a.duration) setProgress((a.currentTime / a.duration) * 100);
            }}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => { setPlaying(false); setProgress(100); }}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            className="hidden"
          />
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-teal" style={{ width: `${progress}%` }} />
          </div>
          <div className="mb-6 flex justify-between text-[10px] text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : "—"}</span>
          </div>
          <button
            type="button"
            onClick={() => void handlePlayPause()}
            disabled={loadingAudio}
            className="mx-auto grid size-16 place-items-center rounded-full bg-teal text-white disabled:opacity-60"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" />}
          </button>
          <p className="mt-4 text-xs text-muted">
            {loadingAudio ? "Generating audio…" : playing ? "Playing" : audioUrl ? "Ready — tap play" : "Tap play to generate audio"}
          </p>
          {error && <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left text-xs text-red">{error}</div>}
          <div className="mt-4">
            <Button
              variant="secondary"
              className="text-xs"
              disabled={loadingAudio}
              onClick={async () => {
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
                setProgress(0);
                await ensureAudio();
              }}
            >
              Regenerate audio
            </Button>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Script</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg">{set.audioScript}</p>
        </div>
      </div>
    </AppShell>
  );
}
