import gsap from 'gsap';

/**
 * A tiny, client-side, heuristic take on PromptShield's attack taxonomy.
 * The real tool fires 25 attacks at a live model and proves leaks with canaries;
 * this one classifies a single input so visitors can feel the idea.
 */
const RULES = [
  {
    cat: 'Instruction override', weight: 0.92,
    why: 'Tries to cancel the system prompt and install new orders.',
    re: [/\b(ignore|disregard|forget|override|bypass|skip)\b[^.]{0,40}\b(previous|prior|above|earlier|all|your|the)\b[^.]{0,25}\b(instructions?|rules?|prompts?|guidelines?|directives?|policy|policies)\b/i,
      /\bnew (instructions?|rules?)\b/i, /\bfrom now on\b/i, /\b(system|developer) (override|mode)\b/i, /\byou (must|will) now\b/i],
  },
  {
    cat: 'Prompt extraction', weight: 0.9,
    why: 'Fishes for the hidden system prompt or its secrets.',
    re: [/\b(repeat|print|reveal|show|display|output|leak|tell me|what (is|are|was))\b[^.]{0,40}\b(system prompt|instructions?|above|initial prompt|hidden|secret|canary|configuration|rules you)\b/i,
      /\bverbatim\b/i, /\beverything (above|before)\b/i, /zebra-?7731/i, /\bstarting with ['"]?you are\b/i],
  },
  {
    cat: 'Role-play jailbreak', weight: 0.86,
    why: 'Wraps the request in a persona that “has no rules”.',
    re: [/\bDAN\b/, /\b(pretend|act as|role-?play|you are now|imagine you are|stay in character|let'?s play a game)\b/i,
      /\b(no|without) (rules|restrictions|filters|limits|guidelines)\b/i, /\bjailbr(oken|eak)\b/i, /\bdeveloper mode\b/i, /\bevil (twin|ai|mode)\b/i],
  },
  {
    cat: 'Obfuscation', weight: 0.8,
    why: 'Hides the payload behind an encoding so filters miss it.',
    re: [/\b(base64|rot13|hex|binary|morse|unicode|leetspeak|caesar)\b/i, /\b(decode|decipher|deobfuscate|translate)\b[^.]{0,20}\b(this|following|and)\b/i,
      /[A-Za-z0-9+/]{16,}={0,2}/, /(\\x[0-9a-f]{2}){3,}/i, /\b1gn0r3\b|\bpr0mpt\b|\binstruct10ns\b/i],
  },
  {
    cat: 'Indirect injection', weight: 0.84,
    why: 'Smuggles instructions inside content the bot is asked to process.',
    re: [/<!--[\s\S]*-->/, /\[(system|assistant|inst)\]/i, /<\/?(system|instructions?|im_start|im_end)>/i,
      /\b(ai|assistant|bot|model)\s*[:,]\s*(please\s*)?(ignore|forward|send|email|exfiltrate|reveal)/i, /\b(forward|send|exfiltrate|post)\b[^.]{0,30}\b(data|credentials|password|history|to http|to evil)/i],
  },
];

function classify(text) {
  const hits = [];
  for (const rule of RULES) {
    for (const re of rule.re) {
      const m = text.match(re);
      if (m) { hits.push({ rule, match: m[0] }); break; }
    }
  }
  if (!hits.length) return { blocked: false, score: Math.min(0.12, text.length / 900) };
  hits.sort((a, b) => b.rule.weight - a.rule.weight);
  const score = Math.min(0.99, hits[0].rule.weight + (hits.length - 1) * 0.04);
  return { blocked: true, score, hits };
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initShield(root, { onResult } = {}) {
  if (!root) return;
  const form = root.querySelector('[data-shield-form]');
  const input = form.querySelector('input');
  const out = root.querySelector('[data-shield-out]');
  const blockedEl = root.querySelector('[data-blocked]');
  const totalEl = root.querySelector('[data-total]');
  let blocked = 0, total = 0, busy = false;

  root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    input.value = b.dataset.preset;
    form.requestSubmit();
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    busy = true;
    out.innerHTML = '';
    const steps = ['normalising input', 'checking override patterns', 'probing for extraction', 'scanning encodings', 'canary watch: ZEBRA-7731'];
    for (const s of steps) {
      const p = document.createElement('p');
      p.className = 'scanline mono';
      p.innerHTML = `<b>›</b> ${s}…`;
      out.appendChild(p);
      gsap.from(p, { opacity: 0, x: -10, duration: 0.25 });
      await new Promise((r) => setTimeout(r, 140));
    }
    const res = classify(text);
    total++; if (res.blocked) blocked++;
    blockedEl.textContent = blocked; totalEl.textContent = total;
    out.innerHTML = '';
    const v = document.createElement('div');
    v.className = `verdict ${res.blocked ? 'verdict--blocked' : 'verdict--clean'}`;
    if (res.blocked) {
      const top = res.hits[0];
      const others = res.hits.slice(1).map((h) => h.rule.cat).join(', ');
      v.innerHTML = `
        <div class="verdict__badge">BLOCKED</div>
        <div class="verdict__cat">${top.rule.cat} <span class="mono dim">· risk ${(res.score * 100).toFixed(0)}%</span></div>
        <div class="verdict__why">${top.rule.why} Evidence: <mark>${esc(top.match.slice(0, 80))}</mark>${others ? `<br/>Also matched: ${others}.` : ''}</div>
        <div class="meter"><i></i></div>`;
    } else {
      v.innerHTML = `
        <div class="verdict__badge">CLEAN</div>
        <div class="verdict__cat">Looks like a normal question <span class="mono dim">· risk ${(res.score * 100).toFixed(0)}%</span></div>
        <div class="verdict__why">No override, extraction, persona, encoding or smuggling patterns found. The canary stays safe. Think you can sneak one past? Try again.</div>
        <div class="meter"><i></i></div>`;
    }
    out.appendChild(v);
    gsap.from(v.querySelector('.verdict__badge'), { scale: 0.6, opacity: 0, duration: 0.6, ease: 'back.out(2)' });
    gsap.from(v.querySelectorAll('.verdict__cat, .verdict__why'), { y: 12, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.1 });
    gsap.fromTo(v.querySelector('.meter i'), { scaleX: 0 }, { scaleX: Math.max(res.score, 0.04), duration: 1, ease: 'power3.out' });
    if (res.blocked) gsap.fromTo(root, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    onResult?.(res);
    busy = false;
  });
}
