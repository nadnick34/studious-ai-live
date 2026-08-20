import type { Slide, StudyNotes } from "@/lib/types";

export function synthesizeSlides(notes: StudyNotes): Slide[] {
  const slides: Slide[] = [
    {
      id: "title",
      title: notes.title || "Study slides",
      bullets: [notes.subtitle].filter(Boolean) as string[],
      layout: "title",
    },
  ];

  (notes.sections || []).forEach((sec, i) => {
    const bullets = (sec.bullets || []).slice(0, 8);
    if (sec.layout === "two-column" && sec.columns?.length) {
      slides.push({
        id: `s${i + 1}`,
        title: sec.heading,
        bullets,
        layout: "two-column",
        body: sec.body,
        columns: sec.columns.map((col) => ({
          title: col.title,
          bullets: (col.bullets || []).slice(0, 6),
        })),
        footer: sec.reference,
      });
      return;
    }
    if (sec.layout === "table" && sec.table) {
      slides.push({
        id: `s${i + 1}`,
        title: sec.heading,
        bullets,
        layout: "table",
        body: sec.body,
        table: {
          headers: sec.table.headers || [],
          rows: (sec.table.rows || []).slice(0, 8),
        },
        footer: sec.reference,
      });
      return;
    }
    const extra = sec.body ? [sec.body, ...bullets] : bullets;
    slides.push({
      id: `s${i + 1}`,
      title: sec.heading,
      bullets: extra.slice(0, 8),
      layout: "bullets",
      footer: sec.reference,
    });
  });

  if (notes.otherResources?.length) {
    slides.push({
      id: "resources",
      title: "Other resources",
      bullets: notes.otherResources.map((r) => r.title).slice(0, 8),
      layout: "bullets",
    });
  }

  return slides;
}

export function normalizeSlides(slides: Slide[] | undefined, notes: StudyNotes): Slide[] {
  if (!Array.isArray(slides) || slides.length === 0) return synthesizeSlides(notes);
  return slides.map((s, i) => ({
    id: s.id || `s${i + 1}`,
    title: s.title || `Slide ${i + 1}`,
    bullets: Array.isArray(s.bullets) ? s.bullets : [],
    layout: s.layout || (s.table ? "table" : s.columns?.length ? "two-column" : "bullets"),
    body: s.body,
    columns: s.columns,
    table: s.table,
    footer: s.footer,
  }));
}
