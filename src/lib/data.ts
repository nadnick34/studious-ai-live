import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { parseJson, uid } from "@/lib/utils";
import { SAMPLE_PACKAGE } from "@/lib/seed";
import type {
  AssignmentGuidance,
  AssignmentRecord,
  AssignmentSubmission,
  Attachment,
  ClassAlert,
  ClassRecord,
  ClassUpcoming,
  FlashCard,
  GeneratedPackage,
  GanttTask,
  MeetingActionItem,
  MeetingCategory,
  MeetingFocusItem,
  MeetingNotes,
  MeetingPackage,
  MeetingProject,
  MeetingRecord,
  MeetingSession,
  MeetingType,
  ProjectMaterial,
  ProjectStakeholder,
  QuizQuestion,
  StudyNotes,
  StudySet,
  UserProfile,
} from "@/lib/types";

type ClassRow = {
  id: string;
  user_id: string;
  name: string;
  code: string;
  subject: string;
  created_at: string;
  last_accessed: string;
  archived: boolean;
  school_name: string | null;
  semester: string | null;
  professor_name: string | null;
  professor_insight: string | null;
  textbook: string | null;
  textbook_author: string | null;
  schedule_days: string | null;
  schedule_time: string | null;
  syllabus_file: string | null;
  syllabus_text: string | null;
  misc_notes: string | null;
  alerts: unknown;
  upcoming: unknown;
};

type SetRow = {
  id: string;
  user_id: string;
  class_id: string;
  name: string;
  created_at: string;
  notes: unknown;
  audio_script: string;
  quiz: unknown;
  flashcards: unknown;
  source_files: unknown;
  attachments: unknown;
  focus_prompt: string | null;
};

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  phone: string;
  sms_alerts: boolean;
  school_select: string;
  palette_id: string | null;
  custom_school_name: string | null;
  school_logo_url: string | null;
  avatar_data_url: string | null;
  role: string;
  edition: string;
  setup_complete: boolean;
  for_child?: boolean;
  child_age?: number | null;
  child_gender?: string | null;
  kids_mode?: boolean;
  education_approach?: string | null;
  state?: string | null;
  education_level?: string | null;
  college_class?: string | null;
  student_grade?: string | null;
};

function emptyNotes(title: string): StudyNotes {
  return { title, subtitle: "", sections: [], otherResources: [] };
}

function mapClass(row: ClassRow): ClassRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    code: row.code,
    subject: row.subject,
    createdAt: row.created_at,
    lastAccessed: row.last_accessed,
    archived: Boolean(row.archived),
    schoolName: row.school_name || undefined,
    semester: row.semester || undefined,
    professorName: row.professor_name || undefined,
    professorInsight: row.professor_insight || undefined,
    textbook: row.textbook || undefined,
    textbookAuthor: row.textbook_author || undefined,
    scheduleDays: row.schedule_days || undefined,
    scheduleTime: row.schedule_time || undefined,
    syllabusFile: row.syllabus_file || undefined,
    syllabusText: row.syllabus_text || undefined,
    miscNotes: row.misc_notes || undefined,
    alerts: parseJson<ClassAlert[]>(row.alerts, []),
    upcoming: parseJson<ClassUpcoming[]>(row.upcoming, []),
  };
}

function mapSet(row: SetRow): StudySet {
  return {
    id: row.id,
    classId: row.class_id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    notes: parseJson<StudyNotes>(row.notes, emptyNotes(row.name)),
    audioScript: row.audio_script || "",
    quiz: parseJson<QuizQuestion[]>(row.quiz, []),
    flashcards: parseJson<FlashCard[]>(row.flashcards, []),
    sourceFiles: parseJson<string[]>(row.source_files, []),
    attachments: parseJson<Attachment[]>(row.attachments, []),
    focusPrompt: row.focus_prompt || undefined,
  };
}

function mapProfile(row: ProfileRow | undefined): UserProfile {
  if (!row) {
    return {
      phone: "",
      smsAlerts: false,
      schoolSelect: "studious",
      role: "student",
      edition: "student",
      setupComplete: false,
      forChild: false,
      childAge: null,
      childGender: null,
      kidsMode: false,
      educationApproach: null,
      state: null,
      educationLevel: null,
      collegeClass: null,
      studentGrade: null,
    };
  }
  const childAge = row.child_age == null ? null : Number(row.child_age);
  const forChild = Boolean(row.for_child);
  const kidsMode =
    Boolean(row.kids_mode) ||
    forChild ||
    (row.role === "student" && childAge != null && childAge <= 9);
  return {
    displayName: row.display_name,
    phone: row.phone || "",
    smsAlerts: Boolean(row.sms_alerts),
    schoolSelect: row.school_select || "studious",
    paletteId: row.palette_id,
    customSchoolName: row.custom_school_name,
    schoolLogoUrl: row.school_logo_url,
    avatarDataUrl: row.avatar_data_url,
    role: (row.role as UserProfile["role"]) || "student",
    edition: row.edition === "teacher" ? "teacher" : row.edition === "professional" ? "professional" : "student",
    setupComplete: Boolean(row.setup_complete),
    forChild,
    childAge,
    childGender: row.child_gender === "boy" || row.child_gender === "girl" ? row.child_gender : null,
    kidsMode,
    educationApproach: (row.education_approach as UserProfile["educationApproach"]) || null,
    state: row.state || null,
    educationLevel: (row.education_level as UserProfile["educationLevel"]) || null,
    collegeClass: (row.college_class as UserProfile["collegeClass"]) || null,
    studentGrade: (row.student_grade as UserProfile["studentGrade"]) || null,
  };
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId} limit 1`;
    return mapProfile(rows[0]);
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: UserProfile) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const childAge = data.childAge == null || data.childAge === ("" as unknown as number) ? null : Number(data.childAge);
    const forChild = Boolean(data.forChild);
    const kidsMode =
      Boolean(data.kidsMode) ||
      forChild ||
      (data.role === "student" && childAge != null && !Number.isNaN(childAge) && childAge <= 9);
    try {
      await sql.query(`alter table profiles add column if not exists education_approach text`);
      await sql.query(`alter table profiles add column if not exists state text`);
      await sql.query(`alter table profiles add column if not exists education_level text`);
      await sql.query(`alter table profiles add column if not exists college_class text`);
      await sql.query(`alter table profiles add column if not exists student_grade text`);
    } catch {
      /* ignore */
    }
    await sql`
      insert into profiles (
        user_id, display_name, phone, sms_alerts, school_select, palette_id,
        custom_school_name, school_logo_url, avatar_data_url, role, edition, setup_complete,
        for_child, child_age, child_gender, kids_mode, education_approach, state, education_level, college_class, student_grade, updated_at
      ) values (
        ${context.userId}, ${data.displayName ?? null}, ${data.phone}, ${data.smsAlerts},
        ${data.schoolSelect}, ${data.paletteId ?? null}, ${data.customSchoolName ?? null},
        ${data.schoolLogoUrl ?? null}, ${data.avatarDataUrl ?? null}, ${data.role},
        ${data.edition}, ${data.setupComplete},
        ${forChild}, ${childAge}, ${data.childGender ?? null}, ${kidsMode}, ${data.educationApproach ?? null}, ${data.state ?? null}, ${data.educationLevel ?? null}, ${data.collegeClass ?? null}, ${data.studentGrade ?? null}, now()
      )
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        phone = excluded.phone,
        sms_alerts = excluded.sms_alerts,
        school_select = excluded.school_select,
        palette_id = excluded.palette_id,
        custom_school_name = excluded.custom_school_name,
        school_logo_url = excluded.school_logo_url,
        avatar_data_url = excluded.avatar_data_url,
        role = excluded.role,
        edition = excluded.edition,
        setup_complete = excluded.setup_complete,
        for_child = excluded.for_child,
        child_age = excluded.child_age,
        child_gender = excluded.child_gender,
        kids_mode = excluded.kids_mode,
        education_approach = excluded.education_approach,
        state = excluded.state,
        education_level = excluded.education_level,
        college_class = excluded.college_class,
        student_grade = excluded.student_grade,
        updated_at = now()
    `;
    return { ok: true as const };
  });

export const listClasses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((archived: boolean) => Boolean(archived))
  .handler(async ({ context, data: archived }) => {
    const sql = await getSql();
    const rows = await sql<ClassRow>`
      select * from classes
      where user_id = ${context.userId} and archived = ${archived}
      order by last_accessed desc
    `;
    return rows.map(mapClass);
  });

export const getClassById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<ClassRow>`
      select * from classes where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapClass(rows[0]) : null;
  });

export type ClassInput = {
  name: string;
  code: string;
  subject: string;
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
};

export const createClass = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ClassInput) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = uid("c");
    const alerts = JSON.stringify(data.alerts || []);
    const upcoming = JSON.stringify(data.upcoming || []);
    await sql`
      insert into classes (
        id, user_id, name, code, subject, school_name, semester, professor_name,
        professor_insight, textbook, textbook_author, schedule_days, schedule_time,
        syllabus_file, syllabus_text, misc_notes, alerts, upcoming
      ) values (
        ${id}, ${context.userId}, ${data.name}, ${data.code}, ${data.subject},
        ${data.schoolName ?? null}, ${data.semester ?? null}, ${data.professorName ?? null},
        ${data.professorInsight ?? null}, ${data.textbook ?? null}, ${data.textbookAuthor ?? null},
        ${data.scheduleDays ?? null}, ${data.scheduleTime ?? null}, ${data.syllabusFile ?? null},
        ${data.syllabusText ?? null}, ${data.miscNotes ?? null}, ${alerts}::jsonb, ${upcoming}::jsonb
      )
    `;
    const rows = await sql<ClassRow>`select * from classes where id = ${id} limit 1`;
    return mapClass(rows[0]);
  });

export const updateClass = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; patch: Partial<ClassInput> & { archived?: boolean } }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<ClassRow>`
      select * from classes where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!existing[0]) return null;
    const cur = mapClass(existing[0]);
    const p = data.patch;
    const next: ClassRecord = {
      ...cur,
      name: p.name ?? cur.name,
      code: p.code ?? cur.code,
      subject: p.subject ?? cur.subject,
      archived: p.archived ?? cur.archived,
      schoolName: p.schoolName ?? cur.schoolName,
      semester: p.semester ?? cur.semester,
      professorName: p.professorName ?? cur.professorName,
      professorInsight: p.professorInsight ?? cur.professorInsight,
      textbook: p.textbook ?? cur.textbook,
      textbookAuthor: p.textbookAuthor ?? cur.textbookAuthor,
      scheduleDays: p.scheduleDays ?? cur.scheduleDays,
      scheduleTime: p.scheduleTime ?? cur.scheduleTime,
      syllabusFile: p.syllabusFile ?? cur.syllabusFile,
      syllabusText: p.syllabusText ?? cur.syllabusText,
      miscNotes: p.miscNotes ?? cur.miscNotes,
      alerts: p.alerts ?? cur.alerts,
      upcoming: p.upcoming ?? cur.upcoming,
    };
    await sql`
      update classes set
        name = ${next.name},
        code = ${next.code},
        subject = ${next.subject},
        archived = ${Boolean(next.archived)},
        school_name = ${next.schoolName ?? null},
        semester = ${next.semester ?? null},
        professor_name = ${next.professorName ?? null},
        professor_insight = ${next.professorInsight ?? null},
        textbook = ${next.textbook ?? null},
        textbook_author = ${next.textbookAuthor ?? null},
        schedule_days = ${next.scheduleDays ?? null},
        schedule_time = ${next.scheduleTime ?? null},
        syllabus_file = ${next.syllabusFile ?? null},
        syllabus_text = ${next.syllabusText ?? null},
        misc_notes = ${next.miscNotes ?? null},
        alerts = ${JSON.stringify(next.alerts || [])}::jsonb,
        upcoming = ${JSON.stringify(next.upcoming || [])}::jsonb
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return next;
  });

export const touchClass = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update classes set last_accessed = now()
      where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const listStudySets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((classId: string) => classId)
  .handler(async ({ context, data: classId }) => {
    const sql = await getSql();
    const rows = await sql<SetRow>`
      select * from study_sets
      where user_id = ${context.userId} and class_id = ${classId}
      order by created_at desc
    `;
    return rows.map(mapSet);
  });

export const getStudySetById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<SetRow>`
      select * from study_sets where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapSet(rows[0]) : null;
  });

export type NewStudySetInput = {
  classId: string;
  name: string;
  generated: GeneratedPackage;
  sourceFiles: string[];
  attachments?: Attachment[];
  focusPrompt?: string;
};

export const createStudySet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: NewStudySetInput) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = uid("s");
    const attachments = data.attachments || [];
    await sql`
      insert into study_sets (
        id, user_id, class_id, name, notes, audio_script, quiz, flashcards,
        source_files, attachments, focus_prompt
      ) values (
        ${id}, ${context.userId}, ${data.classId}, ${data.name},
        ${JSON.stringify(data.generated.notes)}::jsonb,
        ${data.generated.audioScript},
        ${JSON.stringify(data.generated.quiz)}::jsonb,
        ${JSON.stringify(data.generated.flashcards)}::jsonb,
        ${JSON.stringify(data.sourceFiles)}::jsonb,
        ${JSON.stringify(attachments)}::jsonb,
        ${data.focusPrompt ?? null}
      )
    `;
    await sql`
      update classes set last_accessed = now()
      where id = ${data.classId} and user_id = ${context.userId}
    `;
    const rows = await sql<SetRow>`select * from study_sets where id = ${id} limit 1`;
    return mapSet(rows[0]);
  });

export const updateStudySet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id: string;
      patch: Partial<{
        name: string;
        sourceFiles: string[];
        attachments: Attachment[];
        notes: StudyNotes;
        audioScript: string;
        quiz: QuizQuestion[];
        flashcards: FlashCard[];
      }>;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<SetRow>`
      select * from study_sets where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!rows[0]) return null;
    const cur = mapSet(rows[0]);
    const p = data.patch;
    const next: StudySet = {
      ...cur,
      name: p.name ?? cur.name,
      sourceFiles: p.sourceFiles ?? cur.sourceFiles,
      attachments: p.attachments ?? cur.attachments,
      notes: p.notes ?? cur.notes,
      audioScript: p.audioScript ?? cur.audioScript,
      quiz: p.quiz ?? cur.quiz,
      flashcards: p.flashcards ?? cur.flashcards,
    };
    await sql`
      update study_sets set
        name = ${next.name},
        source_files = ${JSON.stringify(next.sourceFiles)}::jsonb,
        attachments = ${JSON.stringify(next.attachments)}::jsonb,
        notes = ${JSON.stringify(next.notes)}::jsonb,
        audio_script = ${next.audioScript},
        quiz = ${JSON.stringify(next.quiz)}::jsonb,
        flashcards = ${JSON.stringify(next.flashcards)}::jsonb
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return next;
  });

export const deleteStudySet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from study_sets where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const seedSampleClass = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await sql<{ n: number }>`
      select count(*)::int as n from classes where user_id = ${context.userId}
    `;
    if ((existing[0]?.n ?? 0) > 0) return { created: false as const };

    const classId = uid("c");
    const setId = uid("s");
    await sql`
      insert into classes (id, user_id, name, code, subject, school_name, semester, professor_name)
      values (
        ${classId}, ${context.userId}, ${"Principles of Biology"}, ${"BIOL 1543"},
        ${"Biology"}, ${"University of Arkansas"}, ${"Fall 2026"}, ${"Dr. Sarah Mitchell"}
      )
    `;
    await sql`
      insert into study_sets (
        id, user_id, class_id, name, notes, audio_script, quiz, flashcards, source_files, attachments
      ) values (
        ${setId}, ${context.userId}, ${classId}, ${"Chapters 1–3"},
        ${JSON.stringify(SAMPLE_PACKAGE.notes)}::jsonb,
        ${SAMPLE_PACKAGE.audioScript},
        ${JSON.stringify(SAMPLE_PACKAGE.quiz)}::jsonb,
        ${JSON.stringify(SAMPLE_PACKAGE.flashcards)}::jsonb,
        ${JSON.stringify(["Campbell_Ch1-3.pdf", "Lecture_Week1-2.pdf"])}::jsonb,
        ${JSON.stringify([
          { id: "a1", name: "Campbell_Ch1-3.pdf", kind: "pdf", size: 0, addedAt: new Date().toISOString() },
          { id: "a2", name: "Lecture_Week1-2.pdf", kind: "pdf", size: 0, addedAt: new Date().toISOString() },
        ])}::jsonb
      )
    `;
    return { created: true as const, classId };
  });

type AssignmentRow = {
  id: string;
  user_id: string;
  class_id: string;
  title: string;
  created_at: string;
  instructions_text: string;
  source_files: unknown;
  guidance: unknown;
  submissions: unknown;
};

function mapAssignment(row: AssignmentRow): AssignmentRecord {
  return {
    id: row.id,
    classId: row.class_id,
    title: row.title,
    createdAt: row.created_at,
    instructionsText: row.instructions_text || "",
    sourceFiles: parseJson<string[]>(row.source_files, []),
    guidance: (row.guidance as AssignmentGuidance | null) || null,
    submissions: parseJson<AssignmentSubmission[]>(row.submissions, []),
  };
}

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((classId: string) => classId)
  .handler(async ({ context, data: classId }) => {
    const sql = await getSql();
    const rows = await sql<AssignmentRow>`
      select * from assignments
      where user_id = ${context.userId} and class_id = ${classId}
      order by created_at desc
    `;
    return rows.map(mapAssignment);
  });

export const getAssignmentById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<AssignmentRow>`
      select * from assignments where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapAssignment(rows[0]) : null;
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      classId: string;
      title: string;
      instructionsText: string;
      sourceFiles?: string[];
      guidance?: AssignmentGuidance | null;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = uid("asg");
    const createdAt = new Date().toISOString();
    await sql`
      insert into assignments (
        id, user_id, class_id, title, created_at, instructions_text, source_files, guidance, submissions
      ) values (
        ${id}, ${context.userId}, ${data.classId}, ${data.title.trim()}, ${createdAt},
        ${data.instructionsText || ""},
        ${JSON.stringify(data.sourceFiles || [])}::jsonb,
        ${data.guidance ? JSON.stringify(data.guidance) : null}::jsonb,
        ${JSON.stringify([])}::jsonb
      )
    `;
    return {
      id,
      classId: data.classId,
      title: data.title.trim(),
      createdAt,
      instructionsText: data.instructionsText || "",
      sourceFiles: data.sourceFiles || [],
      guidance: data.guidance || null,
      submissions: [],
    } satisfies AssignmentRecord;
  });

export const updateAssignment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id: string;
      patch: Partial<{
        title: string;
        instructionsText: string;
        sourceFiles: string[];
        guidance: AssignmentGuidance | null;
        submissions: AssignmentSubmission[];
      }>;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<AssignmentRow>`
      select * from assignments where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    const row = rows[0];
    if (!row) return { ok: false as const };
    const next = {
      title: data.patch.title ?? row.title,
      instructions_text: data.patch.instructionsText ?? row.instructions_text,
      source_files: data.patch.sourceFiles ?? parseJson<string[]>(row.source_files, []),
      guidance: data.patch.guidance !== undefined ? data.patch.guidance : row.guidance,
      submissions: data.patch.submissions ?? parseJson<AssignmentSubmission[]>(row.submissions, []),
    };
    await sql`
      update assignments set
        title = ${next.title},
        instructions_text = ${next.instructions_text},
        source_files = ${JSON.stringify(next.source_files)}::jsonb,
        guidance = ${next.guidance ? JSON.stringify(next.guidance) : null}::jsonb,
        submissions = ${JSON.stringify(next.submissions)}::jsonb
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from assignments where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

/* ——— Professional meetings ——— */

type MeetingRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  organizer: string;
  meeting_type: string;
  subject: string;
  company_name: string;
  location: string;
  meeting_at: string | null;
  attendees: string;
  misc_notes: string;
  agenda_text: string;
  invite_text: string;
  created_at: string;
  last_accessed: string;
  archived: boolean;
  project_id: string | null;
};

type MeetingSessionRow = {
  id: string;
  user_id: string;
  meeting_id: string;
  name: string;
  created_at: string;
  notes: unknown;
  focus_items: unknown;
  action_items: unknown;
  audio_script: string;
  source_files: unknown;
  attachments: unknown;
};

type MeetingProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status?: string;
  meeting_ids: unknown;
  stakeholders?: unknown;
  plan?: unknown;
  gantt_tasks?: unknown;
  materials?: unknown;
  status_summary?: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  archived: boolean;
};

function mapMeeting(row: MeetingRow): MeetingRecord {
  return {
    id: row.id,
    name: row.name,
    category: (row.category as MeetingCategory) || "Regular Work",
    organizer: row.organizer || "",
    meetingType: (row.meeting_type as MeetingType) || "In-Person",
    subject: row.subject || "",
    companyName: row.company_name || "",
    location: row.location || "",
    meetingAt: row.meeting_at,
    attendees: row.attendees || "",
    miscNotes: row.misc_notes || "",
    agendaText: row.agenda_text || "",
    inviteText: row.invite_text || "",
    createdAt: row.created_at,
    lastAccessed: row.last_accessed,
    archived: Boolean(row.archived),
    projectId: row.project_id,
  };
}

function mapMeetingSession(row: MeetingSessionRow): MeetingSession {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    name: row.name,
    createdAt: row.created_at,
    notes: parseJson<MeetingNotes>(row.notes, { title: row.name, sections: [] }),
    focusItems: parseJson<MeetingFocusItem[]>(row.focus_items, []),
    actionItems: parseJson<MeetingActionItem[]>(row.action_items, []),
    audioScript: row.audio_script || "",
    sourceFiles: parseJson<string[]>(row.source_files, []),
    attachments: parseJson(row.attachments, []),
  };
}

function mapMeetingProject(row: MeetingProjectRow): MeetingProject {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    status: row.status || "active",
    meetingIds: parseJson<string[]>(row.meeting_ids, []),
    stakeholders: parseJson(row.stakeholders, []),
    plan: parseJson(row.plan, {}),
    ganttTasks: parseJson(row.gantt_tasks, []),
    materials: parseJson(row.materials, []),
    statusSummary: row.status_summary || "",
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    archived: Boolean(row.archived),
  };
}

export const listMeetings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<MeetingRow>`
      select * from meetings where user_id = ${context.userId} and archived = false
      order by coalesce(meeting_at, created_at) desc
    `;
    return rows.map(mapMeeting);
  });

export const listArchivedMeetings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<MeetingRow>`
      select * from meetings where user_id = ${context.userId} and archived = true
      order by last_accessed desc
    `;
    return rows.map(mapMeeting);
  });

export const getMeetingById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<MeetingRow>`
      select * from meetings where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapMeeting(rows[0]) : null;
  });

export type MeetingInput = {
  name: string;
  category?: MeetingCategory;
  organizer?: string;
  meetingType?: MeetingType;
  subject?: string;
  companyName?: string;
  location?: string;
  meetingAt?: string | null;
  attendees?: string;
  miscNotes?: string;
  agendaText?: string;
  inviteText?: string;
};

export const createMeeting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: MeetingInput) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = uid("mtg");
    await sql`
      insert into meetings (
        id, user_id, name, category, organizer, meeting_type, subject, company_name,
        location, meeting_at, attendees, misc_notes, agenda_text, invite_text
      ) values (
        ${id}, ${context.userId}, ${data.name.trim()},
        ${data.category || "Regular Work"}, ${data.organizer || ""},
        ${data.meetingType || "In-Person"}, ${data.subject || ""},
        ${data.companyName || ""}, ${data.location || ""},
        ${data.meetingAt || null}, ${data.attendees || ""},
        ${data.miscNotes || ""}, ${data.agendaText || ""}, ${data.inviteText || ""}
      )
    `;
    const rows = await sql<MeetingRow>`select * from meetings where id = ${id} limit 1`;
    return mapMeeting(rows[0]);
  });

export const updateMeeting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; patch: Partial<MeetingInput> & { archived?: boolean; projectId?: string | null } }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<MeetingRow>`
      select * from meetings where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!rows[0]) return null;
    const cur = mapMeeting(rows[0]);
    const p = data.patch;
    const next = {
      name: p.name ?? cur.name,
      category: p.category ?? cur.category,
      organizer: p.organizer ?? cur.organizer,
      meetingType: p.meetingType ?? cur.meetingType,
      subject: p.subject ?? cur.subject,
      companyName: p.companyName ?? cur.companyName,
      location: p.location ?? cur.location,
      meetingAt: p.meetingAt !== undefined ? p.meetingAt : cur.meetingAt,
      attendees: p.attendees ?? cur.attendees,
      miscNotes: p.miscNotes ?? cur.miscNotes,
      agendaText: p.agendaText ?? cur.agendaText,
      inviteText: p.inviteText ?? cur.inviteText,
      archived: p.archived ?? cur.archived,
      projectId: p.projectId !== undefined ? p.projectId : cur.projectId,
    };
    await sql`
      update meetings set
        name = ${next.name},
        category = ${next.category},
        organizer = ${next.organizer},
        meeting_type = ${next.meetingType},
        subject = ${next.subject},
        company_name = ${next.companyName},
        location = ${next.location},
        meeting_at = ${next.meetingAt},
        attendees = ${next.attendees},
        misc_notes = ${next.miscNotes},
        agenda_text = ${next.agendaText},
        invite_text = ${next.inviteText},
        archived = ${next.archived},
        project_id = ${next.projectId ?? null},
        last_accessed = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ...cur, ...next };
  });

export const listMeetingSessions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((meetingId: string) => meetingId)
  .handler(async ({ context, data: meetingId }) => {
    const sql = await getSql();
    const rows = await sql<MeetingSessionRow>`
      select * from meeting_sessions
      where user_id = ${context.userId} and meeting_id = ${meetingId}
      order by created_at desc
    `;
    return rows.map(mapMeetingSession);
  });

export const getMeetingSessionById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<MeetingSessionRow>`
      select * from meeting_sessions where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapMeetingSession(rows[0]) : null;
  });

export const createMeetingSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      meetingId: string;
      name: string;
      generated: MeetingPackage;
      sourceFiles?: string[];
      attachments?: Attachment[];
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = uid("ms");
    await sql`
      insert into meeting_sessions (
        id, user_id, meeting_id, name, notes, focus_items, action_items, audio_script, source_files, attachments
      ) values (
        ${id}, ${context.userId}, ${data.meetingId}, ${data.name},
        ${JSON.stringify(data.generated.notes)}::jsonb,
        ${JSON.stringify(data.generated.focusItems)}::jsonb,
        ${JSON.stringify(data.generated.actionItems)}::jsonb,
        ${data.generated.audioScript || ""},
        ${JSON.stringify(data.sourceFiles || [])}::jsonb,
        ${JSON.stringify(data.attachments || [])}::jsonb
      )
    `;
    await sql`update meetings set last_accessed = now() where id = ${data.meetingId} and user_id = ${context.userId}`;
    const rows = await sql<MeetingSessionRow>`select * from meeting_sessions where id = ${id} limit 1`;
    return mapMeetingSession(rows[0]);
  });

export const updateMeetingSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id: string;
      patch: Partial<{
        name: string;
        notes: MeetingNotes;
        focusItems: MeetingFocusItem[];
        actionItems: MeetingActionItem[];
        audioScript: string;
        sourceFiles: string[];
        attachments: Attachment[];
      }>;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<MeetingSessionRow>`
      select * from meeting_sessions where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!rows[0]) return { ok: false as const };
    const cur = mapMeetingSession(rows[0]);
    const p = data.patch;
    const next = {
      name: p.name ?? cur.name,
      notes: p.notes ?? cur.notes,
      focusItems: p.focusItems ?? cur.focusItems,
      actionItems: p.actionItems ?? cur.actionItems,
      audioScript: p.audioScript ?? cur.audioScript,
      sourceFiles: p.sourceFiles ?? cur.sourceFiles,
      attachments: p.attachments ?? cur.attachments,
    };
    await sql`
      update meeting_sessions set
        name = ${next.name},
        notes = ${JSON.stringify(next.notes)}::jsonb,
        focus_items = ${JSON.stringify(next.focusItems)}::jsonb,
        action_items = ${JSON.stringify(next.actionItems)}::jsonb,
        audio_script = ${next.audioScript},
        source_files = ${JSON.stringify(next.sourceFiles)}::jsonb,
        attachments = ${JSON.stringify(next.attachments)}::jsonb
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const listMeetingProjects = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<MeetingProjectRow>`
      select * from meeting_projects where user_id = ${context.userId} and archived = false
      order by created_at desc
    `;
    return rows.map(mapMeetingProject);
  });

export const createMeetingProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      name: string;
      description?: string;
      meetingIds?: string[];
      stakeholders?: ProjectStakeholder[];
      startDate?: string | null;
      endDate?: string | null;
      status?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = uid("mpj");
    const ids = data.meetingIds || [];
    await sql`
      insert into meeting_projects (
        id, user_id, name, description, status, meeting_ids, stakeholders, start_date, end_date
      ) values (
        ${id}, ${context.userId}, ${data.name.trim()}, ${data.description || ""},
        ${data.status || "active"}, ${JSON.stringify(ids)}::jsonb,
        ${JSON.stringify(data.stakeholders || [])}::jsonb,
        ${data.startDate || null}, ${data.endDate || null}
      )
    `;
    for (const mid of ids) {
      await sql`
        update meetings set project_id = ${id}
        where id = ${mid} and user_id = ${context.userId}
      `;
    }
    const rows = await sql<MeetingProjectRow>`select * from meeting_projects where id = ${id} limit 1`;
    return mapMeetingProject(rows[0]);
  });

export const getMeetingProjectById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<MeetingProjectRow>`
      select * from meeting_projects where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapMeetingProject(rows[0]) : null;
  });

export const updateMeetingProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id: string;
      patch: Partial<{
        name: string;
        description: string;
        status: string;
        meetingIds: string[];
        stakeholders: ProjectStakeholder[];
        plan: Record<string, unknown>;
        ganttTasks: GanttTask[];
        materials: ProjectMaterial[];
        statusSummary: string;
        startDate: string | null;
        endDate: string | null;
        archived: boolean;
      }>;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<MeetingProjectRow>`
      select * from meeting_projects where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!rows[0]) return null;
    const cur = mapMeetingProject(rows[0]);
    const p = data.patch;
    const next = {
      name: p.name ?? cur.name,
      description: p.description ?? cur.description,
      status: p.status ?? cur.status,
      meetingIds: p.meetingIds ?? cur.meetingIds,
      stakeholders: p.stakeholders ?? cur.stakeholders,
      plan: p.plan ?? cur.plan,
      ganttTasks: p.ganttTasks ?? cur.ganttTasks,
      materials: p.materials ?? cur.materials,
      statusSummary: p.statusSummary ?? cur.statusSummary,
      startDate: p.startDate !== undefined ? p.startDate : cur.startDate,
      endDate: p.endDate !== undefined ? p.endDate : cur.endDate,
      archived: p.archived ?? cur.archived,
    };
    await sql`
      update meeting_projects set
        name = ${next.name},
        description = ${next.description},
        status = ${next.status},
        meeting_ids = ${JSON.stringify(next.meetingIds)}::jsonb,
        stakeholders = ${JSON.stringify(next.stakeholders)}::jsonb,
        plan = ${JSON.stringify(next.plan)}::jsonb,
        gantt_tasks = ${JSON.stringify(next.ganttTasks)}::jsonb,
        materials = ${JSON.stringify(next.materials)}::jsonb,
        status_summary = ${next.statusSummary},
        start_date = ${next.startDate ?? null},
        end_date = ${next.endDate ?? null},
        archived = ${next.archived}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ...cur, ...next };
  });

/* ——— Teacher Edition ——— */
import type {
  AssessmentType,
  CourseLevel,
  SchoolType,
  StudentResult,
  TeacherAssessment,
  TeacherClass,
  TeacherStudent,
  TopicScore,
} from "@/lib/types";

type TeacherClassRow = {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  grade_level: string;
  course_level: string;
  school_type: string;
  school_name: string;
  created_at: string;
  archived: boolean;
};

type TeacherAssessmentRow = {
  id: string;
  user_id: string;
  class_id: string;
  name: string;
  type: string;
  topics: string;
  points_possible: number;
  created_at: string;
  source_files: unknown;
  class_average: number;
  topic_scores: unknown;
  strengths: unknown;
  needs: unknown;
  results: unknown;
  questions?: unknown;
};

function mapTeacherClass(row: TeacherClassRow): TeacherClass {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject || "",
    gradeLevel: row.grade_level || "",
    courseLevel: (row.course_level as CourseLevel) || "Regular",
    schoolType: (row.school_type as SchoolType) || "Private Independent",
    schoolName: row.school_name || "",
    createdAt: row.created_at,
    archived: Boolean(row.archived),
  };
}

function mapTeacherAssessment(row: TeacherAssessmentRow): TeacherAssessment {
  return {
    id: row.id,
    classId: row.class_id,
    name: row.name,
    type: (row.type as AssessmentType) || "Quiz",
    topics: row.topics || "",
    pointsPossible: row.points_possible || 100,
    createdAt: row.created_at,
    sourceFiles: parseJson(row.source_files, []),
    classAverage: Number(row.class_average) || 0,
    topicScores: parseJson(row.topic_scores, []),
    strengths: parseJson(row.strengths, []),
    needs: parseJson(row.needs, []),
    results: parseJson(row.results, []),
    questions: parseJson(row.questions, []),
  };
}



function normName(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(s: string) {
  return normName(s).split(" ").filter((t) => t.length > 1);
}

/** Fuzzy roster match: exact, last+first, last name + initial, token overlap. */
function matchRosterName(candidate: string, roster: string[]): string | null {
  const c = normName(candidate);
  if (!c) return null;
  const exact = roster.find((r) => normName(r) === c);
  if (exact) return exact;
  const cTok = nameTokens(candidate);
  if (!cTok.length) return null;
  let best: { name: string; score: number } | null = null;
  for (const r of roster) {
    const rTok = nameTokens(r);
    if (!rTok.length) continue;
    const lastC = cTok[cTok.length - 1];
    const lastR = rTok[rTok.length - 1];
    const firstC = cTok[0];
    const firstR = rTok[0];
    let score = 0;
    if (lastC === lastR) score += 3;
    if (firstC === firstR) score += 2;
    else if (firstC[0] === firstR[0] && lastC === lastR) score += 2;
    const overlap = cTok.filter((tok) => rTok.includes(tok)).length;
    score += overlap;
    if (c.includes(normName(r)) || normName(r).includes(c)) score += 2;
    if (!best || score > best.score) best = { name: r, score };
  }
  if (best && best.score >= 3) return best.name;
  return null;
}

async function ensureTeacherTables(sql: Awaited<ReturnType<typeof getSql>>) {
  const statements = [
    `create table if not exists teacher_classes (
      id text primary key,
      user_id text not null,
      name text not null,
      subject text not null default '',
      grade_level text not null default '',
      course_level text not null default 'Regular',
      school_type text not null default 'Private Independent',
      school_name text not null default '',
      syllabus_text text not null default '',
      created_at timestamptz not null default now(),
      archived boolean not null default false
    )`,
    `create index if not exists teacher_classes_user_idx on teacher_classes (user_id)`,
    `create table if not exists teacher_students (
      id text primary key,
      user_id text not null,
      class_id text not null,
      name text not null,
      average double precision not null default 0
    )`,
    `create index if not exists teacher_students_class_idx on teacher_students (user_id, class_id)`,
    `create table if not exists teacher_assessments (
      id text primary key,
      user_id text not null,
      class_id text not null,
      name text not null,
      type text not null default 'Quiz',
      topics text not null default '',
      points_possible integer not null default 100,
      created_at timestamptz not null default now(),
      source_files jsonb not null default '[]'::jsonb,
      class_average double precision not null default 0,
      topic_scores jsonb not null default '[]'::jsonb,
      strengths jsonb not null default '[]'::jsonb,
      needs jsonb not null default '[]'::jsonb,
      results jsonb not null default '[]'::jsonb
    )`,
    `create index if not exists teacher_assessments_class_idx on teacher_assessments (user_id, class_id)`,
    `create table if not exists teacher_tool_state (
      user_id text primary key,
      scriptorium_log jsonb not null default '[]'::jsonb,
      testprep_cards jsonb not null default '{}'::jsonb,
      student_testprep jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    )`,
  ];
  for (const stmt of statements) {
    try {
      await sql.query(stmt);
    } catch (err) {
      console.error("[teacher] ensure table statement failed:", err);
      throw err;
    }
  }
  try {
    await sql.query(`alter table teacher_classes add column if not exists syllabus_text text not null default ''`);
  } catch {
    /* ignore */
  }
  try {
    await sql.query(`alter table teacher_assessments add column if not exists questions jsonb not null default '[]'::jsonb`);
  } catch {
    /* ignore */
  }
}

export const listTeacherClasses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const rows = await sql<TeacherClassRow>`
      select * from teacher_classes where user_id = ${context.userId} and archived = false
      order by created_at desc
    `;
    return rows.map(mapTeacherClass);
  });

export const getTeacherClassById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<TeacherClassRow>`
      select * from teacher_classes where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapTeacherClass(rows[0]) : null;
  });

export const createTeacherClass = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      name: string;
      subject: string;
      gradeLevel: string;
      courseLevel: CourseLevel;
      schoolType: SchoolType;
      schoolName?: string;
      syllabusText?: string;
      students?: string[];
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const id = uid("tc");
    try {
      await sql`
        insert into teacher_classes (
          id, user_id, name, subject, grade_level, course_level, school_type, school_name, syllabus_text
        ) values (
          ${id}, ${context.userId}, ${data.name.trim()}, ${data.subject.trim()},
          ${data.gradeLevel}, ${data.courseLevel}, ${data.schoolType}, ${data.schoolName || ""},
          ${data.syllabusText || ""}
        )
      `;
    } catch (err) {
      // Fallback without syllabus_text if column missing on older DB
      await sql`
        insert into teacher_classes (
          id, user_id, name, subject, grade_level, course_level, school_type, school_name
        ) values (
          ${id}, ${context.userId}, ${data.name.trim()}, ${data.subject.trim()},
          ${data.gradeLevel}, ${data.courseLevel}, ${data.schoolType}, ${data.schoolName || ""}
        )
      `;
    }
    const names = (data.students || []).map((n) => n.trim()).filter(Boolean);
    for (const name of names) {
      const sid = uid("ts");
      await sql`
        insert into teacher_students (id, user_id, class_id, name, average)
        values (${sid}, ${context.userId}, ${id}, ${name}, 0)
      `;
    }
    const rows = await sql<TeacherClassRow>`select * from teacher_classes where id = ${id} limit 1`;
    if (!rows[0]) throw new Error("Class was not saved. Try again.");
    return mapTeacherClass(rows[0]);
  });

export const listTeacherStudents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((classId: string) => classId)
  .handler(async ({ context, data: classId }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const rows = await sql<{ id: string; class_id: string; name: string; average: number }>`
      select id, class_id, name, average from teacher_students
      where user_id = ${context.userId} and class_id = ${classId}
      order by name asc
    `;
    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      name: r.name,
      average: Number(r.average) || 0,
    }));
  });


export const updateTeacherClass = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id: string;
      patch: Partial<{
        name: string;
        subject: string;
        gradeLevel: string;
        courseLevel: CourseLevel;
        schoolType: SchoolType;
        schoolName: string;
        syllabusText: string;
        archived: boolean;
      }>;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const rows = await sql<TeacherClassRow>`
      select * from teacher_classes where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!rows[0]) return null;
    const cur = mapTeacherClass(rows[0]);
    const p = data.patch;
    const next = {
      name: p.name ?? cur.name,
      subject: p.subject ?? cur.subject,
      gradeLevel: p.gradeLevel ?? cur.gradeLevel,
      courseLevel: p.courseLevel ?? cur.courseLevel,
      schoolType: p.schoolType ?? cur.schoolType,
      schoolName: p.schoolName ?? cur.schoolName,
      archived: p.archived ?? cur.archived,
    };
    await sql`
      update teacher_classes set
        name = ${next.name},
        subject = ${next.subject},
        grade_level = ${next.gradeLevel},
        course_level = ${next.courseLevel},
        school_type = ${next.schoolType},
        school_name = ${next.schoolName},
        archived = ${next.archived}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ...cur, ...next };
  });


export const getTeacherClassStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((classId: string) => classId)
  .handler(async ({ context, data: classId }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const students = await sql<{ id: string; name: string; average: number }>`
      select id, name, average from teacher_students
      where user_id = ${context.userId} and class_id = ${classId}
      order by name asc
    `;
    const assessments = await sql<TeacherAssessmentRow>`
      select * from teacher_assessments
      where user_id = ${context.userId} and class_id = ${classId}
      order by created_at desc
    `;
    const mapped = assessments.map(mapTeacherAssessment);
    // Per-student averages from latest results across assessments
    const byStudent = new Map<string, number[]>();
    for (const a of mapped) {
      for (const r of a.results || []) {
        const key = r.studentName;
        if (!byStudent.has(key)) byStudent.set(key, []);
        byStudent.get(key)!.push(Number(r.score) || 0);
      }
    }
    const roster = students.map((s) => {
      const scores = byStudent.get(s.name) || [];
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : Math.round(Number(s.average) || 0);
      const lastQuiz = scores.length ? Math.round(scores[0]) : null;
      let status: string = "On Track";
      if (avg >= 90) status = "Strong";
      else if (avg >= 75) status = "On Track";
      else if (avg >= 60) status = "Needs Support";
      else status = "At Risk";
      return {
        id: s.id,
        name: s.name,
        average: avg,
        lastQuiz,
        testCount: scores.length,
        status,
      };
    });
    // If no roster rows but assessment results exist, build roster from results
    if (roster.length === 0 && byStudent.size) {
      for (const [name, scores] of byStudent) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const lastQuiz = Math.round(scores[0]);
        let status = "On Track";
        if (avg >= 90) status = "Strong";
        else if (avg >= 75) status = "On Track";
        else if (avg >= 60) status = "Needs Support";
        else status = "At Risk";
        roster.push({ id: name, name, average: avg, lastQuiz, testCount: scores.length, status });
      }
      roster.sort((a, b) => a.name.localeCompare(b.name));
    }
    const classAverage =
      roster.length > 0
        ? Math.round(roster.reduce((s, r) => s + r.average, 0) / roster.length)
        : mapped.length
          ? Math.round(mapped.reduce((s, a) => s + a.classAverage, 0) / mapped.length)
          : 0;
    const onTrack = roster.filter((r) => r.status === "Strong" || r.status === "On Track").length;
    const needSupport = roster.filter((r) => r.status === "Needs Support" || r.status === "At Risk").length;
    return {
      classAverage,
      studentCount: roster.length,
      onTrack,
      needSupport,
      assessmentCount: mapped.length,
      students: roster,
      assessments: mapped,
    };
  });

export const listTeacherAssessments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((classId: string) => classId)
  .handler(async ({ context, data: classId }) => {
    const sql = await getSql();
    const rows = await sql<TeacherAssessmentRow>`
      select * from teacher_assessments
      where user_id = ${context.userId} and class_id = ${classId}
      order by created_at desc
    `;
    return rows.map(mapTeacherAssessment);
  });

export const getTeacherAssessmentById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const rows = await sql<TeacherAssessmentRow>`
      select * from teacher_assessments where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapTeacherAssessment(rows[0]) : null;
  });

export const createTeacherAssessment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      classId: string;
      name: string;
      type: AssessmentType;
      topics: string;
      pointsPossible: number;
      sourceFiles?: string[];
      classAverage: number;
      topicScores: TopicScore[];
      strengths: string[];
      needs: { topic: string; note: string }[];
      results: StudentResult[];
      questions?: { number: string; prompt: string; correct: string; topic?: string }[];
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const id = uid("ta");
    try {
      await sql`
        insert into teacher_assessments (
          id, user_id, class_id, name, type, topics, points_possible, source_files,
          class_average, topic_scores, strengths, needs, results, questions
        ) values (
          ${id}, ${context.userId}, ${data.classId}, ${data.name}, ${data.type},
          ${data.topics}, ${data.pointsPossible}, ${JSON.stringify(data.sourceFiles || [])}::jsonb,
          ${data.classAverage}, ${JSON.stringify(data.topicScores)}::jsonb,
          ${JSON.stringify(data.strengths)}::jsonb, ${JSON.stringify(data.needs)}::jsonb,
          ${JSON.stringify(data.results)}::jsonb, ${JSON.stringify(data.questions || [])}::jsonb
        )
      `;
    } catch {
    await sql`
      insert into teacher_assessments (
        id, user_id, class_id, name, type, topics, points_possible, source_files,
        class_average, topic_scores, strengths, needs, results
      ) values (
        ${id}, ${context.userId}, ${data.classId}, ${data.name}, ${data.type},
        ${data.topics}, ${data.pointsPossible}, ${JSON.stringify(data.sourceFiles || [])}::jsonb,
        ${data.classAverage}, ${JSON.stringify(data.topicScores)}::jsonb,
        ${JSON.stringify(data.strengths)}::jsonb, ${JSON.stringify(data.needs)}::jsonb,
        ${JSON.stringify(data.results)}::jsonb
      )
    `;
    }
    const rows = await sql<TeacherAssessmentRow>`select * from teacher_assessments where id = ${id} limit 1`;
    if (!rows[0]) throw new Error("Assessment save failed.");
    return mapTeacherAssessment(rows[0]);
  });


export const applyAssessmentResultsToRoster = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      classId: string;
      results: { studentName: string; score: number }[];
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const existing = await sql<{ id: string; name: string; average: number }>`
      select id, name, average from teacher_students
      where user_id = ${context.userId} and class_id = ${data.classId}
    `;
    const rosterNames = existing.map((r) => r.name);
    const mapped: { rosterName: string; score: number }[] = [];
    for (const r of data.results) {
      const raw = (r.studentName || "").trim();
      if (!raw) continue;
      const score = Math.max(0, Math.min(100, Number(r.score) || 0));
      const matched = matchRosterName(raw, rosterNames) || raw;
      mapped.push({ rosterName: matched, score });
    }
    const byName = new Map(existing.map((r) => [normName(r.name), r]));
    for (const r of mapped) {
      const key = normName(r.rosterName);
      const hit = byName.get(key);
      if (hit) {
        const next = Math.round(hit.average * 0.4 + r.score * 0.6);
        await sql`
          update teacher_students set average = ${next}, name = ${hit.name}
          where id = ${hit.id} and user_id = ${context.userId}
        `;
        hit.average = next;
      } else {
        const sid = uid("ts");
        await sql`
          insert into teacher_students (id, user_id, class_id, name, average)
          values (${sid}, ${context.userId}, ${data.classId}, ${r.rosterName}, ${r.score})
        `;
        byName.set(key, { id: sid, name: r.rosterName, average: r.score });
        rosterNames.push(r.rosterName);
      }
    }
    return { updated: mapped.length, names: mapped.map((m) => m.rosterName) };
  });

export const remapResultsToRoster = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { classId: string; results: StudentResult[] }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const existing = await sql<{ name: string }>`
      select name from teacher_students
      where user_id = ${context.userId} and class_id = ${data.classId}
    `;
    const roster = existing.map((r) => r.name);
    return data.results.map((r) => {
      const matched = matchRosterName(r.studentName, roster);
      return matched ? { ...r, studentName: matched } : r;
    });
  });

export const listAllTeacherAssessments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<TeacherAssessmentRow>`
      select * from teacher_assessments where user_id = ${context.userId}
      order by created_at desc limit 50
    `;
    return rows.map(mapTeacherAssessment);
  });


export const upsertTeacherAssessmentResult = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      assessmentId: string;
      result: StudentResult;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const rows = await sql<TeacherAssessmentRow>`
      select * from teacher_assessments
      where id = ${data.assessmentId} and user_id = ${context.userId}
      limit 1
    `;
    if (!rows[0]) throw new Error("Assessment not found.");
    const cur = mapTeacherAssessment(rows[0]);
    const name = data.result.studentName;
    const rest = (cur.results || []).filter((r) => r.studentName.toLowerCase() !== name.toLowerCase());
    const results = [...rest, data.result];
    const classAverage = results.length
      ? Math.round(results.reduce((s, r) => s + Number(r.score || 0), 0) / results.length)
      : cur.classAverage;
    await sql`
      update teacher_assessments
      set results = ${JSON.stringify(results)}::jsonb,
          class_average = ${classAverage}
      where id = ${data.assessmentId} and user_id = ${context.userId}
    `;
    return { ...cur, results, classAverage };
  });


export const getTeacherToolState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const rows = await sql<{ scriptorium_log: unknown; testprep_cards: unknown; student_testprep: unknown }>`
      select scriptorium_log, testprep_cards, student_testprep from teacher_tool_state where user_id = ${context.userId} limit 1
    `;
    const row = rows[0];
    return {
      scriptoriumLog: parseJson(row?.scriptorium_log, []),
      testPrepCards: parseJson(row?.testprep_cards, {}),
      studentTestPrep: parseJson(row?.student_testprep, []),
    };
  });

export const saveTeacherToolState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      scriptoriumLog?: unknown;
      testPrepCards?: unknown;
      studentTestPrep?: unknown;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureTeacherTables(sql);
    const cur = await sql<{ scriptorium_log: unknown; testprep_cards: unknown; student_testprep: unknown }>`
      select scriptorium_log, testprep_cards, student_testprep from teacher_tool_state where user_id = ${context.userId} limit 1
    `;
    const scriptoriumLog =
      data.scriptoriumLog !== undefined ? data.scriptoriumLog : parseJson(cur[0]?.scriptorium_log, []);
    const testPrepCards =
      data.testPrepCards !== undefined ? data.testPrepCards : parseJson(cur[0]?.testprep_cards, {});
    const studentTestPrep =
      data.studentTestPrep !== undefined ? data.studentTestPrep : parseJson(cur[0]?.student_testprep, []);
    try {
      await sql.query(`alter table teacher_tool_state add column if not exists student_testprep jsonb not null default '[]'::jsonb`);
    } catch { /* ignore */ }
    await sql`
      insert into teacher_tool_state (user_id, scriptorium_log, testprep_cards, student_testprep, updated_at)
      values (${context.userId}, ${JSON.stringify(scriptoriumLog)}::jsonb, ${JSON.stringify(testPrepCards)}::jsonb, ${JSON.stringify(studentTestPrep)}::jsonb, now())
      on conflict (user_id) do update set
        scriptorium_log = excluded.scriptorium_log,
        testprep_cards = excluded.testprep_cards,
        student_testprep = excluded.student_testprep,
        updated_at = now()
    `;
    return { ok: true as const };
  });
