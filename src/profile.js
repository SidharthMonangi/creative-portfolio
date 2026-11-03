/**
 * Single source of truth about Sidharth, used by the live assistant (/api/chat)
 * and by the in-browser fallback responder. Keep it factual: everything here
 * comes from the résumé.
 */
export const PROFILE = {
  name: 'Sidharth Monangi',
  headline: 'Final-year B.Tech Computer Science and Engineering student at VIT Vellore (2023 – 2027) working across software, systems and applied AI.',
  location: 'Vellore, India — open to relocation. Raised in Kuwait.',
  availability: 'Open to Software Engineering, Full-stack and Applied AI internships and graduate roles.',
  contact: 'Email sidharthmonangi@gmail.com · LinkedIn linkedin.com/in/sidharth-monangi · GitHub github.com/SidharthMonangi. The résumé PDF is linked in the top navigation.',
  education: 'VIT Vellore, B.Tech CSE, 2023 – 2027, CGPA 7.8/10. Coursework: Data Structures and Algorithms, Operating Systems, Compiler Design, Computer Architecture, Parallel Computing. School: FAIPS Delhi Public School, Kuwait — Class XII 87%, Class X 95%.',
  skills: 'Languages: Python, Java, C, C++, JavaScript, TypeScript, SQL, Verilog. Backend & cloud: Node.js, FastAPI, Flask, Spring Boot, Cloudflare Workers, D1, R2, Vercel, Supabase, Firebase, CI/CD. Frontend: React, Vite, Tailwind, IndexedDB, offline-first sync. AI/ML: transfer learning (MobileNetV3), random forest, Gemini, Groq, RAG, LLM-as-judge, Ollama, Qiskit. Systems: streaming algorithms (Count-Min Sketch), CPU-GPU scheduling, FPGA, Linux. Security: OWASP Top 10, ASVS, OWASP LLM Top 10, prompt-injection testing, post-quantum cryptography.',
  projects: {
    BidirFlow: 'Real-time wash-trading detection (Oct 2026; Python, Verilog, FPGA). A streaming detector that flags wash trading, layering and circular trading rings on live Ethereum transfers in constant 32 MiB memory at 213,000 transfers/s (10,800x real time). 0.963 average precision on 849,118 real transfers ($61B) vs 0.009 for a Count-Min volume baseline; 0.90 and 0.94 on held-out and pre-registered windows, 0.95 on Polygon. Sketch core in Verilog, verified bit for bit against the Python model, placed and routed on a Lattice ECP5 FPGA at 77.6 MHz. Live dashboard answers natural-language queries via a local LLM (Ollama). Patent application in preparation.',
    FieldProof: 'Offline-first field-evidence platform (Oct 2026; React, TypeScript, Cloudflare Workers, D1, R2). Cases, visits, uploads and role-based review on a serverless edge backend with server-side RBAC; offline IndexedDB drafts with duplicate-safe sync (operation IDs, version checks); a cited Gemini assistant. OWASP Top 10 / ASVS L1 review of 20 API routes with Semgrep and gitleaks: fixed 10 of 15 findings, critical advisories 1 to 0, verified by 90 automated tests in CI. Live at fieldproof-vercel.vercel.app.',
    PromptShield: 'Prompt-injection tester for LLM chatbots (Oct 2026; React, Vercel, Groq, Supabase). Built solo for LovHack Season 3. Runs 25 attacks in 5 categories, scores leaks with canary tokens and an LLM judge, then rewrites the defence and reruns the suite. Live at promptshield-drab.vercel.app.',
    'Q-SOC': 'Quantum-aware Security Operations Center (2026; Python, FastAPI, Qiskit). Co-author of an IEEE paper under submission. Rule engine with 17 MITRE ATT&CK-tagged rules, attack simulator, Quantum Readiness Index, Qiskit Grover/Shor demos and ML-DSA-65 post-quantum report signing. 220/220 passing detection runs across 11 scenarios plus a 33/33 negative control; ingestion raised from 35 to 1,526 events/s by batching.',
    RescueSched: 'CPU-GPU inference scheduling for disaster imagery (2026 – 2027; Python, Flask, MobileNetV3). First author. Re-prioritises queued requests by hazard severity from a fine-tuned MobileNetV3; predicts runtimes with a random forest and picks CPU or GPU and batch size (1 to 64) by a deadline-weighted cost.',
    'StudySync AI': 'Student productivity platform (2026; React, Vite, Firebase, Gemini, GitHub Actions). Tasks, notes, Pomodoro and analytics; Gemini-generated summaries, quizzes and flashcards with usage limits and owner-only database rules.',
  },
  achievements: 'Oracle OCI Certified AI Foundations Associate, OCI Certified Foundations Associate and GitHub Foundations (2026). Shortlisted for Round 2 of Booking Holdings HackCellence 2026, a national hiring hackathon. Hackathon team lead since 2024.',
  personal: 'Football captain — interschool title in Class XII and a college tournament win; House Captain at DPS Kuwait. Speaks English, French (intermediate) and Telugu.',
};

export function profileAsText() {
  const p = PROFILE;
  return [
    `Name: ${p.name}`, `Summary: ${p.headline}`, `Location: ${p.location}`, `Availability: ${p.availability}`,
    `Contact: ${p.contact}`, `Education: ${p.education}`, `Skills: ${p.skills}`,
    ...Object.entries(p.projects).map(([k, v]) => `Project ${k}: ${v}`),
    `Achievements: ${p.achievements}`, `Personal: ${p.personal}`,
  ].join('\n');
}
