import gsap from 'gsap';

/**
 * A tiny, client-side, heuristic take on PromptShield's attack taxonomy.
 * The real tool fires 25 attacks at a live model and proves leaks with canaries;
 * this one classifies a single input so visitors can feel the idea.
 */
import { classify } from './shield-core.js';

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
