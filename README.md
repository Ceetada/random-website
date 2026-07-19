# Tada

*A Journal of Applied Overthinking* — rigorously-argued proofs of things that
absolutely did not need proving.

This is a **static site**: a single self-contained `index.html` (all CSS/JS
inline, no build step, no dependencies). It deploys as-is on any static host.

## Files
- `index.html` — the site: math-wall hero, parody-paper flip-book, full-paper reader.
- `tada.html` — an earlier "box reveal" design, kept for reference.
- `backend/` — an early, superseded Next.js publishing prototype. **Not used by
  the live site** and intentionally excluded from deploys. Preserved for when we
  build the real "log in and publish" backend.

## Deploying on Vercel
Import the repo and deploy — no configuration needed. Because the root has no
`package.json`, Vercel treats it as a static site and serves `index.html`
directly. (`vercel.json` just enables clean URLs, so `/tada` serves `tada.html`.)

## Local preview
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```
