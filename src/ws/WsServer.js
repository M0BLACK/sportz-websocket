import { WebSocket, WebSocketServer } from "ws";

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;

    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketToServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    sendJson(socket, { type: "Welcome" });
  });

  wss.on("error", console.error);

  function broadcastCreatedMatch (match) {
    broadcast(wss, { type: "MATCH_CREATED", data: match });
  };

  wss.on("close", () => {
    console.log("WebSocket server closed");
  });

  return { broadcastCreatedMatch };
}
