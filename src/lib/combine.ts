import type { AssignmentRecord, FlashCard, GeneratedPackage, NotesSection, QuizQuestion, Slide, StudySet } from "@/lib/types";

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function chapterStillWorking(set: StudySet) {
  return (set.notes?.subtitle || "").toLowerCase().includes("generating");
}

function sourceLabel(set: StudySet, heading?: string) {
  return heading ? `Refer to ${set.name} · ${heading}` : `Refer to ${set.name}`;
}

export function mergeStudyGuide(
  sets: StudySet[],
  assignments: AssignmentRecord[],
  exclusions: string,
): GeneratedPackage {
  const names = sets.map((s) => s.name);
  const conceptSections: NotesSection[] = [];
  const tableSections: NotesSection[] = [];
  const compareSections: NotesSection[] = [];
  const terms: { term: string; definition: string; source: string }[] = [];
  const seenTerms = new Set<string>();

  function addTerm(term: string, definition: string, source: string) {
    const key = clean(term).toLowerCase();
    if (!key || seenTerms.has(key)) return;
    seenTerms.add(key);
    terms.push({ term: clean(term), definition: clean(definition), source });
  }

  sets.forEach((set, index) => {
    const sections = set.notes?.sections || [];
    if (!sections.length) {
      conceptSections.push({
        heading: set.notes?.title || set.name,
        body: "No saved notes were found for this chapter.",
        bullets: [],
        reference: sourceLabel(set),
      });
      return;
    }
    sections.forEach((sec, secIndex) => {
      const reference = `${sourceLabel(set, sec.heading)} · refer to slide ${index + 2} for its terms`;
      if (sec.layout === "table" && sec.table?.rows?.length) {
        tableSections.push({
          heading: sec.heading || `Table from ${set.name}`,
          layout: "table",
          table: sec.table,
          body: sec.body,
          reference,
        });
        for (const row of sec.table.rows) {
          if (row.length >= 2) addTerm(row[0], row.slice(1).join(" — "), set.name);
        }
        return;
      }
      if (sec.layout === "two-column" && sec.columns?.length) {
        compareSections.push({
          heading: sec.heading || `Comparison from ${set.name}`,
          layout: "two-column",
          columns: sec.columns,
          body: sec.body,
          reference,
        });
        return;
      }
      const bullets = [...(sec.bullets || [])];
      conceptSections.push({
        heading: sec.heading || set.name,
        body: sec.body,
        bullets,
        reference: `${sourceLabel(set, sec.heading)}. Section ${secIndex + 1} of that chapter.`,
      });
    });
    for (const card of set.flashcards || []) addTerm(card.term, card.definition, set.name);
  });

  const slides: Slide[] = [
    {
      id: "s1",
      title: `Study guide · ${names.join(", ")}`,
      layout: "title",
      body: "Key terms and definitions for the whole unit. The notes hold the full explanations.",
      bullets: names,
      footer: "Refer back to the notes section with the same term.",
    },
  ];
  for (let i = 0; i < terms.length; i += 6) {
    const chunk = terms.slice(i, i + 6);
    slides.push({
      id: `s${slides.length + 1}`,
      title: `Key terms ${i + 1}–${i + chunk.length}`,
      layout: "table",
      bullets: chunk.map((t) => `${t.term}: ${t.definition}`),
      table: {
        headers: ["Term", "Definition", "Where it came from"],
        rows: chunk.map((t) => [t.term, t.definition, t.source]),
      },
      footer: `Refer to slide ${slides.length + 1}`,
    });
  }

  const quiz: QuizQuestion[] = [];
  sets.forEach((set) => {
    for (const q of set.quiz || []) {
      quiz.push({
        ...q,
        id: `t${quiz.length + 1}`,
        question: `${quiz.length + 1}. ${q.question}`,
        explanation: [q.explanation, sourceLabel(set)].filter(Boolean).join(" "),
      });
    }
  });
  terms.forEach((term, i) => {
    const distractors = terms.filter((t) => t.term !== term.term).slice(i, i + 3).map((t) => t.definition);
    while (distractors.length < 3) distractors.push("Not used for this term in these chapters.");
    quiz.push({
      id: `t${quiz.length + 1}`,
      question: `${quiz.length + 1}. What is ${term.term}?`,
      options: [term.definition, ...distractors].slice(0, 4),
      correctIndex: 0,
      explanation: `${term.definition} Refer to ${term.source}.`,
    });
  });

  const assignmentBullets = assignments.map((a) => {
    const fb = a.submissions?.[0]?.feedback;
    return clean(`${a.title}: ${fb?.assignmentAssessment || fb?.reviewOfAssignment || fb?.extraMile || "No feedback stored."}`);
  });

  const notesSections: NotesSection[] = [
    {
      heading: "How this unit fits together",
      body: `This is the study text for ${names.join(", ")}. The explanations below are copied from the saved chapter notes and organized so you can read the unit in one pass. References point back to the chapter, table, or slide. They do not replace the material.`,
      bullets: names.map((name) => `Material from ${name} is included in full below.`),
      reference: names.join(", "),
    },
    ...conceptSections,
    ...tableSections,
    ...compareSections,
  ];

  if (terms.length) {
    notesSections.push({
      heading: "Key terms and definitions",
      layout: "table",
      table: {
        headers: ["Term", "Definition", "Refer to"],
        rows: terms.map((t) => [t.term, t.definition, t.source]),
      },
      reference: `Also listed on slides 2–${Math.max(2, slides.length)}.`,
    });
  }
  if (assignmentBullets.length) {
    notesSections.push({
      heading: "From the assignments",
      bullets: assignmentBullets,
      reference: "Assignment Assistant",
    });
  }
  if (exclusions.trim()) {
    notesSections.push({
      heading: "Left out on purpose",
      body: exclusions.trim(),
      bullets: ["Do not study these items for this guide."],
      reference: "Student exclusions",
    });
  }
  notesSections.push({
    heading: "Before the test",
    bullets: [
      "Read the core sections once without skipping the tables.",
      "Cover the key-term slides and say each definition.",
      "Take the quiz as a closed-book test, then check only the misses.",
    ],
    reference: names.join(", "),
  });

  const audio = [
    `This study guide covers ${names.join(", ")}.`,
    ...conceptSections.flatMap((sec) => [sec.heading, sec.body || "", ...(sec.bullets || []).slice(0, 6)]),
    ...terms.slice(0, 20).map((t) => `${t.term}. ${t.definition}`),
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 14000);

  return {
    notes: {
      title: `Study Guide · ${names.join(", ")}`.slice(0, 140),
      subtitle: "Full study text from the selected chapters",
      sections: notesSections,
      otherResources: sets.flatMap((s) => s.notes?.otherResources || []),
    },
    audioScript: audio,
    quiz,
    flashcards: terms.map((t, i) => ({ id: `f${i + 1}`, term: t.term, definition: t.definition })),
    slides,
  };
}
