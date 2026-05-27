export type SleeperConfig = {
  leagueId: string;
  week: number;
  lastSyncedAt?: string;
};

export type SleeperMatchup = {
  matchupId: number;
  homeTeam: string;
  awayTeam: string;
  homePoints: number;
  awayPoints: number;
  winner: string;
};

export type SleeperStanding = {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type SleeperTransaction = {
  type: string;
  rosterIds: number[];
  created: number;
};

export type SleeperSyncData = {
  leagueName: string;
  season: string;
  week: number;
  totalMatchups: number;
  highestScore: { team: string; points: number };
  closestMargin: { matchup: string; margin: number };
  standings: SleeperStanding[];
  matchups: SleeperMatchup[];
  transactions: SleeperTransaction[];
  fetchedAt: string;
};

export type VoiceProfile = {
  preferredPhrases: string[];
  bannedPhrases: string[];
  toneNotes: string;
  intensity: number;
  signatureLine: string;
};
