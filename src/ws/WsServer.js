import { WebSocket, WebSocketServer } from "ws";

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  const msg = JSON.stringify(payload);

  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(msg);
  }
}

export function attachWebSocketToServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    
    sendJson(socket, { type: "Welcome" });

    socket.on("pong", () => {socket.isAlive = true; } );
  });

  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (!socket.isAlive) {
        socket.terminate();
        return;
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
    console.log("WebSocket server closed");
  });

  wss.on("error", console.error);

  function broadcastCreatedMatch(match) {
    broadcast(wss, { type: "MATCH_CREATED", data: match });
  }


  return { broadcastCreatedMatch };
}
