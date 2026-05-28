export type LeagueIdentity = {
  leagueName: string;
  shortCode: string;
  seasonYear: number;
  status: "provisional" | "locked";
  tone: string;
  commissioner: string;
  coCommissioner: string;
  story: string;
  motto: string;
  renameCandidates: string[];
};

export type Matchup = {
  id: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  homeProjection: number;
  awayProjection: number;
  storyline: string;
  rivalryTag?: string;
};

export type TeamRecord = {
  team: string;
  manager: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  qbRoom: string;
  trend: "up" | "flat" | "down";
};

export type Rivalry = {
  name: string;
  teams: [string, string];
  allTimeRecord: string;
  lastResult: string;
  note: string;
};

export type LegacyEvent = {
  season: number;
  champion: string;
  runnerUp: string;
  topScorer: string;
  sotsWinner: string;
  definingMoment: string;
};

export const leagueIdentity: LeagueIdentity = {
  leagueName: "Slinger's of Dynasty",
  shortCode: "SoD",
  seasonYear: 2026,
  status: "provisional",
  tone: "Clean, modern, personal, and competitive.",
  commissioner: "Webs",
  coCommissioner: "Stan",
  story:
    "Slinger was a family nickname that carried local legend energy. This league is inspired by that legacy, carrying it forward as a long-term dynasty identity.",
  motto: "Built on legacy. Won by Slingers.",
  renameCandidates: [
    "Slinger's of Dynasty",
    "Dynasty of Slingers",
    "Legacy of Slingers",
    "Slinger Standard",
    "The Slinger Ledger",
  ],
};

export const weekFocus = {
  week: 1,
  objective: "Open the season with strong narratives and clear commissioner voice.",
  checks: [
    "Finalize Week 1 rivalry spotlight",
    "Approve Slinger of the Week criteria",
    "Publish one pinned Legacy Recap",
    "Archive all published text to Legacy Ledger",
  ],
};

export const teamRecords: TeamRecord[] = [
  {
    team: "Bayou Bombers",
    manager: "Webs",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    qbRoom: "Josh Allen, Brock Purdy",
    trend: "up",
  },
  {
    team: "Route Runners",
    manager: "King",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    qbRoom: "Jalen Hurts, Derek Carr",
    trend: "flat",
  },
  {
    team: "Pocket Chaos",
    manager: "Melo",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    qbRoom: "Lamar Jackson, Will Levis",
    trend: "up",
  },
  {
    team: "Fourth and Wrong",
    manager: "Stax",
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    qbRoom: "Joe Burrow, Bryce Young",
    trend: "down",
  },
];

export const weekOneMatchups: Matchup[] = [
  {
    id: "m1",
    week: 1,
    homeTeam: "Bayou Bombers",
    awayTeam: "Route Runners",
    homeProjection: 134.2,
    awayProjection: 129.8,
    storyline: "Elite QB depth versus balanced skill-position floor.",
    rivalryTag: "Founders Faceoff",
  },
  {
    id: "m2",
    week: 1,
    homeTeam: "Pocket Chaos",
    awayTeam: "Fourth and Wrong",
    homeProjection: 126.1,
    awayProjection: 121.4,
    storyline: "High-variance quarterbacks could swing this by 30.",
    rivalryTag: "Risk Bowl",
  },
];

export const rivalries: Rivalry[] = [
  {
    name: "Founders Faceoff",
    teams: ["Bayou Bombers", "Route Runners"],
    allTimeRecord: "0-0",
    lastResult: "No meetings yet",
    note: "Commissioner table energy. Tone-setter matchup every season.",
  },
  {
    name: "Risk Bowl",
    teams: ["Pocket Chaos", "Fourth and Wrong"],
    allTimeRecord: "0-0",
    lastResult: "No meetings yet",
    note: "Two boom-or-bust roster builds with weekly fireworks potential.",
  },
];

export const legacyLedger: LegacyEvent[] = [
  {
    season: 2026,
    champion: "TBD",
    runnerUp: "TBD",
    topScorer: "TBD",
    sotsWinner: "TBD",
    definingMoment: "Inaugural season. Legacy starts here.",
  },
];

export const brandKit = {
  palette: [
    { token: "Midnight Navy", hex: "#0B132B", usage: "Primary background and headers" },
    { token: "Iron Silver", hex: "#8D99AE", usage: "Secondary text and card borders" },
    { token: "Bone White", hex: "#F8F9FA", usage: "Surface and readable body text" },
    { token: "Victory Gold", hex: "#D4A017", usage: "Accent for awards and highlights" },
  ],
  typography: {
    heading: "Sora or Montserrat (bold, modern)",
    body: "Inter or system sans (clean and readable)",
    accent: "Optional serif for legacy banners only",
  },
  logoConcepts: [
    "Neon Slinger's wordmark with Bar N Grill plate, Dynasty arc, and SoD badge (public/logo-sod.svg).",
    "Lower scene: Labatt Blue bottle, neon pole, and football icon.",
    "Vegas-night backdrop with magenta horizon and skyline silhouette.",
  ],
};
