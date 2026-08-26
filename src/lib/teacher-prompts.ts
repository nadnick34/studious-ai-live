import type { CourseLevel, SchoolType } from "@/lib/types";

const SCHOOL_FRAMEWORKS: Record<SchoolType, string> = {
  Classical:
    "Association of Classical Christian Schools (ACCS), Circe Institute, classical sources, primary-source emphasis, Socratic discussion, recitation and mastery.",
  "Religious / Faith-Based":
    "Faith-tradition curriculum standards, denominational education associations, and the school’s stated doctrinal framework.",
  "Public – Common Core":
    "Common Core State Standards, state DOE guidance, Achieve the Core.",
  "Public – Non-Common Core / State Standards":
    "The relevant state academic standards and state DOE guidance — not Common Core unless the teacher says so.",
  Charter:
    "The charter’s published academic model plus applicable state standards.",
  "Private Independent":
    "Independent-school academic standards, college-preparatory expectations, and the school’s own scope and sequence.",
  Montessori:
    "American Montessori Society (AMS) and Association Montessori Internationale (AMI) principles.",
  Homeschool:
    "The family’s chosen curriculum, parent-defined goals, and any affiliated umbrella-school standards.",
  "Vocational / CTE":
    "CTE pathway standards, industry certifications, and career-ready practices.",
  "Special Education":
    "IEP/504 goals, specialized program standards, and accommodations the teacher provides.",
};

export function schoolFramework(type: SchoolType) {
  return SCHOOL_FRAMEWORKS[type];
}

export function buildAssessmentPrompt(input: {
  schoolType: SchoolType;
  subject: string;
  gradeLevel: string;
  courseLevel: CourseLevel;
  schoolName?: string;
  request: string;
}) {
  const framework = schoolFramework(input.schoolType);
  const system = `You are an expert curriculum and assessment specialist for Studious AI Teacher Edition.

Stay strictly faithful to:
- School type: ${input.schoolType}
- Frameworks: ${framework}
- Subject: ${input.subject}
- Grade: ${input.gradeLevel}
- Course level: ${input.courseLevel}
${input.schoolName ? `- School: ${input.schoolName}` : ""}

Return JSON only:
{
  "title": "string",
  "overview": "string",
  "materials": [{ "heading": "string", "items": ["string"] }],
  "answerKey": [{ "item": "string", "answer": "string" }],
  "sources": ["string"]
}`;
  return { system, user: input.request };
}

export function buildGradingPrompt(input: {
  schoolType: SchoolType;
  subject: string;
  gradeLevel: string;
  courseLevel: CourseLevel;
  schoolName?: string;
  assessmentName: string;
  assessmentType: string;
  topics: string;
  pointsPossible: number;
  rosterNames?: string[];
  extractedText: string;
}) {
  const framework = schoolFramework(input.schoolType);
  const roster =
    input.rosterNames && input.rosterNames.length
      ? input.rosterNames.map((n) => `- ${n}`).join("\n")
      : "(no roster — use exact names printed on each student test)";

  const system = `You are Studious AI Teacher Edition’s assessment grader.

The teacher uploaded one or more files in a SINGLE batch. Files may include any mix of:
- A blank test form (questions only, no student name / no marked answers)
- An official answer key (tables with Question #, Correct Answer, domains)
- Completed student tests (student name on each form, answers circled or selected)

YOU must identify which content is the key vs student work. Do not ask the teacher to pre-label files.

Grading rules:
1. Use the answer key as the only source of truth for correct answers (letters and full text).
2. Detect every distinct student in the completed-test content (name in header/fields).
3. Match names to the class roster when possible (fuzzy match OK). Prefer roster spelling in studentName.
4. Score each student: pointsEarned / pointsPossible. Default pointsPossible = number of questions on the key (or ${input.pointsPossible} if unclear).
5. For each miss: question id/stem, studentAnswer if visible, correct answer from key.
6. topicScores from key domains or question topics (e.g. Founding Era, Civil War Era).
7. strengths = what the class did well; needs = weak topics with a brief teaching note for this school type.
8. status: Strong ≥90, On Track 75–89, Needs Support 60–74, At Risk <60.
9. ALWAYS return a non-empty results array when any student test content is present. If only a key is present and no students, return results: [].
10. Never invent students who are not in the extract. Never skip a student whose name and at least one answer appear.

School context: ${input.schoolType} (${framework}); ${input.subject}; grade ${input.gradeLevel}; ${input.courseLevel}.

Return ONLY valid JSON (no markdown):
{
  "classAverage": 76,
  "questions": [{ "number": "1", "prompt": "Year Declaration adopted?", "correct": "B – 1776", "topic": "Founding Era" }],
  "topicScores": [{ "topic": "Founding Era", "average": 88 }],
  "strengths": ["string"],
  "needs": [{ "topic": "string", "note": "string" }],
  "results": [{
    "studentName": "Alexander Adams",
    "score": 80,
    "pointsEarned": 4,
    "pointsPossible": 5,
    "status": "On Track",
    "missed": [{ "questionNumber": "2", "question": "Civil War turning point", "studentAnswer": "A", "correct": "C – Gettysburg" }],
    "focusAreas": ["Punnett-style setup of Civil War causation"],
    "studyTips": ["string"]
  }]
}`;

  const user = `Grade this assessment.

Name: ${input.assessmentName}
Type: ${input.assessmentType}
Teacher topic notes: ${input.topics}
Default points possible: ${input.pointsPossible}
School: ${input.schoolName || "not specified"}

CLASS ROSTER:
${roster}

UPLOADED CONTENT (mixed blank / key / student tests — classify yourself):
${input.extractedText.slice(0, 60000)}`;

  return { system, user };
}
