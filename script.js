/* ───────────────────────── Netryx Astra V2 — demo UI ─────────────────────────
   Drives the retrieval → matching → consensus pipeline.

   When the Flask backend (server/app.py) is running, the uploaded photo is POSTed
   to /api/geolocate and geolocated by the real engine (or the backend's labeled
   simulation if the engine isn't installed). When the page is opened without a
   backend, it degrades to a fully client-side simulation so the demo still works. */

const $ = (sel) => document.querySelector(sel);

const drop      = $("#drop");
const fileInput = $("#file");
const preview   = $("#preview");
const dropEmpty = $("#dropEmpty");
const sampleBtn = $("#sampleBtn");
const runBtn    = $("#run");
const pipeItems = [...document.querySelectorAll("#pipe li")];
const mapEmpty  = $("#mapEmpty");
const pin       = $("#pin");
const result    = $("#result");
const badge     = $("#engineBadge");
const badgeText = $("#engineText");

let currentFile = null;   // the File/Blob to upload
let hasImage    = false;
let running     = false;

/* Client-side fallback outcomes (used only when no backend is reachable). */
const SIM = [
  { place: "Trocadéro, Paris, FR",        lat: 48.8617, lng:   2.2876 },
  { place: "Shibuya Crossing, Tokyo, JP", lat: 35.6595, lng: 139.7005 },
  { place: "Brooklyn Bridge, NYC, US",    lat: 40.7061, lng: -73.9969 },
  { place: "Camden Lock, London, UK",     lat: 51.5416, lng:  -0.1465 },
  { place: "Gothic Quarter, Barcelona",   lat: 41.3833, lng:   2.1777 },
];

/* ── image input ── */
function setImage(src, file) {
  preview.src = src;
  preview.hidden = false;
  dropEmpty.hidden = true;
  currentFile = file || null;
  hasImage = true;
  runBtn.disabled = false;
  resetPipeline();
}

fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) setImage(URL.createObjectURL(f), f);
});

drop.addEventListener("click", (e) => {
  if (e.target === sampleBtn) return;
  fileInput.click();
});
drop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
});

["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); })
);
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); })
);
drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith("image/")) setImage(URL.createObjectURL(f), f);
});

sampleBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  const url = "image-1784232959837.png";
  try {
    const blob = await (await fetch(url)).blob();
    setImage(url, new File([blob], "sample.png", { type: blob.type }));
  } catch {
    setImage(url, null); // still runnable — will use client-side fallback
  }
});

/* ── pipeline visuals ── */
const STAGE_COPY = [
  ["scanning 500 candidates", "candidates shortlisted"],
  ["dense correspondence",    "matches found"],
  ["clustering ~50 m cells",  "consensus locked"],
];

function setStatus(i, text) { pipeItems[i].querySelector(".pl-status").textContent = text; }

function resetPipeline() {
  pipeItems.forEach((li) => {
    li.classList.remove("active", "done");
    li.querySelector(".pl-status").textContent = "idle";
  });
  result.hidden = true;
  pin.classList.remove("show");
  mapEmpty.style.opacity = "1";
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function animateStage(i) {
  pipeItems[i].classList.add("active");
  setStatus(i, STAGE_COPY[i][0]);
  await wait(750 + Math.random() * 650);
  pipeItems[i].classList.remove("active");
  pipeItems[i].classList.add("done");
}

/* ── backend call ── */
async function geolocate(file) {
  if (!file) throw new Error("no-file");
  const fd = new FormData();
  fd.append("image", file, file.name || "query.png");
  const r = await fetch("/api/geolocate", { method: "POST", body: fd });
  const data = await r.json();
  if (!r.ok && r.status !== 422) throw new Error(data.error || "request failed");
  return data;
}

function clientSim() {
  const s = SIM[Math.floor(Math.random() * SIM.length)];
  return { found: true, engine: "offline", ...s,
           confidence: 78 + Math.floor(Math.random() * 18),
           matches: 180 + Math.floor(Math.random() * 240) };
}

/* ── run ── */
async function runPipeline() {
  if (running || !hasImage) return;
  running = true;
  runBtn.disabled = true;
  runBtn.childNodes[0].nodeValue = "Processing… ";
  runBtn.querySelector("span").textContent = "";
  resetPipeline();

  const request = geolocate(currentFile).catch(() => null); // resolve to null on failure

  await animateStage(0);
  setStatus(0, STAGE_COPY[0][1]);
  await animateStage(1);

  // Consensus stays live until the backend answers (real runs can take minutes).
  pipeItems[2].classList.add("active");
  setStatus(2, STAGE_COPY[2][0]);

  let result_ = await request;
  if (!result_) result_ = clientSim();          // no backend / network error
  else if (result_.found === false) { /* keep as-is */ }

  pipeItems[2].classList.remove("active");
  pipeItems[2].classList.add("done");
  setStatus(2, result_.found === false ? "no consensus" : STAGE_COPY[2][1]);

  // Backfill stage-2 count if the backend reported one.
  if (result_.matches) setStatus(1, `${result_.matches} matches found`);

  if (result_.found === false) showNotFound(result_);
  else showResult(result_);

  updateBadge(result_.engine, result_.reason);

  running = false;
  runBtn.disabled = false;
  runBtn.childNodes[0].nodeValue = "Run again ";
  runBtn.querySelector("span").textContent = "→";
}

/* Equirectangular projection onto the stylised map panel. */
function project(lat, lng) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  const clamp = (v) => Math.max(6, Math.min(94, v));
  return { x: clamp(x), y: clamp(y) };
}

function showResult(r) {
  mapEmpty.style.opacity = "0";
  const { x, y } = project(r.lat, r.lng);
  pin.style.left = x + "%";
  pin.style.top  = y + "%";
  requestAnimationFrame(() => pin.classList.add("show"));

  const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
  $("#rPlace").textContent = r.place || "—";
  $("#rCoord").textContent = `${fmt(r.lat, "N", "S")}, ${fmt(r.lng, "E", "W")}`;
  $("#rConf").textContent  = (r.confidence ?? "—") + "%";
  $("#rMatch").textContent = `${r.matches ?? "—"} inliers`;
  result.hidden = false;
  requestAnimationFrame(() => { $("#rBar").style.width = (r.confidence ?? 0) + "%"; });
}

function showNotFound(r) {
  mapEmpty.style.opacity = "1";
  mapEmpty.textContent = "No confident match";
  pin.classList.remove("show");
  $("#rPlace").textContent = "No match";
  $("#rCoord").textContent = "—";
  $("#rConf").textContent  = (r.confidence ?? 0) + "%";
  $("#rMatch").textContent = `${r.matches ?? 0} inliers`;
  result.hidden = false;
  $("#rBar").style.width = "0%";
}

runBtn.addEventListener("click", runPipeline);

/* ── engine badge ── */
function updateBadge(mode, reason) {
  badge.hidden = false;
  badge.classList.remove("live", "sim");
  if (mode === "live") {
    badge.classList.add("live");
    badgeText.textContent = "live engine · geolocating for real";
  } else if (mode === "simulation") {
    badge.classList.add("sim");
    badgeText.textContent = "backend up · simulation (no index/model)";
  } else if (mode === "ready") {
    badge.classList.add("sim");
    badgeText.textContent = "engine ready · no index loaded";
  } else {
    badge.classList.add("sim");
    badgeText.textContent = "offline demo · simulated result";
  }
  if (reason) badge.title = reason;
}

// Probe the backend on load so the badge reflects reality before the first run.
fetch("/api/health")
  .then((r) => r.json())
  .then((d) => {
    const e = d.engine || {};
    if (e.available && e.has_index) updateBadge("live");
    else if (e.available) updateBadge("ready", e.reason);
    else updateBadge("simulation", e.reason);
  })
  .catch(() => updateBadge("offline"));

/* ── scroll reveals ── */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll("section > .section-head, .stage, .feat, .hero-stats, .console, .specs-cols, .cta > *")
  .forEach((el, i) => { el.classList.add("reveal"); el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
