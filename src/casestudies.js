/**
 * Case-study content. Screenshots are optional: drop images into public/shots/
 * with the listed names and they appear automatically; missing ones are skipped.
 */
export const CASES = {
  bidirflow: {
    title: 'BidirFlow', kicker: 'Real-time wash-trading detection · Oct 2026', accent: '#ffb21f',
    problem: 'Wash trading inflates on-chain volume with trades that go nowhere: wallets passing the same value back and forth, or around a ring. Volume-based detectors drown in normal busy wallets, and anything that has to keep up with a live chain must run in fixed memory.',
    approach: [
      'A streaming detector for live Ethereum transfers that looks at flow that cancels out — wash trading, layering and circular rings — instead of raw volume.',
      'Runs in constant 32 MiB of memory using sketch data structures.',
      'Sketch core written in Verilog, verified bit for bit against the Python model, then placed and routed on a Lattice ECP5 FPGA.',
      'A live dashboard answers natural-language questions through a local LLM (Ollama) that calls the detector’s tools.',
    ],
    results: [
      ['0.963', 'average precision on 849,118 real transfers ($61B), vs 0.009 for a Count-Min volume baseline'],
      ['213K/s', 'transfers processed — 10,800× real time'],
      ['0.90 · 0.94', 'on held-out and pre-registered windows'],
      ['0.95', 'on Polygon, a different chain'],
      ['77.6 MHz', 'on a Lattice ECP5 FPGA'],
    ],
    stack: 'Python · Verilog · FPGA · Count-Min Sketch · Ollama',
    status: 'Patent application in preparation, so the code is private for now.',
    demo: { label: 'Try the simplified in-browser demo', href: '#lab', tab: 'flow' },
    shots: ['bidirflow-1.jpg', 'bidirflow-2.jpg'],
  },
  fieldproof: {
    title: 'FieldProof', kicker: 'Offline-first field-evidence platform · Oct 2026', accent: '#ff5a1f',
    problem: 'Housing fieldwork happens in basements, stairwells and blocks with no signal. If an app needs a connection to save a visit or a photo, the evidence gets lost or duplicated when the network comes back.',
    approach: [
      'Cases, visits, uploads and role-based review on a serverless edge backend (Cloudflare Workers, D1, R2) with server-side RBAC.',
      'Offline IndexedDB drafts with duplicate-safe sync using operation IDs and version checks.',
      'A Gemini assistant that answers with citations.',
      'An OWASP Top 10 / ASVS Level 1 review of 20 API routes using Semgrep and gitleaks.',
    ],
    results: [
      ['90', 'automated tests in CI'],
      ['10 / 15', 'security findings fixed'],
      ['1 → 0', 'critical advisories'],
    ],
    stack: 'React · TypeScript · Cloudflare Workers · D1 · R2 · IndexedDB · Gemini',
    links: [['Live site', 'https://fieldproof-vercel.vercel.app/'], ['Code', 'https://github.com/SidharthMonangi/fieldproof']],
    shots: ['fieldproof-1.jpg', 'fieldproof-2.jpg'],
  },
  promptshield: {
    title: 'PromptShield', kicker: 'Prompt-injection tester for LLM chatbots · LovHack Season 3 (solo)', accent: '#c8ff3d',
    problem: 'Teams ship chatbots with system prompts they have never attacked. Prompt injection is the #1 risk in the OWASP LLM Top 10, but testing for it is usually manual and subjective.',
    approach: [
      'An automated suite of 25 attacks in 5 categories: instruction override, prompt extraction, role-play jailbreaks, obfuscation and indirect injection.',
      'Leaks are scored with canary tokens and an LLM judge, producing an A–F grade.',
      'It then rewrites the defence and reruns the suite to prove the fix.',
    ],
    results: [['25', 'attacks · 5 categories'], ['A–F', 'security grade per chatbot'], ['Solo', 'built during LovHack Season 3']],
    stack: 'React · Vercel · Groq · Supabase',
    links: [['Live site', 'https://promptshield-drab.vercel.app/'], ['Code', 'https://github.com/SidharthMonangi/promptshield']],
    demo: { label: 'Try to jailbreak my assistant', href: '#lab', tab: 'chat' },
    shots: ['promptshield-1.jpg', 'promptshield-2.jpg'],
  },
  rescuesched: {
    title: 'RescueSched', kicker: 'CPU-GPU inference scheduling · first author · 2026 – 2027', accent: '#5b8cff',
    problem: 'After a disaster, image-analysis requests pile up faster than hardware can process them, and first-come-first-served means the worst damage can wait behind routine images.',
    approach: [
      'A fine-tuned MobileNetV3 estimates each image’s hazard severity, and queued requests are re-prioritised by it.',
      'A random forest predicts runtimes.',
      'A deadline-weighted cost picks CPU or GPU and a batch size from 1 to 64 for each dispatch.',
    ],
    results: [['MobileNetV3', 'hazard-severity model'], ['1–64', 'adaptive batch size'], ['CPU / GPU', 'chosen per request']],
    stack: 'Python · Flask · MobileNetV3 · Random Forest',
    status: 'First-author research in progress.',
    shots: ['rescuesched-1.jpg'],
  },
  studysync: {
    title: 'StudySync AI', kicker: 'Student productivity platform · 2026', accent: '#ff3d8b',
    problem: 'Students juggle tasks, notes and revision across too many apps, and turning notes into practice material takes time they don’t have.',
    approach: [
      'Tasks, notes, a Pomodoro timer and analytics in one React + Vite app.',
      'Gemini turns notes into summaries, quizzes and flashcards, with per-user usage limits and a rate-limit fallback.',
      'Owner-only Firestore rules tested against tampering; shipped with GitHub Actions to Vercel.',
    ],
    results: [['Gemini', 'summaries · quizzes · flashcards'], ['Owner-only', 'data rules, tamper-tested'], ['CI/CD', 'GitHub Actions → Vercel']],
    stack: 'React · Vite · Firebase · Gemini · GitHub Actions',
    links: [['Code', 'https://github.com/SidharthMonangi/studysync']],
    shots: ['studysync-1.jpg'],
  },
  qsoc: {
    title: 'Q-SOC', kicker: 'Quantum-aware SOC · co-author · IEEE paper under submission', accent: '#a46bff',
    problem: 'Security operations centres triage today’s threats, but much of today’s cryptography will not survive large quantum computers. A SOC needs to know how quantum-ready an organisation is, and its own reports must stay trustworthy.',
    approach: [
      'A rule engine with 17 rules tagged to MITRE ATT&CK, plus an attack simulator.',
      'A Quantum Readiness Index, and Qiskit demos of Grover and Shor.',
      'Reports signed with the post-quantum ML-DSA-65 scheme.',
    ],
    results: [['220 / 220', 'passing detection runs across 11 scenarios'], ['33 / 33', 'negative-control runs clean'], ['35 → 1,526', 'events/s ingestion after batching']],
    stack: 'Python · FastAPI · Qiskit · MITRE ATT&CK · ML-DSA-65',
    status: 'IEEE paper under submission.',
    shots: ['qsoc-1.jpg'],
  },
};
