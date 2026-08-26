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
  extractedText: string;
}) {
  const framework = schoolFramework(input.schoolType);
  const system = `You are an expert assessment analyst for Studious AI Teacher Edition.

When a teacher uploads a scanned class set (and optionally an answer key), produce clear, actionable results for the class and for each student.

Stay faithful to:
- School type: ${input.schoolType} (${framework})
- Subject: ${input.subject}
- Grade: ${input.gradeLevel}
- Course level: ${input.courseLevel}

Rules:
- Never invent scores. If handwriting is unreadable, note the limitation.
- Tone: constructive, specific, no "study more."
- Class report: average, distribution, topics that did not resonate, what to try next (aligned to this school type), topics that landed well.
- Student report: what they missed, what it should have been, what to focus on, 2–4 study tips.

Return JSON only:
{
  "classAverage": 76,
  "topicScores": [{ "topic": "string", "average": 58 }],
  "strengths": ["string"],
  "needs": [{ "topic": "string", "note": "string" }],
  "results": [{
    "studentName": "string",
    "score": 64,
    "pointsEarned": 32,
    "pointsPossible": 50,
    "status": "Needs Support",
    "missed": [{ "question": "string", "correct": "string" }],
    "focusAreas": ["string"],
    "studyTips": ["string"]
  }]
}`;

  const user = `Grade this assessment.
Name: ${input.assessmentName}
Type: ${input.assessmentType}
Topics: ${input.topics}
Points: ${input.pointsPossible}
School: ${input.schoolName || "not specified"}

EXTRACTED FILES:
${input.extractedText.slice(0, 20000)}`;

  return { system, user };
}
