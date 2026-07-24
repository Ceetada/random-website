# Netryx Astra V2 — front-end

A clean, dark, HUD-style landing page and **interactive demo** for the
open-source [Netryx Astra V2 Geolocation Tool](https://github.com/sparkyniner/Netryx-Astra-V2-Geolocation-Tool)
— a system that recovers GPS coordinates from a single photograph using
MegaLoc retrieval and MASt3R dense matching.

## What this is

A static site (no build step, no dependencies) that:

- explains the three-stage **Retrieval → Matching → Consensus** pipeline,
- lets you drop in a photo and **visualise each stage running**, ending on a
  coordinate pinned to a stylised map,
- is honest that the demo is a UI simulation — the real geolocation needs the
  Python engine and GPU.

## Run it

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Or just open `index.html`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Structure and copy |
| `styles.css` | Dark cinematic theme, HUD panels, map, animations, responsive |
| `script.js` | Drag-and-drop upload + simulated pipeline + scroll reveals |

## Wiring it to the real engine

The demo's `runPipeline()` in `script.js` is the only place to change. Replace
the staged timers with a `fetch()` to a small server that wraps the Netryx
Astra Python CLI, and feed the returned `{ place, lat, lng, confidence, matches }`
into `showResult()`.

> Not affiliated with the original authors — this is a concept front-end.
