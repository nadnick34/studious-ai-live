import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-kgFKYUAS.mjs";
import { u as uid } from "./utils-DyWB8yQo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-Xws9kZvO.js
/**
* Core Studious AI generation prompt.
* Generated notes are intended to become THE study source for this section.
*/
function buildGenerationPrompt(input) {
	const { className, classCode, subject, setName, sourceFiles, extractedText, focusPrompt } = input;
	const focusBlock = focusPrompt ? `\n\nCUSTOM FOCUS REQUEST FROM THE STUDENT:\n"${focusPrompt}"\n\nPrioritize this focus. Go deeper on the requested area, expand definitions, add extra examples, and weight the quiz and flashcards toward that topic. Still produce a complete package.` : "";
	const sourceLen = (extractedText || "").length;
	return {
		system: `You are Studious AI, an expert tutor whose job is mastery — not test-cramming.

USE EVERYTHING available in the uploaded sources for this section. Do not skip headings, definitions, examples, figures described in text, or caveats. The generated notes document should be able to stand alone as THE source the student studies from.

${sourceLen > 8e3 ? "The uploaded material is substantial. Produce a LONG, complete set of notes (aim for the equivalent of 6–10 printed pages). Do not summarize away detail." : sourceLen > 2500 ? "The uploaded material is moderate. Produce thorough notes (aim for the equivalent of 3–6 printed pages)." : "The uploaded material is limited. Still produce complete teaching notes (aim for the equivalent of 2–4 printed pages), clearly marking what is inferred vs. drawn from the sources."}
Hard cap: do not exceed the equivalent of ~10 printed pages. Typical target is 2–3 pages for a short lecture and 4–8 for a full chapter.

FORMAT (tight and organized, never fluffy):
- Short heading + optional 1–3 sentence body, then bullets
- Use layout "table" for definitions, processes, taxonomies, timelines, comparisons
- Use layout "two-column" for paired ideas (compare/contrast)
- Use layout "stack" for narrative or lists
- Cite the source file or page/section when possible
- End with specific Other Resources (named videos, open texts, reputable sites)

AUDIO SCRIPT (single narrator lecture, 5–20 minutes spoken):
- ONE voice only. Do not use HOST:/TUTOR: or a two-person podcast.
- Tone: informative, explanatory, and enjoyable — like a strong guest lecture, not a skit.
- Structure, spoken as sections:
  1) INTRODUCTION — what this set is, why it matters in the course
  2) FULL CONTENT — teach the material in order; use ALL uploaded notes, PDFs, and any books/publications named in the sources
  3) OUTSIDE CONNECTIONS — only well-established explanations, classic examples, or standard textbook treatments that match this content. Name the source type (e.g. OpenStax, a well-known lecture series). Do not invent studies, quotes, or data.
  4) CONCLUSION — pull the threads together and leave the student with what to remember
- Spoken length: minimum ~5 minutes (~800 words), maximum ~20 minutes (~2800 words).
- Do not pad with filler, repetition, or made-up facts. Length should follow how much real material there is.
- Write the script as continuous spoken prose (short paragraphs). No stage directions.

QUIZ: 8–12 items (definition, application, conceptual) with explanations.
FLASH CARDS: 12–20 high-value terms.

Rules:
- Do not invent unsupported facts. If a figure is mentioned but not described, say so.
- Prefer density over length, but do not omit important source content.
- Return ONLY valid JSON. No markdown fences.`,
		user: `Generate a full study package for this class section.

Class: ${classCode} – ${className}
Subject: ${subject}
Study set name: ${setName}
Source files: ${sourceFiles.join(", ") || "None named"}
${focusBlock}

${extractedText ? `UPLOADED / EXTRACTED CONTENT (use all of it as primary source; do not say sources were missing):\n---\n${extractedText.slice(0, 24e3)}\n---` : "No file text was extracted. If source file names are listed, treat those as the assigned section and write full teaching notes for that section. Do not tell the student their sources were limited unless no files were named."}

Return JSON:
{
  "notes": {
    "title": "string",
    "subtitle": "string",
    "sections": [
      {
        "heading": "string",
        "body": "optional short paragraph",
        "layout": "stack | two-column | table",
        "bullets": ["for stack"],
        "columns": [{ "title": "Left", "bullets": ["..."] }, { "title": "Right", "bullets": ["..."] }],
        "table": { "headers": ["A", "B"], "rows": [["a1", "b1"]] },
        "reference": "optional"
      }
    ],
    "otherResources": [{ "title": "string", "url": "optional" }]
  },
  "audioScript": "continuous spoken lecture script",
  "quiz": [{ "id": "q1", "question": "string", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "string" }],
  "flashcards": [{ "id": "f1", "term": "string", "definition": "string" }]
}`
	};
}
function buildProfessorInsightPrompt(input) {
	const { professorName, schoolName, subject, courseCode } = input;
	return {
		system: `You brief a student on an instructor. The UNIVERSITY / SCHOOL NAME is the primary way to identify the right person (including former appointments).

Use only:
- Faculty directory pages, department pages, Rate My Professors, Coursicle, LinkedIn-style public bios, university news, and publications that name THIS school
- Web snippets provided
Do NOT use Wikipedia. Do not borrow a similarly named person at another school.

Write a BRIEF PROFILE plus practical insight (not a dossier).

Return JSON only:
{
  "found": true or false,
  "summary": "one tight paragraph: who they are, school/department, what they teach, any former institutions",
  "teachingStyle": "short phrase or unknown",
  "difficulty": "short phrase or unknown",
  "tips": ["how to succeed in their class", "exam / workload pattern if known"],
  "sources": ["Rate My Professors", "faculty page", "etc. — types you actually used"]
}

Rules:
- Identify by NAME + the SCHOOL the student entered. Course number is optional.
- found=true only if this person can be placed at that school (or a clearly stated prior appointment at that same school).
- If the name matches someone at a different university, found=false.
- Never use Wikipedia. Never invent ratings, quotes, or private contact information.
- If identity is not clearly tied to the entered school, found=false and say so.
- No gossip, no home addresses, no personal family details.`,
		user: `Research this instructor for a student briefing.

Name: ${professorName}
University / school (use this as the main reference): ${schoolName || "not specified"}
Subject: ${subject || "not specified"}
Course: ${courseCode || "not specified"}`
	};
}
var MONTHS = {
	jan: "01",
	january: "01",
	feb: "02",
	february: "02",
	mar: "03",
	march: "03",
	apr: "04",
	april: "04",
	may: "05",
	jun: "06",
	june: "06",
	jul: "07",
	july: "07",
	aug: "08",
	august: "08",
	sep: "09",
	sept: "09",
	september: "09",
	oct: "10",
	october: "10",
	nov: "11",
	november: "11",
	dec: "12",
	december: "12"
};
function toIso(year, month, day) {
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
function classify(line) {
	const t = line.toLowerCase();
	if (/\b(final|midterm|exam)\b/.test(t)) return "exam";
	if (/\bquiz\b/.test(t)) return "quiz";
	if (/\b(reading|read chapter|chapter)\b/.test(t)) return "reading";
	if (/\b(assignment|homework|paper|essay|project|due)\b/.test(t)) return "assignment";
	return "other";
}
function parseSyllabusLocally(text) {
	const year = String((/* @__PURE__ */ new Date()).getFullYear());
	const upcoming = [];
	const seen = /* @__PURE__ */ new Set();
	const datePatterns = [/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?/gi, /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](20\d{2}))?\b/g];
	const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter((l) => l.length > 8);
	for (const line of lines) {
		if (!/\b(exam|midterm|final|quiz|due|assignment|homework|paper|essay|project|reading|chapter|test)\b/i.test(line)) continue;
		let date = "";
		const named = [...line.matchAll(datePatterns[0])];
		if (named[0]) {
			const mon = MONTHS[named[0][1].toLowerCase().replace(".", "")];
			const day = named[0][2];
			const yr = named[0][3] || year;
			if (mon) date = toIso(yr, mon, day);
		} else {
			const num = [...line.matchAll(datePatterns[1])];
			if (num[0]) date = toIso(num[0][3] || year, num[0][1], num[0][2]);
		}
		const key = `${date}|${line.slice(0, 80)}`;
		if (seen.has(key)) continue;
		seen.add(key);
		upcoming.push({
			id: "u_" + upcoming.length,
			type: classify(line),
			title: line.slice(0, 90),
			date: date || void 0
		});
	}
	upcoming.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
	return {
		alerts: upcoming.filter((u) => {
			if (!u.date) return u.type === "exam";
			const d = new Date(u.date).getTime();
			const now = Date.now();
			return d >= now - 864e5 && d <= now + 864e6;
		}).slice(0, 4).map((u, i) => ({
			id: "a_" + i,
			kind: u.type === "exam" ? "exam" : u.type === "reading" ? "reading" : "due-soon",
			message: u.date ? `${u.title} (${u.date})` : u.title
		})),
		upcoming: upcoming.slice(0, 10)
	};
}
function apiKey() {
	return process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
}
function kindFromName(name, type) {
	const lower = name.toLowerCase();
	if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(lower)) return "image";
	if (type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
	if (type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(lower)) return "text";
	if (type.startsWith("audio/") || /\.(mp3|m4a|wav|aac)$/i.test(lower)) return "audio";
	return "other";
}
function decodeBase64(b64) {
	return Buffer.from(b64, "base64");
}
async function extractPdf(buf) {
	const { extractText, getDocumentProxy } = await import("../_libs/unpdf.mjs").then((n) => n.t);
	const result = await extractText(await getDocumentProxy(new Uint8Array(buf)), { mergePages: true });
	return ((Array.isArray(result.text) ? result.text.join("\n") : result.text) || "").toString();
}
async function visionOcr(name, mime, base64) {
	const key = apiKey();
	if (!key) return `[Image uploaded: ${name}. Filename recorded. Enable AI to read text from photos and scans.]`;
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .1,
			max_tokens: 4e3,
			messages: [{
				role: "user",
				content: [{
					type: "text",
					text: `Extract ALL readable text from this photo/scan of class materials named "${name}". Preserve headings, lists, tables, and labels. If handwriting is present, transcribe it as best you can. Return plain text only.`
				}, {
					type: "image_url",
					image_url: { url: `data:${mime};base64,${base64}` }
				}]
			}]
		})
	});
	if (!res.ok) return `[Could not read image ${name}: ${(await res.text()).slice(0, 180)}]`;
	return (await res.json()).choices?.[0]?.message?.content?.trim() || `[No text found in ${name}]`;
}
async function processFile(file) {
	const name = file.name || "upload";
	const type = file.type || "application/octet-stream";
	const kind = kindFromName(name, type);
	const buf = decodeBase64(file.base64);
	let text = "";
	if (kind === "text") text = buf.toString("utf8");
	else if (kind === "pdf") try {
		text = await extractPdf(buf);
		if (!text.trim()) text = `[PDF had little extractable text. It may be a scan. Treat the filename as context.]`;
	} catch (err) {
		text = `[Could not parse PDF: ${err instanceof Error ? err.message : "parse error"}]`;
	}
	else if (kind === "image") text = await visionOcr(name, type || "image/jpeg", file.base64);
	else text = `[File recorded: ${name}, ${Math.round(buf.length / 1024)} KB.]`;
	const heading = `\n\n===== SOURCE: ${name} =====\n${text}`;
	const attachment = {
		id: uid("a"),
		name,
		kind,
		size: file.size || buf.length,
		addedAt: (/* @__PURE__ */ new Date()).toISOString(),
		extractedText: text.slice(0, 2e4),
		dataUrl: kind === "image" && file.base64.length < 9e5 ? `data:${type};base64,${file.base64}` : void 0
	};
	return {
		heading,
		text,
		attachment
	};
}
var extractMaterials_createServerFn_handler = createServerRpc({
	id: "3a33784bfe4b18fb419f789e3966a198b5de98c075a4192d5dd9cf05d9ff43d0",
	name: "extractMaterials",
	filename: "src/lib/ai.ts"
}, (opts) => extractMaterials.__executeServer(opts));
var extractMaterials = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(extractMaterials_createServerFn_handler, async ({ data }) => {
	const parts = [];
	const attachments = [];
	for (const file of data.files.slice(0, 12)) {
		const processed = await processFile(file);
		parts.push(processed.heading);
		attachments.push(processed.attachment);
	}
	return {
		text: parts.join("\n").trim(),
		attachments,
		fileCount: attachments.length
	};
});
function parseJsonContent(content) {
	let cleaned = content.trim();
	if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
	const parsed = JSON.parse(cleaned);
	if (!parsed.notes || !parsed.audioScript || !Array.isArray(parsed.quiz)) throw new Error("Model response missing required fields");
	if (!Array.isArray(parsed.flashcards)) parsed.flashcards = [];
	return parsed;
}
function mockPackage(body) {
	return {
		notes: {
			title: `${body.classCode || body.className} – ${body.setName}`,
			subtitle: `Generated by Studious AI · ${body.subject || "General"}`,
			sections: [
				{
					heading: "Key Concepts",
					body: "Core ideas from this set, organized for quick review.",
					layout: "stack",
					bullets: [
						`Central theme of “${body.setName}” and why it matters`,
						"Supporting idea with a concrete example from the materials",
						"How this unit connects to prior and upcoming topics",
						"Exam-relevant distinction students often miss"
					],
					reference: body.sourceFiles?.[0] || "Uploaded materials"
				},
				{
					heading: "Definitions at a Glance",
					layout: "table",
					table: {
						headers: [
							"Term",
							"Definition",
							"Why it matters"
						],
						rows: [
							[
								"Key term A",
								"Precise definition from the material",
								"Appears in quizzes and essays"
							],
							[
								"Key term B",
								"Precise definition from the material",
								"Links to the next chapter"
							],
							[
								"Key term C",
								"Precise definition from the material",
								"Common FRQ / short-answer target"
							]
						]
					}
				},
				{
					heading: "Compare & Connect",
					layout: "two-column",
					columns: [{
						title: "What to know",
						bullets: [
							"Primary facts and processes",
							"Must-memorize relationships",
							"Standard examples from lecture"
						]
					}, {
						title: "Watch-outs",
						bullets: [
							"Common misconceptions",
							"Terms that sound similar but differ",
							"Where students lose points"
						]
					}]
				},
				{
					heading: "Application & Mastery Checks",
					layout: "stack",
					bullets: [
						"Explain the main idea out loud in one minute",
						"Teach one definition to a peer without notes",
						"Write one exam-style question and answer it"
					]
				}
			],
			otherResources: [{ title: "Khan Academy – related topic overview" }, { title: "OpenStax chapter for deeper reading" }]
		},
		audioScript: `Welcome to this Studious AI review of ${body.setName} for ${body.classCode || body.className}.

This lecture was generated from the materials you uploaded so you can study while you move.

We will cover the key concepts first, then the essential definitions, and finally how this material connects to the rest of the course.

Listen carefully. Afterward, open the written notes and take the quiz to lock the ideas in.`,
		quiz: [
			{
				id: "q1",
				question: `Which statement best captures a central idea from ${body.setName}?`,
				options: [
					"An incorrect statement",
					"The correct core concept drawn from the materials",
					"A partially true but incomplete statement",
					"An unrelated idea"
				],
				correctIndex: 1,
				explanation: "The second option reflects the main idea present in the uploaded material."
			},
			{
				id: "q2",
				question: "Based on the material, which definition is most accurate?",
				options: [
					"Incorrect definition",
					"Another incorrect definition",
					"The accurate definition",
					"A vague definition"
				],
				correctIndex: 2
			},
			{
				id: "q3",
				question: "How does this material most likely connect to earlier topics?",
				options: [
					"It replaces earlier topics completely",
					"It has no relationship to previous chapters",
					"It builds on foundational concepts introduced earlier",
					"It only matters for the final exam"
				],
				correctIndex: 2
			},
			{
				id: "q4",
				question: "What is the best next step after reviewing these notes?",
				options: [
					"Move on without testing yourself",
					"Memorize every bullet word-for-word",
					"Take the quiz and revisit any missed ideas",
					"Ignore the audio lecture"
				],
				correctIndex: 2
			}
		],
		flashcards: [
			{
				id: "f1",
				term: `Key term from ${body.setName}`,
				definition: "Concise definition grounded in the uploaded material."
			},
			{
				id: "f2",
				term: "Primary concept",
				definition: "The central idea this chapter or lecture is built around."
			},
			{
				id: "f3",
				term: "Supporting vocabulary",
				definition: "A related term students often need for quizzes and essays."
			},
			{
				id: "f4",
				term: "Application idea",
				definition: "How this concept connects to earlier or later material."
			},
			{
				id: "f5",
				term: "Common misconception",
				definition: "What students often get wrong — and the accurate alternative."
			}
		]
	};
}
var generateStudyPackage_createServerFn_handler = createServerRpc({
	id: "999e8d529732bcb6be834c345f36be2df13dff7c69b5a5e7b943483b58d6db70",
	name: "generateStudyPackage",
	filename: "src/lib/ai.ts"
}, (opts) => generateStudyPackage.__executeServer(opts));
var generateStudyPackage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(generateStudyPackage_createServerFn_handler, async ({ data }) => {
	const { system, user } = buildGenerationPrompt({
		className: data.className || "Course",
		classCode: data.classCode || "",
		subject: data.subject || "General",
		setName: data.setName.trim(),
		sourceFiles: data.sourceFiles || [],
		extractedText: data.extractedText,
		focusPrompt: data.focusPrompt
	});
	const key = apiKey();
	if (!key) return mockPackage(data);
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .35,
			max_tokens: 12e3,
			messages: [{
				role: "system",
				content: system
			}, {
				role: "user",
				content: user
			}]
		})
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Generation failed (${res.status}): ${err.slice(0, 240)}`);
	}
	const content = (await res.json()).choices?.[0]?.message?.content;
	if (!content) throw new Error("Empty response from Grok");
	return parseJsonContent(content);
});
var parseClassCalendar_createServerFn_handler = createServerRpc({
	id: "156fd2f967842b9be506f41212b0aac5fcd4b8413af7003e29f32863104e21c0",
	name: "parseClassCalendar",
	filename: "src/lib/ai.ts"
}, (opts) => parseClassCalendar.__executeServer(opts));
var parseClassCalendar = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(parseClassCalendar_createServerFn_handler, async ({ data }) => {
	const source = [data.syllabusText || "", data.notesText || ""].join("\n");
	const local = parseSyllabusLocally(source);
	const key = apiKey();
	if (!key || !source.trim()) return local;
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${key}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: .1,
				max_tokens: 2e3,
				messages: [{
					role: "system",
					content: "Extract upcoming class work from syllabus/notes. Return JSON only: {\"alerts\":[{\"id\":\"a1\",\"kind\":\"due-soon|exam|reading|policy\",\"message\":\"...\"}],\"upcoming\":[{\"id\":\"u1\",\"type\":\"assignment|exam|quiz|reading|other\",\"title\":\"...\",\"date\":\"YYYY-MM-DD\"}]}"
				}, {
					role: "user",
					content: `Class: ${data.className}\nSemester: ${data.semester || ""}\n\n${source.slice(0, 12e3)}`
				}]
			})
		});
		if (!res.ok) return local;
		let cleaned = (await res.json()).choices?.[0]?.message?.content?.trim() || "";
		if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
		const parsed = JSON.parse(cleaned);
		return {
			alerts: parsed.alerts?.length ? parsed.alerts : local.alerts,
			upcoming: parsed.upcoming?.length ? parsed.upcoming : local.upcoming
		};
	} catch {
		return local;
	}
});
var lookupProfessor_createServerFn_handler = createServerRpc({
	id: "d10ccbbdf10288b30be6878e601650705f2b6897a8e0323e31ec6331a1e50654",
	name: "lookupProfessor",
	filename: "src/lib/ai.ts"
}, (opts) => lookupProfessor.__executeServer(opts));
var lookupProfessor = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(lookupProfessor_createServerFn_handler, async ({ data }) => {
	const key = apiKey();
	if (!key) return { summary: "AI lookup is unavailable in this environment. Add a short note yourself, or try again after publishing." };
	const { system, user } = buildProfessorInsightPrompt(data);
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .2,
			max_tokens: 1200,
			messages: [{
				role: "system",
				content: system
			}, {
				role: "user",
				content: user
			}]
		})
	});
	if (!res.ok) {
		const err = await res.text();
		return { summary: `Could not look up this professor (${res.status}): ${err.slice(0, 160)}` };
	}
	let cleaned = (await res.json()).choices?.[0]?.message?.content?.trim() || "";
	if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
	try {
		const parsed = JSON.parse(cleaned);
		return { summary: [
			parsed.summary,
			parsed.teachingStyle && parsed.teachingStyle !== "unknown" ? `Style: ${parsed.teachingStyle}` : "",
			parsed.difficulty && parsed.difficulty !== "unknown" ? `Difficulty: ${parsed.difficulty}` : "",
			Array.isArray(parsed.tips) && parsed.tips.length ? "Tips: " + parsed.tips.join(" ") : "",
			Array.isArray(parsed.sources) && parsed.sources.length ? "Sources: " + parsed.sources.join("; ") : ""
		].filter(Boolean).join(" ") };
	} catch {
		return { summary: cleaned.slice(0, 800) };
	}
});
var speakLecture_createServerFn_handler = createServerRpc({
	id: "799356f9501dee9fbf19d11ed97dbeec2806105f6dd0e34f88bd90e237fc7cfd",
	name: "speakLecture",
	filename: "src/lib/ai.ts"
}, (opts) => speakLecture.__executeServer(opts));
var speakLecture = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(speakLecture_createServerFn_handler, async ({ data }) => {
	const key = apiKey();
	if (!key) return {
		ok: false,
		error: "Audio generation needs the xAI key. You can still read the lecture script."
	};
	const input = data.text.slice(0, 14e3);
	const requested = (data.voice || "eve").toLowerCase();
	const voice = [
		"eve",
		"ara",
		"rex",
		"sal",
		"leo"
	].includes(requested) ? requested : "eve";
	const res = await fetch("https://api.x.ai/v1/tts", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			text: input,
			voice_id: voice,
			language: "en",
			output_format: {
				codec: "mp3",
				sample_rate: 24e3,
				bit_rate: 128e3
			}
		})
	});
	if (!res.ok) {
		const err = await res.text();
		return {
			ok: false,
			error: `TTS failed (${res.status}): ${err.slice(0, 200)}`
		};
	}
	return {
		ok: true,
		mime: "audio/mpeg",
		audioBase64: Buffer.from(await res.arrayBuffer()).toString("base64")
	};
});
//#endregion
export { extractMaterials_createServerFn_handler, generateStudyPackage_createServerFn_handler, lookupProfessor_createServerFn_handler, parseClassCalendar_createServerFn_handler, speakLecture_createServerFn_handler };
