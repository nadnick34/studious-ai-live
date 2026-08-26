import type { MeetingCategory } from "@/lib/types";

export function buildMeetingPackagePrompt(input: {
  meetingName: string;
  category: MeetingCategory;
  organizer: string;
  meetingType: string;
  subject: string;
  companyName: string;
  location: string;
  meetingAt: string | null;
  attendees: string;
  agendaText: string;
  miscNotes: string;
  extractedText: string;
  sourceFiles: string[];
}) {
  const categoryGuidance: Record<string, string> = {
    "Regular Work": "Emphasize decisions, owners, deadlines, and open questions.",
    Conference: "Emphasize themes, notable speakers, takeaways, and networking follow-ups.",
    Education: "Emphasize learning objectives, concepts taught, and practice or application steps.",
    "Legal/Compliance": "Emphasize obligations, risks, deadlines, responsible parties, and documentation needs. Stay factual; do not invent legal conclusions.",
    Vendor: "Emphasize commercial terms, deliverables, pricing signals, risks, and next negotiation steps.",
    Interview: "Emphasize candidate strengths/gaps, role fit signals, and interviewer follow-ups. Stay professional and non-discriminatory.",
    "Human Resources": "Emphasize policy, people process, confidentiality-aware notes, and required HR actions.",
    IT: "Emphasize systems, incidents, owners, technical decisions, and implementation steps.",
  };

  const system = `You are Studious AI Professional meeting analyst.
Produce structured meeting intelligence for knowledge workers.
Be accurate to the uploaded materials. Do not invent attendees, decisions, or quotes.
When speakers are identifiable, attribute points to them.
Use tables in notes when comparisons, owners, timelines, or inventories help.
Tone: clear, executive, charcoal-professional — no academic quiz content.

Category focus for this meeting (${input.category}):
${categoryGuidance[input.category] || categoryGuidance["Regular Work"]}

Return ONLY valid JSON. No markdown fences.`;

  const user = `MEETING METADATA
Name: ${input.meetingName}
Category: ${input.category}
Organizer: ${input.organizer}
Type: ${input.meetingType}
Subject: ${input.subject}
Company: ${input.companyName}
Location: ${input.location}
When: ${input.meetingAt || "not specified"}
Attendees: ${input.attendees || "not specified"}
Agenda:
${input.agendaText || "(none)"}
Misc notes:
${input.miscNotes || "(none)"}
Source files: ${(input.sourceFiles || []).join(", ") || "(none)"}

UPLOADED / CAPTURED MATERIAL (authority):
---
${(input.extractedText || "").slice(0, 60000)}
---

Return JSON:
{
  "notes": {
    "title": "string",
    "subtitle": "string",
    "sections": [
      {
        "heading": "string",
        "bullets": ["..."],
        "body": "optional short prose",
        "layout": "stack|two-column|table",
        "columns": [{ "title": "string", "bullets": ["..."] }],
        "table": { "headers": ["..."], "rows": [["..."]] }
      }
    ],
    "speakers": [{ "name": "string", "points": ["what they said or committed to"] }]
  },
  "focusItems": [
    { "id": "f1", "phrase": "key phrase or takeaway", "why": "why it matters" }
  ],
  "actionItems": [
    { "id": "a1", "action": "specific next step", "owner": "who", "dueHint": "optional timing", "audience": "who needs to know" }
  ],
  "audioScript": "5–12 minute narrative read-aloud: meeting story, key decisions, attributed remarks when known, focus items, and action items with owners. Professional spoken English."
}`;

  return { system, user };
}

export function buildInviteParsePrompt(text: string) {
  const system = `Extract meeting fields from an email or calendar invite. Return ONLY JSON. Use empty string when unknown.
Fields: name, category (one of Regular Work|Conference|Education|Legal/Compliance|Vendor|Interview|Human Resources|IT), organizer, meetingType (In-Person|Teams|Zoom|Google Meet|Other Remote), subject, companyName, location, meetingAt (ISO if possible), attendees (comma-separated names/emails), agendaText, miscNotes.`;
  const user = `INVITE / EMAIL TEXT:\n---\n${text.slice(0, 20000)}\n---`;
  return { system, user };
}
