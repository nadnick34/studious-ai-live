import type { GeneratedPackage, StudyNotes } from "@/lib/types";

export const SAMPLE_NOTES: StudyNotes = {
  title: "BIOL 1543 – Principles of Biology",
  subtitle: "Chapters 1–3 · Sample set",
  sections: [
    {
      heading: "The Scientific Method",
      layout: "stack",
      bullets: [
        "Observation – noticing a phenomenon or pattern in nature",
        "Hypothesis – a testable, falsifiable explanation",
        "Experiment – controlled test with independent & dependent variables",
        "Analysis – interpret data; accept, reject, or refine the hypothesis",
        "Theory – a well-supported explanation that has withstood repeated testing",
      ],
      reference: "Campbell Biology, Ch. 1",
    },
    {
      heading: "Characteristics of Living Things",
      layout: "stack",
      bullets: [
        "Cellular organization",
        "Metabolism (energy processing)",
        "Homeostasis",
        "Growth and development",
        "Reproduction",
        "Response to stimuli",
        "Evolutionary adaptation",
      ],
    },
    {
      heading: "Levels of Biological Organization",
      layout: "stack",
      bullets: [
        "Atom → Molecule → Organelle → Cell → Tissue → Organ → Organ System → Organism",
        "Population → Community → Ecosystem → Biosphere",
      ],
      reference: "Class lecture notes, Week 2",
    },
  ],
  otherResources: [
    { title: "Khan Academy – Introduction to Biology" },
    { title: "Crash Course Biology – Scientific Method" },
    { title: "OpenStax Biology 2e, Chapter 1" },
  ],
};

export const SAMPLE_PACKAGE: GeneratedPackage = {
  notes: SAMPLE_NOTES,
  audioScript: `Welcome to this Studious AI review of Chapters 1 through 3 of Principles of Biology.

We begin with the scientific method. Science starts with careful observation of the natural world. From those observations we form a hypothesis — a testable and falsifiable explanation. We then design controlled experiments, collect data, and analyze the results. Only after repeated testing and confirmation does an idea rise to the level of a scientific theory.

Living things share several key characteristics: cellular organization, metabolism, homeostasis, growth and development, reproduction, response to stimuli, and evolutionary adaptation.

Finally, biology is organized across many levels — from atoms and molecules up through cells, tissues, organs, organisms, populations, communities, ecosystems, and the biosphere.

Keep these foundations clear. They will support everything that follows in this course.`,
  quiz: [
    {
      id: "q1",
      question: "Which of the following is a key characteristic of a scientific hypothesis?",
      options: [
        "It must be proven true",
        "It must be testable and falsifiable",
        "It is the same as a theory",
        "It cannot be revised",
      ],
      correctIndex: 1,
      explanation: "A hypothesis must be testable and capable of being shown false.",
    },
    {
      id: "q2",
      question: "Homeostasis refers to an organism’s ability to:",
      options: [
        "Reproduce rapidly",
        "Maintain a stable internal environment",
        "Evolve over generations",
        "Respond only to external stimuli",
      ],
      correctIndex: 1,
    },
    {
      id: "q3",
      question: "Which sequence correctly shows levels of biological organization from smallest to largest?",
      options: [
        "Cell → Atom → Organism → Ecosystem",
        "Atom → Molecule → Cell → Organism",
        "Organism → Tissue → Cell → Molecule",
        "Ecosystem → Population → Cell → Atom",
      ],
      correctIndex: 1,
    },
    {
      id: "q4",
      question: "A scientific theory is best described as:",
      options: [
        "An untested idea",
        "A guess about the natural world",
        "A well-supported explanation that has withstood repeated testing",
        "A single experiment’s conclusion",
      ],
      correctIndex: 2,
    },
  ],
  flashcards: [
    { id: "f1", term: "Hypothesis", definition: "A testable, falsifiable explanation for an observation." },
    { id: "f2", term: "Theory", definition: "A well-supported explanation that has withstood repeated testing." },
    { id: "f3", term: "Homeostasis", definition: "An organism’s ability to maintain a stable internal environment." },
    { id: "f4", term: "Metabolism", definition: "The sum of chemical processes that process energy in living things." },
    { id: "f5", term: "Cell", definition: "The basic unit of structure and function in living organisms." },
    { id: "f6", term: "Biosphere", definition: "All ecosystems on Earth; the highest level of biological organization." },
  ],
};
