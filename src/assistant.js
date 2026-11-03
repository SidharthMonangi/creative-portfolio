import gsap from 'gsap';
import { classify } from './shield-core.js';
import { PROFILE } from './profile.js';

const LOCAL_CANARY = 'ORCHID-4471';

/* ---------- offline responder: keyword intents over the profile ---------- */
const INTENTS = [
  { k: /bidir|wash|trading|ethereum|fpga|verilog|patent/i, a: () => PROFILE.projects.BidirFlow },
  { k: /field ?proof|offline|evidence|indexeddb|cloudflare/i, a: () => PROFILE.projects.FieldProof },
  { k: /prompt ?shield|injection|red.?team|lovhack/i, a: () => PROFILE.projects.PromptShield },
  { k: /q-?soc|quantum|soc\b|mitre|ieee|paper|research|publication/i, a: () => `${PROFILE.projects['Q-SOC']} He is also first author on RescueSched.` },
  { k: /rescue|sched|gpu|mobilenet|disaster/i, a: () => PROFILE.projects.RescueSched },
  { k: /study ?sync|pomodoro|flashcard/i, a: () => PROFILE.projects['StudySync AI'] },
  { k: /project|built|build|work|portfolio/i, a: () => 'Highlights: BidirFlow (real-time wash-trading detection on FPGA, 0.963 avg precision), FieldProof (offline-first evidence app, 90 CI tests), PromptShield (25-attack chatbot red-team), plus research on Q-SOC and RescueSched. Ask about any of them!' },
  { k: /skill|stack|language|tech|know|framework/i, a: () => PROFILE.skills },
  { k: /educat|college|university|vit|cgpa|gpa|school|degree|graduat/i, a: () => PROFILE.education },
  { k: /cert|oracle|oci|achiev|award|hackathon|hackcellence/i, a: () => PROFILE.achievements },
  { k: /hire|intern|job|role|available|open to|opportunit|relocat/i, a: () => `${PROFILE.availability} ${PROFILE.location}` },
  { k: /contact|email|mail|reach|linkedin|github|resume|résumé|cv/i, a: () => PROFILE.contact },
  { k: /where|live|from|kuwait|india|based/i, a: () => PROFILE.location },
  { k: /football|sport|hobby|hobbies|fun|captain|languages?|french|telugu/i, a: () => PROFILE.personal },
  { k: /^(hi|hey|hello|yo|sup)\b/i, a: () => 'Hey! I’m Sid-bot. Ask me about Sidharth’s projects, skills or availability — or try to make me leak my secret code. (You won’t.)' },
  { k: /who|about|tell me|summar|introduc/i, a: () => `${PROFILE.headline} ${PROFILE.availability}` },
];
function localReply(text) {
  const v = classify(text);
  if (v.blocked) {
    const cat = v.hits[0].rule.cat.toLowerCase();
    return { reply: `Nice try — that reads as ${cat}. I’m staying in role and the secret code stays secret. Fun fact: Sidharth built PromptShield to test chatbots against exactly this. Want to hear how it grades them?`, verdict: { flagged: true, category: v.hits[0].rule.cat, score: v.score }, leak: null };
  }
  if (/secret|code|password|canary|key/i.test(text)) {
    return { reply: 'There is a secret code in my instructions, and my whole job on this page is to never say it. Try harder — or ask me something about Sidharth instead.', verdict: { flagged: true, category: 'Secret probing', score: 0.6 }, leak: null };
  }
  const hit = INTENTS.find((i) => i.k.test(text));
  return { reply: hit ? hit.a() : 'I only know about Sidharth — his projects, skills, education and how to reach him. Try “What is BidirFlow?” or “Is he open to internships?”', verdict: { flagged: false }, leak: null };
}

/* ---------- UI ---------- */
export function initAssistant(root, { onAttack } = {}) {
  if (!root) return;
  const log = root.querySelector('[data-chat-log]');
  const form = root.querySelector('[data-chat-form]');
  const input = form.querySelector('input');
  const modeEl = root.querySelector('[data-chat-mode]');
  const stats = { attempts: root.querySelector('[data-chat-attacks]'), guarded: root.querySelector('[data-chat-leaks]') };
  const history = [];
  let mode = 'unknown', attacks = 0, guarded = 0, busy = false;

  const setMode = (m, label) => { mode = m; modeEl.textContent = label; modeEl.dataset.mode = m; };
  setMode('unknown', 'connecting…');

  function bubble(role, text, meta) {
    const el = document.createElement('div');
    el.className = `msg msg--${role}`;
    const p = document.createElement('p');
    p.textContent = text;
    el.appendChild(p);
    if (meta) {
      const m = document.createElement('span');
      m.className = 'msg__meta mono';
      m.textContent = meta;
      el.appendChild(m);
    }
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    gsap.from(el, { y: 14, opacity: 0, duration: 0.45, ease: 'power3.out' });
    return el;
  }
  function typing() {
    const el = document.createElement('div');
    el.className = 'msg msg--bot msg--typing';
    el.innerHTML = '<p><i></i><i></i><i></i></p>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  async function ask(text) {
    if (mode !== 'local') {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 15000);
        const r = await fetch('./api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }), signal: ctrl.signal });
        clearTimeout(t);
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('json')) {
          const d = await r.json();
          if (d.error) throw new Error(d.error);
          setMode('live', `live · ${d.model || 'llm'}`);
          return d;
        }
        if (r.status === 429) return { reply: 'You’re sending a lot of attacks — give me a minute to cool down. (Rate limited.)', verdict: { flagged: false } };
      } catch (e) { /* fall through to local */ }
      setMode('local', 'offline · in-browser model');
    }
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 400));
    return localReply(text);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim().slice(0, 700);
    if (!text || busy) return;
    busy = true; input.value = '';
    bubble('user', text);
    history.push({ role: 'user', content: text });
    const t = typing();
    const d = await ask(text);
    t.remove();
    let meta = '';
    if (d.verdict?.flagged) { attacks++; meta = `⚑ attack detected · ${d.verdict.category}`; onAttack?.(); }
    if (d.leak) { guarded++; meta = `⛨ output guard blocked a leak (${d.leak})`; }
    if (d.reply.includes(LOCAL_CANARY)) d.reply = '[redacted]';
    stats.attempts.textContent = attacks; stats.guarded.textContent = guarded;
    const el = bubble('bot', d.reply, meta || null);
    if (d.verdict?.flagged || d.leak) el.classList.add('msg--alert');
    history.push({ role: 'assistant', content: d.reply });
    if (history.length > 12) history.splice(0, history.length - 12);
    busy = false;
  });

  root.querySelectorAll('[data-ask]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.ask; form.requestSubmit(); }));

  // static hosts have no /api — go straight to the in-browser model
  if (/github\.io$|^localhost$|^127\./.test(location.hostname) || location.protocol === 'file:') { setMode('local', 'offline · in-browser model'); return; }
  // probe once so the badge is honest before the first message
  fetch('./api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"probe":true}' })
    .then(async (r) => {
      const d = (r.headers.get('content-type') || '').includes('json') ? await r.json().catch(() => ({})) : null;
      if (d && d.ok) setMode('live', `live · ${d.model || 'llm'}`); else setMode('local', 'offline · in-browser model');
    })
    .catch(() => setMode('local', 'offline · in-browser model'));
}
