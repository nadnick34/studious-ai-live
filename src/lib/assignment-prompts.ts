export function buildAssignmentUnifiedPrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  title: string;
  instructionsText?: string;
  workText?: string;
  kidsMode?: boolean;
  childAge?: number | null;
}) {
  const kids = input.kidsMode
    ? `
KIDS MODE (age ${input.childAge ?? "9 or under"}):
- Simple, warm language. Short sentences. Encouraging and constructive.
- Stay wholesome and traditional.
`
    : "";

  const hasInstructions = Boolean((input.instructionsText || "").trim());
  const hasWork = Boolean((input.workText || "").trim());

  const system = `You are Studious AI Assignment Coach.
You help students understand what an assignment asks for and how to improve completed work.
Stay positive but constructive. Be clear and concise.
Do NOT write the full finished assignment for the student.
Do NOT invent requirements that are not in the materials.

You MUST return exactly three top-level feedback sections:
1. reviewOfAssignment — ONLY from assignment instructions / problem sheet. If no instructions were provided, set reviewOfAssignment to exactly "TBD".
2. assignmentAssessment — ONLY from completed student work compared to instructions when available. If no completed work was provided, set assignmentAssessment to exactly "TBD".
3. extraMile — stretch recommendations to make work even better. If not applicable (e.g. simple matching/fill-in worksheet with finite answers), set extraMile to exactly "N/A".

${kids}

Return ONLY valid JSON. No markdown fences.`;

  const user = `Class: ${input.classCode} – ${input.className}
Subject: ${input.subject}
Assignment title: ${input.title}

Has instructions material: ${hasInstructions ? "YES" : "NO"}
Has completed work: ${hasWork ? "YES" : "NO"}

ASSIGNMENT INSTRUCTIONS / PROBLEM SHEET:
---
${(input.instructionsText || "").trim() || "(none provided)"}
---

COMPLETED STUDENT WORK:
---
${(input.workText || "").trim() || "(none provided)"}
---

Return JSON:
{
  "reviewOfAssignment": "clear concise summary of what the assignment wants and how to approach it OR exactly TBD",
  "reviewSummary": "optional short overview when instructions exist",
  "reviewSteps": ["brief ordered how-to steps when instructions exist"],
  "problemGuides": [
    {
      "id": "p1",
      "problem": "actual question/problem from the sheet",
      "howTo": "brief how-to for this item",
      "example": "short example of approach (not a full answer key)",
      "tips": ["optional"]
    }
  ],
  "assignmentAssessment": "clear concise overall assessment of the completed work OR exactly TBD",
  "strengths": ["what looks good"],
  "issues": ["what may be wrong or missing — constructive"],
  "extraMile": "stretch guidance OR exactly N/A",
  "extraMileTips": ["optional stretch tips when extraMile is not N/A"]
}

Rules:
- If no instructions: reviewOfAssignment = "TBD", empty reviewSteps/problemGuides.
- If no completed work: assignmentAssessment = "TBD", empty strengths/issues.
- Matching/vocab/fill-in with finite answers: extraMile is often "N/A".
- Keep every section concise.`;

  return { system, user };
}

/** @deprecated kept for compatibility — prefer unified prompt */
export function buildAssignmentGuidancePrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  title: string;
  instructionsText: string;
  kidsMode?: boolean;
  childAge?: number | null;
}) {
  return buildAssignmentUnifiedPrompt({ ...input, workText: "" });
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
