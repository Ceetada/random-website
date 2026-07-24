"""
Netryx Astra V2 — headless engine adapter.

The upstream tool (test_super.py) is a Tkinter GUI. Its GUI is only built under
`if __name__ == "__main__"`, so the module imports cleanly and every pipeline
primitive we need is module-level:

    encode_query, search_compact_index, get_lazy_mast3r, get_mast3r_matches,
    tiles_info, download_tiles, stitch_tiles, pil_to_tensor, tensor_to_pil,
    get_projection_base_dirs, equirectangular_to_rectilinear_torch

This adapter replicates the core of `_run_search` without any GUI, so a web
server can geolocate an image and get back plain coordinates.

If the engine (or its models / a city index) isn't installed, `geolocate()`
returns a clearly-labeled *simulation* result so the whole stack still runs
end-to-end. Nothing here pretends a simulated fix is real — the response always
carries `engine: "live"` or `engine: "simulation"`.

Point it at a checkout of the tool with the NETRYX_HOME env var:

    export NETRYX_HOME=/path/to/Netryx-Astra-V2-Geolocation-Tool
"""

from __future__ import annotations

import os
import sys
import math
import random
import importlib
from typing import Callable, Optional

# ─────────────────────────── engine discovery ───────────────────────────

NETRYX_HOME = os.environ.get("NETRYX_HOME", "").strip()
_ns = None                 # the imported test_super module, if available
_engine_error: str = ""    # why the live engine is unavailable


def _try_import_engine():
    """Import the upstream module once, recording why if it fails."""
    global _ns, _engine_error
    if _ns is not None or _engine_error:
        return _ns
    if not NETRYX_HOME:
        _engine_error = "NETRYX_HOME is not set — running in simulation mode."
        return None
    if not os.path.isdir(NETRYX_HOME):
        _engine_error = f"NETRYX_HOME does not exist: {NETRYX_HOME}"
        return None
    try:
        if NETRYX_HOME not in sys.path:
            sys.path.insert(0, NETRYX_HOME)
        _ns = importlib.import_module("test_super")
        return _ns
    except Exception as e:  # torch missing, mast3r not cloned, etc.
        _engine_error = f"{type(e).__name__}: {e}"
        return None


def engine_status() -> dict:
    """Report whether the live engine and an index are ready."""
    ns = _try_import_engine()
    if ns is None:
        return {"available": False, "reason": _engine_error, "index": None}
    index_dir = getattr(ns, "COMPACT_INDEX_DIR", None)
    meta = getattr(ns, "COMPACT_META_PATH", None)
    has_index = bool(meta and os.path.exists(meta))
    return {
        "available": True,
        "reason": "" if has_index else "Engine imported but no index found.",
        "index": index_dir,
        "has_index": has_index,
        "encoder": getattr(ns, "ACTIVE_ENCODER", None),
    }


# ─────────────────────────── helpers ───────────────────────────

def _confidence_from_inliers(inliers: int) -> int:
    """Map MASt3R dense-match count to a 0–100 confidence.

    The GUI treats >150 dense patches as a strong match and 50 as the floor.
    We map that band onto a percentage for display.
    """
    if inliers <= 50:
        return max(0, int(inliers))
    # 50 -> ~55%, 150 -> ~85%, 300+ -> ~98%
    pct = 55 + 43 * (1 - math.exp(-(inliers - 50) / 120.0))
    return int(min(99, round(pct)))


def _default_search_area(ns) -> tuple[tuple[float, float], float]:
    """Derive a (center, radius_km) that covers the installed index."""
    import numpy as np
    meta_path = getattr(ns, "COMPACT_META_PATH", None)
    if not meta_path or not os.path.exists(meta_path):
        raise RuntimeError("No index metadata found — build or import an index first.")
    meta = np.load(meta_path, allow_pickle=True)
    lats, lons = meta["lats"], meta["lons"]
    clat, clon = float(np.mean(lats)), float(np.mean(lons))
    # radius = farthest point from centre, padded a touch
    radius = 0.0
    for la, lo in zip(lats, lons):
        radius = max(radius, ns.haversine((clat, clon), (float(la), float(lo))))
    return (clat, clon), max(0.5, radius * 1.1)


def _reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """Best-effort place name via Nominatim. Offline-safe: returns None on any failure."""
    try:
        import urllib.request
        import urllib.parse
        import json
        q = urllib.parse.urlencode({"lat": lat, "lon": lon, "format": "json", "zoom": "16"})
        req = urllib.request.Request(
            "https://nominatim.openstreetmap.org/reverse?" + q,
            headers={"User-Agent": "netryx-astra-frontend/1.0"},
        )
        with urllib.request.urlopen(req, timeout=6) as r:
            data = json.load(r)
        a = data.get("address", {})
        parts = [
            a.get("road") or a.get("neighbourhood") or a.get("suburb"),
            a.get("city") or a.get("town") or a.get("village") or a.get("county"),
            a.get("country_code", "").upper() or a.get("country"),
        ]
        parts = [p for p in parts if p]
        return ", ".join(parts) if parts else data.get("display_name")
    except Exception:
        return None


# ─────────────────────────── live pipeline ───────────────────────────

def _geolocate_live(
    ns,
    image_path: str,
    center: Optional[tuple[float, float]],
    radius_km: Optional[float],
    crop_fov: int = 90,
    crop_size: int = 512,
    top_n: int = 500,
    on_status: Optional[Callable[[str, dict], None]] = None,
) -> dict:
    """Headless reimplementation of test_super's `_run_search` core."""
    import numpy as np
    from PIL import Image

    def status(stage, **kw):
        if on_status:
            on_status(stage, kw)

    if center is None or radius_km is None:
        center, radius_km = _default_search_area(ns)

    # PCA (MegaLoc only)
    if getattr(ns, "ENCODER_USES_PCA", False):
        pca_path = os.path.join(ns.COMPACT_INDEX_DIR, "megaloc_pca.pkl")
        if os.path.exists(pca_path):
            from megaloc_utils import load_pca, _pca_model  # noqa: F401
            if _pca_model is None:
                load_pca(pca_path)

    # Stage 1 — retrieval
    status("retrieval", msg="Encoding query descriptor")
    query_img = Image.open(image_path).convert("RGB")
    q = query_img.resize((crop_size, crop_size), Image.BILINEAR)

    desc_original = ns.encode_query(q)
    w, h = q.size
    mx, my = int(w * 0.1), int(h * 0.1)
    zoom = q.crop((mx, my, w - mx, h - my)).resize((crop_size, crop_size), Image.BILINEAR)
    desc_zoom = ns.encode_query(zoom)
    desc = 0.65 * desc_original + 0.35 * desc_zoom
    desc = desc / (np.linalg.norm(desc) + 1e-8)

    flip = q.transpose(Image.FLIP_LEFT_RIGHT)
    desc_f = ns.encode_query(flip)
    desc_fz = ns.encode_query(flip.crop((mx, my, w - mx, h - my)).resize((crop_size, crop_size), Image.BILINEAR))
    desc_f = 0.65 * desc_f + 0.35 * desc_fz
    desc_f = desc_f / (np.linalg.norm(desc_f) + 1e-8)

    status("retrieval", msg="Searching index (original + flipped)")
    res_o = ns.search_compact_index(query_desc=desc, center=center, radius_km=radius_km, top_k=500)
    res_f = ns.search_compact_index(query_desc=desc_f, center=center, radius_km=radius_km, top_k=500)
    seen = {}
    for r in res_o + res_f:
        k = r["panoid"]
        if k not in seen or r["score"] > seen[k]["score"]:
            seen[k] = r
    candidates = sorted(seen.values(), key=lambda x: x["score"], reverse=True)[:1000]
    status("retrieval", msg=f"{len(candidates)} candidates shortlisted", candidates=len(candidates))

    if not candidates:
        return {"found": False, "reason": "No candidates in search radius."}

    # Stage 2 — MASt3R dense matching
    status("matching", msg="Loading MASt3R")
    mast3r = ns.get_lazy_mast3r()
    if mast3r is None:
        raise RuntimeError("MASt3R model unavailable — is naver/mast3r cloned alongside the tool?")

    candidates = candidates[:top_n]
    base_dirs = ns.get_projection_base_dirs(crop_fov, (crop_size, crop_size))
    best = {"inliers": 0, "panoid": None, "heading": None, "lat": None, "lon": None}

    for i, m in enumerate(candidates):
        pid, hdg = m.get("panoid"), m.get("heading")
        if not pid or hdg is None:
            continue
        if i % 25 == 0:
            status("matching", msg=f"MASt3R {i + 1}/{len(candidates)}", i=i, total=len(candidates))
        try:
            tiles = ns.tiles_info(pid)
            td = ns.download_tiles(tiles, max_workers=16)
            if not td:
                continue
            pano = ns.stitch_tiles(td)
            if pano.size[0] > 2048:
                pano = pano.resize((2048, int(pano.size[1] * (2048 / pano.size[0]))), Image.BILINEAR)
            pano_t = ns.pil_to_tensor(pano)
            crop_t = ns.equirectangular_to_rectilinear_torch(
                pano_t, fov_deg=crop_fov, out_hw=(crop_size, crop_size),
                yaw_deg=[hdg], pitch_deg=0, base_dirs=base_dirs,
            )[0].unsqueeze(0)
            crop_pil = ns.tensor_to_pil(crop_t)
            m0, _m1, _conf = ns.get_mast3r_matches(q, crop_pil, mast3r)
            score = len(m0)
        except Exception:
            continue
        if score > best["inliers"]:
            best = {"inliers": score, "panoid": pid, "heading": hdg,
                    "lat": m.get("lat"), "lon": m.get("lon")}

    # Stage 3 — consensus / decision
    status("consensus", msg="Scoring best cluster", inliers=best["inliers"])
    if best["inliers"] <= 50 or best["lat"] is None:
        return {"found": False, "reason": f"No confident match (best {best['inliers']} inliers)."}

    lat, lon = float(best["lat"]), float(best["lon"])
    return {
        "found": True,
        "engine": "live",
        "lat": lat,
        "lng": lon,
        "confidence": _confidence_from_inliers(best["inliers"]),
        "matches": int(best["inliers"]),
        "heading": best["heading"],
        "panoid": best["panoid"],
        "place": _reverse_geocode(lat, lon) or f"{lat:.5f}, {lon:.5f}",
    }


# ─────────────────────────── simulation fallback ───────────────────────────

_SIM = [
    ("Trocadéro, Paris, FR",        48.8617,   2.2876),
    ("Shibuya Crossing, Tokyo, JP", 35.6595, 139.7005),
    ("Brooklyn Bridge, NYC, US",    40.7061, -73.9969),
    ("Camden Lock, London, UK",     51.5416,  -0.1465),
    ("Gothic Quarter, Barcelona",   41.3833,   2.1777),
]


def _geolocate_sim() -> dict:
    place, lat, lng = random.choice(_SIM)
    return {
        "found": True,
        "engine": "simulation",
        "lat": lat,
        "lng": lng,
        "confidence": random.randint(78, 96),
        "matches": random.randint(180, 420),
        "place": place,
        "reason": _engine_error or "Live engine not configured.",
    }


# ─────────────────────────── public API ───────────────────────────

def geolocate(image_path: str, center=None, radius_km=None, on_status=None) -> dict:
    """Geolocate an image. Uses the live engine when available, else simulates."""
    ns = _try_import_engine()
    if ns is None:
        return _geolocate_sim()
    try:
        return _geolocate_live(ns, image_path, center, radius_km, on_status=on_status)
    except Exception as e:
        # Never fail the request outright — degrade to a labeled simulation.
        result = _geolocate_sim()
        result["reason"] = f"Live engine error, simulated instead: {type(e).__name__}: {e}"
        return result
