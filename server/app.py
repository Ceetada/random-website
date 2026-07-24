"""
Netryx Astra V2 — front-end server.

Serves the static site and exposes a small JSON API the demo calls to geolocate
a real photo through the Netryx Astra engine (or a labeled simulation when the
engine isn't installed).

    pip install -r server/requirements.txt
    python server/app.py                 # http://localhost:8000

Optional — wire in the real engine:

    export NETRYX_HOME=/path/to/Netryx-Astra-V2-Geolocation-Tool
    python server/app.py
"""

import os
import tempfile

from flask import Flask, jsonify, request, send_from_directory

import engine

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
MAX_UPLOAD_MB = 20

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024

ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "engine": engine.engine_status()})


@app.post("/api/geolocate")
def geolocate():
    if "image" not in request.files:
        return jsonify({"error": "no image uploaded (field 'image')"}), 400
    f = request.files["image"]
    ext = os.path.splitext(f.filename or "")[1].lower()
    if ext not in ALLOWED:
        return jsonify({"error": f"unsupported file type '{ext}'"}), 400

    # Optional search-area override.
    def _num(name):
        v = request.form.get(name)
        try:
            return float(v) if v not in (None, "") else None
        except ValueError:
            return None

    lat, lon, radius = _num("lat"), _num("lon"), _num("radius")
    center = (lat, lon) if lat is not None and lon is not None else None

    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    try:
        f.save(tmp.name)
        tmp.close()
        result = engine.geolocate(tmp.name, center=center, radius_km=radius)
        status = 200 if result.get("found", True) else 422
        return jsonify(result), status
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


# ─────────────────────────── static site ───────────────────────────

@app.get("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:path>")
def static_files(path):
    # Don't let asset routing swallow the API namespace.
    if path.startswith("api/"):
        return jsonify({"error": "not found"}), 404
    full = os.path.join(ROOT, path)
    if os.path.isfile(full):
        return send_from_directory(ROOT, path)
    return jsonify({"error": "not found"}), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    st = engine.engine_status()
    mode = "LIVE engine" if st.get("available") and st.get("has_index") else "SIMULATION"
    print(f"\n  TADA  →  http://localhost:{port}")
    print(f"  Geolocation mode: {mode}")
    if not st.get("available"):
        print(f"  ({st.get('reason')})")
    print()
    app.run(host="0.0.0.0", port=port, debug=False)
