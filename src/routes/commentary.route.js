import { Router } from "express";
import prisma from "../config/prisma.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";

const commentaryRouters = Router({ mergeParams: true });
const COMMENTARY_MAX_LIMIT = 100;

commentaryRouters.get("/", async (req, res) => {
  try {
    const matchIdParsed = matchIdParamSchema.safeParse(req.params);

    if (!matchIdParsed.success) {
      return res.status(400).json({
        success: false,
        errors: "Invalid match ID.",
        details: matchIdParsed.error.issues,
      });
    }

    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);

    if (!queryParsed.success) {
      return res.status(400).json({
        success: false,
        errors: "Invalid query parameters",
        details: queryParsed.error.issues,
      });
    }

    const limit = Math.min(queryParsed.data.limit ?? 100, COMMENTARY_MAX_LIMIT);

    const commentaries = await prisma.commentary.findMany({
      where: {
        matchId: matchIdParsed.data.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return res.json({
      success: true,
      data: commentaries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: "Failed to fetch commentaries",
    });
  }
});

commentaryRouters.post("/", async (req, res) => {
  console.log("Created commentary request invoked...");
  try {
    const matchIdPrams = matchIdParamSchema.safeParse(req.params);
    if (!matchIdPrams.success) {
      return res.status(400).json({
        success: false,
        errors: "Invalid match ID.",
        details: matchIdPrams.error.issues,
      });
    }
    const resultBody = createCommentarySchema.safeParse(req.body);
    if (!resultBody.success) {
      return res.status(400).json({
        success: false,
        errors: resultBody.error.flatten(),
      });
    }

    const newCommentary = await prisma.commentary.create({
      data: {
        matchId: matchIdPrams.data.id,
        ...resultBody.data,
      },
    });
    const broadcastCommentary = res.app.locals.broadcastCommentary;
    try {
      if (typeof broadcastCommentary === "function") {
        broadcastCommentary(newCommentary.matchId, newCommentary);
      }
    } catch (broadcastError) {
      console.error("Error broadcasting commentary:", broadcastError);
    }
    console.log("Created commentary:", newCommentary);
    return res.status(201).json({
      success: true,
      data: newCommentary,
    });
  } catch (error) {
    console.error("Error creating commentary:", error);
    return res.status(500).json({
      success: false,
      errors: "Failed to create commentary",
    });
  }
});

export default commentaryRouters;
