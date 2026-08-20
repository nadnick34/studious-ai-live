import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { parseJson, uid } from "@/lib/utils";
import { SAMPLE_PACKAGE } from "@/lib/seed";
import type {
  Attachment,
  ClassAlert,
  ClassRecord,
  ClassUpcoming,
  FlashCard,
  GeneratedPackage,
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
    };
  }
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
    edition: row.edition === "teacher" ? "teacher" : "student",
    setupComplete: Boolean(row.setup_complete),
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
    await sql`
      insert into profiles (
        user_id, display_name, phone, sms_alerts, school_select, palette_id,
        custom_school_name, school_logo_url, avatar_data_url, role, edition, setup_complete, updated_at
      ) values (
        ${context.userId}, ${data.displayName ?? null}, ${data.phone}, ${data.smsAlerts},
        ${data.schoolSelect}, ${data.paletteId ?? null}, ${data.customSchoolName ?? null},
        ${data.schoolLogoUrl ?? null}, ${data.avatarDataUrl ?? null}, ${data.role},
        ${data.edition}, ${data.setupComplete}, now()
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
