/* ───────────────────────── Netryx Astra V2 — demo UI ─────────────────────────
   A faithful *visualisation* of the retrieval → matching → consensus pipeline.
   It does not run the real MegaLoc/MASt3R models (those need Python + GPU);
   swap runPipeline() for a fetch() to your engine to make it live. */

const $ = (sel) => document.querySelector(sel);

const drop      = $("#drop");
const fileInput = $("#file");
const preview   = $("#preview");
const dropEmpty = $("#dropEmpty");
const sampleBtn = $("#sampleBtn");
const runBtn    = $("#run");
const pipeItems = [...document.querySelectorAll("#pipe li")];
const map       = $("#map");
const mapEmpty  = $("#mapEmpty");
const pin       = $("#pin");
const result    = $("#result");

let hasImage = false;
let running  = false;

/* Plausible sample outcomes the demo rotates through. */
const SAMPLES = [
  { place: "Trocadéro, Paris, FR",        lat: 48.8617, lng:  2.2876, x: 41, y: 33 },
  { place: "Shibuya Crossing, Tokyo, JP", lat: 35.6595, lng: 139.7005, x: 63, y: 58 },
  { place: "Brooklyn Bridge, NYC, US",    lat: 40.7061, lng: -73.9969, x: 28, y: 61 },
  { place: "Camden Lock, London, UK",     lat: 51.5416, lng: -0.1465,  x: 55, y: 26 },
  { place: "Gothic Quarter, Barcelona",   lat: 41.3833, lng:  2.1777,  x: 47, y: 47 },
];

/* ── image input ── */
function loadImage(src) {
  preview.src = src;
  preview.hidden = false;
  dropEmpty.hidden = true;
  hasImage = true;
  runBtn.disabled = false;
  resetPipeline();
}

fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (f) loadImage(URL.createObjectURL(f));
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
  if (f && f.type.startsWith("image/")) loadImage(URL.createObjectURL(f));
});

sampleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  loadImage("image-1784232959837.png");
});

/* ── pipeline ── */
const STAGE_COPY = [
  ["scanning 500 candidates", "487 shortlisted"],
  ["dense correspondence",    "matches found"],
  ["clustering ~50 m cells",  "consensus locked"],
];

function resetPipeline() {
  pipeItems.forEach((li, i) => {
    li.classList.remove("active", "done");
    li.querySelector(".pl-status").textContent = "idle";
  });
  result.hidden = true;
  pin.classList.remove("show");
  mapEmpty.style.opacity = "1";
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPipeline() {
  if (running || !hasImage) return;
  running = true;
  runBtn.disabled = true;
  runBtn.querySelector("span").textContent = "";
  runBtn.childNodes[0].nodeValue = "Processing… ";
  resetPipeline();

  const sample  = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  const matches = 180 + Math.floor(Math.random() * 240);
  const conf    = 78 + Math.floor(Math.random() * 18);

  for (let i = 0; i < pipeItems.length; i++) {
    const li = pipeItems[i];
    const status = li.querySelector(".pl-status");
    li.classList.add("active");
    status.textContent = STAGE_COPY[i][0];
    await wait(900 + Math.random() * 700);
    li.classList.remove("active");
    li.classList.add("done");
    status.textContent = i === 1 ? `${matches} ${STAGE_COPY[i][1]}` : STAGE_COPY[i][1];
  }

  showResult(sample, matches, conf);

  running = false;
  runBtn.disabled = false;
  runBtn.childNodes[0].nodeValue = "Run again ";
  runBtn.querySelector("span").textContent = "→";
}

function showResult(s, matches, conf) {
  mapEmpty.style.opacity = "0";
  pin.style.left = s.x + "%";
  pin.style.top  = s.y + "%";
  requestAnimationFrame(() => pin.classList.add("show"));

  const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
  $("#rPlace").textContent = s.place;
  $("#rCoord").textContent = `${fmt(s.lat, "N", "S")}, ${fmt(s.lng, "E", "W")}`;
  $("#rConf").textContent  = conf + "%";
  $("#rMatch").textContent = `${matches} inliers`;
  result.hidden = false;
  requestAnimationFrame(() => { $("#rBar").style.width = conf + "%"; });
}

runBtn.addEventListener("click", runPipeline);

/* ── scroll reveals ── */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll("section > .section-head, .stage, .feat, .hero-stats, .console, .specs-cols, .cta > *")
  .forEach((el, i) => { el.classList.add("reveal"); el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
