export function buildClassicalPrompt(input: {
  className: string;
  classCode: string;
  subject: string;
  setName: string;
  sourceText: string;
}) {
  const { className, classCode, subject, setName, sourceText } = input;

  const system = `You are Studious AI Classical Mode. Transform chapter study material into a classical Trivium package.

Authority: use ONLY the uploaded/generated chapter material provided. Do not invent a different unit. Prefer the instructor's wording for definitions and memory work.

Return ONLY valid JSON. No markdown fences.

JSON shape:
{
  "conspectus": {
    "memoryWork": ["short recitation items — definitions, lists, exact phrases worth saying aloud"],
    "outline": [{ "heading": "string", "bullets": ["clean outline points"] }],
    "logicQuestions": ["5-8 why/how/relationship questions"],
    "fiveCommonTopics": {
      "definition": "what it is, from the material",
      "comparison": "like/unlike from the material",
      "circumstance": "when/where/context from the material",
      "relationship": "cause, effect, part/whole from the material",
      "testimony": "who said / authority / evidence from the material"
    },
    "tellBackPrompts": ["2-4 narration prompts such as Retell the process… / Explain why X follows Y…"],
    "lociMap": [{ "locus": "vivid place on a familiar route", "item": "what is stored there" }]
  },
  "orator": {
    "recitationScript": "Grammar layer spoken slowly and precisely — lists, definitions, exact wording. Continuous spoken prose.",
    "narrationScript": "The unit as story/argument including the WHY, not only facts. Continuous spoken prose."
  },
  "socraticCards": [
    {
      "id": "c1",
      "type": "recite" | "explain" | "dialectic" | "locus",
      "front": "prompt",
      "back": "model answer",
      "locus": "optional for type locus"
    }
  ],
  "commonplace": [
    { "id": "cp1", "text": "striking sentence, definition, or connection", "kind": "sentence" | "definition" | "connection" }
  ],
  "recitationQueue": [
    { "id": "r1", "text": "grammar-layer item to say aloud", "kind": "list" | "definition" | "sentence" }
  ],
  "fromMemoryOutline": [
    { "heading": "section title", "blankBullets": 3 }
  ]
}

Rules:
- memoryWork: 6–12 short items
- outline: 3–7 sections
- logicQuestions: 5–8
- lociMap: 8–12 if material supports it; otherwise fewer
- socraticCards: 12–20 mixed types (recite, explain, dialectic; locus optional)
- commonplace: 8–15 extracts
- recitationQueue: 8–15 items
- orator scripts: no HOST:/TUTOR: labels; clear prose
- fiveCommonTopics: fill from material; if thin, write a short honest line rather than inventing`;

  const user = `Build the Classical package for this chapter.

Class: ${classCode} – ${className}
Subject: ${subject}
Chapter: ${setName}

SOURCE MATERIAL:
---
${sourceText.slice(0, 50000)}
---`;

  return { system, user };
}
