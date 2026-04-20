import express from "express";
import { config } from "dotenv";
import http from "http";
import matchesRouter from "./routes/matches.route.js";
import { attachWebSocketToServer } from "./ws/WsServer.js";

config();

const app = express();
const PORT = Number(process.env.PORT || 8000 );
const host = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

app.use(express.json());

app.use("/api/matches", matchesRouter);

const { broadcastCreatedMatch } = attachWebSocketToServer(server);
app.locals.broadcastCreatedMatch = broadcastCreatedMatch;

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
