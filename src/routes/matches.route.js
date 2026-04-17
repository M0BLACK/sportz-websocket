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
      details: error.message,
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
    return res.json({ success: true, data: newMatch });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: "Failed to create match",
      details: error.message,
    });
  }
});

export default matchesRouter;
