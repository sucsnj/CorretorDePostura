from __future__ import annotations

import argparse
import json
import time
import urllib.request


def post_event(broker_url: str, payload: dict) -> None:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{broker_url.rstrip('/')}/api/telemetry",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        response.read()


def main() -> None:
    parser = argparse.ArgumentParser(description="Ponte Serial Arduino -> broker HTTP")
    parser.add_argument("--port", required=True, help="Exemplo: COM3")
    parser.add_argument("--baud", type=int, default=9600)
    parser.add_argument("--broker", default="http://127.0.0.1:8000")
    args = parser.parse_args()

    try:
        import serial
    except ImportError as exc:
        raise SystemExit(
            "Instale pyserial para usar a ponte serial: python -m pip install pyserial"
        ) from exc

    with serial.Serial(args.port, args.baud, timeout=2) as arduino:
        time.sleep(2)
        print(f"Lendo {args.port} a {args.baud} baud e enviando para {args.broker}")
        while True:
            line = arduino.readline().decode("utf-8", errors="ignore").strip()
            if not line or not line.startswith("{"):
                continue

            try:
                payload = json.loads(line)
                payload["source"] = "serial"
                post_event(args.broker, payload)
                print(line)
            except json.JSONDecodeError:
                continue


if __name__ == "__main__":
    main()
