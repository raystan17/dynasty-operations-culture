"use client";

import { useMemo, useRef, useState } from "react";
import { CopyBlock } from "@/components/copy-block";
import { LeagueLogo } from "@/components/league-logo";
import { LOGO_ASSET } from "@/lib/brand-assets";
import {
  brandKit,
  leagueIdentity as initialLeagueIdentity,
  legacyLedger as initialLegacyLedger,
  rivalries as initialRivalries,
  teamRecords as initialTeamRecords,
  type LeagueIdentity,
  type LegacyEvent,
  type Matchup,
  type Rivalry,
  type TeamRecord,
  weekFocus as initialWeekFocus,
  weekOneMatchups as initialMatchups,
} from "@/lib/league-data";
import {
  buildFactExtractionPrompt,
  buildLegacyRecapPrompt,
  buildMatchupPrompt,
  buildNarrativeRecapPrompt,
  buildSleeperPostTemplate,
} from "@/lib/template-builder";
import type { SleeperConfig, SleeperSyncData, VoiceProfile } from "@/lib/sleeper";

type WeekFocus = {
  week: number;
  objective: string;
  checks: string[];
};

type DashboardState = {
  leagueIdentity: LeagueIdentity;
  weekFocus: WeekFocus;
  weekMatchups: Matchup[];
  teamRecords: TeamRecord[];
  rivalries: Rivalry[];
  legacyLedger: LegacyEvent[];
};

const trendStyle = {
  up: "text-emerald-300",
  flat: "text-slate-300",
  down: "text-rose-300",
};

const defaultSleeperConfig: SleeperConfig = {
  leagueId: "1365036347412201472",
  week: 1,
};

const defaultVoiceProfile: VoiceProfile = {
  preferredPhrases: ["huge", "dirty win", "statement game"],
  bannedPhrases: ["synergy", "stakeholders", "optimization"],
  toneNotes: "Keep it personal, competitive, and legacy-driven.",
  intensity: 7,
  signatureLine: "Built on legacy. Won by Slingers.",
};

const initialState: DashboardState = {
  leagueIdentity: initialLeagueIdentity,
  weekFocus: initialWeekFocus,
  weekMatchups: initialMatchups,
  teamRecords: initialTeamRecords,
  rivalries: initialRivalries,
  legacyLedger: initialLegacyLedger,
};

function pickPhrase(phrases: string[], fallback: string) {
  return phrases.find((phrase) => phrase.trim().length > 0) ?? fallback;
}

function buildAutoRecapDraft(
  sync: SleeperSyncData | null,
  state: DashboardState,
  voice: VoiceProfile
): string {
  const leagueName = state.leagueIdentity.leagueName;
  const shortCode = state.leagueIdentity.shortCode;
  const week = state.weekFocus.week;
  const huge = pickPhrase(voice.preferredPhrases, "huge");
  const dirtyWin = pickPhrase(
    voice.preferredPhrases.filter((phrase) => phrase.toLowerCase().includes("dirty")),
    "dirty win"
  );
  const signature = voice.signatureLine || "Built on legacy. Won by Slingers.";

  if (!sync) {
    return [
      `[${shortCode}] Week ${week} Legacy Recap`,
      "",
      "No live Sleeper sync found yet.",
      "Sync league data first, then run One-Click Recap Draft.",
      "",
      `Signature: ${signature}`,
    ].join("\n");
  }

  const topStanding = sync.standings[0];
  const topPerformer = sync.highestScore;
  const featured = sync.matchups[0];
  const rivalryLine = featured
    ? `${featured.awayTeam} at ${featured.homeTeam} ended ${featured.awayPoints}-${featured.homePoints}.`
    : "Rivalry spotlight unavailable this week.";
  const slingerLine = `${topPerformer.team} posted ${topPerformer.points.toFixed(
    2
  )}, a ${huge} swing for Week ${sync.week}.`;
  const commissionerParagraph = [
    `Week ${sync.week} in ${leagueName} delivered another ${huge} round of matchups.`,
    `${topPerformer.team} set the pace, while the closest finish was ${sync.closestMargin.matchup} by ${sync.closestMargin.margin.toFixed(
      2
    )} points.`,
    `This week also had a ${dirtyWin} feel in every tight game.`,
  ].join(" ");
  const standingsLine = topStanding
    ? `${topStanding.team} leads at ${topStanding.wins}-${topStanding.losses} (${topStanding.pointsFor.toFixed(2)} PF).`
    : "Standings update unavailable.";

  const matchupLines = sync.matchups
    .slice(0, 4)
    .map((matchup) => `- ${matchup.awayTeam} at ${matchup.homeTeam}: ${matchup.awayPoints}-${matchup.homePoints} (${matchup.winner})`)
    .join("\n");

  return [
    `[${shortCode}] Week ${sync.week} Legacy Recap`,
    "",
    "Legacy Note:",
    signature,
    "",
    "Commissioner Recap:",
    commissionerParagraph,
    standingsLine,
    "",
    "Slinger of the Week:",
    slingerLine,
    "",
    "Rivalry Spotlight:",
    rivalryLine,
    "",
    "Matchup Results:",
    matchupLines || "- No matchup results available",
    "",
    "Next Week Teaser:",
    `Carry the momentum into Week ${sync.week + 1}. Stay sharp, set lineups early, and protect your edge.`,
    "",
    `Facts Source: Sleeper sync at ${new Date(sync.fetchedAt).toLocaleString()}`,
  ].join("\n");
}

export function CommissionerHub() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [sleeperConfig, setSleeperConfig] = useState<SleeperConfig>(defaultSleeperConfig);
  const [sleeperSync, setSleeperSync] = useState<SleeperSyncData | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>(defaultVoiceProfile);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [recapDraft, setRecapDraft] = useState("");
  const [recapMeta, setRecapMeta] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promptContext = useMemo(
    () => ({
      identity: state.leagueIdentity,
      week: state.weekFocus.week,
      matchups: state.weekMatchups,
    }),
    [state]
  );

  const updateIdentity = <K extends keyof LeagueIdentity>(key: K, value: LeagueIdentity[K]) => {
    setState((prev) => ({
      ...prev,
      leagueIdentity: {
        ...prev.leagueIdentity,
        [key]: value,
      },
    }));
  };

  const factsPacket = useMemo(() => {
    if (!sleeperSync) {
      return JSON.stringify(
        {
          notice: "No Sleeper data synced yet.",
          nextStep: "Use Sleeper Sync panel to pull live league facts.",
        },
        null,
        2
      );
    }

    return JSON.stringify(
      {
        leagueName: sleeperSync.leagueName,
        season: sleeperSync.season,
        week: sleeperSync.week,
        highestScore: sleeperSync.highestScore,
        closestMargin: sleeperSync.closestMargin,
        standingsTop4: sleeperSync.standings.slice(0, 4),
        matchups: sleeperSync.matchups,
        transactions: sleeperSync.transactions.slice(0, 10),
        fetchedAt: sleeperSync.fetchedAt,
      },
      null,
      2
    );
  }, [sleeperSync]);

  const syncSleeper = async () => {
    setSyncLoading(true);
    setSyncError("");
    try {
      const response = await fetch(
        `/api/sleeper/sync?leagueId=${encodeURIComponent(sleeperConfig.leagueId)}&week=${sleeperConfig.week}`,
        { method: "GET" }
      );
      const payload = (await response.json()) as SleeperSyncData | { error: string };
      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Failed to sync Sleeper.");
      }

      const synced = payload as SleeperSyncData;
      setSleeperSync(synced);
      setSleeperConfig((prev) => ({ ...prev, lastSyncedAt: synced.fetchedAt, week: synced.week }));

      setState((prev) => ({
        ...prev,
        leagueIdentity: {
          ...prev.leagueIdentity,
          leagueName: synced.leagueName || prev.leagueIdentity.leagueName,
          seasonYear: Number(synced.season) || prev.leagueIdentity.seasonYear,
        },
        weekFocus: {
          ...prev.weekFocus,
          week: synced.week,
          objective: `Publish accurate Week ${synced.week} recap using synced Sleeper facts.`,
        },
        weekMatchups: synced.matchups.map((m, idx) => ({
          id: `sync-${m.matchupId}`,
          week: synced.week,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeProjection: Number(m.homePoints.toFixed(2)),
          awayProjection: Number(m.awayPoints.toFixed(2)),
          storyline: `${m.winner} took this matchup ${m.homePoints}-${m.awayPoints}.`,
          rivalryTag: idx === 0 ? "Featured Rivalry" : undefined,
        })),
        teamRecords: synced.standings.map((standing) => ({
          team: standing.team,
          manager: standing.team,
          wins: standing.wins,
          losses: standing.losses,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
          qbRoom: "Sync from Sleeper lineup data",
          trend: standing.rank <= Math.ceil(synced.standings.length / 2) ? "up" : "flat",
        })),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Sleeper sync failure.";
      setSyncError(message);
    } finally {
      setSyncLoading(false);
    }
  };

  const exportState = () => {
    const blob = new Blob([JSON.stringify({ state, sleeperConfig, voiceProfile, sleeperSync }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "commissioner-hub-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const generateRecapDraft = () => {
    const draft = buildAutoRecapDraft(sleeperSync, state, voiceProfile);
    setRecapDraft(draft);
    setRecapMeta(
      sleeperSync
        ? `Draft generated from live Week ${sleeperSync.week} sync.`
        : "Draft generated from current in-app state (no live sync)."
    );
  };

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    setImportError("");
    setImportSuccess("");

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        state?: Partial<DashboardState>;
        sleeperConfig?: Partial<SleeperConfig>;
        voiceProfile?: Partial<VoiceProfile>;
        sleeperSync?: SleeperSyncData;
      };
      const importedState = parsed.state ?? (parsed as Partial<DashboardState>);

      if (!importedState.leagueIdentity || !importedState.weekFocus || !Array.isArray(importedState.weekMatchups)) {
        throw new Error("Missing required keys: leagueIdentity, weekFocus, weekMatchups.");
      }

      setState((prev) => ({
        leagueIdentity: importedState.leagueIdentity ?? prev.leagueIdentity,
        weekFocus: importedState.weekFocus ?? prev.weekFocus,
        weekMatchups: importedState.weekMatchups ?? prev.weekMatchups,
        teamRecords: importedState.teamRecords ?? prev.teamRecords,
        rivalries: importedState.rivalries ?? prev.rivalries,
        legacyLedger: importedState.legacyLedger ?? prev.legacyLedger,
      }));
      if (parsed.sleeperConfig) setSleeperConfig((prev) => ({ ...prev, ...parsed.sleeperConfig }));
      if (parsed.voiceProfile) {
        const importedVoice = parsed.voiceProfile;
        setVoiceProfile((prev) => ({
          ...prev,
          ...importedVoice,
          preferredPhrases: importedVoice.preferredPhrases ?? prev.preferredPhrases,
          bannedPhrases: importedVoice.bannedPhrases ?? prev.bannedPhrases,
        }));
      }
      if (parsed.sleeperSync) setSleeperSync(parsed.sleeperSync);
      setImportSuccess("Data imported successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown import error.";
      setImportError(`Import failed: ${message}`);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-8 scroll-smooth">
      <section
        id="overview"
        className="scroll-mt-24 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Commissioner Hub</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
              {state.leagueIdentity.leagueName}{" "}
              <span className="text-amber-300/90">({state.leagueIdentity.shortCode})</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
              {state.leagueIdentity.story}
            </p>
          </div>
          <LeagueLogo size="lg" showLabel className="shrink-0 sm:pt-1" />
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Status" value={state.leagueIdentity.status} />
          <InfoCard label="Commissioner" value={state.leagueIdentity.commissioner} />
          <InfoCard label="Co-Commissioner" value={state.leagueIdentity.coCommissioner} />
          <InfoCard label="Season" value={String(state.leagueIdentity.seasonYear)} />
        </div>
        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">Motto:</span> {state.leagueIdentity.motto}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>
              <span className="font-semibold text-white">Voice:</span> {state.leagueIdentity.tone}
            </li>
            <li>
              <span className="font-semibold text-white">Rename-safe candidates:</span>{" "}
              {state.leagueIdentity.renameCandidates.join(" | ")}
            </li>
          </ul>
        </div>
      </section>

      <CategorySection
        id="week"
        eyebrow="This Week"
        title="Weekly Control"
        subtitle="Focus, matchups, and the Slinger of the Week call."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Weekly Control Center">
            <p className="text-sm text-slate-300">Week {state.weekFocus.week}</p>
            <p className="mt-2 text-sm text-slate-200">{state.weekFocus.objective}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
              {state.weekFocus.checks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>

          <Panel title="Matchup Blurbs">
            <div className="space-y-3">
              {state.weekMatchups.map((matchup) => (
                <div key={matchup.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <p className="text-sm font-semibold text-white">
                    {matchup.awayTeam} at {matchup.homeTeam}
                  </p>
                  <p className="text-xs text-slate-400">
                    Projections: {matchup.awayProjection} - {matchup.homeProjection}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{matchup.storyline}</p>
                  {matchup.rivalryTag ? (
                    <p className="mt-1 text-xs uppercase tracking-wide text-amber-300">
                      Rivalry: {matchup.rivalryTag}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Slinger of the Week">
          <p className="text-sm text-slate-300">
            Suggested rubric: QB ceiling impact (40%), clutch margin swing (35%), and lineup
            efficiency (25%).
          </p>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-sm font-semibold text-white">Current placeholder</p>
            <p className="mt-1 text-sm text-slate-300">Josh Allen, Bayou Bombers</p>
            <p className="mt-2 text-xs text-slate-400">
              Adjust after final stat sync and commissioner approval.
            </p>
          </div>
        </Panel>
      </CategorySection>

      <CategorySection
        id="teams"
        eyebrow="Teams"
        title="Team Snapshot"
        subtitle="Rosters, records, and trend at a glance."
      >
        <Panel title="Team Snapshot">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {state.teamRecords.map((team) => (
              <div key={team.team} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-sm font-semibold text-white">{team.team}</p>
                <p className="text-xs text-slate-400">Manager: {team.manager}</p>
                <p className="mt-2 text-xs text-slate-300">QB Room: {team.qbRoom}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Record: {team.wins}-{team.losses}
                </p>
                <p className={`mt-1 text-xs uppercase tracking-wide ${trendStyle[team.trend]}`}>
                  Trend: {team.trend}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </CategorySection>

      <CategorySection
        id="rivalries"
        eyebrow="Rivalries"
        title="Rivalry Tracker"
        subtitle="Long-running beefs and current heat."
      >
        <Panel title="Rivalry Tracker">
          <div className="grid gap-3 sm:grid-cols-2">
            {state.rivalries.map((rivalry) => (
              <div key={rivalry.name} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-sm font-semibold text-white">{rivalry.name}</p>
                <p className="text-xs text-slate-400">{rivalry.teams.join(" vs ")}</p>
                <p className="mt-1 text-sm text-slate-300">
                  Record: {rivalry.allTimeRecord} | Last Result: {rivalry.lastResult}
                </p>
                <p className="mt-1 text-xs text-slate-400">{rivalry.note}</p>
              </div>
            ))}
          </div>
        </Panel>
      </CategorySection>

      <CategorySection
        id="legacy"
        eyebrow="Legacy"
        title="Legacy Ledger"
        subtitle="The all-time book on SoD."
      >
        <Panel title="Legacy Ledger">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2">Season</th>
                  <th className="py-2">Champion</th>
                  <th className="py-2">Runner-Up</th>
                  <th className="py-2">Top Scorer</th>
                  <th className="py-2">Slinger</th>
                </tr>
              </thead>
              <tbody>
                {state.legacyLedger.map((row) => (
                  <tr key={row.season} className="border-t border-slate-800 text-slate-200">
                    <td className="py-2">{row.season}</td>
                    <td className="py-2">{row.champion}</td>
                    <td className="py-2">{row.runnerUp}</td>
                    <td className="py-2">{row.topScorer}</td>
                    <td className="py-2">{row.sotsWinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">{state.legacyLedger[0]?.definingMoment}</p>
        </Panel>
      </CategorySection>

      <CategorySection
        id="sleeper"
        eyebrow="Sleeper"
        title="Sync & Publish"
        subtitle="Pull live data, validate facts, ship the recap."
      >
        <Panel title="Sleeper Sync">
          <p className="text-sm text-slate-300">
            Sync live league data using Sleeper league ID. This drives fact-accurate recap generation.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="League ID"
              value={sleeperConfig.leagueId}
              onChange={(v) => setSleeperConfig((prev) => ({ ...prev, leagueId: v.trim() }))}
            />
            <LabeledInput
              label="Week"
              type="number"
              value={String(sleeperConfig.week)}
              onChange={(v) => setSleeperConfig((prev) => ({ ...prev, week: Math.max(1, Number(v) || 1) }))}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={syncSleeper}
              disabled={syncLoading || !sleeperConfig.leagueId}
              className="rounded-md border border-violet-400/40 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncLoading ? "Syncing..." : "Sync Sleeper Data"}
            </button>
            <p className="text-xs text-slate-400">
              Last sync:{" "}
              {sleeperConfig.lastSyncedAt
                ? new Date(sleeperConfig.lastSyncedAt).toLocaleString()
                : "Not yet"}
            </p>
          </div>
          {syncError ? <p className="mt-3 text-xs text-rose-300">{syncError}</p> : null}
          {sleeperSync ? (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
              <p>
                Synced {sleeperSync.totalMatchups} matchups for Week {sleeperSync.week}. Highest score:{" "}
                <span className="font-semibold text-white">
                  {sleeperSync.highestScore.team} ({sleeperSync.highestScore.points})
                </span>
              </p>
            </div>
          ) : null}
        </Panel>

        <Panel title="Sleeper Publish Queue">
          <p className="text-sm text-slate-300">
            Accuracy pipeline: sync Sleeper {"->"} validate facts JSON {"->"} generate narrative in Voice Lab style.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generateRecapDraft}
              className="rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20"
            >
              One-Click Recap Draft
            </button>
            <p className="text-xs text-slate-400">{recapMeta || "No draft generated yet."}</p>
          </div>
          <div className="mt-4 grid gap-3">
            {recapDraft ? <CopyBlock title="Generated Recap Draft" content={recapDraft} /> : null}
            <CopyBlock
              title="Step 1 - Fact Validation Prompt"
              content={buildFactExtractionPrompt(factsPacket)}
            />
            <CopyBlock
              title="Step 2 - Narrative Recap Prompt"
              content={buildNarrativeRecapPrompt(
                "medium",
                promptContext,
                voiceProfile,
                "{{PASTE_VALIDATED_FACT_JSON_HERE}}"
              )}
            />
            <CopyBlock
              title="Sleeper Post Template"
              content={buildSleeperPostTemplate("long", promptContext)}
            />
            <CopyBlock title="Legacy Recap Prompt (Alt)" content={buildLegacyRecapPrompt("short", promptContext)} />
            <CopyBlock title="Matchup Blurbs Prompt (Alt)" content={buildMatchupPrompt("medium", promptContext)} />
          </div>
        </Panel>
      </CategorySection>

      <CategorySection
        id="voice"
        eyebrow="Voice Lab"
        title="AI Voice & Tone"
        subtitle="Tune the writing style injected into the narrative prompt."
      >
        <Panel title="Voice Lab">
          <p className="text-sm text-slate-300">
            These rules are injected into the narrative prompt after fact validation.
          </p>
          <LabeledTextArea
            label="Preferred Phrases (one per line)"
            value={voiceProfile.preferredPhrases.join("\n")}
            onChange={(v) =>
              setVoiceProfile((prev) => ({
                ...prev,
                preferredPhrases: v
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              }))
            }
          />
          <LabeledTextArea
            label="Banned Phrases (one per line)"
            value={voiceProfile.bannedPhrases.join("\n")}
            onChange={(v) =>
              setVoiceProfile((prev) => ({
                ...prev,
                bannedPhrases: v
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              }))
            }
          />
          <LabeledTextArea
            label="Tone Notes"
            value={voiceProfile.toneNotes}
            onChange={(v) => setVoiceProfile((prev) => ({ ...prev, toneNotes: v }))}
          />
          <LabeledInput
            label="Signature Line"
            value={voiceProfile.signatureLine}
            onChange={(v) => setVoiceProfile((prev) => ({ ...prev, signatureLine: v }))}
          />
          <label className="mt-3 block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Intensity ({voiceProfile.intensity}/10)
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={voiceProfile.intensity}
              onChange={(event) =>
                setVoiceProfile((prev) => ({ ...prev, intensity: Number(event.target.value) }))
              }
              className="w-full accent-amber-400"
            />
          </label>
        </Panel>
      </CategorySection>

      <CategorySection
        id="brand"
        eyebrow="Brand Kit"
        title="Logo, Palette, Typography"
        subtitle="The look that makes SoD feel like SoD."
      >
        <Panel title="Brand Kit">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">League Logo</p>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <LeagueLogo size="md" />
                <div className="text-xs text-slate-300">
                  <p>Classic scroll + slinger arm mark with football trail and updated SoD / Slinger&apos;s of Dynasty text.</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <a
                      href={LOGO_ASSET}
                      download="sod-league-logo.png"
                      className="text-amber-300 underline-offset-2 hover:underline"
                    >
                      Download PNG
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {brandKit.palette.map((color) => (
                <div key={color.token} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-slate-700"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="text-sm font-medium text-white">{color.token}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{color.hex}</p>
                  <p className="mt-1 text-xs text-slate-300">{color.usage}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">
              <p>
                <span className="font-semibold text-white">Heading:</span> {brandKit.typography.heading}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-white">Body:</span> {brandKit.typography.body}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-white">Accent:</span> {brandKit.typography.accent}
              </p>
            </div>
          </div>
        </Panel>
      </CategorySection>

      <CategorySection
        id="settings"
        eyebrow="Settings"
        title="League & Data"
        subtitle="Editable identity, plus import / export of the full workspace."
      >
        <Panel title="Editable Settings">
          <p className="mb-3 text-xs uppercase tracking-wide text-amber-300">
            Webs-only touchpoint (honor system)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="League Name"
              value={state.leagueIdentity.leagueName}
              onChange={(v) => updateIdentity("leagueName", v)}
            />
            <LabeledInput
              label="League Code"
              value={state.leagueIdentity.shortCode}
              onChange={(v) => updateIdentity("shortCode", v.toUpperCase())}
            />
            <LabeledInput
              label="Commissioner"
              value={state.leagueIdentity.commissioner}
              onChange={(v) => updateIdentity("commissioner", v)}
            />
            <LabeledInput
              label="Co-Commissioner"
              value={state.leagueIdentity.coCommissioner}
              onChange={(v) => updateIdentity("coCommissioner", v)}
            />
            <LabeledInput
              label="Motto"
              value={state.leagueIdentity.motto}
              onChange={(v) => updateIdentity("motto", v)}
            />
            <LabeledInput
              label="Season Year"
              type="number"
              value={String(state.leagueIdentity.seasonYear)}
              onChange={(v) => updateIdentity("seasonYear", Number(v) || state.leagueIdentity.seasonYear)}
            />
          </div>
          <LabeledTextArea
            label="Tone"
            value={state.leagueIdentity.tone}
            onChange={(v) => updateIdentity("tone", v)}
          />
          <LabeledTextArea
            label="Origin Story"
            value={state.leagueIdentity.story}
            onChange={(v) => updateIdentity("story", v)}
          />
          <LabeledTextArea
            label="Rename Candidates (one per line)"
            value={state.leagueIdentity.renameCandidates.join("\n")}
            onChange={(v) =>
              updateIdentity(
                "renameCandidates",
                v
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
              )
            }
          />
        </Panel>

        <Panel title="Data Confidence + Import / Export">
          <p className="mb-2 text-xs uppercase tracking-wide text-amber-300">
            Webs-only touchpoint (honor system)
          </p>
          <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
            <p>Facts packet source: {sleeperSync ? "Live Sleeper sync" : "Seed data fallback"}</p>
            <p>Matchups in packet: {sleeperSync?.matchups.length ?? state.weekMatchups.length}</p>
            <p>Standings rows: {sleeperSync?.standings.length ?? state.teamRecords.length}</p>
          </div>
          <p className="text-sm text-slate-300">
            Export your latest workspace data to JSON, or import a previous snapshot to restore.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportState}
              className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={onImportClick}
              className="rounded-md border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/20"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={onImportFile}
              className="hidden"
            />
          </div>
          {importError ? <p className="mt-3 text-xs text-rose-300">{importError}</p> : null}
          {importSuccess ? <p className="mt-3 text-xs text-emerald-300">{importSuccess}</p> : null}
        </Panel>
      </CategorySection>
    </div>
  );
}

export function CommissionerHeader({ username, role }: { username: string; role: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
      <p>
        Signed in as <span className="font-semibold text-white">{username}</span> ({role})
      </p>
      <p className="text-slate-400">Private commissioner workspace</p>
    </div>
  );
}

function CategorySection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300/90">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-slate-500"
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block space-y-1">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-slate-500"
      />
    </label>
  );
}
