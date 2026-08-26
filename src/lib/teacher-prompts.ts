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

Do not apply a generic approach across school types.
Research and cite relevant national or state standards, respected textbooks used in this school type, and professional organizations.
Match Regular / Honors / AP rigor.
Do not write completed student work that replaces student thinking.

When asked for materials, you may produce: in-class activities, discussion prompts, homework, pop quizzes, tests, midterms, finals, answer keys, and scoring guidance.

Return JSON only:
{
  "title": "string",
  "overview": "string",
  "materials": [{ "heading": "string", "items": ["string"] }],
  "answerKey": [{ "item": "string", "answer": "string" }],
  "sources": ["string"]
}`;

  const user = input.request;
  return { system, user };
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
      : "(no roster provided — use exact names printed on each student test)";

  const system = `You are an expert assessment analyst for Studious AI Teacher Edition.

The teacher uploads THREE kinds of material (any may be present):
1) BLANK TEST — the original questions
2) ANSWER KEY — official correct answers (letters and/or full choices), often with topic/domain labels
3) STUDENT BATCH — a multi-page PDF of completed student tests (one or more pages per student, names on each form)

Your job:
- Read the answer key as the only source of truth for correct answers.
- Find each student in the batch (name on the form / header).
- Match each student to the class roster when possible (fuzzy match OK: "Alex Adams" ≈ "Alexander Adams").
- Prefer roster spelling for studentName when matched.
- Score each student against the key (points earned / points possible).
- List what they missed: question # or stem, what they marked if visible, and the correct answer.
- Build class-level topicScores from key domains (Founding Era, Civil War, etc.) or question topics.
- strengths = what the class handled well.
- needs = topics that did not resonate, with a brief teaching suggestion aligned to this school type.
- focusAreas and studyTips are specific and constructive (never vague "study more").

Status rules:
- Strong: score ≥ 90
- On Track: 75–89
- Needs Support: 60–74
- At Risk: < 60

Never invent a student who is not in the batch extract.
Never invent scores — if a page is unreadable, omit that student or note limited confidence in studyTips.
If the key has 5 questions and a student only shows 4 answers, score only what is visible.

Stay faithful to:
- School type: ${input.schoolType} (${framework})
- Subject: ${input.subject}
- Grade: ${input.gradeLevel}
- Course level: ${input.courseLevel}

Return JSON only:
{
  "classAverage": 76,
  "topicScores": [{ "topic": "Founding Era", "average": 88 }],
  "strengths": ["string"],
  "needs": [{ "topic": "string", "note": "string" }],
  "results": [{
    "studentName": "string",
    "score": 80,
    "pointsEarned": 4,
    "pointsPossible": 5,
    "status": "On Track",
    "missed": [{ "question": "Q2 …", "studentAnswer": "A", "correct": "C – Battle of Gettysburg" }],
    "focusAreas": ["string"],
    "studyTips": ["string"]
  }]
}`;

  const user = `Grade this assessment batch.

Assessment: ${input.assessmentName}
Type: ${input.assessmentType}
Topics (teacher notes): ${input.topics}
Points possible (default if not clear from key): ${input.pointsPossible}
School: ${input.schoolName || "not specified"}

CLASS ROSTER (match names from scans to these when possible):
${roster}

EXTRACTED UPLOADS (blank test / answer key / student batch):
${input.extractedText.slice(0, 55000)}`;

  return { system, user };
}
