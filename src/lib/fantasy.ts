export type FantasyPos = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export type FantasyPlayer = {
  id: string;
  name: string;
  pos: FantasyPos;
  team: string;
  adp: number;
};

export type Scoring = {
  passYdsPerPoint: number;
  passTd: number;
  int: number;
  rushYdsPerPoint: number;
  rushTd: number;
  recYdsPerPoint: number;
  recTd: number;
  reception: number;
};

export const DEFAULT_SCORING: Scoring = {
  passYdsPerPoint: 25,
  passTd: 4,
  int: -2,
  rushYdsPerPoint: 10,
  rushTd: 6,
  recYdsPerPoint: 10,
  recTd: 6,
  reception: 1,
};

export const STARTER_BOARD: FantasyPlayer[] = [
  ["Ja'Marr Chase", "WR", "CIN", 1],
  ["Bijan Robinson", "RB", "ATL", 2],
  ["Justin Jefferson", "WR", "MIN", 3],
  ["Jahmyr Gibbs", "RB", "DET", 4],
  ["CeeDee Lamb", "WR", "DAL", 5],
  ["Saquon Barkley", "RB", "PHI", 6],
  ["Amon-Ra St. Brown", "WR", "DET", 7],
  ["Nico Collins", "WR", "HOU", 8],
  ["Puka Nacua", "WR", "LAR", 9],
  ["A.J. Brown", "WR", "PHI", 10],
  ["Drake London", "WR", "ATL", 11],
  ["Ashton Jeanty", "RB", "LV", 12],
  ["Brian Thomas Jr.", "WR", "JAX", 13],
  ["Malik Nabers", "WR", "NYG", 14],
  ["Derrick Henry", "RB", "BAL", 15],
  ["Josh Jacobs", "RB", "GB", 16],
  ["Lamar Jackson", "QB", "BAL", 17],
  ["Josh Allen", "QB", "BUF", 18],
  ["Breece Hall", "RB", "NYJ", 19],
  ["Jonathan Taylor", "RB", "IND", 20],
  ["Bucky Irving", "RB", "TB", 21],
  ["Jalen Hurts", "QB", "PHI", 22],
  ["Tee Higgins", "WR", "CIN", 23],
  ["Davante Adams", "WR", "LAR", 24],
  ["Tyreek Hill", "WR", "MIA", 25],
  ["Mike Evans", "WR", "TB", 26],
  ["Garrett Wilson", "WR", "NYJ", 27],
  ["DK Metcalf", "WR", "PIT", 28],
  ["Jayden Daniels", "QB", "WAS", 29],
  ["Kyren Williams", "RB", "LAR", 30],
  ["James Cook", "RB", "BUF", 31],
  ["De'Von Achane", "RB", "MIA", 32],
  ["Chase Brown", "RB", "CIN", 33],
  ["Travis Kelce", "TE", "KC", 34],
  ["Brock Bowers", "TE", "LV", 35],
  ["George Kittle", "TE", "SF", 36],
  ["Trey McBride", "TE", "ARI", 37],
  ["Joe Burrow", "QB", "CIN", 38],
  ["Patrick Mahomes", "QB", "KC", 39],
  ["Justin Herbert", "QB", "LAC", 40],
  ["Bo Nix", "QB", "DEN", 41],
  ["Ladd McConkey", "WR", "LAC", 42],
  ["Marvin Harrison Jr.", "WR", "ARI", 43],
  ["Jaxon Smith-Njigba", "WR", "SEA", 44],
  ["Courtland Sutton", "WR", "DEN", 45],
  ["Chris Olave", "WR", "NO", 46],
  ["Tetairoa McMillan", "WR", "CAR", 47],
  ["Omarion Hampton", "RB", "LAC", 48],
  ["Kenneth Walker III", "RB", "SEA", 49],
  ["Alvin Kamara", "RB", "NO", 50],
  ["Chuba Hubbard", "RB", "CAR", 51],
  ["James Conner", "RB", "ARI", 52],
  ["David Montgomery", "RB", "DET", 53],
  ["Tony Pollard", "RB", "TEN", 54],
  ["Isiah Pacheco", "RB", "KC", 55],
  ["D'Andre Swift", "RB", "CHI", 56],
  ["Aaron Jones", "RB", "MIN", 57],
  ["RJ Harvey", "RB", "DEN", 58],
  ["George Pickens", "WR", "DAL", 59],
  ["Zay Flowers", "WR", "BAL", 60],
  ["Jameson Williams", "WR", "DET", 61],
  ["DJ Moore", "WR", "CHI", 62],
  ["Xavier Worthy", "WR", "KC", 63],
  ["DeVonta Smith", "WR", "PHI", 64],
  ["Calvin Ridley", "WR", "TEN", 65],
  ["Rome Odunze", "WR", "CHI", 66],
  ["Jerry Jeudy", "WR", "CLE", 67],
  ["Jakobi Meyers", "WR", "LV", 68],
  ["Sam LaPorta", "TE", "DET", 69],
  ["T.J. Hockenson", "TE", "MIN", 70],
  ["David Njoku", "TE", "CLE", 71],
  ["Mark Andrews", "TE", "BAL", 72],
  ["Baker Mayfield", "QB", "TB", 73],
  ["Kyler Murray", "QB", "ARI", 74],
  ["Jared Goff", "QB", "DET", 75],
  ["Caleb Williams", "QB", "CHI", 76],
  ["Jordan Love", "QB", "GB", 77],
  ["Brock Purdy", "QB", "SF", 78],
  ["Rashee Rice", "WR", "KC", 79],
  ["Jordan Addison", "WR", "MIN", 80],
  ["Jaylen Waddle", "WR", "MIA", 81],
  ["Chris Godwin", "WR", "TB", 82],
  ["Stefon Diggs", "WR", "NE", 83],
  ["Cooper Kupp", "WR", "SEA", 84],
  ["Rhamondre Stevenson", "RB", "NE", 85],
  ["Najee Harris", "RB", "LAC", 86],
  ["Travis Etienne", "RB", "JAX", 87],
  ["Rachaad White", "RB", "TB", 88],
  ["Jaylen Warren", "RB", "PIT", 89],
  ["Tyrone Tracy Jr.", "RB", "NYG", 90],
  ["Baltimore", "DST", "BAL", 91],
  ["Denver", "DST", "DEN", 92],
  ["Pittsburgh", "DST", "PIT", 93],
  ["Justin Tucker", "K", "BAL", 94],
  ["Brandon Aubrey", "K", "DAL", 95],
  ["Harrison Butker", "K", "KC", 96],
  ["Jake Bates", "K", "DET", 97],
  ["Cameron Dicker", "K", "LAC", 98],
  ["Evan Engram", "TE", "JAX", 99],
  ["Dallas Goedert", "TE", "PHI", 100],
].map(([name, pos, team, adp]) => ({
  id: String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name: String(name),
  pos: pos as FantasyPos,
  team: String(team),
  adp: Number(adp),
}));

export function needsWeights(myPos: FantasyPos[]) {
  const count = (p: FantasyPos) => myPos.filter((x) => x === p).length;
  return {
    QB: count("QB") === 0 ? 1.15 : count("QB") >= 2 ? 0.72 : 0.95,
    RB: count("RB") < 2 ? 1.22 : count("RB") < 4 ? 1.05 : 0.8,
    WR: count("WR") < 2 ? 1.2 : count("WR") < 5 ? 1.06 : 0.82,
    TE: count("TE") === 0 ? 1.18 : 0.78,
    K: count("K") === 0 && myPos.length >= 10 ? 1.1 : 0.45,
    DST: count("DST") === 0 && myPos.length >= 10 ? 1.1 : 0.45,
  } as Record<FantasyPos, number>;
}

export type PreferredTargets = {
  QB?: string;
  RB?: string;
  WR?: string;
  TE?: string;
};

function nameHit(q: string | undefined, player: FantasyPlayer) {
  const n = (q || "").trim().toLowerCase();
  if (!n) return false;
  return n.split(",").some((part) => {
    const s = part.trim();
    return s && (player.name.toLowerCase() === s || player.name.toLowerCase().includes(s) || s.includes(player.name.toLowerCase()));
  });
}

export function rankAvailable(
  available: FantasyPlayer[],
  mine: FantasyPlayer[],
  scoring: Scoring,
  opts?: {
    scoringType?: string;
    draftType?: string;
    overall?: number;
    teams?: number;
    limit?: number;
    preferred?: PreferredTargets;
  },
) {
  const myPos = mine.map((p) => p.pos);
  const count = (pos: FantasyPos) => myPos.filter((x) => x === pos).length;
  const w = needsWeights(myPos);
  const type = opts?.scoringType || "";
  const draft = (opts?.draftType || "").toLowerCase();
  const pprBoost = scoring.reception >= 1 ? 0.1 : scoring.reception > 0 ? 0.05 : 0;
  const superflex = /superflex/i.test(type);
  const tePrem = /TE Premium/i.test(type);
  const idp = /^IDP$/i.test(type);
  const death = /death|guillotine/i.test(type);
  const dynasty = /dynasty|keeper/i.test(draft);
  const bestBall = /best ball/i.test(draft);
  const teams = opts?.teams || 12;
  const overall = opts?.overall || 1;
  const round = Math.ceil(overall / teams);
  const rb = count("RB");
  const wr = count("WR");
  const qb = count("QB");
  const te = count("TE");
  const skillSet = (rb >= 2 && wr >= 1) || (wr >= 2 && rb >= 1);
  const wantQbNow = qb === 0 && skillSet && round >= 4 && !superflex;
  const wantTeNow = te === 0 && skillSet && round >= 5 && (scoring.reception >= 1 || tePrem);
  const maxReach = Math.max(4, Math.round(teams * 0.75));
  const pref = opts?.preferred || {};

  const ranked = [...available].map((p) => {
    let score = 220 - p.adp;
    score *= w[p.pos] || 1;
    if (p.pos === "WR" || p.pos === "RB") score *= 1 + pprBoost;
    if (p.pos === "TE" && (scoring.reception >= 1 || tePrem)) score *= tePrem ? 1.12 : 1.05;
    if (p.pos === "QB") score *= superflex ? 1.22 : wantQbNow ? 1.16 : 1;
    if ((p.pos === "K" || p.pos === "DST") && (idp || death || bestBall || round < 12)) score *= 0.55;
    if (dynasty && p.adp <= 40) score *= 1.04;
    if (death && (p.pos === "RB" || p.pos === "WR") && p.adp <= 24) score *= 1.08;
    if (wantTeNow && p.pos === "TE" && p.adp <= overall + teams) score *= 1.08;

    const isPref = nameHit(pref[p.pos], p);
    const picksEarly = p.adp - overall;
    if (isPref && picksEarly <= maxReach) {
      const mild = 1.1 + Math.max(0, (maxReach - Math.max(0, picksEarly)) / maxReach) * 0.12;
      score *= mild;
    } else if (isPref && picksEarly > maxReach) {
      score *= 1.02;
    }
    return { player: p, score, isPref };
  });
  ranked.sort((a, b) => b.score - a.score);
  const limit = opts?.limit ?? 10;
  const top = ranked.slice(0, limit).map((r) => r.player);
  if (limit >= 8) {
    for (const pos of ["QB", "RB", "WR", "TE"] as FantasyPos[]) {
      const target = available.find((p) => nameHit(pref[pos], p));
      if (!target) continue;
      if (target.adp - overall > maxReach) continue;
      if (top.some((p) => p.id === target.id)) continue;
      top.splice(Math.min(6, top.length), 0, target);
    }
  }
  return top.slice(0, limit);
}

export function localTop3(available: FantasyPlayer[], mine: FantasyPlayer[], scoring: Scoring) {
  return rankAvailable(available, mine, scoring, { limit: 3 });
}

export function whosePick(overall: number, teams: number, snake: boolean) {
  const round = Math.ceil(overall / teams);
  const pos = ((overall - 1) % teams) + 1;
  const slot = snake && round % 2 === 0 ? teams - pos + 1 : pos;
  return { round, slot };
}

export function isMine(overall: number, teams: number, snake: boolean, mySlot: number) {
  return whosePick(overall, teams, snake).slot === mySlot;
}

export function matchPlayer(q: string, pool: FantasyPlayer[]) {
  const n = q.trim().toLowerCase();
  if (!n) return null;
  return (
    pool.find((p) => p.name.toLowerCase() === n) ||
    pool.find((p) => p.name.toLowerCase().startsWith(n)) ||
    pool.find((p) => p.name.toLowerCase().includes(n)) ||
    null
  );
}
