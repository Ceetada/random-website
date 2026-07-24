#!/usr/bin/env bash
# Launch the Netryx Astra front-end + geolocation backend.
#
#   ./run.sh                     # simulation mode (no engine needed)
#   NETRYX_HOME=/path ./run.sh   # live mode (real geolocation)
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8000}"

if ! python3 -c "import flask" 2>/dev/null; then
  echo "Installing front-end deps…"
  pip install -r server/requirements.txt
fi

echo "Starting Netryx Astra on http://localhost:${PORT}"
PORT="$PORT" python3 server/app.py
