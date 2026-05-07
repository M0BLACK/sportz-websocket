import prisma from "../config/prisma.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  loadMatchForScoring,
  assertMatchLive,
  incrementMatchScore,
  HttpError,
} from "../services/match-score.js";
import {
  isNonZeroScoreDelta,
  scoreDeltaFromEntry,
} from "../utils/score-delta.js";

const COMMENTARY_MAX_LIMIT = 100;

export const getCommentaries = async (req, res) => {
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
};

export const createCommentary = async (req, res) => {
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

    const matchId = matchIdPrams.data.id;

    const { scoreDelta, ...commentaryPayload } = resultBody.data;

    const { newCommentary, updatedScore } = await prisma.$transaction(
      async (tx) => {
        const match = await loadMatchForScoring(tx, matchId);
        if (!match) {
          throw new HttpError(404, "Match not found");
        }

        const derivedDelta = scoreDeltaFromEntry(
          { ...commentaryPayload, scoreDelta },
          match,
        );
        const hasDelta = isNonZeroScoreDelta(derivedDelta);

        // Keep consistent with PATCH /score: score-changing events are only allowed while LIVE.
        if (hasDelta) {
          assertMatchLive(match);
        }

        const metadata = {
          ...(commentaryPayload.metadata ?? {}),
          ...(scoreDelta ? { scoreDelta } : {}),
        };

        const created = await tx.commentary.create({
          data: {
            matchId,
            ...commentaryPayload,
            metadata,
          },
        });

        if (!hasDelta) {
          return { newCommentary: created, updatedScore: null };
        }

        const updated = await incrementMatchScore(tx, matchId, derivedDelta);

        return {
          newCommentary: created,
          updatedScore: {
            homeScore: updated.homeScore,
            awayScore: updated.awayScore,
          },
        };
      },
    );

    const broadcastCommentary = res.app.locals.broadcastCommentary;
    const broadcastMatchUpdate = res.app.locals.broadcastMatchUpdate;
    try {
      if (typeof broadcastCommentary === "function") {
        broadcastCommentary(newCommentary.matchId, newCommentary);
      }
      if (updatedScore && typeof broadcastMatchUpdate === "function") {
        broadcastMatchUpdate(matchId, updatedScore);
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
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        errors: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      errors: "Failed to create commentary",
    });
  }
};
