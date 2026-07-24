# TADA — find where a photo was taken

A single-screen web app: drop in a photo, TADA recovers the coordinates it was
taken from and drops a pin on a **real map**. White, cartographic, and simple.

It's a front-end for the open-source
[Netryx Astra V2](https://github.com/sparkyniner/Netryx-Astra-V2-Geolocation-Tool)
geolocation engine (MegaLoc retrieval + MASt3R dense matching).

## Run it

**Static (hosted demo)** — real map, sample results, no backend:

```bash
python3 -m http.server 8000    # or just open index.html
```

**With the geolocation backend** — real fixes when the engine is installed:

```bash
./run.sh                                           # simulation mode
NETRYX_HOME=/path/to/Netryx-Astra ./run.sh         # live geolocation
```

See [`server/README.md`](server/README.md) for engine setup.

## What's here

| Path | Purpose |
| --- | --- |
| `index.html` | The single hero page |
| `styles.css` | White cartographic theme, vendored Archivo + IBM Plex Mono |
| `script.js` | Upload → `/api/geolocate` (with sample fallback) → real Leaflet/OSM map |
| `assets/vendor/` | Self-hosted Leaflet + fonts (no CDN, no external JS/CSS) |
| `server/` | Flask backend that drives the real engine or a labeled simulation |
| `.github/workflows/pages.yml` | Deploys the site to GitHub Pages |

## Notes

- The map is real OpenStreetMap tiles via Leaflet; everything else is
  self-hosted, so the site has no third-party script/style dependencies.
- On the hosted static demo there is no Python engine, so results are sample
  coordinates shown on the real map. Run the backend for real geolocation.
- Not affiliated with the Netryx Astra authors — this is a concept front-end.
