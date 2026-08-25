export function buildAssignmentGuidancePrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  title: string;
  instructionsText: string;
  kidsMode?: boolean;
  childAge?: number | null;
}) {
  const kids = input.kidsMode
    ? `
KIDS MODE (age ${input.childAge ?? "9 or under"}):
- Use simple, warm language a child can understand.
- Short sentences. Encouraging tone.
- Still practical and honest about what the assignment asks.
- Owl mascot voice is fine in encouragement only, not as the main content.
- Wholesome and traditional. No political or ideological framing.
`
    : "";

  const system = `You are Studious AI Assignment Assistant.
Help a student understand an assignment and plan how to complete it well.
Do NOT write the finished assignment for them.
Do NOT invent requirements that are not in the instructions.
Give clear recommendations, ideas, and a practical plan.

${kids}

Return ONLY valid JSON. No markdown fences.`;

  const user = `Class: ${input.classCode} – ${input.className}
Subject: ${input.subject}
Assignment title: ${input.title}

ASSIGNMENT INSTRUCTIONS / SHEET TEXT:
---
${input.instructionsText.slice(0, 50000)}
---

Return JSON:
{
  "summary": "what this assignment is asking in plain language",
  "steps": ["ordered plan to complete the work"],
  "ideas": ["good approaches or angles that still do the student's own work"],
  "tips": ["practical tips for quality, clarity, sources, format"],
  "checklist": ["before-turning-in checks"],
  "warnings": ["common mistakes or requirements that are easy to miss"]
}`;

  return { system, user };
}

export function buildAssignmentCheckPrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  title: string;
  instructionsText: string;
  workText: string;
  kidsMode?: boolean;
  childAge?: number | null;
}) {
  const kids = input.kidsMode
    ? `
KIDS MODE:
- Encourage first, then give clear improvement ideas in simple words.
- Be kind and specific. Never harsh or sarcastic.
- Wholesome and traditional. No political framing.
`
    : "";

  const system = `You are Studious AI Assignment Checker.
Compare the student's submitted work to the assignment instructions.
Analyze completeness, clarity, accuracy, and alignment with the prompt.
Recommend concrete improvements.
Do NOT rewrite the whole assignment for them.
Do NOT invent instructions that were not given.

${kids}

Return ONLY valid JSON. No markdown fences.`;

  const user = `Class: ${input.classCode} – ${input.className}
Subject: ${input.subject}
Assignment: ${input.title}

INSTRUCTIONS:
---
${input.instructionsText.slice(0, 30000)}
---

STUDENT WORK:
---
${input.workText.slice(0, 50000)}
---

Return JSON:
{
  "overall": "short overall assessment",
  "strengths": ["what is working well"],
  "improvements": ["specific changes that would raise quality"],
  "scoreHint": "optional qualitative sense of readiness (not a fake grade number unless the rubric supports it)",
  "nextSteps": ["ordered actions before final submit"]
}`;

  return { system, user };
}
