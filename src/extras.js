import gsap from 'gsap';
import { CASES } from './casestudies.js';
import { PROFILE } from './profile.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ======================= CASE-STUDY PANEL ======================= */
function mediaInfo() {
  try { return JSON.parse(document.documentElement.dataset.media || '{}'); } catch (e) { return {}; }
}

export function initCaseStudies({ lenis, go, openLabTab }) {
  const available = new Set(mediaInfo().shots || []);
  const panel = document.querySelector('.case');
  const body = panel.querySelector('.case__body');
  const closeBtn = panel.querySelector('[data-case-close]');
  let lastFocus = null, open = false;

  function render(key) {
    const c = CASES[key];
    panel.style.setProperty('--accent', c.accent);
    const links = (c.links || []).map(([l, h]) => `<a class="btn" href="${h}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join('');
    const demo = c.demo ? `<a class="btn btn--solid" href="${c.demo.href}" data-case-demo="${c.demo.tab}">${esc(c.demo.label)} →</a>` : '';
    body.innerHTML = `
      <p class="mono case__kicker">${esc(c.kicker)}</p>
      <h2 class="case__title" id="case-title">${esc(c.title)}</h2>
      <div class="case__shots" data-shots></div>
      <div class="case__grid">
        <section><h3 class="mono">The problem</h3><p>${esc(c.problem)}</p></section>
        <section><h3 class="mono">The approach</h3><ul>${c.approach.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></section>
      </div>
      <section class="case__results"><h3 class="mono">The results</h3><div>${c.results.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div></section>
      <p class="case__stack mono">${esc(c.stack)}</p>
      ${c.status ? `<p class="lock-note mono">🔒 ${esc(c.status)}</p>` : ''}
      <div class="case__links">${demo}${links}</div>`;
    // optional screenshots
    const wrap = body.querySelector('[data-shots]');
    (c.shots || []).filter((n) => available.has(n)).forEach((name) => {
      const img = new Image();
      img.alt = `${c.title} screenshot`;
      img.decoding = 'async';
      // justified row: each image's flex-grow is its aspect ratio, so heights match
      img.onload = () => { img.style.flex = `${img.naturalWidth / img.naturalHeight} 1 0`; wrap.appendChild(img); wrap.classList.add('has-shots'); };
      img.title = 'Open full size';
      img.addEventListener('click', () => open(img.src, '_blank', 'noopener'));
      img.src = `./shots/${name}`;
    });
    const d = body.querySelector('[data-case-demo]');
    d?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); close(); setTimeout(() => { go('#lab'); openLabTab?.(d.dataset.caseDemo); }, 350); });
  }

  function show(key) {
    if (!CASES[key]) return;
    render(key);
    lastFocus = document.activeElement;
    panel.hidden = false; open = true;
    lenis?.stop();
    body.scrollTop = 0;
    gsap.fromTo(panel.querySelector('.case__sheet'), { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: 'expo.out' });
    gsap.fromTo(panel.querySelector('.case__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.from(body.children, { y: 30, opacity: 0, duration: 0.7, stagger: 0.05, delay: 0.2, ease: 'power3.out' });
    setTimeout(() => closeBtn.focus(), 50);
    history.replaceState(null, '', `#case-${key}`);
  }
  function close() {
    if (!open) return;
    open = false;
    gsap.to(panel.querySelector('.case__sheet'), { xPercent: 100, duration: 0.5, ease: 'power3.in' });
    gsap.to(panel.querySelector('.case__backdrop'), { opacity: 0, duration: 0.4, onComplete: () => { panel.hidden = true; } });
    lenis?.start();
    history.replaceState(null, '', location.pathname + location.search);
    lastFocus?.focus?.();
  }
  document.querySelectorAll('[data-case]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); show(b.dataset.case); }));
  panel.querySelectorAll('[data-case-close]').forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(); });
  // focus trap
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('a, button')].filter((x) => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  const m = location.hash.match(/^#case-(\w+)/);
  return { show, close, deepLink: m ? m[1] : null };
}

/* ======================= PHOTO SLOT ======================= */
export function initPhoto() {
  const fig = document.querySelector('[data-photo]');
  if (!fig) return;
  const img = fig.querySelector('img');
  const { photo } = mediaInfo();
  if (!photo) { fig.remove(); return; }
  img.src = `./${photo}`;
  const reveal = () => { fig.hidden = false; document.querySelector('.about__grid')?.classList.add('has-photo'); };
  if (img.complete && img.naturalWidth) reveal();
  else { img.addEventListener('load', reveal); img.addEventListener('error', () => fig.remove()); }
}

/* ======================= TERMINAL ======================= */
export function initTerminal({ toggleTheme, go, copyEmail, lenis, field, toast }) {
  const el = document.querySelector('.term');
  const out = el.querySelector('.term__out');
  const input = el.querySelector('.term__input');
  const hist = []; let hi = 0, isOpen = false;
  const print = (html, cls = '') => { const p = document.createElement('div'); p.className = `term__line ${cls}`; p.innerHTML = html; out.appendChild(p); out.scrollTop = out.scrollHeight; };
  const projects = Object.keys(PROFILE.projects);
  const slug = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

  const cmds = {
    help: () => print(['help', 'whoami', 'ls', 'cat &lt;project&gt;', 'skills', 'education', 'contact', 'resume', 'hire', 'theme', 'goto &lt;section&gt;', 'particles', 'offline', 'clear', 'exit'].map((c) => `<span class="term__k">${c}</span>`).join('  ')),
    whoami: () => print(esc(`${PROFILE.name} — ${PROFILE.headline}`)),
    ls: () => print(projects.map((p) => `<span class="term__k">${esc(slug(p))}/</span>`).join('  ')),
    cat: (a) => {
      const k = projects.find((p) => slug(p) === slug(a || '') || slug(p).startsWith(slug(a || '_')));
      k ? print(esc(PROFILE.projects[k])) : print(`cat: ${esc(a || '')}: no such project. try <span class="term__k">ls</span>`, 'term__err');
    },
    skills: () => print(esc(PROFILE.skills)),
    education: () => print(esc(PROFILE.education)),
    contact: () => { print(esc(PROFILE.contact)); copyEmail(); },
    resume: () => { print('opening résumé…'); open('./resume.pdf', '_blank', 'noopener'); },
    hire: () => { print('<span class="term__ok">✔ excellent decision.</span> drafting an email…'); setTimeout(() => (location.href = 'mailto:sidharthmonangi@gmail.com?subject=Let%E2%80%99s%20talk'), 700); },
    sudo: (a) => (/hire/.test(a || '') ? cmds.hire() : print('nice try. this incident will be reported to PromptShield.', 'term__err')),
    theme: () => { toggleTheme(); print(`theme → ${document.documentElement.dataset.theme}`); },
    goto: (a) => { const id = `#${(a || '').replace('#', '')}`; if (document.querySelector(id)) { close(); go(id); } else print('sections: about skills work lab journey contact', 'term__err'); },
    particles: () => { if (!field()) return print('webgl unavailable on this device', 'term__err'); close(); field().spellText('HIRE ME'); toast('✦ particles rearranged'); },
    offline: async () => {
      const ctl = navigator.serviceWorker?.controller;
      const keys = (await caches?.keys?.().catch(() => [])) || [];
      print(ctl ? `<span class="term__ok">service worker active</span> · caches: ${esc(keys.join(', ') || 'none')} · go offline and reload — the site still works.` : 'service worker not active yet (it registers over https after the first visit).');
    },
    clear: () => { out.innerHTML = ''; },
    exit: () => close(),
  };

  function run(line) {
    print(`<span class="term__p">sid@portfolio:~$</span> ${esc(line)}`);
    const [c, ...rest] = line.trim().split(/\s+/);
    if (!c) return;
    const fn = cmds[c.toLowerCase()];
    fn ? fn(rest.join(' ')) : print(`command not found: ${esc(c)} — type <span class="term__k">help</span>`, 'term__err');
  }
  function openT() {
    if (isOpen) return;
    isOpen = true; el.hidden = false; lenis?.stop();
    if (!out.children.length) {
      print('<span class="term__ok">sidharth.os</span> v2027.1 — you found the terminal. type <span class="term__k">help</span>.');
    }
    gsap.fromTo(el.querySelector('.term__win'), { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' });
    setTimeout(() => input.focus(), 30);
  }
  function close() { if (!isOpen) return; isOpen = false; el.hidden = true; lenis?.start(); }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const v = input.value; input.value = ''; if (v.trim()) { hist.push(v); hi = hist.length; } run(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) input.value = hist[--hi]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); input.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      const m = Object.keys(cmds).find((k) => k.startsWith(v));
      if (m) input.value = m + ' ';
    }
    else if (e.key === 'Escape') close();
  });
  el.querySelector('[data-term-close]').addEventListener('click', close);
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  addEventListener('keydown', (e) => {
    if (e.key === '`' && !e.target.closest('input, textarea')) { e.preventDefault(); isOpen ? close() : openT(); }
  });
  return { open: openT, close };
}

/* ======================= KONAMI ======================= */
export function initKonami(onUnlock) {
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let i = 0;
  addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0;
    if (i === seq.length) { i = 0; onUnlock(); }
  });
}
