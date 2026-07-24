# Netryx Astra V2 — backend

A thin Flask server that serves the front-end and geolocates uploaded photos by
driving the real [Netryx Astra V2](https://github.com/sparkyniner/Netryx-Astra-V2-Geolocation-Tool)
pipeline — with a labeled simulation fallback so the whole thing runs even
before the (heavy) engine is installed.

## Quick start (simulation mode)

```bash
pip install -r server/requirements.txt
python server/app.py            # → http://localhost:8000
```

Open the site, run the demo, and you'll get simulated results tagged
**"backend up · simulation"**. Good for developing the UI.

## Live mode (real geolocation)

The engine needs its own heavy dependencies (PyTorch, timm, MASt3R) and a city
index. On a machine that can run the upstream GUI tool:

```bash
# 1. Get the engine + MASt3R (see upstream README)
git clone https://github.com/sparkyniner/Netryx-Astra-V2-Geolocation-Tool.git
git clone https://github.com/naver/mast3r.git   # alongside it
pip install -r Netryx-Astra-V2-Geolocation-Tool/requirements.txt

# 2. Build or import a city index (e.g. via netryx_hub.py import city.netryx)

# 3. Point this server at the checkout and run
export NETRYX_HOME=/abs/path/to/Netryx-Astra-V2-Geolocation-Tool
pip install -r server/requirements.txt
python server/app.py
```

When `NETRYX_HOME` resolves and an index is present, the badge turns cyan
(**"live engine"**) and uploads are geolocated for real.

## API

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET`  | `/api/health` | — | `{ ok, engine: { available, has_index, encoder, reason } }` |
| `POST` | `/api/geolocate` | multipart `image` (+ optional `lat`,`lon`,`radius`) | see below |

`/api/geolocate` response:

```json
{
  "found": true,
  "engine": "live",              // "live" | "simulation"
  "lat": 48.8617, "lng": 2.2876,
  "confidence": 87,              // 0–100, from MASt3R inlier count
  "matches": 214,                // dense inliers
  "heading": 130.0,
  "panoid": "…",
  "place": "Trocadéro, Paris, FR"
}
```

If no confident match is found: `{ "found": false, "reason": "…" }` (HTTP 422).

## How it maps to the upstream code

`engine.py` reimplements the core of `test_super.py`'s `_run_search` **without the
Tkinter GUI**, reusing its module-level primitives:

`encode_query` → `search_compact_index` (original + flipped, dedup by panoid) →
`get_lazy_mast3r` + per-candidate `tiles_info`/`download_tiles`/`stitch_tiles` →
equirectangular-to-rectilinear crop → `get_mast3r_matches` → highest inlier
count wins. Confidence is derived from that inlier count; the place name is an
optional best-effort Nominatim reverse-geocode (offline-safe).
