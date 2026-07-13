# Lumi — AI companion landing page

A concept landing page for **Lumi**, a warm, funny AI companion you talk to when
you're bored, overthinking, or just need to vent — therapist energy, minus the
clinical part.

The design is inspired by dreamy, calm, glassmorphic interfaces: a floating
"app preview" card with a dusty-blue dreamscape, a glossy breathing orb, a live
self-playing conversation, and soft blur-to-focus reveals on scroll.

## Run it

It's a static site — no build step, no dependencies. Just open `index.html`,
or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and copy |
| `styles.css` | Dreamscape background, glass, glossy orb, animations, responsive layout |
| `script.js` | Self-playing chat, live "listening" timer, scroll reveals, vibe-card previews |

## Highlights

- **Split hero** — clean pitch panel + dreamy live demo with a glass chat card
- **Self-playing conversation** that types, loops, and stays warm/judgment-free
- **"Choose your vibe"** personality cards (Listener, Hype Friend, Deep Diver, Goofball)
- **Accessible touches** — `prefers-reduced-motion` support, keyboard-focusable cards
- Fully responsive down to mobile

> Note: Lumi is a concept for a supportive companion, not a substitute for
> professional care. The page includes a visible crisis-resources reminder.
