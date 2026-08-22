import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { buildGenerationPrompt, buildProfessorInsightPrompt } from "@/lib/prompts";
import { parseSyllabusLocally } from "@/lib/calendar";
import { normalizeSlides } from "@/lib/slides";
import { uid } from "@/lib/utils";
import type { Attachment, FilePayload, GeneratedPackage, Slide } from "@/lib/types";

function apiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
}

function kindFromName(name: string, type: string): Attachment["kind"] {
  const lower = name.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(lower)) return "image";
  if (type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(lower)) return "text";
  if (type.startsWith("audio/") || /\.(mp3|m4a|wav|aac)$/i.test(lower)) return "audio";
  return "other";
}

function decodeBase64(b64: string) {
  return Buffer.from(b64, "base64");
}

async function extractPdf(buf: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const result = await extractText(pdf, { mergePages: true });
  const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  return (text || "").toString();
}

async function transcribeAudio(name: string, mime: string, buf: Buffer): Promise<string> {
  const key = apiKey();
  if (!key) {
    return `[Audio uploaded: ${name}. Add GROK_API_KEY / XAI_API_KEY so Studious can transcribe lectures.]`;
  }
  const form = new FormData();
  form.append("language", "en");
  form.append("file", new Blob([new Uint8Array(buf)], { type: mime || "audio/mp4" }), name);
  const res = await fetch("https://api.x.ai/v1/stt", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    return `[Could not transcribe ${name} (${res.status}): ${err.slice(0, 220)}]`;
  }
  const data = (await res.json()) as { text?: string };
  const transcript = (data.text || "").trim();
  if (!transcript) return `[Audio ${name} was uploaded but the transcript came back empty.]`;
  return `LECTURE TRANSCRIPT from ${name}:\n${transcript}`;
}

async function visionOcr(name: string, mime: string, base64: string): Promise<string> {
  const key = apiKey();
  if (!key) {
    return `[Image uploaded: ${name}. Filename recorded. Enable AI to read text from photos and scans.]`;
  }
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.1,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL readable text from this photo/scan of class materials named "${name}". Preserve headings, lists, tables, and labels. If handwriting is present, transcribe it as best you can. Return plain text only.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return `[Could not read image ${name}: ${err.slice(0, 180)}]`;
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() || `[No text found in ${name}]`;
}

async function processFile(file: FilePayload): Promise<{ heading: string; text: string; attachment: Attachment }> {
  const name = file.name || "upload";
  const type = file.type || "application/octet-stream";
  const kind = kindFromName(name, type);
  const buf = decodeBase64(file.base64);
  let text = "";

  if (kind === "text") {
    text = buf.toString("utf8");
  } else if (kind === "pdf") {
    try {
      text = await extractPdf(buf);
      if (!text.trim()) {
        text = `[PDF had little extractable text. It may be a scan. Treat the filename as context.]`;
      }
    } catch (err) {
      text = `[Could not parse PDF: ${err instanceof Error ? err.message : "parse error"}]`;
    }
  } else if (kind === "image") {
    text = await visionOcr(name, type || "image/jpeg", file.base64);
  } else if (kind === "audio") {
    text = await transcribeAudio(name, type || "audio/mp4", buf);
  } else {
    text = `[File recorded: ${name}, ${Math.round(buf.length / 1024)} KB.]`;
  }

  const heading = `\n\n===== SOURCE: ${name} =====\n${text}`;
  const attachment: Attachment = {
    id: uid("a"),
    name,
    kind,
    size: file.size || buf.length,
    addedAt: new Date().toISOString(),
    extractedText: text.slice(0, 80000),
    dataUrl: kind === "image" && file.base64.length < 900_000 ? `data:${type};base64,${file.base64}` : undefined,
  };
  return { heading, text, attachment };
}

export const extractMaterials = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { files: FilePayload[] }) => input)
  .handler(async ({ data }) => {
    const parts: string[] = [];
    const attachments: Attachment[] = [];
    for (const file of data.files.slice(0, 12)) {
      const processed = await processFile(file);
      parts.push(processed.heading);
      attachments.push(processed.attachment);
    }
    return {
      text: parts.join("\n").trim(),
      attachments,
      fileCount: attachments.length,
    };
  });

function extractJsonObject(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

function ensurePackage(parsed: GeneratedPackage): GeneratedPackage {
  if (!parsed.notes || !parsed.audioScript || !Array.isArray(parsed.quiz)) {
    throw new Error("Model response missing required fields");
  }
  if (!Array.isArray(parsed.flashcards)) parsed.flashcards = [];
  parsed.slides = normalizeSlides(parsed.slides as Slide[] | undefined, parsed.notes);
  parsed.quiz = parsed.quiz.map((q, i) => ({
    id: q.id || `q${i + 1}`,
    question: q.question,
    options: Array.isArray(q.options) ? q.options : [],
    correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
    explanation: q.explanation,
  }));
  return parsed;
}

function parseJsonContent(content: string): GeneratedPackage {
  const parsed = JSON.parse(extractJsonObject(content)) as GeneratedPackage;
  return ensurePackage(parsed);
}

function mockPackage(body: {
  className: string;
  classCode: string;
  subject: string;
  setName: string;
  sourceFiles: string[];
}): GeneratedPackage {
  const title = `${body.classCode || body.className} – ${body.setName}`;
  const notes = {
    title,
    subtitle: `Generated by Studious AI · ${body.subject || "General"}`,
    sections: [
      {
        heading: "Key Concepts",
        body: "Core ideas from this set, organized for quick review.",
        layout: "stack" as const,
        bullets: [
          `Central theme of “${body.setName}” and why it matters`,
          "Supporting idea with a concrete example from the materials",
          "How this unit connects to prior and upcoming topics",
          "Exam-relevant distinction students often miss",
        ],
        reference: body.sourceFiles?.[0] || "Uploaded materials",
      },
      {
        heading: "Definitions at a Glance",
        layout: "table" as const,
        table: {
          headers: ["Term", "Definition", "Why it matters"],
          rows: [
            ["Key term A", "Precise definition from the material", "Appears in quizzes and essays"],
            ["Key term B", "Precise definition from the material", "Links to the next chapter"],
            ["Key term C", "Precise definition from the material", "Common FRQ / short-answer target"],
          ],
        },
      },
      {
        heading: "Compare & Connect",
        layout: "two-column" as const,
        columns: [
          {
            title: "What to know",
            bullets: ["Primary facts and processes", "Must-memorize relationships", "Standard examples from lecture"],
          },
          {
            title: "Watch-outs",
            bullets: ["Common misconceptions", "Terms that sound similar but differ", "Where students lose points"],
          },
        ],
      },
      {
        heading: "Application & Mastery Checks",
        layout: "stack" as const,
        bullets: [
          "Explain the main idea out loud in one minute",
          "Teach one definition to a peer without notes",
          "Write one exam-style question and answer it",
        ],
      },
    ],
    otherResources: [
      { title: "Khan Academy – related topic overview" },
      { title: "OpenStax chapter for deeper reading" },
    ],
  };
  return ensurePackage({
    notes,
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
          "An unrelated idea",
        ],
        correctIndex: 1,
        explanation: "The second option reflects the main idea present in the uploaded material.",
      },
      {
        id: "q2",
        question: "Based on the material, which definition is most accurate?",
        options: ["Incorrect definition", "Another incorrect definition", "The accurate definition", "A vague definition"],
        correctIndex: 2,
      },
      {
        id: "q3",
        question: "How does this material most likely connect to earlier topics?",
        options: [
          "It replaces earlier topics completely",
          "It has no relationship to previous chapters",
          "It builds on foundational concepts introduced earlier",
          "It only matters for the final exam",
        ],
        correctIndex: 2,
      },
      {
        id: "q4",
        question: "What is the best next step after reviewing these notes?",
        options: [
          "Move on without testing yourself",
          "Memorize every bullet word-for-word",
          "Take the quiz and revisit any missed ideas",
          "Ignore the audio lecture",
        ],
        correctIndex: 2,
      },
    ],
    flashcards: [
      { id: "f1", term: `Key term from ${body.setName}`, definition: "Concise definition grounded in the uploaded material." },
      { id: "f2", term: "Primary concept", definition: "The central idea this chapter or lecture is built around." },
      { id: "f3", term: "Supporting vocabulary", definition: "A related term students often need for quizzes and essays." },
      { id: "f4", term: "Application idea", definition: "How this concept connects to earlier or later material." },
      { id: "f5", term: "Common misconception", definition: "What students often get wrong — and the accurate alternative." },
    ],
    slides: [],
  });
}

export const generateStudyPackage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      className: string;
      classCode: string;
      subject: string;
      setName: string;
      sourceFiles: string[];
      extractedText?: string;
      focusPrompt?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { system, user } = buildGenerationPrompt({
      className: data.className || "Course",
      classCode: data.classCode || "",
      subject: data.subject || "General",
      setName: data.setName.trim(),
      sourceFiles: data.sourceFiles || [],
      extractedText: data.extractedText,
      focusPrompt: data.focusPrompt,
    });

    const key = apiKey();
    if (!key) return mockPackage(data);

    let lastError = "Generation failed";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: attempt === 0 ? 0.35 : 0.1,
          max_tokens: 12000,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        lastError = `Generation failed (${res.status}): ${err.slice(0, 240)}`;
        continue;
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = body.choices?.[0]?.message?.content;
      if (!content) {
        lastError = "Empty response from Grok";
        continue;
      }
      try {
        return parseJsonContent(content);
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Could not parse study package";
      }
    }
    throw new Error(lastError);
  });

export const parseClassCalendar = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { className: string; semester?: string; syllabusText: string; notesText?: string }) => input)
  .handler(async ({ data }) => {
    const source = [data.syllabusText || "", data.notesText || ""].join("\n");
    const local = parseSyllabusLocally(source);
    const key = apiKey();
    if (!key || !source.trim()) return local;

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.1,
          max_tokens: 2000,
          messages: [
            {
              role: "system",
              content:
                'Extract upcoming class work from syllabus/notes. Return JSON only: {"alerts":[{"id":"a1","kind":"due-soon|exam|reading|policy","message":"..."}],"upcoming":[{"id":"u1","type":"assignment|exam|quiz|reading|other","title":"...","date":"YYYY-MM-DD"}]}',
            },
            {
              role: "user",
              content: `Class: ${data.className}\nSemester: ${data.semester || ""}\n\n${source.slice(0, 12000)}`,
            },
          ],
        }),
      });
      if (!res.ok) return local;
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      let cleaned = body.choices?.[0]?.message?.content?.trim() || "";
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(cleaned) as typeof local;
      return {
        alerts: parsed.alerts?.length ? parsed.alerts : local.alerts,
        upcoming: parsed.upcoming?.length ? parsed.upcoming : local.upcoming,
      };
    } catch {
      return local;
    }
  });

export const lookupProfessor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { professorName: string; schoolName?: string; subject?: string; courseCode?: string }) => input)
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) {
      return {
        summary: "AI lookup is unavailable in this environment. Add a short note yourself, or try again after publishing.",
      };
    }
    const { system, user } = buildProfessorInsightPrompt(data);
    const payload = {
      model: "grok-4.5",
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };
    let res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ ...payload, search_parameters: { mode: "on" } }),
    });
    if (!res.ok) {
      res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) {
      const err = await res.text();
      return { summary: `Could not look up this professor (${res.status}): ${err.slice(0, 160)}` };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let cleaned = body.choices?.[0]?.message?.content?.trim() || "";
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    try {
      const parsed = JSON.parse(cleaned) as {
        summary?: string;
        teachingStyle?: string;
        difficulty?: string;
        tips?: string[];
        sources?: string[];
      };
      const parts = [
        parsed.summary,
        parsed.teachingStyle && parsed.teachingStyle !== "unknown" ? `Style: ${parsed.teachingStyle}` : "",
        parsed.difficulty && parsed.difficulty !== "unknown" ? `Difficulty: ${parsed.difficulty}` : "",
        Array.isArray(parsed.tips) && parsed.tips.length ? "Tips: " + parsed.tips.join(" ") : "",
        Array.isArray(parsed.sources) && parsed.sources.length ? "Sources: " + parsed.sources.join("; ") : "",
      ].filter(Boolean);
      return { summary: parts.join(" ") };
    } catch {
      return { summary: cleaned.slice(0, 800) };
    }
  });

export const speakLecture = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { text: string; voice?: string }) => input)
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) {
      return { ok: false as const, error: "Audio generation needs the xAI key. You can still read the lecture script." };
    }
    const input = data.text.slice(0, 14000);
    const requested = (data.voice || "eve").toLowerCase();
    const voice = ["eve", "ara", "rex", "sal", "leo"].includes(requested) ? requested : "eve";
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input,
        voice_id: voice,
        language: "en",
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 128000 },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false as const, error: `TTS failed (${res.status}): ${err.slice(0, 200)}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true as const, mime: "audio/mpeg", audioBase64: buf.toString("base64") };
  });
