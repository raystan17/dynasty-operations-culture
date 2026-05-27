import { leagueIdentity, type LeagueIdentity, type Matchup, weekFocus, weekOneMatchups } from "@/lib/league-data";
import type { VoiceProfile } from "@/lib/sleeper";

type LengthMode = "short" | "medium" | "long";

const lengthNotes: Record<LengthMode, string> = {
  short: "Keep each section under 2 sentences.",
  medium: "Use concise but descriptive writing.",
  long: "Expand each section with richer context and stakes.",
};

type PromptContext = {
  identity?: LeagueIdentity;
  week?: number;
  matchups?: Matchup[];
};

export function buildLegacyRecapPrompt(mode: LengthMode, context?: PromptContext): string {
  const identity = context?.identity ?? leagueIdentity;
  const week = context?.week ?? weekFocus.week;

  return [
    `You are writing the Week ${week} Legacy Recap for ${identity.leagueName} (${identity.shortCode}).`,
    `League tone: ${identity.tone}`,
    `Commissioner: ${identity.commissioner}. Co-Commissioner: ${identity.coCommissioner}.`,
    `Context: ${identity.story}`,
    `Length rule: ${lengthNotes[mode]}`,
    "Output exactly these sections:",
    "1) Legacy Recap headline",
    "2) 1 paragraph commissioner recap",
    "3) Slinger of the Week with 2 supporting reasons",
    "4) Rivalry Spotlight",
    "5) Next Week teaser",
  ].join("\n");
}

export function buildMatchupPrompt(mode: LengthMode, context?: PromptContext): string {
  const identity = context?.identity ?? leagueIdentity;
  const week = context?.week ?? weekFocus.week;
  const matchups = context?.matchups ?? weekOneMatchups;
  const matchupLines = matchups.map(
    (m, idx) =>
      `${idx + 1}. ${m.awayTeam} at ${m.homeTeam} (${m.awayProjection}-${m.homeProjection}) | ${m.storyline}`
  );

  return [
    `Create Week ${week} matchup blurbs for ${identity.leagueName}.`,
    `Tone: ${identity.tone}`,
    `Length rule: ${lengthNotes[mode]}`,
    "For each matchup, output:",
    "- 1 title line",
    "- 2-4 sentence narrative",
    "- 1 key swing player mention",
    "",
    "Matchups:",
    ...matchupLines,
  ].join("\n");
}

export function buildSleeperPostTemplate(mode: LengthMode, context?: PromptContext): string {
  const identity = context?.identity ?? leagueIdentity;
  const week = context?.week ?? weekFocus.week;
  const header = `[${identity.shortCode}] Week ${week} Legacy Recap`;
  const sizeHint =
    mode === "short"
      ? "(Fast format)"
      : mode === "medium"
      ? "(Standard format)"
      : "(Expanded format)";

  return [
    `${header} ${sizeHint}`,
    "",
    "Legacy Note:",
    "Built on legacy, played with conviction. Every lineup writes part of league history.",
    "",
    "Slinger of the Week:",
    "[Player/Team] - [1 sentence why]",
    "",
    "Rivalry Spotlight:",
    "[Matchup] - [2 sentence angle]",
    "",
    "Matchup Blurbs:",
    "- [Matchup A] [Narrative]",
    "- [Matchup B] [Narrative]",
    "",
    "Commissioner Note:",
    "Set lineups early. Stay active. Respect the league.",
  ].join("\n");
}

export function buildFactExtractionPrompt(factsPacket: string): string {
  return [
    "You are a stats validation engine for fantasy football recap generation.",
    "Use ONLY the provided facts packet. Do not invent any names, scores, standings, or records.",
    "Return valid JSON with exactly these keys:",
    "{",
    '  "headline": "string",',
    '  "topPerformer": { "team": "string", "points": 0 },',
    '  "closestMatchup": { "label": "string", "margin": 0 },',
    '  "matchupSummaries": [{ "label": "string", "winner": "string", "score": "string" }],',
    '  "standingsSnapshot": ["string"],',
    '  "confidence": "high|medium|low"',
    "}",
    "",
    "Facts packet:",
    factsPacket,
  ].join("\n");
}

export function buildNarrativeRecapPrompt(
  mode: LengthMode,
  context: PromptContext | undefined,
  voice: VoiceProfile,
  factJson: string
): string {
  const identity = context?.identity ?? leagueIdentity;
  const week = context?.week ?? weekFocus.week;

  return [
    `Write a Week ${week} recap for ${identity.leagueName} (${identity.shortCode}).`,
    `Tone baseline: ${identity.tone}`,
    `Length rule: ${lengthNotes[mode]}`,
    "",
    "Voice profile rules:",
    `- Preferred phrases: ${voice.preferredPhrases.join(", ") || "none"}`,
    `- Banned phrases: ${voice.bannedPhrases.join(", ") || "none"}`,
    `- Intensity (1-10): ${voice.intensity}`,
    `- Tone notes: ${voice.toneNotes || "none"}`,
    `- Signature line: ${voice.signatureLine || "none"}`,
    "",
    "Hard constraints:",
    "- Use only facts from the JSON block below.",
    "- If a needed detail is missing, state it as unavailable.",
    "- Keep competitive, modern language and avoid corporate phrasing.",
    "",
    "Produce these sections:",
    "1) Legacy Recap headline",
    "2) Commissioner recap paragraph",
    "3) Slinger of the Week section",
    "4) Rivalry Spotlight",
    "5) Next Week teaser",
    "",
    "Validated facts JSON:",
    factJson,
  ].join("\n");
}
