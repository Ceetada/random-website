# assets

## `hero.jpg` — the cinematic hero photograph

Drop your hero image here as **`hero.jpg`** and it will automatically take over
the hero background. No code change needed — `styles.css` already references it:

```css
.cine__bg { background-image: url("assets/hero.jpg"), /* …atmospheric fallback… */ }
```

If `hero.jpg` is absent, the hero falls back gracefully to a hand-built
atmospheric gradient (dark forest + shaft of golden light), so the page never
looks broken.

### Recommended specs
- **Format:** JPG (or WebP — if you use `hero.webp`, update the filename in `.cine__bg`)
- **Size:** ~2000–2560px wide, landscape
- **Weight:** compress to < 500 KB for fast loading
- **Composition:** keep the important subject slightly right-of-centre — the
  headline sits over the left third, and a glass caption card sits bottom-right.
  The scrim darkens the left and bottom for text legibility.
