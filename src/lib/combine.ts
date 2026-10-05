import type { AssignmentRecord, FlashCard, GeneratedPackage, NotesSection, QuizQuestion, StudySet } from "@/lib/types";

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function bulletsOf(sec: NotesSection): string[] {
  const out = [...(sec.bullets || [])];
  if (sec.body) out.unshift(sec.body);
  for (const col of sec.columns || []) out.push(...(col.bullets || []).map((b) => `${col.title}: ${b}`));
  return out.map((b) => b.trim()).filter(Boolean);
}

export function chapterStillWorking(set: StudySet) {
  return (set.notes?.subtitle || "").toLowerCase().includes("generating");
}

export function mergeStudyGuide(
  sets: StudySet[],
  assignments: AssignmentRecord[],
  exclusions: string,
): GeneratedPackage {
  const names = sets.map((s) => s.name);
  const ideas: string[] = [];
  const definitions: string[][] = [];
  const comparisons: string[] = [];
  const seen = new Set<string>();

  for (const set of sets) {
    for (const sec of set.notes?.sections || []) {
      const bits = bulletsOf(sec);
      if (sec.layout === "table" && sec.table?.rows?.length) {
        for (const row of sec.table.rows) {
          if (row.length >= 2) definitions.push([row[0], row.slice(1).join(" — ")]);
        }
      }
      if (sec.layout === "two-column") comparisons.push(...bits);
      else ideas.push(...bits);
    }
  }

  const uniqueIdeas = ideas.filter((idea) => {
    const key = idea.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sections: NotesSection[] = [
    {
      heading: "The unit in one pass",
      body: `This guide treats ${names.join(", ")} as one unit. Read it straight through, then use the quiz to check whether the ideas hold together.`,
      bullets: uniqueIdeas.slice(0, 8),
      reference: names.join(", "),
    },
    {
      heading: "Core ideas",
      bullets: uniqueIdeas.slice(8, 28),
      reference: names.join(", "),
    },
  ];

  if (definitions.length) {
    sections.push({
      heading: "Definitions",
      layout: "table",
      table: {
        headers: ["Term", "Meaning in this unit"],
        rows: definitions.slice(0, 18),
      },
      reference: names.join(", "),
    });
  }

  if (comparisons.length) {
    sections.push({
      heading: "Compare and connect",
      bullets: comparisons.slice(0, 12),
      reference: names.join(", "),
    });
  }

  sections.push({
    heading: "How the material fits together",
    bullets: [
      `Start with the process or structure named in ${names[0] || "the first chapter"}, then follow what changes in the later material.`,
      "When two terms sound alike, use the definitions table before moving on.",
      "A test question on this unit can pull a term from one chapter and an example from another.",
    ],
    reference: names.join(", "),
  });

  if (assignments.length) {
    sections.push({
      heading: "From the assignments",
      bullets: assignments.map((a) => {
        const fb = a.submissions?.[0]?.feedback;
        return clip(`${a.title}: ${fb?.assignmentAssessment || fb?.reviewOfAssignment || fb?.extraMile || "No feedback stored."}`, 360);
      }),
      reference: "Assignment Assistant",
    });
  }

  if (exclusions.trim()) {
    sections.push({
      heading: "Left out on purpose",
      body: exclusions.trim(),
      bullets: ["Do not study these items for this guide."],
      reference: "Student exclusions",
    });
  }

  sections.push({
    heading: "Study checklist",
    bullets: [
      "Retell the unit in your own words without looking.",
      "Cover the definitions table and say each meaning.",
      "Work the quiz, then reread only the ideas you missed.",
    ],
    reference: names.join(", "),
  });

  const quiz: QuizQuestion[] = [];
  sets.forEach((set, setIndex) => {
    (set.quiz || []).slice(0, 4).forEach((q, i) => {
      quiz.push({ ...q, id: `g${setIndex + 1}q${i + 1}`, question: q.question });
    });
  });

  const cardSeen = new Set<string>();
  const flashcards: FlashCard[] = [];
  sets.forEach((set, setIndex) => {
    (set.flashcards || []).forEach((card, i) => {
      const key = card.term.trim().toLowerCase();
      if (!key || cardSeen.has(key) || flashcards.length >= 32) return;
      cardSeen.add(key);
      flashcards.push({ ...card, id: `g${setIndex + 1}f${i + 1}` });
    });
  });

  return {
    notes: {
      title: `Study Guide · ${names.join(", ")}`.slice(0, 120),
      subtitle: "One continuous guide for the selected chapters",
      sections: sections.filter((sec) => sec.body || sec.bullets?.length || sec.table?.rows?.length),
      otherResources: sets.flatMap((s) => s.notes?.otherResources || []).slice(0, 8),
    },
    audioScript: `This is one study guide for ${names.join(", ")}. ${uniqueIdeas.slice(0, 12).join(". ")}`.slice(0, 5000),
    quiz: quiz.slice(0, 16),
    flashcards,
    slides: [],
  };
}
