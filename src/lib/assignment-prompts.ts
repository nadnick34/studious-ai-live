export function buildAssignmentUnifiedPrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  title: string;
  instructionsText?: string;
  workText?: string;
  kidsMode?: boolean;
  childAge?: number | null;
  singleMaterial?: boolean;
}) {
  const kids = input.kidsMode
    ? `
KIDS MODE (age ${input.childAge ?? "9 or under"}):
- Simple, warm language. Short sentences. Encouraging and constructive.
- Stay wholesome and traditional.
`
    : "";

  const material = (input.instructionsText || input.workText || "").trim();
  const single = Boolean(input.singleMaterial) || (
    (input.instructionsText || "").trim() === (input.workText || "").trim() && material.length > 0
  );

  const system = `You are Studious AI Assignment Coach.
Help students understand assignments and improve completed work.
Stay positive but constructive. Be clear and concise.
Do NOT write the full finished assignment for the student.
Do NOT invent requirements that are not in the materials.

You MUST return exactly three feedback areas:
1. reviewOfAssignment — what the assignment asks and how to approach it. If there is no assignment sheet/directions/problems, use exactly "TBD".
2. assignmentAssessment (shown to the user as "Completed Work Assessment") — evaluation of student answers/completed work. If the material is only a blank assignment (no student answers), use exactly "TBD".
3. extraMile — stretch tips. Use exactly "N/A" for simple matching/fill-in worksheets with finite answers, or when assessment is TBD.

CRITICAL RULE FOR "issues" (What to fix):
- List ONLY items that are actually incorrect, incomplete, or missing.
- Identify each by exact problem/question number or label from the sheet (e.g. "Problem 2", "Question 5", "Part 1 #3").
- State what the student wrote and what is wrong.
- When the correct answer is knowable from the problem (math, matching, fill-in, factual), include the correct answer.
- Format each issue like: "Problem 2 (1.2 × 0.6): you wrote 7.2; correct is 0.72 — count decimal places in the factors."
- Do NOT use vague lines like "check your work" or "review the chapter" without naming the item.
- If nothing is wrong, use an empty issues array.

${single ? `SINGLE UPLOAD MODE:
The student uploaded one set of material that may be:
- a blank assignment / directions only
- completed work only
- both directions and answers mixed together
Decide which based on the content (blank lines, "Workspace / Answer", student name filled in, marked answers, "Correct:", checkmarks, etc.).
If blank/incomplete only: fill reviewOfAssignment; set assignmentAssessment to "TBD"; extraMile usually "N/A"; issues = [].
If completed work is present: fill both review (from the questions) and assignmentAssessment; put every incorrect item in issues with exact identifiers; extraMile as appropriate.
` : ""}

${kids}

Return ONLY valid JSON. No markdown fences.`;

  const user = `Class: ${input.classCode} – ${input.className}
Subject: ${input.subject}
Assignment title: ${input.title}

MATERIAL:
---
${material || "(none)"}
---

Return JSON:
{
  "reviewOfAssignment": "clear concise summary of what is required and how to approach it, OR exactly TBD",
  "reviewSummary": "optional short overview",
  "reviewSteps": ["brief ordered how-to steps when a sheet exists"],
  "problemGuides": [
    {
      "id": "p1",
      "problem": "actual question from the sheet",
      "howTo": "brief how-to",
      "example": "short example of approach (not a full answer key)",
      "tips": ["optional"]
    }
  ],
  "assignmentAssessment": "clear concise assessment of completed work OR exactly TBD",
  "strengths": ["what looks good — name correct items when possible (e.g. Problem 1 correct)"],
  "issues": [
    "Problem N (short quote of the question): student answer → why wrong → correct answer when known"
  ],
  "extraMile": "stretch guidance OR exactly N/A",
  "extraMileTips": ["optional"]
}

Reminder: every entry in "issues" must name the exact problem/question that is incorrect.`;

  return { system, user };
}

export function buildAssignmentGuidancePrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  title: string;
  instructionsText: string;
  kidsMode?: boolean;
  childAge?: number | null;
}) {
  return buildAssignmentUnifiedPrompt({ ...input, workText: "", singleMaterial: true });
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
  return buildAssignmentUnifiedPrompt(input);
}
