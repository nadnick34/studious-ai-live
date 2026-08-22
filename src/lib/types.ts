export type UserRole = "student" | "teacher" | "both" | "admin";
export type EditionView = "student" | "teacher";

export interface NotesSection {
  heading: string;
  bullets?: string[];
  body?: string;
  reference?: string;
  layout?: "stack" | "two-column" | "table";
  columns?: { title: string; bullets: string[] }[];
  table?: { headers: string[]; rows: string[][] };
}

export interface StudyNotes {
  title: string;
  subtitle: string;
  sections: NotesSection[];
  otherResources: { title: string; url?: string }[];
  /** Classical Education package for this chapter, when generated */
  classical?: ClassicalPackage;
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
  paletteId?: string | null;
  customSchoolName?: string | null;
  schoolLogoUrl?: string | null;
  avatarDataUrl?: string | null;
  role: UserRole;
  edition: EditionView;
  setupComplete: boolean;
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
