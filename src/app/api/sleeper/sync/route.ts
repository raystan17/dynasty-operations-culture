import { NextRequest, NextResponse } from "next/server";
import type { SleeperMatchup, SleeperStanding, SleeperSyncData, SleeperTransaction } from "@/lib/sleeper";

type SleeperLeague = {
  name?: string;
  season?: string;
};

type SleeperState = {
  week?: number;
};

type SleeperUser = {
  user_id?: string;
  display_name?: string;
};

type SleeperRoster = {
  roster_id: number;
  owner_id?: string;
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
  };
};

type SleeperMatchupRow = {
  roster_id: number;
  points?: number;
  matchup_id?: number;
};

const SLEEPER_BASE = "https://api.sleeper.app/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Sleeper API ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

function pointsFromSettings(whole?: number, decimal?: number) {
  return Number(`${whole ?? 0}.${decimal ?? 0}`);
}

export async function GET(request: NextRequest) {
  try {
    const leagueId = request.nextUrl.searchParams.get("leagueId")?.trim();
    const weekParam = request.nextUrl.searchParams.get("week");

    if (!leagueId) {
      return NextResponse.json({ error: "Missing leagueId query parameter." }, { status: 400 });
    }

    const [league, users, rosters, nflState] = await Promise.all([
      fetchJson<SleeperLeague>(`${SLEEPER_BASE}/league/${leagueId}`),
      fetchJson<SleeperUser[]>(`${SLEEPER_BASE}/league/${leagueId}/users`),
      fetchJson<SleeperRoster[]>(`${SLEEPER_BASE}/league/${leagueId}/rosters`),
      fetchJson<SleeperState>(`${SLEEPER_BASE}/state/nfl`),
    ]);

    const activeWeek = weekParam ? Number(weekParam) : Number(nflState.week ?? 1);
    const [matchupRows, transactions] = await Promise.all([
      fetchJson<SleeperMatchupRow[]>(`${SLEEPER_BASE}/league/${leagueId}/matchups/${activeWeek}`),
      fetch(`${SLEEPER_BASE}/league/${leagueId}/transactions/${activeWeek}`, { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) return [] as SleeperTransaction[];
          return (await res.json()) as SleeperTransaction[];
        })
        .catch(() => [] as SleeperTransaction[]),
    ]);

    const userNames = new Map(users.map((user) => [user.user_id ?? "", user.display_name ?? "Unknown"]));
    const rosterNames = new Map(
      rosters.map((roster) => [roster.roster_id, userNames.get(roster.owner_id ?? "") ?? `Roster ${roster.roster_id}`])
    );

    const matchupsById = new Map<number, SleeperMatchupRow[]>();
    matchupRows.forEach((row) => {
      const id = row.matchup_id;
      if (!id || id <= 0) return;
      const rows = matchupsById.get(id) ?? [];
      rows.push(row);
      matchupsById.set(id, rows);
    });

    const normalizedMatchups: SleeperMatchup[] = Array.from(matchupsById.entries()).map(([matchupId, rows]) => {
      const [a, b] = rows;
      const home = a;
      const away = b;
      const homeTeam = rosterNames.get(home?.roster_id ?? -1) ?? `Roster ${home?.roster_id ?? "?"}`;
      const awayTeam = rosterNames.get(away?.roster_id ?? -1) ?? `Roster ${away?.roster_id ?? "?"}`;
      const homePoints = Number(home?.points ?? 0);
      const awayPoints = Number(away?.points ?? 0);
      const winner =
        homePoints === awayPoints ? "Tie" : homePoints > awayPoints ? homeTeam : awayTeam;

      return {
        matchupId,
        homeTeam,
        awayTeam,
        homePoints,
        awayPoints,
        winner,
      };
    });

    const standings: SleeperStanding[] = rosters
      .map((roster) => {
        const settings = roster.settings ?? {};
        return {
          rank: 0,
          team: rosterNames.get(roster.roster_id) ?? `Roster ${roster.roster_id}`,
          wins: settings.wins ?? 0,
          losses: settings.losses ?? 0,
          ties: settings.ties ?? 0,
          pointsFor: pointsFromSettings(settings.fpts, settings.fpts_decimal),
          pointsAgainst: pointsFromSettings(settings.fpts_against, settings.fpts_against_decimal),
        };
      })
      .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
      .map((standing, index) => ({ ...standing, rank: index + 1 }));

    const highestScore = normalizedMatchups.reduce(
      (best, matchup) => {
        if (matchup.homePoints > best.points) return { team: matchup.homeTeam, points: matchup.homePoints };
        if (matchup.awayPoints > best.points) return { team: matchup.awayTeam, points: matchup.awayPoints };
        return best;
      },
      { team: "TBD", points: 0 }
    );

    const closestMargin = normalizedMatchups.reduce(
      (best, matchup) => {
        const margin = Math.abs(matchup.homePoints - matchup.awayPoints);
        if (margin < best.margin) {
          return { matchup: `${matchup.awayTeam} at ${matchup.homeTeam}`, margin };
        }
        return best;
      },
      { matchup: "No completed matchup", margin: Number.POSITIVE_INFINITY }
    );

    const payload: SleeperSyncData = {
      leagueName: league.name ?? "Sleeper League",
      season: league.season ?? "2026",
      week: activeWeek,
      totalMatchups: normalizedMatchups.length,
      highestScore,
      closestMargin: {
        matchup: closestMargin.matchup,
        margin: Number.isFinite(closestMargin.margin) ? closestMargin.margin : 0,
      },
      standings,
      matchups: normalizedMatchups,
      transactions,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error while syncing Sleeper data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
