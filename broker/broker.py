from __future__ import annotations

import argparse
from functools import partial
import json
import queue
import socketserver
import threading
import time
from collections import deque
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
HISTORY_LIMIT = 250


class TelemetryStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._history: deque[dict[str, Any]] = deque(maxlen=HISTORY_LIMIT)
        self._subscribers: list[queue.Queue[dict[str, Any]]] = []

    def publish(self, payload: dict[str, Any]) -> dict[str, Any]:
        event = normalize_payload(payload)
        with self._lock:
            self._history.append(event)
            subscribers = list(self._subscribers)

        for subscriber in subscribers:
            try:
                subscriber.put_nowait(event)
            except queue.Full:
                pass
        return event

    def latest(self) -> dict[str, Any] | None:
        with self._lock:
            return self._history[-1] if self._history else None

    def history(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._history)

    def subscribe(self) -> queue.Queue[dict[str, Any]]:
        subscriber: queue.Queue[dict[str, Any]] = queue.Queue(maxsize=25)
        with self._lock:
            self._subscribers.append(subscriber)
        return subscriber

    def unsubscribe(self, subscriber: queue.Queue[dict[str, Any]]) -> None:
        with self._lock:
            if subscriber in self._subscribers:
                self._subscribers.remove(subscriber)


store = TelemetryStore()


def normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    angle = payload.get("angleX", payload.get("angle", 0))
    limit = payload.get("limit", 20)

    try:
        angle_value = float(angle)
    except (TypeError, ValueError):
        angle_value = 0.0

    try:
        limit_value = float(limit)
    except (TypeError, ValueError):
        limit_value = 20.0

    alert = payload.get("alert")
    if alert is None:
        alert = abs(angle_value) > limit_value

    return {
        "deviceId": str(payload.get("deviceId", "postura-uno")),
        "angleX": round(angle_value, 2),
        "limit": round(limit_value, 2),
        "alert": bool(alert),
        "status": "alert" if bool(alert) else "ok",
        "source": str(payload.get("source", "broker")),
        "timestamp": int(payload.get("timestamp", time.time() * 1000)),
    }


def json_response(handler: SimpleHTTPRequestHandler, status: int, body: Any) -> None:
    data = json.dumps(body).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


class BrokerHttpHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/api/latest":
            json_response(self, 200, store.latest() or {})
            return

        if self.path == "/api/history":
            json_response(self, 200, store.history())
            return

        if self.path == "/events":
            self.handle_events()
            return

        if self.path == "/":
            self.send_response(302)
            self.send_header("Location", "/dashboard/")
            self.end_headers()
            return

        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/api/telemetry":
            json_response(self, 404, {"error": "rota nao encontrada"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            payload = json.loads(raw_body.decode("utf-8"))
            event = store.publish(payload)
            json_response(self, 201, event)
        except json.JSONDecodeError:
            json_response(self, 400, {"error": "JSON invalido"})

    def handle_events(self) -> None:
        subscriber = store.subscribe()
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        latest = store.latest()
        if latest:
            self.write_sse(latest)

        while True:
            try:
                event = subscriber.get(timeout=15)
                self.write_sse(event)
            except queue.Empty:
                try:
                    self.wfile.write(b": keep-alive\n\n")
                    self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    break
            except (BrokenPipeError, ConnectionResetError, TimeoutError):
                break
        finally:
            store.unsubscribe(subscriber)

    def write_sse(self, event: dict[str, Any]) -> None:
        data = f"data: {json.dumps(event)}\n\n".encode("utf-8")
        self.wfile.write(data)
        self.wfile.flush()

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[http] {self.address_string()} - {format % args}")


class TcpTelemetryHandler(socketserver.StreamRequestHandler):
    def handle(self) -> None:
        for raw_line in self.rfile:
            try:
                payload = json.loads(raw_line.decode("utf-8").strip())
                payload.setdefault("source", "tcp")
                event = store.publish(payload)
                response = {"ok": True, "event": event}
                self.wfile.write((json.dumps(response) + "\n").encode("utf-8"))
            except json.JSONDecodeError:
                self.wfile.write(b'{"ok":false,"error":"JSON invalido"}\n')


def start_tcp_server(host: str, port: int) -> socketserver.ThreadingTCPServer | None:
    try:
        server = socketserver.ThreadingTCPServer((host, port), TcpTelemetryHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        return server
    except Exception as e:
        print(f"[tcp] Aviso: Nao foi possivel iniciar o servidor TCP: {e}")
        return None


def main() -> None:
    env_port = os.environ.get("PORT")
    default_host = "0.0.0.0" if env_port else "127.0.0.1"
    default_port = int(env_port) if env_port else 8000

    parser = argparse.ArgumentParser(description="Broker local do sistema de postura")
    parser.add_argument("--host", default=default_host)
    parser.add_argument("--http-port", type=int, default=default_port)
    parser.add_argument("--tcp-port", type=int, default=1883)
    args = parser.parse_args()

    tcp_server = start_tcp_server(args.host, args.tcp_port)
    handler = partial(BrokerHttpHandler, directory=str(ROOT))
    http_server = ThreadingHTTPServer((args.host, args.http_port), handler)

    print(f"Broker HTTP: http://{args.host}:{args.http_port}")
    print(f"Dashboard:   http://{args.host}:{args.http_port}/dashboard/")
    print(f"App:         http://{args.host}:{args.http_port}/app/")
    print(f"TCP ingest:  {args.host}:{args.tcp_port}")

    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        if tcp_server:
            tcp_server.shutdown()
        http_server.server_close()


if __name__ == "__main__":
    main()
