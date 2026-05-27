const state = {
  latest: null,
  feed: [],
  seen: new Set(),
};

const els = {
  status: document.querySelector("#status"),
  device: document.querySelector("#device"),
  angle: document.querySelector("#angle"),
  input: document.querySelector("#angleInput"),
  send: document.querySelector("#send"),
  feed: document.querySelector("#feed"),
  dial: document.querySelector(".dial"),
};

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function render(event) {
  const key = `${event.timestamp}-${event.deviceId}-${event.angleX}`;
  if (state.seen.has(key)) return;
  state.seen.add(key);

  state.latest = event;
  state.feed.unshift(event);
  state.feed = state.feed.slice(0, 8);

  els.status.textContent = event.alert ? "Corrija a postura" : "Postura ok";
  els.device.textContent = event.deviceId;
  els.angle.textContent = `${event.angleX.toFixed(1)}°`;
  els.input.value = event.angleX;
  els.dial.classList.toggle("alert", event.alert);
  els.feed.innerHTML = state.feed.map((item) => `
    <li>
      <span>${formatTime(item.timestamp)}</span>
      <strong>${item.angleX.toFixed(1)}°</strong>
    </li>
  `).join("");
}

async function send(angleX) {
  const response = await fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: "app-simulador",
      angleX,
      limit: 20,
      source: "app",
    }),
  });
  render(await response.json());
}

document.querySelectorAll("[data-angle]").forEach((button) => {
  button.addEventListener("click", () => send(Number(button.dataset.angle)));
});

els.input.addEventListener("input", () => {
  els.angle.textContent = `${Number(els.input.value).toFixed(1)}°`;
});

els.send.addEventListener("click", () => send(Number(els.input.value)));

const events = new EventSource("/events");
events.onmessage = (message) => render(JSON.parse(message.data));
