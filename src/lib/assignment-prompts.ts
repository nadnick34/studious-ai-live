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
- Examples must stay simple and wholesome.
- Still practical and honest about what each problem asks.
`
    : "";

  const system = `You are Studious AI Assignment Assistant.

The student may upload:
1) assignment instructions / rubric / directions, and/or
2) the actual assignment sheet with numbered questions, problems, prompts, or exercises.

Your job:
- Analyze the uploaded content carefully.
- Base every recommendation on what is actually on the sheet (instructions AND questions/problems).
- Give a brief overall plan.
- For each distinct question/problem/prompt you can identify, give:
  - a short how-to (method / approach), and
  - one short example that shows the form of a good response (not a full essay or complete answer key for every item).
- Do NOT complete the whole assignment for the student.
- Do NOT invent problems that are not present in the upload.
- If extraction is incomplete, say so and guide only from what is readable.

${kids}

Return ONLY valid JSON. No markdown fences.`;

  const user = `Class: ${input.classCode} – ${input.className}
Subject: ${input.subject}
Assignment title: ${input.title}

UPLOADED ASSIGNMENT MATERIAL (instructions and/or problem set):
---
${input.instructionsText.slice(0, 55000)}
---

Return JSON:
{
  "summary": "plain-language summary of what this assignment requires overall",
  "steps": ["ordered plan to complete the work from start to finish"],
  "ideas": ["good approaches that still leave the student doing their own work"],
  "tips": ["format, sources, show-your-work, time management"],
  "checklist": ["before-turning-in checks tied to the instructions"],
  "warnings": ["easy-to-miss requirements from the sheet"],
  "problemGuides": [
    {
      "id": "p1",
      "problem": "quote or paraphrase the actual question/problem from the sheet",
      "howTo": "brief how-to for THIS problem (2–5 sentences)",
      "example": "a short illustrative example of the approach or a sample mini-answer shape",
      "tips": ["optional tip specific to this problem"]
    }
  ]
}

Include a problemGuides entry for each major question/problem found. If the upload is only general instructions with no discrete problems, problemGuides may be empty or cover the main required sections.`;

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
`
    : "";

  const system = `You are Studious AI Assignment Checker.
Compare the student's submitted work to the assignment instructions and problems.
Analyze completeness, clarity, accuracy, and alignment with each required part.
Recommend concrete improvements.
Do NOT rewrite the whole assignment for them.
Do NOT invent instructions that were not given.

${kids}

Return ONLY valid JSON. No markdown fences.`;

  const user = `Class: ${input.classCode} – ${input.className}
Subject: ${input.subject}
Assignment: ${input.title}

ASSIGNMENT INSTRUCTIONS / PROBLEMS:
---
${input.instructionsText.slice(0, 35000)}
---

STUDENT WORK:
---
${input.workText.slice(0, 50000)}
---

Return JSON:
{
  "overall": "short overall assessment",
  "strengths": ["what is working well"],
  "improvements": ["specific changes that would raise quality, tied to the actual problems when possible"],
  "scoreHint": "optional qualitative sense of readiness (not a fake grade unless a rubric supports it)",
  "nextSteps": ["ordered actions before final submit"]
}`;

  return { system, user };
}
