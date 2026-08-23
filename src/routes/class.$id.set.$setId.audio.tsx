import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getClassById, getStudySetById } from "@/lib/data";
import type { ClassRecord, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/audio")({ component: AudioPage });

function AudioPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [classId, setId]);

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeRef.current = false;
    setPlaying(false);
    setPaused(false);
  }

  function pauseSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function resumeSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }

  function startSpeech() {
    if (!set?.audioScript?.trim()) {
      setError("No lecture script available for this set.");
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("This browser does not support text-to-speech. Try Chrome or Edge.");
      return;
    }

    if (playing && paused) {
      resumeSpeech();
      return;
    }
    if (playing && !paused) {
      pauseSpeech();
      return;
    }

    stopSpeech();
    setError(null);

    const utterance = new SpeechSynthesisUtterance(set.audioScript);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en-US/i.test(v.lang) && /Google|Microsoft|Samantha|Natural/i.test(v.name)) ||
      voices.find((v) => /en/i.test(v.lang));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      if (activeRef.current) {
        activeRef.current = false;
        setPlaying(false);
        setPaused(false);
      }
    };
    utterance.onerror = () => {
      setError("Speech was interrupted or failed. Tap play again.");
      activeRef.current = false;
      setPlaying(false);
      setPaused(false);
    };

    activeRef.current = true;
    setPlaying(true);
    setPaused(false);

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const later = window.speechSynthesis.getVoices();
        const v = later.find((x) => /en/i.test(x.lang));
        if (v) utterance.voice = v;
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
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
          <p className="mb-6 text-xs text-muted">Lecture audio · device voice (instant)</p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={startSpeech}
              className="grid size-16 place-items-center rounded-full bg-teal text-white"
              aria-label={playing && !paused ? "Pause" : "Play"}
            >
              {playing && !paused ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" />}
            </button>
            {playing && (
              <button
                type="button"
                onClick={stopSpeech}
                className="grid size-12 place-items-center rounded-full border border-border bg-bg text-fg"
                aria-label="Stop"
              >
                <Square className="size-4 fill-current" />
              </button>
            )}
          </div>

          <p className="mt-4 text-xs text-muted">
            {!playing ? "Tap play to listen" : paused ? "Paused" : "Playing"}
          </p>
          {error && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left text-xs text-red dark:bg-red-950/30">
              {error}
            </div>
          )}
          <div className="mt-4">
            <Button variant="secondary" className="text-xs" onClick={stopSpeech}>
              Stop
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
