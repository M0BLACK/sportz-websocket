import { Router } from "express";
import {
  createCommentary,
  getCommentaries,
} from "../controller/commentary.controller.js";

const commentaryRouters = Router({ mergeParams: true });

commentaryRouters.get("/", getCommentaries);

commentaryRouters.post("/", createCommentary);

export default commentaryRouters;
