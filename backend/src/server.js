import express from "express";
import { config } from "dotenv";
import http from "http";
import cors from "cors";
import matchesRouter from "./routes/matches.route.js";
import { attachWebSocketToServer } from "./ws/WsServer.js";
import commentaryRouters from "./routes/commentary.route.js";

config();

const app = express();
const PORT = Number(process.env.PORT || 8000 );
const host = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

app.use(express.json());
// allow CORS for development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
  : ["http://localhost:3000"];
app.use(cors({ origin: allowedOrigins, methods: ["GET","POST","PUT","PATCH","DELETE"] }));

app.use("/api/matches", matchesRouter);
app.use("/api/matches/:id/commentary", commentaryRouters)

const { broadcastCreatedMatch, broadcastCommentary } = attachWebSocketToServer(server);
app.locals.broadcastCreatedMatch = broadcastCreatedMatch;
app.locals.broadcastCommentary = broadcastCommentary;

app.get("/", (req, res) => {
  res.send("Welcome to Sportz app API...");
});

server.listen(PORT, () => {
  const BaseUrl = host === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${host}:${PORT}`;
  console.log(`server running at ${BaseUrl}`);
  console.log(
    `WebSocket server running at ${BaseUrl.replace("http", "ws")}/ws`,
  );
});
