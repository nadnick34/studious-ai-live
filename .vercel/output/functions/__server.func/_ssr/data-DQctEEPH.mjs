import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-kgFKYUAS.mjs";
import { c as parseJson, u as uid } from "./utils-DyWB8yQo.mjs";
import { r as getSql } from "./db-DI6H24jX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/data-DQctEEPH.js
var SAMPLE_PACKAGE = {
	notes: {
		title: "BIOL 1543 – Principles of Biology",
		subtitle: "Chapters 1–3 · Sample set",
		sections: [
			{
				heading: "The Scientific Method",
				layout: "stack",
				bullets: [
					"Observation – noticing a phenomenon or pattern in nature",
					"Hypothesis – a testable, falsifiable explanation",
					"Experiment – controlled test with independent & dependent variables",
					"Analysis – interpret data; accept, reject, or refine the hypothesis",
					"Theory – a well-supported explanation that has withstood repeated testing"
				],
				reference: "Campbell Biology, Ch. 1"
			},
			{
				heading: "Characteristics of Living Things",
				layout: "stack",
				bullets: [
					"Cellular organization",
					"Metabolism (energy processing)",
					"Homeostasis",
					"Growth and development",
					"Reproduction",
					"Response to stimuli",
					"Evolutionary adaptation"
				]
			},
			{
				heading: "Levels of Biological Organization",
				layout: "stack",
				bullets: ["Atom → Molecule → Organelle → Cell → Tissue → Organ → Organ System → Organism", "Population → Community → Ecosystem → Biosphere"],
				reference: "Class lecture notes, Week 2"
			}
		],
		otherResources: [
			{ title: "Khan Academy – Introduction to Biology" },
			{ title: "Crash Course Biology – Scientific Method" },
			{ title: "OpenStax Biology 2e, Chapter 1" }
		]
	},
	audioScript: `Welcome to this Studious AI review of Chapters 1 through 3 of Principles of Biology.

We begin with the scientific method. Science starts with careful observation of the natural world. From those observations we form a hypothesis — a testable and falsifiable explanation. We then design controlled experiments, collect data, and analyze the results. Only after repeated testing and confirmation does an idea rise to the level of a scientific theory.

Living things share several key characteristics: cellular organization, metabolism, homeostasis, growth and development, reproduction, response to stimuli, and evolutionary adaptation.

Finally, biology is organized across many levels — from atoms and molecules up through cells, tissues, organs, organisms, populations, communities, ecosystems, and the biosphere.

Keep these foundations clear. They will support everything that follows in this course.`,
	quiz: [
		{
			id: "q1",
			question: "Which of the following is a key characteristic of a scientific hypothesis?",
			options: [
				"It must be proven true",
				"It must be testable and falsifiable",
				"It is the same as a theory",
				"It cannot be revised"
			],
			correctIndex: 1,
			explanation: "A hypothesis must be testable and capable of being shown false."
		},
		{
			id: "q2",
			question: "Homeostasis refers to an organism’s ability to:",
			options: [
				"Reproduce rapidly",
				"Maintain a stable internal environment",
				"Evolve over generations",
				"Respond only to external stimuli"
			],
			correctIndex: 1
		},
		{
			id: "q3",
			question: "Which sequence correctly shows levels of biological organization from smallest to largest?",
			options: [
				"Cell → Atom → Organism → Ecosystem",
				"Atom → Molecule → Cell → Organism",
				"Organism → Tissue → Cell → Molecule",
				"Ecosystem → Population → Cell → Atom"
			],
			correctIndex: 1
		},
		{
			id: "q4",
			question: "A scientific theory is best described as:",
			options: [
				"An untested idea",
				"A guess about the natural world",
				"A well-supported explanation that has withstood repeated testing",
				"A single experiment’s conclusion"
			],
			correctIndex: 2
		}
	],
	flashcards: [
		{
			id: "f1",
			term: "Hypothesis",
			definition: "A testable, falsifiable explanation for an observation."
		},
		{
			id: "f2",
			term: "Theory",
			definition: "A well-supported explanation that has withstood repeated testing."
		},
		{
			id: "f3",
			term: "Homeostasis",
			definition: "An organism’s ability to maintain a stable internal environment."
		},
		{
			id: "f4",
			term: "Metabolism",
			definition: "The sum of chemical processes that process energy in living things."
		},
		{
			id: "f5",
			term: "Cell",
			definition: "The basic unit of structure and function in living organisms."
		},
		{
			id: "f6",
			term: "Biosphere",
			definition: "All ecosystems on Earth; the highest level of biological organization."
		}
	]
};
function emptyNotes(title) {
	return {
		title,
		subtitle: "",
		sections: [],
		otherResources: []
	};
}
function mapClass(row) {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		code: row.code,
		subject: row.subject,
		createdAt: row.created_at,
		lastAccessed: row.last_accessed,
		archived: Boolean(row.archived),
		schoolName: row.school_name || void 0,
		semester: row.semester || void 0,
		professorName: row.professor_name || void 0,
		professorInsight: row.professor_insight || void 0,
		textbook: row.textbook || void 0,
		textbookAuthor: row.textbook_author || void 0,
		scheduleDays: row.schedule_days || void 0,
		scheduleTime: row.schedule_time || void 0,
		syllabusFile: row.syllabus_file || void 0,
		syllabusText: row.syllabus_text || void 0,
		miscNotes: row.misc_notes || void 0,
		alerts: parseJson(row.alerts, []),
		upcoming: parseJson(row.upcoming, [])
	};
}
function mapSet(row) {
	return {
		id: row.id,
		classId: row.class_id,
		userId: row.user_id,
		name: row.name,
		createdAt: row.created_at,
		notes: parseJson(row.notes, emptyNotes(row.name)),
		audioScript: row.audio_script || "",
		quiz: parseJson(row.quiz, []),
		flashcards: parseJson(row.flashcards, []),
		sourceFiles: parseJson(row.source_files, []),
		attachments: parseJson(row.attachments, []),
		focusPrompt: row.focus_prompt || void 0
	};
}
function mapProfile(row) {
	if (!row) return {
		phone: "",
		smsAlerts: false,
		schoolSelect: "studious",
		role: "student",
		edition: "student",
		setupComplete: false
	};
	return {
		displayName: row.display_name,
		phone: row.phone || "",
		smsAlerts: Boolean(row.sms_alerts),
		schoolSelect: row.school_select || "studious",
		paletteId: row.palette_id,
		customSchoolName: row.custom_school_name,
		schoolLogoUrl: row.school_logo_url,
		avatarDataUrl: row.avatar_data_url,
		role: row.role || "student",
		edition: row.edition === "teacher" ? "teacher" : "student",
		setupComplete: Boolean(row.setup_complete)
	};
}
var getProfile_createServerFn_handler = createServerRpc({
	id: "18184547672c7149d4ceaeed294304774ab03185b25430db2539a79a75e1ef7b",
	name: "getProfile",
	filename: "src/lib/data.ts"
}, (opts) => getProfile.__executeServer(opts));
var getProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getProfile_createServerFn_handler, async ({ context }) => {
	return mapProfile((await (await getSql())`select * from profiles where user_id = ${context.userId} limit 1`)[0]);
});
var saveProfile_createServerFn_handler = createServerRpc({
	id: "cbd35ae0399351319cbefd9d5c534093de43069cc71eac8dd11e1888f129aa62",
	name: "saveProfile",
	filename: "src/lib/data.ts"
}, (opts) => saveProfile.__executeServer(opts));
var saveProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(saveProfile_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`
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
	return { ok: true };
});
var listClasses_createServerFn_handler = createServerRpc({
	id: "043bebd22833c5a9fa0e49643c2500c85fb75770e7f0f696de36487e7b9ebbc9",
	name: "listClasses",
	filename: "src/lib/data.ts"
}, (opts) => listClasses.__executeServer(opts));
var listClasses = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((archived) => Boolean(archived)).handler(listClasses_createServerFn_handler, async ({ context, data: archived }) => {
	return (await (await getSql())`
      select * from classes
      where user_id = ${context.userId} and archived = ${archived}
      order by last_accessed desc
    `).map(mapClass);
});
var getClassById_createServerFn_handler = createServerRpc({
	id: "1be93e685fb0c5aef0cd90b282b68626853166f85136488766ab4dc916b4fa95",
	name: "getClassById",
	filename: "src/lib/data.ts"
}, (opts) => getClassById.__executeServer(opts));
var getClassById = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(getClassById_createServerFn_handler, async ({ context, data: id }) => {
	const rows = await (await getSql())`
      select * from classes where id = ${id} and user_id = ${context.userId} limit 1
    `;
	return rows[0] ? mapClass(rows[0]) : null;
});
var createClass_createServerFn_handler = createServerRpc({
	id: "10b1bc4b341edea3dcc6361f5f61c87a2bdd4c11f2acb50c0ac17ada76544c76",
	name: "createClass",
	filename: "src/lib/data.ts"
}, (opts) => createClass.__executeServer(opts));
var createClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createClass_createServerFn_handler, async ({ context, data }) => {
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
	return mapClass((await sql`select * from classes where id = ${id} limit 1`)[0]);
});
var updateClass_createServerFn_handler = createServerRpc({
	id: "55e032a87aadd1e0b251d19fe8c20ca6791702e02253d92cb8c4d275d0d30ef3",
	name: "updateClass",
	filename: "src/lib/data.ts"
}, (opts) => updateClass.__executeServer(opts));
var updateClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(updateClass_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const existing = await sql`
      select * from classes where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
	if (!existing[0]) return null;
	const cur = mapClass(existing[0]);
	const p = data.patch;
	const next = {
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
		upcoming: p.upcoming ?? cur.upcoming
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
var touchClass_createServerFn_handler = createServerRpc({
	id: "efaf38309bab77a82e577e1b235dc3c8e03d979c9c30923e43da5c61366086fd",
	name: "touchClass",
	filename: "src/lib/data.ts"
}, (opts) => touchClass.__executeServer(opts));
var touchClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(touchClass_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`
      update classes set last_accessed = now()
      where id = ${id} and user_id = ${context.userId}
    `;
	return { ok: true };
});
var listStudySets_createServerFn_handler = createServerRpc({
	id: "ab27bc5db43144b6747ece10cff72365451c93386d79b533c19e41469bac17a1",
	name: "listStudySets",
	filename: "src/lib/data.ts"
}, (opts) => listStudySets.__executeServer(opts));
var listStudySets = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((classId) => classId).handler(listStudySets_createServerFn_handler, async ({ context, data: classId }) => {
	return (await (await getSql())`
      select * from study_sets
      where user_id = ${context.userId} and class_id = ${classId}
      order by created_at desc
    `).map(mapSet);
});
var getStudySetById_createServerFn_handler = createServerRpc({
	id: "db0e9f9c0219c50b3f5e781eb6d1bb627be893e9812c347879b8fc4b6792b15e",
	name: "getStudySetById",
	filename: "src/lib/data.ts"
}, (opts) => getStudySetById.__executeServer(opts));
var getStudySetById = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(getStudySetById_createServerFn_handler, async ({ context, data: id }) => {
	const rows = await (await getSql())`
      select * from study_sets where id = ${id} and user_id = ${context.userId} limit 1
    `;
	return rows[0] ? mapSet(rows[0]) : null;
});
var createStudySet_createServerFn_handler = createServerRpc({
	id: "034d425024168ebf8d87a10b7fe3f9a997ad55a874f852daad05f0166daf8808",
	name: "createStudySet",
	filename: "src/lib/data.ts"
}, (opts) => createStudySet.__executeServer(opts));
var createStudySet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createStudySet_createServerFn_handler, async ({ context, data }) => {
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
	return mapSet((await sql`select * from study_sets where id = ${id} limit 1`)[0]);
});
var updateStudySet_createServerFn_handler = createServerRpc({
	id: "6aa269e07467c077071ee441c0fed5bd2cfd97ef0af8978784d317dd41a03fce",
	name: "updateStudySet",
	filename: "src/lib/data.ts"
}, (opts) => updateStudySet.__executeServer(opts));
var updateStudySet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(updateStudySet_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const rows = await sql`
      select * from study_sets where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
	if (!rows[0]) return null;
	const cur = mapSet(rows[0]);
	const p = data.patch;
	const next = {
		...cur,
		name: p.name ?? cur.name,
		sourceFiles: p.sourceFiles ?? cur.sourceFiles,
		attachments: p.attachments ?? cur.attachments,
		notes: p.notes ?? cur.notes,
		audioScript: p.audioScript ?? cur.audioScript,
		quiz: p.quiz ?? cur.quiz,
		flashcards: p.flashcards ?? cur.flashcards
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
var deleteStudySet_createServerFn_handler = createServerRpc({
	id: "0398e7ba66a9e3f5a8a7f0999a1f1c243d7fbc0dfeffd48576b7530186b2d26f",
	name: "deleteStudySet",
	filename: "src/lib/data.ts"
}, (opts) => deleteStudySet.__executeServer(opts));
var deleteStudySet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(deleteStudySet_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`delete from study_sets where id = ${id} and user_id = ${context.userId}`;
	return { ok: true };
});
var seedSampleClass_createServerFn_handler = createServerRpc({
	id: "272228bec3e614808b3688543d93d278cc0bb18039a5d682ada827c8e52a325a",
	name: "seedSampleClass",
	filename: "src/lib/data.ts"
}, (opts) => seedSampleClass.__executeServer(opts));
var seedSampleClass = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(seedSampleClass_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	if (((await sql`
      select count(*)::int as n from classes where user_id = ${context.userId}
    `)[0]?.n ?? 0) > 0) return { created: false };
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
        ${JSON.stringify([{
		id: "a1",
		name: "Campbell_Ch1-3.pdf",
		kind: "pdf",
		size: 0,
		addedAt: (/* @__PURE__ */ new Date()).toISOString()
	}, {
		id: "a2",
		name: "Lecture_Week1-2.pdf",
		kind: "pdf",
		size: 0,
		addedAt: (/* @__PURE__ */ new Date()).toISOString()
	}])}::jsonb
      )
    `;
	return {
		created: true,
		classId
	};
});
//#endregion
export { createClass_createServerFn_handler, createStudySet_createServerFn_handler, deleteStudySet_createServerFn_handler, getClassById_createServerFn_handler, getProfile_createServerFn_handler, getStudySetById_createServerFn_handler, listClasses_createServerFn_handler, listStudySets_createServerFn_handler, saveProfile_createServerFn_handler, seedSampleClass_createServerFn_handler, touchClass_createServerFn_handler, updateClass_createServerFn_handler, updateStudySet_createServerFn_handler };
