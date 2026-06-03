const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const historyLimit = 250;
const history = [];
const clients = new Set();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".gif": "image/gif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function normalizePayload(payload) {
  const angle = Number(payload.angleX ?? payload.angle ?? 0);
  const limit = Number(payload.limit ?? 20);
  const angleX = Number.isFinite(angle) ? angle : 0;
  const postureLimit = Number.isFinite(limit) ? limit : 20;
  const alert = payload.alert ?? Math.abs(angleX) > postureLimit;

  return {
    deviceId: String(payload.deviceId || "postura-uno"),
    angleX: Number(angleX.toFixed(2)),
    limit: Number(postureLimit.toFixed(2)),
    alert: Boolean(alert),
    status: alert ? "alert" : "ok",
    source: String(payload.source || "broker"),
    timestamp: Number(payload.timestamp || Date.now()),
  };
}

function publish(payload) {
  const event = normalizePayload(payload);
  history.push(event);
  if (history.length > historyLimit) history.shift();

  const message = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
  return event;
}

function sendJson(response, status, body) {
  const data = Buffer.from(JSON.stringify(body), "utf8");
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": data.length,
    "Access-Control-Allow-Origin": "*",
  });
  response.end(data);
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("body muito grande"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  if (requestUrl.pathname === "/") {
    response.writeHead(302, { Location: "/dashboard/" });
    response.end();
    return;
  }
  const pathname = requestUrl.pathname;
  const filePath = path.normalize(path.join(root, pathname));

  if (!filePath.startsWith(root)) {
    sendJson(response, 403, { error: "acesso negado" });
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      sendJson(response, 404, { error: "arquivo nao encontrado" });
      return;
    }

    if (stats.isDirectory()) {
      if (!requestUrl.pathname.endsWith("/")) {
        response.writeHead(301, { Location: requestUrl.pathname + "/" + requestUrl.search });
        response.end();
        return;
      }
    }

    const finalPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;
    fs.readFile(finalPath, (readError, data) => {
      if (readError) {
        sendJson(response, 404, { error: "arquivo nao encontrado" });
        return;
      }

      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(finalPath)] || "application/octet-stream",
        "Content-Length": data.length,
      });
      response.end(data);
    });
  });
}

function handleEvents(response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  clients.add(response);
  if (history.length > 0) {
    response.write(`data: ${JSON.stringify(history[history.length - 1])}\n\n`);
  }

  const heartbeat = setInterval(() => response.write(": keep-alive\n\n"), 15000);
  response.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(response);
  });
}

function createHttpServer() {
  return http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      });
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/api/latest") {
      sendJson(response, 200, history[history.length - 1] || {});
      return;
    }

    if (request.method === "GET" && request.url === "/api/history") {
      sendJson(response, 200, history);
      return;
    }

    if (request.method === "GET" && request.url === "/events") {
      handleEvents(response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/telemetry") {
      try {
        const payload = await parseBody(request);
        sendJson(response, 201, publish(payload));
      } catch (error) {
        sendJson(response, 400, { error: "JSON invalido" });
      }
      return;
    }

    if (request.method === "GET") {
      serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { error: "metodo nao permitido" });
  });
}

function createTcpServer() {
  return net.createServer((socket) => {
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const payload = JSON.parse(line);
          payload.source = payload.source || "tcp";
          socket.write(`${JSON.stringify({ ok: true, event: publish(payload) })}\n`);
        } catch (error) {
          socket.write('{"ok":false,"error":"JSON invalido"}\n');
        }
      }
    });
  });
}

const args = process.argv.slice(2);
const host = args.includes("--host") ? args[args.indexOf("--host") + 1] : (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const httpPort = args.includes("--http-port") ? Number(args[args.indexOf("--http-port") + 1]) : (process.env.PORT ? Number(process.env.PORT) : 8000);
const tcpPort = args.includes("--tcp-port") ? Number(args[args.indexOf("--tcp-port") + 1]) : 1883;

const tcpServer = createTcpServer();
tcpServer.on("error", (err) => {
  console.warn(`[tcp] Aviso: Não foi possível iniciar o servidor TCP: ${err.message}`);
});
try {
  tcpServer.listen(tcpPort, host);
} catch (err) {
  console.warn(`[tcp] Aviso: Não foi possível escutar na porta TCP ${tcpPort}: ${err.message}`);
}

const httpServer = createHttpServer();
httpServer.listen(httpPort, host, () => {
  console.log(`Broker HTTP: http://${host}:${httpPort}`);
  console.log(`Dashboard:   http://${host}:${httpPort}/dashboard/`);
  console.log(`App:         http://${host}:${httpPort}/app/`);
  console.log(`TCP ingest:  ${host}:${tcpPort}`);
});

process.on("SIGINT", () => {
  tcpServer.close();
  httpServer.close(() => process.exit(0));
});
