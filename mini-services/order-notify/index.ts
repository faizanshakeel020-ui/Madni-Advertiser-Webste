import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "socket.io";

/**
 * Order notification service.
 *
 * - Port 3003: socket.io (path "/") — the admin panel connects through the
 *   gateway with io("/?XTransformPort=3003"). (socket.io with path "/" owns
 *   every request on that port, so plain HTTP cannot share it.)
 * - Port 3005: plain HTTP — the Next.js /api/orders route POSTs order
 *   payloads to http://localhost:3005/notify (server-to-server) and this
 *   process broadcasts them to every connected admin panel.
 */

const io = new Server(
  createServer(),
  {
    // DO NOT change the path — the Caddy gateway uses it to forward requests
    path: "/",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000,
  }
);

io.on("connection", (socket) => {
  console.log(`[order-notify] admin panel connected (${socket.id})`);
  socket.emit("hello", { service: "order-notify", at: new Date().toISOString() });
  socket.on("disconnect", () => {
    console.log(`[order-notify] admin panel disconnected (${socket.id})`);
  });
});

/** Plain HTTP server the Next.js API notifies. */
const notifyServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: io.engine.clientsCount }));
    return;
  }

  if (req.method === "POST" && req.url === "/notify") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
      if (body.length > 1_000_000) req.destroy(); // guard: 1MB
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (!payload || typeof payload.orderNumber !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "orderNumber is required" }));
          return;
        }
        io.emit("new-order", payload);
        console.log(
          `[order-notify] broadcast new order ${payload.orderNumber} to ${io.engine.clientsCount} client(s)`
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, delivered: io.engine.clientsCount }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const SOCKET_PORT = 3003;
const NOTIFY_PORT = 3005;

io.listen(SOCKET_PORT);
console.log(`[order-notify] socket.io listening on port ${SOCKET_PORT} (path "/")`);

notifyServer.listen(NOTIFY_PORT, () => {
  console.log(`[order-notify] HTTP notify endpoint listening on port ${NOTIFY_PORT}`);
});
