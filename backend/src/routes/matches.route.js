import { Router } from "express";
import { createMatch, getMatches, updateMatchScore } from "../controller/matches.controller.js";
const matchesRouter = Router();

matchesRouter.get("/", getMatches);

matchesRouter.post("/", createMatch);

matchesRouter.patch('/:id/score', updateMatchScore);

export default matchesRouter;
