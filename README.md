# Sidharth Monangi — Portfolio

A hand-built, single-page portfolio for the Skillinf Portfolio Design Hackathon 2026.

**Theme: software that survives** — offline-first apps, attack-tested AI, deadline-aware systems.

## Highlights
- **WebGL particle engine** (Three.js, custom GLSL): ~15k particles spell the name, then morph per section — globe → shield → vortex → DNA helix → portal ring. Cursor/touch repulsion, scroll-velocity stretch.
- **Live prompt-injection lab** — a pocket version of PromptShield that classifies attacks in-browser (override, extraction, jailbreak, obfuscation, indirect).
- **Pinned horizontal project gallery** with animated, code-drawn project visuals (offline→sync phone, A–F security report, CPU/GPU scheduler lanes, flashcards, qubit circuit).
- Command palette (`⌘K` / `Ctrl+K` / `/`), light & dark themes, magnetic buttons, custom cursor, SplitText & scramble reveals, Lenis smooth scroll.
- **Works offline** via a service worker, just like FieldProof.
- Responsive down to 320px, `prefers-reduced-motion` respected, WebGL fallback.

## Run
```bash
npm install
npm run dev      # local dev
npm run build    # outputs dist/
```

## Résumé
`public/resume.pdf` is generated from `resume/resume.html` (phone number removed). To regenerate after edits, print that page to A4 PDF (e.g. Chrome → Print → Save as PDF, margins: none).

## Deploy
Vercel / Netlify: framework “Vite”, build `npm run build`, output `dist`.
