# Lumi — AI companion landing page

A concept landing page for **Lumi**, a warm, funny AI companion you talk to when
you're bored, overthinking, or just need to vent — therapist energy, minus the
clinical part.

**Design direction:** one consistent cinematic world drawn from the hero
photograph — deep mossy-forest greens, a glowing golden sky as the single
accent, cream editorial-serif display type, and warm rust/amber pops. The page
opens on a full-bleed cinematic hero and carries that palette all the way down.

## Run it

Static site — no build step, no dependencies. Open `index.html`, or serve it:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Structure and copy |
| `styles.css` | Cinematic hero, dark-forest palette, glass, animations, responsive |
| `script.js` | Self-playing chat, live "listening" timer, scroll reveals, vibe previews |
| `assets/hero.jpg` | The hero photograph (optimized). See `assets/README.md` to swap it |

## Highlights

- **Cinematic hero** — full-bleed photo, editorial serif headline, minimal nav,
  legibility scrim, and a glass caption card
- **Consistent palette** — forest green + golden light + cream, top to bottom
- **Self-playing conversation** in a "glimpse" section — types, loops, judgment-free
- **"Choose your vibe"** personality cards (Listener, Hype Friend, Deep Diver, Goofball)
- **Accessible touches** — `prefers-reduced-motion`, keyboard-focusable cards, strong contrast
- Fully responsive down to mobile

> Note: Lumi is a concept for a supportive companion, not a substitute for
> professional care. The page includes a visible crisis-resources reminder.
