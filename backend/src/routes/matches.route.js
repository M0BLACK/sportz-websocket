import { Router } from "express";
import prisma from "../config/prisma.js";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { getMatchStatus } from "../utils/match-status.js";

const matchesRouter = Router();

matchesRouter.get("/", async (req, res) => {
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
});

matchesRouter.post("/", async (req, res) => {
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
});




matchesRouter.patch("/:id/score", async (req, res) => {
  const matchId = Number(req.params.id);

  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: "Invalid match ID" });
  }

  const { homeScore, awayScore } = req.body;

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return res.status(400).json({ error: "homeScore and awayScore must be integers" });
  }

  try {
    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore },
    });

    if (!updated) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.status(200).json({success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update score" });
  }
});

export default matchesRouter;
