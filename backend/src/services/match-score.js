import { MATCH_STATUS } from "../validation/matches.js";
import { syncMatchStatus } from "../utils/match-status.js";

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function loadMatchForScoring(tx, matchId) {
  const match = await tx.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      sport: true,
      homeTeam: true,
      awayTeam: true,
      status: true,
      startTime: true,
      endTime: true,
      homeScore: true,
      awayScore: true,
    },
  });

  if (!match) {
    return null;
  }

  await syncMatchStatus(match, async (nextStatus) => {
    await tx.match.update({
      where: { id: matchId },
      data: { status: nextStatus },
    });
  });

  return match;
}

export function assertMatchLive(match) {
  if (match.status !== MATCH_STATUS.LIVE) {
    throw new HttpError(409, "Match is not live");
  }
}

export async function setMatchScore(tx, matchId, { homeScore, awayScore }) {
  return tx.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
    },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
    },
  });
}

export async function incrementMatchScore(tx, matchId, { home, away }) {
  const homeDelta = Number(home || 0);
  const awayDelta = Number(away || 0);

  return tx.match.update({
    where: { id: matchId },
    data: {
      homeScore: { increment: homeDelta },
      awayScore: { increment: awayDelta },
    },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
    },
  });
}
