export type LiveFeedEventSnapshot = {
  id: string;
  eventType: string | null;
  playerName: string | null;
  avatarKey: string | null;
  locale: string | null;
  gameSlug: string | null;
  promptI18n: { uk: string | null; en: string | null };
  answerText: string | null;
  xpDelta: number | null;
  welcomeText: string | null;
  playerId: string | null;
  createdAt: string;
};

export type LeaderboardEntrySnapshot = {
  playerId: string;
  nickname: string;
  avatarKey: string | null;
  totalPoints: number;
  rank: number;
};

export type LiveSnapshot = {
  feed: LiveFeedEventSnapshot[];
  leaderboard: LeaderboardEntrySnapshot[];
};
