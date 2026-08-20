export interface SchoolBrand {
  id: string;
  name: string;
  location: string;
  kind: "college" | "high-school" | "custom" | "default";
  primary: string;
  accent: string;
  mascot?: string;
  initials: string;
}

export const DEFAULT_BRAND: SchoolBrand = {
  id: "studious",
  name: "Studious AI",
  location: "",
  kind: "default",
  primary: "#0d9488",
  accent: "#3d4f5f",
  initials: "S",
};

export const COLLEGE_STOCK: SchoolBrand[] = [
  {
    id: "lsu",
    name: "Louisiana State University",
    location: "Baton Rouge, LA",
    kind: "college",
    primary: "#461D7C",
    accent: "#2A1248",
    mascot: "Tigers",
    initials: "LSU",
  },
  {
    id: "uark",
    name: "University of Arkansas",
    location: "Fayetteville, AR",
    kind: "college",
    primary: "#9D2235",
    accent: "#1C1C1C",
    mascot: "Razorbacks",
    initials: "UA",
  },
  {
    id: "latech",
    name: "Louisiana Tech University",
    location: "Ruston, LA",
    kind: "college",
    primary: "#002F6C",
    accent: "#8B1323",
    mascot: "Bulldogs",
    initials: "LT",
  },
  {
    id: "baylor",
    name: "Baylor University",
    location: "Waco, TX",
    kind: "college",
    primary: "#154734",
    accent: "#0F2F23",
    mascot: "Bears",
    initials: "BU",
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    kind: "college",
    primary: "#8C1515",
    accent: "#2E2D29",
    mascot: "Cardinal",
    initials: "SU",
  },
];

export const HIGH_SCHOOL_STOCK: SchoolBrand[] = [
  {
    id: "benton-la",
    name: "Benton High School",
    location: "Benton, Bossier Parish, LA",
    kind: "high-school",
    primary: "#5B2C8C",
    accent: "#3D1D5C",
    mascot: "Tigers",
    initials: "BHS",
  },
  {
    id: "airline-la",
    name: "Airline High School",
    location: "Bossier City, Bossier Parish, LA",
    kind: "high-school",
    primary: "#0B3A6E",
    accent: "#082846",
    mascot: "Vikings",
    initials: "AHS",
  },
  {
    id: "pca-bossier",
    name: "Providence Classical Academy",
    location: "Bossier City, LA",
    kind: "high-school",
    primary: "#1B3A6B",
    accent: "#122544",
    mascot: "Knights",
    initials: "PCA",
  },
  {
    id: "calvary-shreveport",
    name: "Calvary Baptist Academy",
    location: "Shreveport, LA",
    kind: "high-school",
    primary: "#1F6B2D",
    accent: "#143F1C",
    mascot: "Cavaliers",
    initials: "CBA",
  },
  {
    id: "magnolia-ar",
    name: "Magnolia High School",
    location: "Magnolia, AR",
    kind: "high-school",
    primary: "#B32024",
    accent: "#6E1416",
    mascot: "Panthers",
    initials: "MHS",
  },
];

export const FALLBACK_PALETTES: { id: string; name: string; primary: string; accent: string }[] = [
  { id: "studious", name: "Studious teal", primary: "#0d9488", accent: "#3d4f5f" },
  { id: "navy", name: "Navy", primary: "#0B3A6E", accent: "#082846" },
  { id: "navy-gold", name: "Navy & gold", primary: "#0B3A6E", accent: "#1A2740" },
  { id: "royal", name: "Royal blue", primary: "#1D4ED8", accent: "#1E3A5F" },
  { id: "sky", name: "Columbia blue", primary: "#3B82C4", accent: "#1E3A5F" },
  { id: "teal", name: "Deep teal", primary: "#0F766E", accent: "#134E4A" },
  { id: "forest", name: "Forest green", primary: "#1F6B2D", accent: "#143F1C" },
  { id: "forest-gold", name: "Forest & gold", primary: "#1F6B2D", accent: "#3F2E10" },
  { id: "purple", name: "Purple", primary: "#5B2C8C", accent: "#3D1D5C" },
  { id: "purple-gold", name: "Purple & gold", primary: "#5B2C8C", accent: "#3D1D5C" },
  { id: "cardinal", name: "Cardinal", primary: "#9D2235", accent: "#1C1C1C" },
  { id: "crimson", name: "Crimson", primary: "#8C1515", accent: "#2E2D29" },
  { id: "crimson-navy", name: "Crimson & navy", primary: "#8C1515", accent: "#1B2A4A" },
  { id: "orange", name: "Orange", primary: "#EA580C", accent: "#7C2D12" },
  { id: "burnt-orange", name: "Burnt orange", primary: "#BF5700", accent: "#3D1F00" },
  { id: "orange-navy", name: "Orange & navy", primary: "#F97316", accent: "#0F2744" },
  { id: "gold", name: "Gold", primary: "#C9A227", accent: "#3D3410" },
  { id: "black-gold", name: "Black & gold", primary: "#1A1A1A", accent: "#2C2C2C" },
  { id: "maroon", name: "Maroon", primary: "#7A1F2B", accent: "#3B0F16" },
  { id: "slate", name: "Slate", primary: "#475569", accent: "#1E293B" },
];

export function allStock(): SchoolBrand[] {
  return [...COLLEGE_STOCK, ...HIGH_SCHOOL_STOCK];
}

export function getStockById(id: string): SchoolBrand | undefined {
  return allStock().find((s) => s.id === id) || (id === "studious" ? DEFAULT_BRAND : undefined);
}

function shade(hex: string, amount: number) {
  const n = hex.replace("#", "");
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const BRAND_KEY = "studious-brand-v1";

export function brandFromProfile(p?: {
  schoolSelect?: string;
  paletteId?: string | null;
  customSchoolName?: string | null;
} | null): SchoolBrand | null {
  if (!p?.schoolSelect || p.schoolSelect === "studious") return null;
  if (p.schoolSelect === "custom") {
    const pal = FALLBACK_PALETTES.find((x) => x.id === p.paletteId) || FALLBACK_PALETTES[0];
    return {
      ...DEFAULT_BRAND,
      id: "custom",
      name: p.customSchoolName || "Custom",
      primary: pal.primary,
      accent: pal.accent,
      initials: (p.customSchoolName || "CS").slice(0, 2).toUpperCase(),
      kind: "custom",
    };
  }
  return getStockById(p.schoolSelect) || null;
}

export function persistBrand(brand: SchoolBrand) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
  } catch {
    /* ignore */
  }
  applyBrand(brand);
}

export function hydrateBrand() {
  if (typeof window === "undefined") return DEFAULT_BRAND;
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) {
      const brand = JSON.parse(raw) as SchoolBrand;
      applyBrand(brand);
      return brand;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BRAND;
}

export function applyBrand(brand: SchoolBrand) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--teal", brand.primary, "important");
  root.style.setProperty("--teal-hover", shade(brand.primary, -18), "important");
  root.style.setProperty("--slate", brand.accent, "important");
  root.style.setProperty("--slate-dark", shade(brand.accent, -20), "important");
}

export function clearBrandVars() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ["--teal", "--teal-hover", "--slate", "--slate-dark"].forEach((k) => root.style.removeProperty(k));
}
