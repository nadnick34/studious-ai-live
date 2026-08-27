export type UserRole = "student" | "teacher" | "professional" | "theologian" | "admin" | "both";
export type EditionView = "student" | "teacher" | "professional";
export type ChildGender = "boy" | "girl";

/** Display label for the account type chip under the logo */
export function accountTypeLabel(profile?: {
  role?: UserRole;
  forChild?: boolean;
  kidsMode?: boolean;
  childAge?: number | null;
} | null): string {
  const role = profile?.role || "student";
  if (profile?.forChild || profile?.kidsMode || (profile?.childAge != null && profile.childAge <= 9)) {
    return "Student · Kids Mode";
  }
  switch (role) {
    case "teacher":
      return "Teacher";
    case "professional":
      return "Professional";
    case "theologian":
      return "Theologian";
    case "admin":
      return "Admin";
    case "both":
      return "Student & Teacher";
    default:
      return "Student";
  }
}

export interface NotesSection {
  heading: string;
  bullets?: string[];
  body?: string;
  reference?: string;
  layout?: "stack" | "two-column" | "table";
  columns?: { title: string; bullets: string[] }[];
  table?: { headers: string[]; rows: string[][] };
}

export interface SpatialPanel {
  id: string;
  title: string;
  caption: string;
  /** What a cartoon should show — used for spatial learning UI */
  visualDescription: string;
  emoji: string;
  /** Owl narrator line for this panel */
  owlSays?: string;
  /** Generated cartoon image URL or data URL */
  imageUrl?: string;
}

export interface SpatialQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface SpatialStory {
  title: string;
  panels: SpatialPanel[];
  questions: SpatialQuestion[];
  /** Generated short story video URL when unlocked */
  videoUrl?: string;
}

export interface StudyNotes {
  title: string;
  subtitle: string;
  sections: NotesSection[];
  otherResources: { title: string; url?: string }[];
  /** Classical Education package for this chapter, when generated */
  classical?: ClassicalPackage;
  /** Kids Mode: spatial / cartoon learning (legacy panel array or full story) */
  spatialLearning?: SpatialPanel[] | SpatialStory;
}

export type SocraticCardType = "recite" | "explain" | "dialectic" | "locus";

export interface SocraticCard {
  id: string;
  type: SocraticCardType;
  front: string;
  back: string;
  locus?: string;
}

export interface ClassicalPackage {
  generatedAt: string;
  conspectus: {
    memoryWork: string[];
    outline: { heading: string; bullets: string[] }[];
    logicQuestions: string[];
    fiveCommonTopics: {
      definition: string;
      comparison: string;
      circumstance: string;
      relationship: string;
      testimony: string;
    };
    tellBackPrompts: string[];
    lociMap: { locus: string; item: string }[];
  };
  orator: {
    recitationScript: string;
    narrationScript: string;
  };
  socraticCards: SocraticCard[];
  commonplace: { id: string; text: string; kind: "sentence" | "definition" | "connection" }[];
  recitationQueue: { id: string; text: string; kind: "list" | "definition" | "sentence" }[];
  fromMemoryOutline: { heading: string; blankBullets: number }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface FlashCard {
  id: string;
  term: string;
  definition: string;
  /** Kids Mode visual cue */
  emoji?: string;
  /** Tailwind-ish color hint: blue, pink, green, yellow, purple, orange */
  color?: string;
}

export interface Slide {
  id: string;
  title: string;
  bullets: string[];
  layout?: "title" | "bullets" | "two-column" | "table";
  body?: string;
  columns?: { title: string; bullets: string[] }[];
  table?: { headers: string[]; rows: string[][] };
  footer?: string;
}

export interface ClassAlert {
  id: string;
  message: string;
  kind?: "due-soon" | "exam" | "reading" | "policy";
}

export interface ClassUpcoming {
  id: string;
  type: "assignment" | "exam" | "quiz" | "reading" | "other";
  title: string;
  date?: string;
  note?: string;
}

export interface Attachment {
  id: string;
  name: string;
  kind: "pdf" | "image" | "text" | "audio" | "other";
  size: number;
  addedAt: string;
  extractedText?: string;
  dataUrl?: string;
}

export interface StudySet {
  id: string;
  classId: string;
  userId?: string;
  name: string;
  createdAt: string;
  notes: StudyNotes;
  audioScript: string;
  quiz: QuizQuestion[];
  flashcards: FlashCard[];
  slides: Slide[];
  sourceFiles: string[];
  attachments: Attachment[];
  focusPrompt?: string;
}

export interface ClassRecord {
  id: string;
  userId?: string;
  name: string;
  code: string;
  subject: string;
  createdAt: string;
  lastAccessed: string;
  archived?: boolean;
  schoolName?: string;
  semester?: string;
  professorName?: string;
  professorInsight?: string;
  textbook?: string;
  textbookAuthor?: string;
  scheduleDays?: string;
  scheduleTime?: string;
  syllabusFile?: string;
  syllabusText?: string;
  miscNotes?: string;
  alerts?: ClassAlert[];
  upcoming?: ClassUpcoming[];
}

export interface UserProfile {
  displayName?: string | null;
  phone: string;
  smsAlerts: boolean;
  schoolSelect: string;
  educationApproach?: EducationApproach | null;
  state?: string | null;
  educationLevel?: EducationLevel | null;
  collegeClass?: CollegeClass | null;
  paletteId?: string | null;
  customSchoolName?: string | null;
  schoolLogoUrl?: string | null;
  avatarDataUrl?: string | null;
  role: UserRole;
  edition: EditionView;
  setupComplete: boolean;
  /** Parent is setting this account up for a child */
  forChild?: boolean;
  /** Child age in years (Kids Mode when <= 9 and role is student) */
  childAge?: number | null;
  childGender?: ChildGender | null;
  /** Derived / explicit kids skin */
  kidsMode?: boolean;
}

export interface FilePayload {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export interface GeneratedPackage {
  notes: StudyNotes;
  audioScript: string;
  quiz: QuizQuestion[];
  flashcards: FlashCard[];
  slides: Slide[];
}

export interface AssignmentProblemGuide {
  id: string;
  problem: string;
  howTo: string;
  example: string;
  tips?: string[];
}

export interface AssignmentGuidance {
  summary: string;
  steps: string[];
  ideas: string[];
  tips: string[];
  checklist: string[];
  warnings?: string[];
  problemGuides?: AssignmentProblemGuide[];
}

export interface AssignmentSubmission {
  id: string;
  submittedAt: string;
  fileNames: string[];
  workText: string;
  feedback: AssignmentFeedback;
}

/** Unified three-section assignment report */
export interface AssignmentFeedback {
  /** 1. Review of Assignment — based on instructions; "TBD" if none */
  reviewOfAssignment: string;
  /** Structured review pieces when instructions exist */
  reviewSummary?: string;
  reviewSteps?: string[];
  problemGuides?: AssignmentProblemGuide[];
  /** 2. Assignment Assessment — based on completed work */
  assignmentAssessment: string;
  strengths?: string[];
  issues?: string[];
  /** 3. The Extra Mile — or "N/A" */
  extraMile: string;
  extraMileTips?: string[];
}

export interface AssignmentRecord {
  id: string;
  classId: string;
  title: string;
  createdAt: string;
  instructionsText: string;
  sourceFiles: string[];
  guidance?: AssignmentGuidance | null;
  submissions: AssignmentSubmission[];
  /** Latest unified report (assistant + checker) */
  latestReport?: AssignmentFeedback | null;
}

export type MeetingCategory =
  | "Regular Work"
  | "Conference"
  | "Education"
  | "Legal/Compliance"
  | "Vendor"
  | "Interview"
  | "Human Resources"
  | "IT";

export type MeetingType = "In-Person" | "Teams" | "Zoom" | "Google Meet" | "Other Remote";

export interface MeetingActionItem {
  id: string;
  action: string;
  owner?: string;
  dueHint?: string;
  audience?: string;
}

export interface MeetingFocusItem {
  id: string;
  phrase: string;
  why?: string;
}

export interface MeetingNotes {
  title: string;
  subtitle?: string;
  sections: NotesSection[];
  speakers?: { name: string; points: string[] }[];
}

export interface MeetingPackage {
  notes: MeetingNotes;
  focusItems: MeetingFocusItem[];
  actionItems: MeetingActionItem[];
  audioScript: string;
}

export interface MeetingSession {
  id: string;
  meetingId: string;
  name: string;
  createdAt: string;
  notes: MeetingNotes;
  focusItems: MeetingFocusItem[];
  actionItems: MeetingActionItem[];
  audioScript: string;
  sourceFiles: string[];
  attachments: Attachment[];
}

export interface MeetingRecord {
  id: string;
  name: string;
  category: MeetingCategory;
  organizer: string;
  meetingType: MeetingType;
  subject: string;
  companyName: string;
  location: string;
  meetingAt: string | null;
  attendees: string;
  miscNotes: string;
  agendaText: string;
  inviteText: string;
  createdAt: string;
  lastAccessed: string;
  archived: boolean;
  projectId?: string | null;
}

export interface GanttTask {
  id: string;
  name: string;
  owner?: string;
  start: string; // YYYY-MM-DD
  end: string;
  progress?: number; // 0-100
  lane?: string; // e.g. Discovery, Compliance, IT
  /** completed = green; incomplete default = yellow */
  completed?: boolean;
  /** Risk of slipping past deadline: medium = orange, high = red */
  risk?: "none" | "medium" | "high";
}

export interface ProjectMaterial {
  id: string;
  name: string;
  kind?: string;
  notes?: string;
  needsSignature?: boolean;
  signed?: boolean;
  owner?: string;
  addedAt: string;
}

export interface ProjectStakeholder {
  id: string;
  name: string;
  role?: string; // Compliance, IT, Administration, Vendor, etc.
  email?: string;
}

export interface MeetingProject {
  id: string;
  name: string;
  description: string;
  status: string;
  meetingIds: string[];
  stakeholders: ProjectStakeholder[];
  plan: Record<string, unknown>;
  ganttTasks: GanttTask[];
  materials: ProjectMaterial[];
  statusSummary: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  archived: boolean;
}

export const MEETING_CATEGORIES: MeetingCategory[] = [
  "Regular Work",
  "Conference",
  "Education",
  "Legal/Compliance",
  "Vendor",
  "Interview",
  "Human Resources",
  "IT",
];

export const MEETING_TYPES: MeetingType[] = [
  "In-Person",
  "Teams",
  "Zoom",
  "Google Meet",
  "Other Remote",
];

export const EDUCATION_APPROACHES = [
  "Classical",
  "Religious",
  "Public (Standard)",
  "Public (Common Core)",
  "Montessori",
  "Vocational",
  "Special Education",
] as const;
export type EducationApproach = (typeof EDUCATION_APPROACHES)[number];

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia",
] as const;
export type USState = (typeof US_STATES)[number];

export const TEST_FOCUS_OPTIONS = [
  "ACT",
  "SAT",
  "PSAT",
  "PreACT",
  "CLT",
  "LEAP",
  "Iowa Assessments",
  "State summative",
] as const;
export type TestFocus = (typeof TEST_FOCUS_OPTIONS)[number];

export const EDUCATION_LEVELS = [
  "Elementary",
  "Middle School",
  "Junior High",
  "High School",
  "College/Undergraduate",
  "Graduate School",
  "Medical School",
  "Law School",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const COLLEGE_CLASSES = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
export type CollegeClass = (typeof COLLEGE_CLASSES)[number];

export const STUDENT_TEST_GROUPS: { group: string; tests: string[] }[] = [
  { group: "Life", tests: ["Real World"] },
  { group: "High school & middle grades", tests: ["ACT", "SAT", "PSAT", "PreACT", "CLT", "LEAP", "Iowa Assessments", "State summative"] },
  { group: "College admissions & graduate", tests: ["GRE", "LSAT", "GMAT", "MCAT"] },
  { group: "Health professions", tests: ["DAT", "OAT", "PCAT", "ATI TEAS", "HESI", "NLN NEX", "NCLEX-RN", "NCLEX-PN"] },
  { group: "Engineering & licensure", tests: ["FE (Fundamentals of Engineering)", "PE (Principles and Practice of Engineering)", "Praxis"] },
  { group: "Other common", tests: ["AP subject exam", "CLEP", "TOEFL", "IELTS"] },
];



export type SchoolType =
  | "Classical"
  | "Religious / Faith-Based"
  | "Public – Common Core"
  | "Public – Non-Common Core / State Standards"
  | "Charter"
  | "Private Independent"
  | "Montessori"
  | "Homeschool"
  | "Vocational / CTE"
  | "Special Education";

export type CourseLevel = "Regular" | "Honors" | "AP / Advanced";

export type AssessmentType =
  | "Pop Quiz"
  | "Quiz"
  | "Test"
  | "Midterm"
  | "Final"
  | "Lab / Practical";

export type StudentStatus = "Strong" | "On Track" | "Needs Support" | "At Risk";

export const SCHOOL_TYPES: SchoolType[] = [
  "Classical",
  "Religious / Faith-Based",
  "Public – Common Core",
  "Public – Non-Common Core / State Standards",
  "Charter",
  "Private Independent",
  "Montessori",
  "Homeschool",
  "Vocational / CTE",
  "Special Education",
];

export const COURSE_LEVELS: CourseLevel[] = ["Regular", "Honors", "AP / Advanced"];

export const ASSESSMENT_TYPES: AssessmentType[] = [
  "Pop Quiz",
  "Quiz",
  "Test",
  "Midterm",
  "Final",
  "Lab / Practical",
];

export interface TeacherClass {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  courseLevel: CourseLevel;
  schoolType: SchoolType;
  schoolName: string;
  createdAt: string;
  archived: boolean;
}

export interface TeacherStudent {
  id: string;
  classId: string;
  name: string;
  average: number;
}

export interface TopicScore {
  topic: string;
  average: number;
}

export interface MissedItem {
  question: string;
  questionNumber?: string;
  studentAnswer?: string;
  correct: string;
}

export interface AssessmentQuestion {
  number: string;
  prompt: string;
  correct: string;
  topic?: string;
}

export interface StudentResult {
  studentId?: string;
  studentName: string;
  score: number;
  pointsEarned: number;
  pointsPossible: number;
  status: StudentStatus;
  missed: MissedItem[];
  focusAreas: string[];
  studyTips: string[];
}

export interface TeacherAssessment {
  id: string;
  classId: string;
  name: string;
  type: AssessmentType;
  topics: string;
  pointsPossible: number;
  createdAt: string;
  sourceFiles: string[];
  classAverage: number;
  topicScores: TopicScore[];
  strengths: string[];
  needs: { topic: string; note: string }[];
  results: StudentResult[];
  questions?: AssessmentQuestion[];
}
