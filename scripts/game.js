const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const scoreEl = document.getElementById("score");
const errEl = document.getElementById("err");
const bestEl = document.getElementById("best");
const beaconsEl = document.getElementById("beacons");

const STEP = 1000 / 60;
const MAX_FRAME = 64;
const BEST_KEY = "nebula-draco-best";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const input = new Set();

let mode = "ready";
let acc = 0;
let last = performance.now();
let score = 0;
let best = Number(localStorage.getItem(BEST_KEY) || 0);
let heading = 0;
let target = 0;
let drift = 12;
let shake = 0;
let hold = 0;
let beacons = 0;

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function bind() {
  const down = (c) => input.add(c);
  const up = (c) => input.delete(c);
  window.addEventListener("keydown", (e) => {
    if (["Space", "ArrowLeft", "ArrowRight", "KeyP"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyP") togglePause();
    if (e.code === "Space" && mode !== "play") start();
    down(e.code);
  });
  window.addEventListener("keyup", (e) => up(e.code));
  canvas.addEventListener("pointerdown", () => down("Pointer"));
  window.addEventListener("pointerup", () => up("Pointer"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && mode === "play") {
      setMode("pause", "Paused", "Tab hidden. Resume when the night is yours again.");
    }
  });
  document.getElementById("start").addEventListener("click", start);
  document.getElementById("pause").addEventListener("click", togglePause);
  if (bestEl) bestEl.textContent = String(Math.floor(best));
}

function setMode(next, title, msg) {
  mode = next;
  overlay.hidden = next === "play";
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
  const start = document.getElementById("start");
  start.textContent = next === "dead" ? "Drill again" : next === "ready" ? "Begin drill" : "Resume";
}

function start() {
  if (mode === "ready" || mode === "dead") {
    score = 0;
    heading = 0;
    target = 0;
    drift = 10;
    hold = 0;
    beacons = 0;
  }
  last = performance.now();
  acc = 0;
  setMode("play", "", "");
}

function togglePause() {
  if (mode === "play") setMode("pause", "Paused", "The card holds. Continue when ready.");
  else if (mode === "pause") start();
}

function rememberBest() {
  if (score > best) {
    best = score;
    localStorage.setItem(BEST_KEY, String(Math.floor(best)));
  }
  if (bestEl) bestEl.textContent = String(Math.floor(best));
}

function update(dt) {
  const t = dt / 1000;
  drift += Math.sin(performance.now() / 650) * 10 * t;
  drift += (Math.random() - 0.5) * 18 * t;
  drift = Math.max(-36, Math.min(36, drift));
  const left = input.has("ArrowLeft");
  const right = input.has("ArrowRight");
  const correct = input.has("Space") || input.has("Pointer");
  if (left) heading -= 80 * t;
  if (right) heading += 80 * t;
  if (correct) heading += (target - heading) * 4.4 * t;
  heading += drift * t;
  const err = Math.abs(heading - target);
  if (err < 7) {
    score += 20 * t;
    hold += dt;
    if (hold > 2200 && beacons < 3) {
      beacons += 1;
      hold = 0;
      shake = 5;
    }
  } else {
    hold = Math.max(0, hold - dt * 0.6);
  }
  if (err > 28) {
    shake = 10;
    rememberBest();
    const extra = beacons === 3 ? " All three beacons stood." : `${beacons} beacon${beacons === 1 ? "" : "s"} held.`;
    setMode("dead", "Lost the mark", `Error opened to ${err.toFixed(1)}°. Score ${Math.floor(score)}. ${extra}`);
  }
  if (beacons >= 3 && err < 7 && score > 40) {
    rememberBest();
    setMode("dead", "Window held", `Three beacons. Score ${Math.floor(score)}. Best ${Math.floor(best)}.`);
    beacons = 3;
  }
  shake *= 0.86;
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 16;
  ctx.save();
  if (!reduceMotion) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.fillStyle = css("--canvas") || "#14110d";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#2c261f";
  ctx.lineWidth = 1;
  for (let x = 40; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.strokeStyle = "#5c4e3c";
  ctx.beginPath();
  ctx.arc(cx, cy, 168, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#e7dcc8";
  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const inner = i % 3 === 0 ? 128 : 138;
    ctx.strokeStyle = i === 0 ? "#e0a25a" : "#8a7a64";
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * inner, cy - Math.cos(a) * inner);
    ctx.lineTo(cx + Math.sin(a) * 150, cy - Math.cos(a) * 150);
    ctx.stroke();
  }
  ctx.fillStyle = "#e0a25a";
  ctx.font = "16px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText("N", cx, cy - 178);
  const needle = ((heading - target) * Math.PI) / 180;
  ctx.strokeStyle = "#c56a32";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - Math.sin(needle) * 18, cy + Math.cos(needle) * 18);
  ctx.lineTo(cx + Math.sin(needle) * 138, cy - Math.cos(needle) * 138);
  ctx.stroke();
  ctx.fillStyle = "#efe6d6";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const err = Math.abs(heading - target);
  scoreEl.textContent = String(Math.floor(score));
  errEl.textContent = `${err.toFixed(1)}°`;
  if (beaconsEl) beaconsEl.textContent = `${beacons}/3`;
}

function frame(now) {
  requestAnimationFrame(frame);
  if (mode !== "play") {
    render();
    return;
  }
  let dt = now - last;
  last = now;
  if (dt > MAX_FRAME) dt = MAX_FRAME;
  acc += dt;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  render();
}

bind();
requestAnimationFrame(frame);
