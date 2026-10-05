import type { AssignmentRecord, FlashCard, GeneratedPackage, QuizQuestion, StudySet } from "@/lib/types";

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function mergeStudyGuide(
  sets: StudySet[],
  assignments: AssignmentRecord[],
  exclusions: string,
): GeneratedPackage {
  const names = sets.map((s) => s.name);
  const sections = sets.flatMap((set) => {
    const own = (set.notes?.sections || []).map((sec) => ({
      ...sec,
      heading: sec.heading?.startsWith(set.name) ? sec.heading : `${set.name} — ${sec.heading || "Notes"}`,
      reference: sec.reference || set.name,
    }));
    return own.length
      ? own
      : [{ heading: set.name, body: set.notes?.title || "No generated notes were stored for this chapter.", bullets: [], reference: set.name }];
  });

  if (assignments.length) {
    sections.push({
      heading: "Assignment returns",
      bullets: assignments.map((a) => {
        const fb = a.submissions?.[0]?.feedback;
        return clip(
          `${a.title}: ${fb?.assignmentAssessment || fb?.reviewOfAssignment || fb?.extraMile || "No feedback stored."}`,
          400,
        );
      }),
      reference: "Assignment Assistant",
    });
  }

  if (exclusions.trim()) {
    sections.push({
      heading: "Left out on purpose",
      body: exclusions.trim(),
      bullets: ["These items were excluded from this guide."],
      reference: "Student exclusions",
    });
  }

  sections.push({
    heading: "How the chapters connect",
    bullets: [
      `This guide covers ${names.join(", ")}.`,
      "Study one chapter section, then the next, before mixing the quiz.",
      "Use the flash cards to check terms that show up in more than one chapter.",
    ],
    reference: names.join(", "),
  });

  const quiz: QuizQuestion[] = [];
  sets.forEach((set) => {
    (set.quiz || []).slice(0, 4).forEach((q, i) => {
      quiz.push({
        ...q,
        id: `${set.id}-q${i + 1}`,
        question: `(${set.name}) ${q.question}`,
      });
    });
  });

  const seen = new Set<string>();
  const flashcards: FlashCard[] = [];
  sets.forEach((set) => {
    (set.flashcards || []).forEach((card, i) => {
      const key = card.term.trim().toLowerCase();
      if (!key || seen.has(key) || flashcards.length >= 40) return;
      seen.add(key);
      flashcards.push({ ...card, id: `${set.id}-f${i + 1}` });
    });
  });

  const audioBits = sets.map((set) => {
    const first = set.notes?.sections?.[0];
    const bullets = (first?.bullets || []).slice(0, 3).join(". ");
    return `${set.name}. ${first?.heading || set.notes?.title || ""}. ${bullets}`;
  });

  return {
    notes: {
      title: `Study Guide · ${names.join(", ")}`.slice(0, 120),
      subtitle: "Combined from saved chapter notes",
      sections,
      otherResources: sets.flatMap((s) => s.notes?.otherResources || []).slice(0, 12),
    },
    audioScript: `Combined study guide for ${names.join(", ")}. ${audioBits.join(" ")}`.slice(0, 6000),
    quiz: quiz.slice(0, 20),
    flashcards,
    slides: [],
  };
}
