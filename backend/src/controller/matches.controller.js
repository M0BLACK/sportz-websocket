import prisma from "../config/prisma.js";
import {
  createMatchSchema,
  listMatchesQuerySchema,
  matchIdParamSchema,
  updateScoreSchema,
} from "../validation/matches.js";
import { getMatchStatus } from "../utils/match-status.js";
import {
  loadMatchForScoring,
  assertMatchLive,
  setMatchScore,
  HttpError,
} from "../services/match-score.js";


export const getMatches = async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  const MATCHES_LIMIT = 100;

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: "Invalid query parameters",
      details: parsed.error.issues,
    });
  }
  const limit = Math.min(parsed.data.limit ?? 50, MATCHES_LIMIT);
  try {
    const matches = await prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.json({ success: true, data: matches });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: "Failed to fetch matches",
    });
  }
}

export const createMatch = async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      errors: "Invalid payload",
      details: parsed.error.issues,
    });
  }

  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  try {
    const newMatch = await prisma.match.create({
      data: {
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(new Date(startTime), new Date(endTime)),
      },
    });

    const broadcastCreatedMatch = res.app.locals.broadcastCreatedMatch;
    if (typeof broadcastCreatedMatch === "function") {
      try {
        broadcastCreatedMatch(newMatch);
      } catch (broadcastError) {
        console.error(
          "Failed to broadcast MATCH_CREATED event",
          broadcastError,
        );
      }
    }

    return res.json({ success: true, data: newMatch });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: "Failed to create match",
    });
  }
}

export const updateMatchScore = async (req, res) => {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid match id', details: paramsParsed.error.issues });
    }

    const bodyParsed = updateScoreSchema.safeParse(req.body);
    if (!bodyParsed.success) {
        return res
            .status(400)
            .json({ error: 'Invalid payload', details: bodyParsed.error.issues });
    }

    const matchId = paramsParsed.data.id;

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await loadMatchForScoring(tx, matchId);
        if (!existing) {
        throw new HttpError(404, "Match not found");
        }

        // Maintain old behavior: only allow score updates while LIVE.
        assertMatchLive(existing);

        return setMatchScore(tx, matchId, {
        homeScore: bodyParsed.data.homeScore,
        awayScore: bodyParsed.data.awayScore,
        });
      });

        if (res.app.locals.broadcastMatchUpdate) {
            res.app.locals.broadcastMatchUpdate(matchId, {
                homeScore: updated.homeScore,
                awayScore: updated.awayScore,
            });
        }

        res.json({ data: updated });
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: 'Failed to update score' });
    }
}


