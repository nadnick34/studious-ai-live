import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { buildClassicalPrompt } from "@/lib/classical-prompts";
import { buildGenerationPrompt, buildProfessorInsightPrompt } from "@/lib/prompts";
import { parseSyllabusLocally } from "@/lib/calendar";
import { normalizeSlides } from "@/lib/slides";
import { uid } from "@/lib/utils";
import type { Attachment, ClassicalPackage, FilePayload, GeneratedPackage, Slide, SpatialStory, SpatialPanel } from "@/lib/types";

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

async function sttOnce(key: string, buf: Buffer, filename: string, mime: string) {
  const form = new FormData();
  form.append("language", "en");
  form.append("format", "true");
  form.append("file", new File([new Uint8Array(buf)], filename, { type: mime }));
  return fetch("https://api.x.ai/v1/stt", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
}

async function transcribeAudio(name: string, mime: string, buf: Buffer): Promise<string> {
  const key = apiKey();
  if (!key) {
    return `[Audio uploaded: ${name}. Add GROK_API_KEY / XAI_API_KEY so Studious can transcribe lectures.]`;
  }
  const attempts = [
    { filename: name.replace(/\s+/g, "_"), mime: mime || "audio/mp4" },
    { filename: "lecture.mp4", mime: "audio/mp4" },
    { filename: "lecture.m4a", mime: "audio/mp4" },
    { filename: "lecture.aac", mime: "audio/aac" },
  ];
  let lastErr = "";
  for (const attempt of attempts) {
    const res = await sttOnce(key, buf, attempt.filename, attempt.mime);
    if (res.ok) {
      const data = (await res.json()) as { text?: string };
      const transcript = (data.text || "").trim();
      if (transcript) return `LECTURE TRANSCRIPT from ${name}:\n${transcript}`;
      lastErr = "empty transcript";
      continue;
    }
    lastErr = `${res.status} ${((await res.text()) || "").slice(0, 180)}`;
  }
  return `[Could not transcribe ${name}: ${lastErr}]`;
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

export const transcribeAudioChunk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: FilePayload) => input)
  .handler(async ({ data }) => {
    const buf = decodeBase64(data.base64);
    const raw = await transcribeAudio(data.name || "chunk.wav", data.type || "audio/wav", buf);
    return raw.replace(/^LECTURE TRANSCRIPT from .+:\n/i, "").trim();
  });

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

async function generateCartoonImage(prompt: string): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: prompt.slice(0, 2000),
      n: 1,
      aspect_ratio: "1:1",
    }),
  });
  if (!res.ok) {
    console.error("image gen failed", res.status, await res.text());
    return null;
  }
  const body = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
  const first = body.data?.[0];
  if (first?.url) return first.url;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return null;
}

function normalizeSpatialStory(raw: unknown): SpatialStory | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return {
      title: "Picture story",
      panels: raw as SpatialPanel[],
      questions: [],
    };
  }
  const s = raw as SpatialStory;
  return {
    title: s.title || "Picture story",
    panels: Array.isArray(s.panels) ? s.panels : [],
    questions: Array.isArray(s.questions) ? s.questions.slice(0, 3) : [],
    videoUrl: s.videoUrl,
  };
}

async function enrichSpatialImages(story: SpatialStory, gender?: string | null): Promise<SpatialStory> {
  const isGirl = gender === "girl";
  const owlName = isGirl ? "Hootie" : "Professor Hoot";
  const owlDesc = isGirl
    ? "Hootie, a cute friendly cartoon girl owl with a large bright pink bow on her head (female character; refer to her as she)"
    : "Professor Hoot, a cute friendly cartoon boy owl with blue round glasses and a blue bowtie (male character; refer to him as he)";
  const panels: SpatialPanel[] = [];
  for (const panel of story.panels.slice(0, 6)) {
    if (panel.imageUrl) {
      panels.push(panel);
      continue;
    }
    const scene = (panel.visualDescription || panel.caption || panel.title || "")
      .replace(/\bOliver\s+Owl\b/gi, owlName)
      .replace(/\bOliver\b/gi, owlName);
    const prompt = [
      "Wholesome traditional children's educational comic book panel, bright clean cartoon style.",
      `Main character is ONLY ${owlDesc}. Do not invent another owl name such as Oliver.`,
      `Show ${owlName} clearly as the teacher guide in the scene.`,
      scene,
      "STRICT VISUAL RULES: no nametags, no name badges, no pronoun pins, no pronoun stickers, no written words of any kind on clothing or props, no logos, no political symbols.",
      "Family-friendly, traditional, pure illustration only.",
    ].join(" ");
    const imageUrl = await generateCartoonImage(prompt);
    panels.push({ ...panel, imageUrl: imageUrl || undefined });
  }
  for (const panel of story.panels.slice(6)) panels.push(panel);
  return { ...story, panels };
}


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
      kidsMode?: boolean;
      childAge?: number | null;
      childGender?: string | null;
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
      kidsMode: data.kidsMode,
      childAge: data.childAge,
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
        const pkg = parseJsonContent(content);
        if (data.kidsMode) {
          const story = normalizeSpatialStory(pkg.notes?.spatialLearning);
          if (story && story.panels.length) {
            // Draw cartoons after notes; gender comes from request when provided
            const enriched = await enrichSpatialImages(story, data.childGender ?? null);
            pkg.notes = { ...pkg.notes, spatialLearning: enriched };
          }
        }
        return pkg;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Could not parse study package";
      }
    }
    throw new Error(lastError);
  });

function normalizeClassical(raw: Partial<ClassicalPackage> | null | undefined): ClassicalPackage {
  const c = raw || {};
  return {
    generatedAt: new Date().toISOString(),
    conspectus: {
      memoryWork: c.conspectus?.memoryWork || [],
      outline: c.conspectus?.outline || [],
      logicQuestions: c.conspectus?.logicQuestions || [],
      fiveCommonTopics: {
        definition: c.conspectus?.fiveCommonTopics?.definition || "",
        comparison: c.conspectus?.fiveCommonTopics?.comparison || "",
        circumstance: c.conspectus?.fiveCommonTopics?.circumstance || "",
        relationship: c.conspectus?.fiveCommonTopics?.relationship || "",
        testimony: c.conspectus?.fiveCommonTopics?.testimony || "",
      },
      tellBackPrompts: c.conspectus?.tellBackPrompts || [],
      lociMap: c.conspectus?.lociMap || [],
    },
    orator: {
      recitationScript: c.orator?.recitationScript || "",
      narrationScript: c.orator?.narrationScript || "",
    },
    socraticCards: (c.socraticCards || []).map((card, i) => ({
      id: card.id || `c${i + 1}`,
      type: card.type || "recite",
      front: card.front || "",
      back: card.back || "",
      locus: card.locus,
    })),
    commonplace: (c.commonplace || []).map((item, i) => ({
      id: item.id || `cp${i + 1}`,
      text: item.text || "",
      kind: item.kind || "sentence",
    })),
    recitationQueue: (c.recitationQueue || []).map((item, i) => ({
      id: item.id || `r${i + 1}`,
      text: item.text || "",
      kind: item.kind || "sentence",
    })),
    fromMemoryOutline: c.fromMemoryOutline || [],
  };
}

export const generateClassicalPackage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      className: string;
      classCode: string;
      subject: string;
      setName: string;
      sourceText: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { system, user } = buildClassicalPrompt({
      className: data.className || "Course",
      classCode: data.classCode || "",
      subject: data.subject || "General",
      setName: data.setName.trim(),
      sourceText: data.sourceText || "",
    });
    const key = apiKey();
    if (!key) {
      return normalizeClassical({
        conspectus: {
          memoryWork: [`Key definition from ${data.setName}`, "Core list item 1", "Core list item 2"],
          outline: [{ heading: data.setName, bullets: ["Main claim", "Supporting points", "Why it matters"] }],
          logicQuestions: [
            "Why does this follow from earlier material?",
            "How does X relate to Y?",
            "What would change if the cause were removed?",
          ],
          fiveCommonTopics: {
            definition: "Working definition from the chapter material.",
            comparison: "How this is like and unlike related ideas.",
            circumstance: "Context in which this appears.",
            relationship: "Cause, effect, or part-whole links.",
            testimony: "Evidence or authority cited in the material.",
          },
          tellBackPrompts: [
            `Retell the process or argument of ${data.setName} in order.`,
            "Explain why the main claim follows from the evidence.",
          ],
          lociMap: [
            { locus: "Front door", item: "Opening definition" },
            { locus: "Kitchen table", item: "Core process" },
          ],
        },
        orator: {
          recitationScript: `Speak slowly. Recite the key terms and lists for ${data.setName}.`,
          narrationScript: `Tell the story of ${data.setName}, including why each major step matters.`,
        },
        socraticCards: [
          { id: "c1", type: "recite", front: "Recite the core definition.", back: "Model definition from the material." },
          { id: "c2", type: "explain", front: "Explain the main idea in your own words.", back: "Clear paraphrase." },
          { id: "c3", type: "dialectic", front: "Why does this follow?", back: "Because of the prior claim in the material." },
        ],
        commonplace: [{ id: "cp1", text: "A striking sentence from the material.", kind: "sentence" }],
        recitationQueue: [{ id: "r1", text: "Core definition to say aloud.", kind: "definition" }],
        fromMemoryOutline: [{ heading: data.setName, blankBullets: 4 }],
      });
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.3,
        max_tokens: 10000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Classical generation failed (${res.status}): ${err.slice(0, 240)}`);
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty classical response");
    const parsed = JSON.parse(extractJsonObject(content)) as Partial<ClassicalPackage>;
    return normalizeClassical(parsed);
  });

export const parseClassCalendar = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
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

export const scoreClassicalWork = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      mode: "tellback" | "outline";
      chapterName: string;
      sourceSummary: string;
      studentText: string;
      prompts?: string[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) {
      return {
        score: 0,
        summary: "Scoring needs the xAI API key.",
        strengths: [] as string[],
        missing: [] as string[],
        whyPresent: false,
      };
    }
    const system =
      data.mode === "tellback"
        ? `You score a classical narration (tell-back). Judge sequence, completeness, and whether the WHY appears. Return ONLY JSON: {"score":0-100,"summary":"2-3 sentences","strengths":["..."],"missing":["..."],"whyPresent":true|false}`
        : `You score a from-memory outline against the source. Judge structure and coverage. Return ONLY JSON: {"score":0-100,"summary":"2-3 sentences","strengths":["..."],"missing":["..."],"whyPresent":false}`;
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Chapter: ${data.chapterName}\nPrompts: ${(data.prompts || []).join(" | ")}\n\nSOURCE:\n${data.sourceSummary.slice(0, 12000)}\n\nSTUDENT RESPONSE:\n${data.studentText.slice(0, 8000)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Scoring failed (${res.status}): ${err.slice(0, 180)}`);
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(extractJsonObject(content)) as {
        score?: number;
        summary?: string;
        strengths?: string[];
        missing?: string[];
        whyPresent?: boolean;
      };
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
        summary: parsed.summary || "",
        strengths: parsed.strengths || [],
        missing: parsed.missing || [],
        whyPresent: Boolean(parsed.whyPresent),
      };
    } catch {
      return { score: 0, summary: content.slice(0, 400), strengths: [], missing: [], whyPresent: false };
    }
  });


export const generateSpatialImages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { story: SpatialStory; childGender?: string | null }) => input)
  .handler(async ({ data }) => {
    const story = normalizeSpatialStory(data.story);
    if (!story) return { ok: false as const, error: "No story to illustrate" };
    if (!apiKey()) return { ok: false as const, error: "xAI API key required to generate cartoons" };
    const enriched = await enrichSpatialImages(story, data.childGender);
    return { ok: true as const, story: enriched };
  });

export const generateSpatialVideo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { story: SpatialStory; childGender?: string | null }) => input)
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "xAI API key required for story video" };
    const story = normalizeSpatialStory(data.story);
    if (!story || !story.panels.length) return { ok: false as const, error: "No story panels" };

    const isGirl = data.childGender === "girl";
    const owlName = isGirl ? "Hootie" : "Professor Hoot";
    const owl = isGirl
      ? "Hootie, a cute girl owl with a large pink bow (she)"
      : "Professor Hoot, a cute boy owl with glasses and a blue bowtie (he)";
    const panelSummary = story.panels
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.title}: ${p.caption || p.owlSays || p.visualDescription}`)
      .join(" ");
    const prompt = [
      `Wholesome traditional children's educational short cartoon video about "${story.title}".`,
      `The only mascot is ${owl}. Never name the owl Oliver. Use ${owlName} only.`,
      "No nametags, no pronoun pins, no text on screen.",
      "Bright clean cartoon animation, family-friendly, traditional.",
      "Story beats:",
      panelSummary,
    ].join(" ");

    // Prefer image-to-video if first panel has an image
    const firstImage = story.panels.find((p) => p.imageUrl)?.imageUrl;
    const body: Record<string, unknown> = {
      model: "grok-imagine-video",
      prompt: prompt.slice(0, 2500),
      duration: 8,
    };
    if (firstImage && firstImage.startsWith("http")) {
      body.image = { url: firstImage };
    }

    const start = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!start.ok) {
      const err = await start.text();
      return { ok: false as const, error: `Video start failed (${start.status}): ${err.slice(0, 240)}` };
    }
    const startJson = (await start.json()) as { request_id?: string; id?: string };
    const requestId = startJson.request_id || startJson.id;
    if (!requestId) return { ok: false as const, error: "No video request id returned" };

    for (let i = 0; i < 36; i += 1) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!poll.ok) continue;
      const status = (await poll.json()) as {
        status?: string;
        video?: { url?: string };
        url?: string;
      };
      if (status.status === "done" || status.status === "completed") {
        const url = status.video?.url || status.url;
        if (url) return { ok: true as const, videoUrl: url };
        return { ok: false as const, error: "Video done but no URL" };
      }
      if (status.status === "failed" || status.status === "expired") {
        return { ok: false as const, error: `Video ${status.status}` };
      }
    }
    return { ok: false as const, error: "Video generation timed out — try again" };
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
