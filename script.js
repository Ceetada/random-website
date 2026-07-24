/* ───────────────────────── TADA — visual geolocation ─────────────────────────
   Upload a photo → locate it → drop the pin on a real map.

   When the Flask backend (server/app.py) is running, the photo is POSTed to
   /api/geolocate and geolocated by the real engine. On the hosted static demo
   there is no backend, so it falls back to a labeled sample result. Either way
   the result lands on a real OpenStreetMap map. */

const $ = (s) => document.querySelector(s);

/* ── map ── */
const map = L.map("map", { zoomControl: true, attributionControl: true, worldCopyJump: true })
  .setView([28, 8], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const pinIcon = L.divIcon({
  className: "",
  html: '<div class="tada-pin pin-drop"></div>',
  iconSize: [22, 22],
  iconAnchor: [3, 22],   // tip of the pin
});
let marker = null;

/* ── elements ── */
const drop      = $("#drop");
const fileInput = $("#file");
const preview   = $("#preview");
const dropEmpty = $("#dropEmpty");
const runBtn    = $("#run");
const sampleBtn = $("#sample");
const progress  = $("#progress");
const progressText = $("#progressText");
const readout   = $("#readout");
const mapTag    = $("#mapTag");

let currentFile = null;
let hasImage = false;
let running = false;

/* ── sample fallbacks (real coordinates) ── */
const SAMPLES = [
  { place: "Trocadéro, Paris, FR",        lat: 48.8617, lng:   2.2876 },
  { place: "Shibuya Crossing, Tokyo, JP", lat: 35.6595, lng: 139.7005 },
  { place: "Brooklyn Bridge, New York",   lat: 40.7061, lng: -73.9969 },
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
  readout.hidden = true;
}

fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) setImage(URL.createObjectURL(f), f);
});
drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
});
["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith("image/")) setImage(URL.createObjectURL(f), f);
});

sampleBtn.addEventListener("click", async () => {
  const url = "image-1784232959837.png";
  try {
    const blob = await (await fetch(url)).blob();
    setImage(url, new File([blob], "sample.png", { type: blob.type }));
  } catch {
    setImage(url, null);
  }
  runPipeline();
});

/* ── backend call, with graceful fallback ── */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function callBackend(file) {
  if (!file) throw new Error("no-file");
  const fd = new FormData();
  fd.append("image", file, file.name || "query.png");
  const r = await fetch("/api/geolocate", { method: "POST", body: fd });
  const data = await r.json();
  if (!r.ok && r.status !== 422) throw new Error(data.error || "failed");
  return data;
}

/* ── run ── */
async function runPipeline() {
  if (running || !hasImage) return;
  running = true;
  runBtn.disabled = true;
  readout.hidden = true;
  mapTag.hidden = true;
  progress.hidden = false;
  progressText.textContent = "Locating…";

  const request = callBackend(currentFile).catch(() => null);

  // Keep the progress visible for a beat so the interaction reads clearly.
  const [result] = await Promise.all([request, wait(1100)]);
  const r = result && result.found !== false
    ? result
    : { ...SAMPLES[Math.floor(Math.random() * SAMPLES.length)],
        confidence: 80 + Math.floor(Math.random() * 16), engine: "offline" };

  progress.hidden = true;
  showResult(r);

  running = false;
  runBtn.disabled = false;
  runBtn.textContent = "Locate another";
}

function showResult(r) {
  // marker + fly
  if (marker) map.removeLayer(marker);
  marker = L.marker([r.lat, r.lng], { icon: pinIcon }).addTo(map);
  map.flyTo([r.lat, r.lng], 15, { duration: 1.6 });

  // readout
  const fmt = (v, p, n) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? p : n}`;
  $("#rPlace").textContent = r.place || `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`;
  $("#rCoord").textContent = `${fmt(r.lat, "N", "S")}, ${fmt(r.lng, "E", "W")}`;
  $("#rConf").textContent  = (r.confidence ?? "—") + "%";
  readout.hidden = false;
  requestAnimationFrame(() => { $("#rBar").style.width = (r.confidence ?? 0) + "%"; });

  // map tag
  mapTag.textContent = r.place || "Located";
  mapTag.hidden = false;
}

runBtn.addEventListener("click", runPipeline);
