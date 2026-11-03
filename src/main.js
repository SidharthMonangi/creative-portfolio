import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import { ParticleField, webglAvailable } from './particles.js';
import { initShield } from './shield.js';
import { initPalette } from './palette.js';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------- toast ---------------- */
const toastEl = $('.toast');
let toastT;
export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
}

/* ---------------- smooth scroll ---------------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduced, wheelMultiplier: 1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

function scrollToTarget(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  lenis.scrollTo(el, { offset: 0, duration: 1.6 });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2 && id !== '#') return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(id === '#' || id === '#top' ? document.body : id);
});

/* ---------------- particles ---------------- */
let field = null;
if (webglAvailable()) {
  try {
    field = new ParticleField($('.gl'));
  } catch (e) { field = null; }
}
if (!field) root.classList.add('no-webgl');

/* ---------------- theme ---------------- */
function applyTheme(t, persist = true) {
  root.dataset.theme = t;
  $('meta[name="theme-color"]').setAttribute('content', t === 'light' ? '#efebe2' : '#0b0b0c');
  field?.setTheme(t);
  if (persist) try { localStorage.setItem('sm-theme', t); } catch (e) { /* ignore */ }
}
function toggleTheme() { applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light'); }
$('[data-theme-toggle]').addEventListener('click', toggleTheme);
applyTheme(root.dataset.theme || 'dark', false);

/* ---------------- mobile menu ---------------- */
const menuBtn = $('[data-menu-toggle]');
const menu = $('.mobile-menu');
function closeMenu() {
  if (!menu.classList.contains('is-open')) return;
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  lenis.start();
}
menuBtn.addEventListener('click', () => {
  const open = !menu.classList.contains('is-open');
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    lenis.stop();
    gsap.from($$('a', menu), { yPercent: 60, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'power4.out', delay: 0.15 });
  } else lenis.start();
});

/* ---------------- clock ---------------- */
const clock = $('[data-clock]');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const tickClock = () => { clock.textContent = `${fmt.format(new Date())} IST`; };
tickClock(); setInterval(tickClock, 1000);

/* ---------------- copy email ---------------- */
async function copyEmail() {
  const email = 'sidharthmonangi@gmail.com';
  try { await navigator.clipboard.writeText(email); toast('Email copied — talk soon ✦'); }
  catch (e) { location.href = `mailto:${email}`; }
}
$$('[data-copy]').forEach((b) => b.addEventListener('click', copyEmail));

/* ---------------- résumé link: hide if missing ---------------- */
const resumeLink = $('[data-resume]');
fetch(resumeLink.getAttribute('href'), { method: 'HEAD' }).then((r) => {
  if (!r.ok || !(r.headers.get('content-type') || '').includes('pdf')) resumeLink.remove();
}).catch(() => resumeLink.remove());

/* ---------------- cursor ---------------- */
if (finePointer && !reduced) {
  document.body.classList.add('has-cursor');
  const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, rp = { ...pos };
  const dx = gsap.quickSetter(dot, 'x', 'px'), dy = gsap.quickSetter(dot, 'y', 'px');
  const rx = gsap.quickSetter(ring, 'x', 'px'), ry = gsap.quickSetter(ring, 'y', 'px');
  addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; dx(pos.x); dy(pos.y); }, { passive: true });
  gsap.ticker.add(() => { rp.x += (pos.x - rp.x) * 0.18; rp.y += (pos.y - rp.y) * 0.18; rx(rp.x); ry(rp.y); });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button, input, [data-spotlight]');
    if (lab && !e.target.closest('a, button')) { cur.classList.add('is-label'); label.textContent = lab.dataset.cursor; cur.classList.remove('is-hover'); }
    else { cur.classList.remove('is-label'); cur.classList.toggle('is-hover', !!hov); }
  });
}

/* ---------------- magnetic ---------------- */
if (finePointer && !reduced) {
  $$('[data-magnetic], .btn').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------- spotlight & tilt ---------------- */
$$('[data-spotlight]').forEach((el) => el.addEventListener('pointermove', (e) => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}));
if (finePointer && !reduced) {
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateZ(0)`;
      el.style.setProperty('--shine', `${(px + 0.5) * 200 - 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; el.style.setProperty('--shine', '-100%'); });
  });
}

/* ---------------- palette ---------------- */
initPalette({
  go: (id) => scrollToTarget(id === '#top' ? document.body : id),
  toggleTheme, copyEmail, lenis,
  toggleMotion: () => {
    if (!field) return toast('Particles unavailable on this device');
    field.hidden = !field.hidden;
    $('.gl').style.opacity = field.hidden ? '0' : '1';
    toast(field.hidden ? 'Particles paused' : 'Particles resumed');
  },
});

/* ---------------- shield lab ---------------- */
initShield($('[data-shield]'), {
  onResult: (res) => {
    if (!field || !res.blocked) return;
    gsap.fromTo(field.uniforms.uScatter, { value: 2.6 }, { value: 0, duration: 1.4, ease: 'power3.out' });
  },
});

/* ---------------- FieldProof phone loop ---------------- */
function phoneLoop() {
  const phone = $('.vis-fieldproof .phone');
  if (!phone) return;
  const rows = $$('.row', phone), net = $('.net b', phone);
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, paused: true });
  tl.call(() => { phone.classList.remove('is-online'); net.textContent = 'OFFLINE'; rows.forEach((r) => { r.classList.remove('is-synced'); $('em', r).textContent = 'queued'; }); })
    .from(rows, { x: -20, opacity: 0, stagger: 0.15, duration: 0.5 }, 0.2)
    .call(() => { phone.classList.add('is-online'); net.textContent = 'ONLINE'; }, null, 2)
    .add(() => {}, 2.2);
  rows.forEach((r, i) => {
    tl.call(() => {
      r.classList.add('is-synced');
      gsap.to($('em', r), { duration: 0.5, scrambleText: { text: 'synced ✓', chars: '01#%', speed: 0.6 } });
    }, null, 2.4 + i * 0.45);
  });
  tl.to({}, { duration: 1.6 });
  ScrollTrigger.create({ trigger: phone, start: 'top 90%', end: 'bottom top', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
}

/* ---------------- LOADER ---------------- */
async function runLoader() {
  const log = $('[data-log]');
  const count = $('[data-count]'), bar = $('[data-bar]');
  const lines = ['› mounting particle field', '› arming prompt shield', '› caching for offline use', '› syncing journey: kuwait → vellore', '› ready.'];
  const obj = { v: 0 };
  const fieldReady = field ? field.init() : Promise.resolve();
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  const dur = reduced ? 0.4 : 2.1;
  let shown = 0;
  await new Promise((resolve) => {
    gsap.to(obj, {
      v: 100, duration: dur, ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(obj.v);
        count.textContent = String(v).padStart(3, '0');
        bar.style.transform = `scaleX(${obj.v / 100})`;
        const want = Math.min(lines.length, Math.floor((obj.v / 100) * lines.length + 0.2));
        while (shown < want) { const p = document.createElement('p'); p.textContent = lines[shown++]; log.appendChild(p); }
      },
      onComplete: resolve,
    });
  });
  await Promise.all([fieldReady, fontsReady]);

  const loader = $('.loader');
  const tl = gsap.timeline();
  tl.to('.loader__inner', { yPercent: -20, opacity: 0, duration: 0.6, ease: 'power3.in' })
    .to('.loader__curtain', { y: '0%', duration: 0.6, ease: 'power4.inOut' }, '-=0.25')
    .set(loader, { backgroundColor: 'transparent' })
    .to('.loader__curtain', { y: '-100%', duration: 0.8, ease: 'power4.inOut' })
    .set(loader, { display: 'none' });
  await tl.then();
  document.body.classList.remove('is-loading');
  lenis.start();
  intro();
}

function intro() {
  if (!finePointer) $('.hero__hint').textContent = 'touch & drag through me';
  if (field) field.morph('name', { duration: reduced ? 0.1 : 3, scatter: 0.8, force: true });
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.nav > *', { y: -30, opacity: 0, duration: 1, stagger: 0.08 }, 0.2)
    .from('.hero .reveal-up', { y: 40, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.6)
    .from('.scroll-cue', { opacity: 0, duration: 1 }, 1.2)
    .to('.hero__hint', { opacity: 1, duration: 1 }, 2.4)
    .to('.hero__hint', { opacity: 0, duration: 1 }, 6);
  if (root.classList.contains('no-webgl')) tl.from('.hero__fallback', { yPercent: 40, opacity: 0, duration: 1.4 }, 0.3);
}

/* ---------------- SCROLL ANIMATIONS ---------------- */
function setupScroll() {
  // horizontal work scroller (desktop)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('.work__track');
    const cards = $$('.project', track);
    const idx = $('[data-work-index]'), bar = $('[data-work-bar]');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.work__pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => {
          bar.style.transform = `scaleX(${s.progress})`;
          idx.textContent = String(Math.min(cards.length, Math.round(s.progress * (cards.length - 1)) + 1)).padStart(2, '0');
        },
      },
    });
    // card visuals parallax inside the horizontal scroll
    cards.forEach((card) => {
      const vis = $('.project__visual > *', card);
      if (vis) gsap.fromTo(vis, { xPercent: 7 }, { xPercent: -7, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      const rep = $('.report', card);
      if (rep) ScrollTrigger.create({ trigger: card, containerAnimation: tween, start: 'left 70%', onEnter: () => rep.classList.add('is-in') });
    });
    // keyboard ← →
    const onKey = (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key) || e.target.closest('input')) return;
      const s = tween.scrollTrigger;
      if (!s.isActive) return;
      e.preventDefault();
      const step = (s.end - s.start) / (cards.length - 1);
      const cur = Math.round((lenis.scroll - s.start) / step);
      lenis.scrollTo(s.start + gsap.utils.clamp(0, cards.length - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)) * step, { duration: 1 });
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });
  mm.add('(max-width: 860px)', () => {
    $$('.project').forEach((card) => {
      gsap.from(card, { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%' } });
      const rep = $('.report', card);
      if (rep) ScrollTrigger.create({ trigger: rep, start: 'top 85%', onEnter: () => rep.classList.add('is-in') });
    });
  });

  // progress bar
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // velocity → particles
  if (field) lenis.on('scroll', ({ velocity }) => field.setVelocity(gsap.utils.clamp(-6, 6, velocity * 0.15)));

  // section → particle shape + nav state
  const navLinks = $$('[data-nav]');
  $$('[data-shape]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        field?.morph(sec.dataset.shape);
        const id = sec.id === 'skills' ? 'about' : sec.id;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
      },
    });
  });

  // hero parallax out
  gsap.to('.hero__bottom, .hero__top', { yPercent: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // split headings
  $$('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
    gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // about statement word scrub
  const st = $('[data-scrub-words]');
  if (st) {
    const split = SplitText.create(st, { type: 'words', wordsClass: 'word' });
    gsap.to(split.words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  }

  // generic reveals
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: (els) => gsap.from(els, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true }),
    once: true,
  });

  // counters
  $$('[data-counter]').forEach((el) => {
    const end = +el.dataset.counter, suffix = el.dataset.suffix || '', dec = +(el.dataset.decimals || 0);
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec) + suffix; } }) });
  });

  // marquees (scroll-velocity aware)
  $$('.marquee__track').forEach((track, i) => {
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
    const dir = i % 2 ? 1 : -1;
    const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
    lenis.on('scroll', ({ velocity }) => { gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(velocity) * 0.15, 5), duration: 0.2, overwrite: true }); gsap.to(tween, { timeScale: 1, duration: 1, delay: 0.25 }); });
  });

  // timeline line draw
  const line = $('.timeline__line line');
  const tlEl = $('.timeline');
  const setLen = () => { const h = tlEl.offsetHeight; line.parentNode.style.setProperty('--len', h); };
  setLen();
  ScrollTrigger.create({
    trigger: tlEl, start: 'top 70%', end: 'bottom 60%', scrub: true,
    onRefresh: setLen,
    onUpdate: (s) => { const h = tlEl.offsetHeight; line.parentNode.style.setProperty('--off', h * (1 - s.progress)); },
  });

  // contact title
  gsap.from('.contact__title .line > span', { yPercent: 110, rotate: 3, duration: 1.3, ease: 'power4.out', stagger: 0.1, scrollTrigger: { trigger: '.contact__title', start: 'top 80%' } });
  gsap.from('.contact__row > *', { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.contact__row', start: 'top 92%' } });

  // footer big word
  gsap.fromTo('.footer__big', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  // scramble section labels on enter
  $$('.section__label').forEach((el) => {
    const node = el.lastChild;
    const span = document.createElement('em');
    span.style.fontStyle = 'normal';
    span.textContent = node.textContent;
    node.replaceWith(span);
    const txt = span.textContent;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(span, { duration: 1, scrambleText: { text: txt, chars: 'upperCase', speed: 0.5 } }) });
  });

  phoneLoop();
}

/* ---------------- offline ---------------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
addEventListener('offline', () => toast('You’re offline — this site keeps working, just like FieldProof.'));
addEventListener('online', () => toast('Back online ✦ synced'));

/* ---------------- console easter egg ---------------- */
console.log('%c SM %c Hey, curious engineer 👋  This site is hand-built — no template. Say hi: sidharthmonangi@gmail.com', 'background:#ff5a1f;color:#000;font-weight:800;padding:4px 8px;border-radius:4px', 'color:inherit');

/* ---------------- boot ---------------- */
document.fonts?.ready.then(() => { setupScroll(); ScrollTrigger.refresh(); });
runLoader();
