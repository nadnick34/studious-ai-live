import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getClassById, getStudySetById } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { ClassRecord, QuizQuestion, StudySet } from "@/lib/types";

export const Route = createFileRoute("/class/$id/set/$setId/quiz")({ component: QuizPage });

function QuizPage() {
  const { id: classId, setId } = Route.useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    void Promise.all([getStudySetById({ data: setId }), getClassById({ data: classId })]).then(([s, c]) => {
      setSet(s);
      setCls(c);
    });
  }, [classId, setId]);

  if (!set || !cls) {
    return (
      <AppShell title="Quiz">
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  const questions: QuizQuestion[] = set.quiz;
  const q = questions[index];
  const total = questions.length;

  if (total === 0) {
    return (
      <AppShell title="Quiz">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="mt-16 text-center text-muted">No quiz questions for this set yet.</div>
      </AppShell>
    );
  }

  function handleSelect(i: number) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
  }

  return (
    <AppShell title={`Quiz – ${set.name}`}>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/class/$id" params={{ id: classId }} className="text-sm text-teal hover:underline">
          ← Back to class
        </Link>
        <div className="text-xs text-muted">{cls.code}</div>
      </div>
      <div className="mx-auto max-w-lg">
        {finished ? (
          <div className="card-surface rounded-xl p-8 text-center">
            <div className="mb-1 text-3xl font-bold text-fg">
              {score}/{total}
            </div>
            <p className="mb-6 text-sm text-muted">
              {score === total
                ? "Perfect — you’ve mastered this material."
                : score >= total * 0.7
                  ? "Solid work. Review the missed items and try again."
                  : "Keep going. Revisit the notes and audio, then retake the quiz."}
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={restart}>Retake quiz</Button>
              <Link to="/class/$id/set/$setId" params={{ id: classId, setId }}>
                <Button>Review notes</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-surface rounded-xl p-6">
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${((index + (revealed ? 1 : 0)) / total) * 100}%` }} />
            </div>
            <div className="mb-2 text-xs text-muted">Question {index + 1} of {total}</div>
            <h2 className="mb-5 text-base leading-snug font-semibold text-fg">{q.question}</h2>
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                let style = "border-border hover:border-teal";
                if (revealed) {
                  if (i === q.correctIndex) style = "border-green-400 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200";
                  else if (i === selected) style = "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200";
                  else style = "border-border opacity-60";
                } else if (selected === i) {
                  style = "border-teal bg-teal/10";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(i)}
                    disabled={revealed}
                    className={cn("w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors", style)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {revealed && q.explanation && (
              <p className="mt-4 rounded-lg bg-bg p-3 text-xs text-muted">{q.explanation}</p>
            )}
            <div className="mt-6 flex items-center justify-between">
              <Link to="/class/$id" params={{ id: classId }} className="text-sm text-muted">
                Exit
              </Link>
              {revealed && (
                <Button
                  onClick={() => {
                    if (index + 1 >= total) setFinished(true);
                    else {
                      setIndex(index + 1);
                      setSelected(null);
                      setRevealed(false);
                    }
                  }}
                >
                  {index + 1 >= total ? "See results" : "Next"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
