# Sidharth Monangi — Portfolio

A hand-built, single-page portfolio for the Skillinf Portfolio Design Hackathon 2026.
**Theme: software that survives** — offline-first apps, attack-tested AI, real-time detection.

## Highlights
- **WebGL particle engine** (Three.js + custom GLSL): ~15k particles spell the name, then morph per section (globe → shield → vortex → helix → portal). Cursor/touch repulsion, scroll-velocity stretch, and automatic quality fallback on slow devices.
- **The Lab — three live experiments**
  - *Jailbreak my assistant*: an AI assistant (Groq) whose instructions hide a secret code, guarded by PromptShield-style input screening and an output guard (canary in plain, spaced, reversed and base64 form, plus instruction-overlap checks). Falls back to an in-browser responder when no API is configured.
  - *Break the shield*: in-browser prompt-injection classifier (override, extraction, jailbreak, obfuscation, indirect).
  - *Catch a wash-trade*: a simplified BidirFlow-style simulation — inject a trading ring and watch it get flagged.
- **Case-study panels** for every major project (problem → approach → results), deep-linkable via `#case-<name>`.
- Pinned horizontal project gallery with code-drawn animated visuals.
- Command palette (`⌘K` / `Ctrl+K` / `/`), hidden terminal (`` ` ``), Konami code, light/dark themes, custom cursor, magnetic buttons.
- Works offline (service worker). JSON-LD, sitemap, robots, canonical + absolute OG tags at build time.
- Lighthouse (local, compressed): desktop 94 / 100 / 100 / 100, mobile 74 / 100 / 100 / 100 (perf / a11y / best practices / SEO).

## Run
```bash
npm install
npm run dev      # local dev (assistant runs in its in-browser mode)
npm run build    # outputs dist/
```

## Deploy (Vercel — recommended, enables the live AI assistant)
1. Import the repo at vercel.com/new (framework: Vite; build `npm run build`; output `dist`).
2. Project → Settings → Environment Variables: add `GROQ_API_KEY` (free at console.groq.com). Optional: `GROQ_MODEL` (default `llama-3.1-8b-instant`), `ASSISTANT_CANARY`.
3. Redeploy. The Lab badge switches from “offline · in-browser model” to “live · <model>”.

`SITE_URL` is picked up automatically on Vercel for canonical/OG/sitemap; set it yourself elsewhere.

GitHub Pages alternative: enable Settings → Pages → Source “GitHub Actions”; `.github/workflows/pages.yml` deploys on push to `main` (the assistant uses its in-browser mode there).

## Your media (optional, picked up automatically at build time)
- `public/me.jpg` — portrait (4:5) shown in About.
- `public/shots/*.jpg` — project screenshots shown in case studies (names in `public/shots/README.md`).

## Résumé
`public/resume.pdf` is generated from `resume/resume.html` (phone number removed). To regenerate, open it in Chrome → Print → Save as PDF (A4, margins none).
