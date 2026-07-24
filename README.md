# Netryx Astra V2 — front-end

A clean, dark, HUD-style landing page and **interactive demo** for the
open-source [Netryx Astra V2 Geolocation Tool](https://github.com/sparkyniner/Netryx-Astra-V2-Geolocation-Tool)
— a system that recovers GPS coordinates from a single photograph using
MegaLoc retrieval and MASt3R dense matching.

## What this is

It:

- explains the three-stage **Retrieval → Matching → Consensus** pipeline,
- lets you drop in a photo and **geolocate it** — really, when the backend +
  engine are installed; as a labeled simulation otherwise,
- projects the result onto a stylised map and reports coordinates, confidence,
  and inlier count.

## Run it

**Front-end + backend (recommended)** — one command, geolocation API included:

```bash
./run.sh                 # → http://localhost:8000  (simulation mode)
```

**Live geolocation** — point it at a checkout of the real engine:

```bash
NETRYX_HOME=/abs/path/to/Netryx-Astra-V2-Geolocation-Tool ./run.sh
```

See [`server/README.md`](server/README.md) for the full engine setup (PyTorch,
MASt3R, and a city index).

**Static only** — no backend; the demo runs a client-side simulation:

```bash
python3 -m http.server 8000   # or just open index.html
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Structure and copy |
| `styles.css` | Dark cinematic theme, HUD panels, map, animations, responsive |
| `script.js` | Upload → calls `/api/geolocate`, animates the pipeline, projects the pin (falls back to a client-side sim if no backend) |
| `server/app.py` | Flask server: serves the site + `/api/geolocate`, `/api/health` |
| `server/engine.py` | Headless adapter that drives the real Netryx pipeline (or a labeled simulation) |
| `run.sh` | One-command launcher |

## How live geolocation works

`server/engine.py` reimplements the core of the upstream `test_super.py`
`_run_search` **without its Tkinter GUI**, reusing the module's own primitives
(`encode_query`, `search_compact_index`, MASt3R matching, tile stitching,
equirectangular projection). Every response is tagged `engine: "live"` or
`engine: "simulation"` — a simulated fix is never presented as a real one.

> Not affiliated with the original authors — this is a concept front-end.
