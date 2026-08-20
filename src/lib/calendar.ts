import type { ClassAlert, ClassUpcoming } from "@/lib/types";

const MONTHS: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

function toIso(year: string, month: string, day: string) {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function classify(line: string): ClassUpcoming["type"] {
  const t = line.toLowerCase();
  if (/\b(final|midterm|exam)\b/.test(t)) return "exam";
  if (/\bquiz\b/.test(t)) return "quiz";
  if (/\b(reading|read chapter|chapter)\b/.test(t)) return "reading";
  if (/\b(assignment|homework|paper|essay|project|due)\b/.test(t)) return "assignment";
  return "other";
}

export function parseSyllabusLocally(text: string): {
  alerts: ClassAlert[];
  upcoming: ClassUpcoming[];
} {
  const year = String(new Date().getFullYear());
  const upcoming: ClassUpcoming[] = [];
  const seen = new Set<string>();

  const datePatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?/gi,
    /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](20\d{2}))?\b/g,
  ];

  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter((l) => l.length > 8);

  for (const line of lines) {
    if (!/\b(exam|midterm|final|quiz|due|assignment|homework|paper|essay|project|reading|chapter|test)\b/i.test(line)) {
      continue;
    }
    let date = "";
    const named = [...line.matchAll(datePatterns[0])];
    if (named[0]) {
      const mon = MONTHS[named[0][1].toLowerCase().replace(".", "")];
      const day = named[0][2];
      const yr = named[0][3] || year;
      if (mon) date = toIso(yr, mon, day);
    } else {
      const num = [...line.matchAll(datePatterns[1])];
      if (num[0]) {
        date = toIso(num[0][3] || year, num[0][1], num[0][2]);
      }
    }
    const key = `${date}|${line.slice(0, 80)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    upcoming.push({
      id: "u_" + upcoming.length,
      type: classify(line),
      title: line.slice(0, 90),
      date: date || undefined,
    });
  }

  upcoming.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const soon = upcoming.filter((u) => {
    if (!u.date) return u.type === "exam";
    const d = new Date(u.date).getTime();
    const now = Date.now();
    return d >= now - 86400000 && d <= now + 10 * 86400000;
  });

  const alerts: ClassAlert[] = soon.slice(0, 4).map((u, i) => ({
    id: "a_" + i,
    kind: u.type === "exam" ? "exam" : u.type === "reading" ? "reading" : "due-soon",
    message: u.date ? `${u.title} (${u.date})` : u.title,
  }));

  return { alerts, upcoming: upcoming.slice(0, 10) };
}
