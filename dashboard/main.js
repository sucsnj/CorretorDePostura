const state = {
  history: [],
  maxPoints: 80,
  seen: new Set(),
};

const elements = {
  connection: document.querySelector("#connection"),
  status: document.querySelector("#status"),
  device: document.querySelector("#device"),
  angle: document.querySelector("#angle"),
  limit: document.querySelector("#limit"),
  updated: document.querySelector("#updated"),
  meter: document.querySelector("#angleMeter"),
  events: document.querySelector("#events"),
  count: document.querySelector("#count"),
  alertCount: document.querySelector("#alertCount"),
  sampleCount: document.querySelector("#sampleCount"),
  panel: document.querySelector(".status-panel"),
  insightPanel: document.querySelector(".insight-panel"),
  insightStatus: document.querySelector("#insightStatus"),
  insightText: document.querySelector("#insightText"),
  scaleMarker: document.querySelector("#scaleMarker"),
  trend: document.querySelector("#trend"),
  chart: document.querySelector("#chart"),
};

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function degree(value) {
  return `${value.toFixed(1)}\u00B0`;
}

function render(event) {
  const key = `${event.timestamp}-${event.deviceId}-${event.angleX}`;
  if (state.seen.has(key)) return;
  state.seen.add(key);

  state.history.push(event);
  if (state.history.length > state.maxPoints) state.history.shift();

  const alertCount = state.history.filter((item) => item.alert).length;
  const previous = state.history[state.history.length - 2];
  const delta = previous ? event.angleX - previous.angleX : 0;

  elements.status.textContent = event.alert ? "Corrigir" : "Postura ok";
  elements.device.textContent = event.deviceId;
  elements.angle.textContent = degree(event.angleX);
  elements.limit.textContent = degree(event.limit);
  elements.updated.textContent = formatTime(event.timestamp);
  elements.meter.value = event.angleX;
  elements.alertCount.textContent = alertCount;
  elements.sampleCount.textContent = `${state.history.length} leituras`;
  elements.trend.textContent = trendLabel(delta);
  elements.insightStatus.textContent = event.alert ? "Fora do limite" : "Dentro do limite";
  elements.insightText.textContent = insightText(event);
  elements.scaleMarker.style.left = `${markerPosition(event.angleX)}%`;

  elements.panel.classList.toggle("alert", event.alert);
  elements.panel.classList.toggle("ok", !event.alert);
  elements.insightPanel.classList.toggle("alert", event.alert);
  elements.insightPanel.classList.toggle("ok", !event.alert);
  elements.count.textContent = `${state.history.length} leituras`;

  renderRows();
  drawChart();
}

function trendLabel(delta) {
  if (Math.abs(delta) < 1) return "Estavel";
  return delta > 0 ? `Subiu ${degree(delta)}` : `Caiu ${degree(Math.abs(delta))}`;
}

function insightText(event) {
  if (event.alert) {
    return `A inclinacao de ${degree(event.angleX)} passou do limite de ${degree(event.limit)}. Acione o feedback visual e ajuste a postura.`;
  }
  return `A inclinacao de ${degree(event.angleX)} esta dentro da tolerancia de ${degree(event.limit)}.`;
}

function markerPosition(angle) {
  const clamped = Math.max(-60, Math.min(60, angle));
  return ((clamped + 60) / 120) * 100;
}

function renderRows() {
  const rows = state.history.slice(-12).reverse().map((event) => {
    const statusClass = event.alert ? "status-alert" : "status-ok";
    const statusLabel = event.alert ? "Alerta" : "Ok";

    return `
      <tr>
        <td>${formatTime(event.timestamp)}</td>
        <td>${event.deviceId}</td>
        <td>${degree(event.angleX)}</td>
        <td><span class="${statusClass}">${statusLabel}</span></td>
        <td>${event.source}</td>
      </tr>
    `;
  });
  elements.events.innerHTML = rows.join("");
}

function drawChart() {
  const canvas = elements.chart;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const left = 44;
  const right = 16;
  const top = 22;
  const bottom = 30;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  ctx.clearRect(0, 0, width, height);
  ctx.font = "13px Segoe UI, Arial, sans-serif";
  ctx.lineWidth = 1;

  for (let value = -60; value <= 60; value += 30) {
    const y = toY(value, top, chartHeight);
    ctx.strokeStyle = "#d3dee3";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - right, y);
    ctx.stroke();

    ctx.fillStyle = "#65747d";
    ctx.fillText(`${value}\u00B0`, 6, y + 4);
  }

  const points = state.history;
  if (points.length === 0) return;

  const latestLimit = points[points.length - 1].limit;
  drawLimitLine(ctx, latestLimit, left, right, top, chartHeight, width);
  drawLimitLine(ctx, -latestLimit, left, right, top, chartHeight, width);

  if (points.length < 2) return;

  const xStep = chartWidth / Math.max(points.length - 1, 1);
  ctx.strokeStyle = "#176b87";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = left + index * xStep;
    const y = toY(point.angleX, top, chartHeight);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const latest = points[points.length - 1];
  const latestX = left + (points.length - 1) * xStep;
  const latestY = toY(latest.angleX, top, chartHeight);
  ctx.fillStyle = latest.alert ? "#c2412d" : "#147a54";
  ctx.beginPath();
  ctx.arc(latestX, latestY, 5, 0, Math.PI * 2);
  ctx.fill();
}

function toY(angle, top, chartHeight) {
  const clamped = Math.max(-60, Math.min(60, angle));
  return top + ((60 - clamped) / 120) * chartHeight;
}

function drawLimitLine(ctx, limit, left, right, top, chartHeight, width) {
  const y = toY(limit, top, chartHeight);
  ctx.strokeStyle = "#e6ad31";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(width - right, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

async function loadHistory() {
  const response = await fetch("/api/history");
  const history = await response.json();
  history.forEach(render);
}

function connectEvents() {
  const events = new EventSource("/events");
  events.onopen = () => {
    elements.connection.textContent = "Online";
    elements.connection.classList.add("online");
  };
  events.onmessage = (message) => render(JSON.parse(message.data));
  events.onerror = () => {
    elements.connection.textContent = "Reconectando";
    elements.connection.classList.remove("online");
  };
}

loadHistory().then(connectEvents).catch(connectEvents);
