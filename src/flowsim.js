/**
 * A simplified, in-browser illustration of the BidirFlow idea: wash trading
 * moves a lot of volume that cancels out. Each wallet keeps two decaying
 * counters in fixed memory — gross volume and net flow — and a wallet whose
 * gross volume is high while its net flow stays near zero gets flagged.
 * (The real detector uses sketches over live Ethereum transfers.)
 */
const N = 16;
const HALF_LIFE = 3.2; // seconds
const GROSS_MIN = 50;
const CANCEL_MIN = 0.75;

export function initFlowSim(root) {
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const out = {
    tx: root.querySelector('[data-flow-tx]'), rate: root.querySelector('[data-flow-rate]'),
    flag: root.querySelector('[data-flow-flag]'), time: root.querySelector('[data-flow-time]'), status: root.querySelector('[data-flow-status]'),
  };
  let W = 0, H = 0, dpr = 1;
  const nodes = [];
  const packets = [];
  const ring = new Set();
  let ringOrder = [], ringUntil = 0, ringStart = 0, caught = false;
  let txCount = 0, txWindow = [], running = false, last = 0, acc = 0;

  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes.forEach((n, i) => {
      const a = (i / N) * Math.PI * 2 + (i % 2) * 0.18;
      // ellipse fitted to the canvas, inner/outer rings alternate; 22px keeps node halos inside
      const k = i % 2 ? 0.74 : 1;
      n.x = W / 2 + Math.cos(a) * (W / 2 - 22) * k;
      n.y = H / 2 + Math.sin(a) * (H / 2 - 22) * k;
    });
  }
  for (let i = 0; i < N; i++) {
    // organic roles: some wallets mostly send (exchanges), some mostly receive
    const bias = i % 5 === 0 ? 0.85 : i % 5 === 1 ? 0.15 : 0.5;
    nodes.push({ id: i, x: 0, y: 0, gross: 0, net: 0, bias, flagged: false, pulse: 0 });
  }

  function transfer(a, b, amt, wash = false) {
    const A = nodes[a], B = nodes[b];
    A.gross += amt; B.gross += amt; A.net -= amt; B.net += amt;
    txCount++; txWindow.push(performance.now());
    if (packets.length < 260) packets.push({ a, b, t: 0, speed: 1.4 + Math.random() * 0.8, wash });
  }
  function organic() {
    let a, b;
    do { a = (Math.random() * N) | 0; b = (Math.random() * N) | 0; } while (a === b);
    // respect roles so organic flow has a direction
    if (Math.random() > nodes[a].bias) [a, b] = [b, a];
    transfer(a, b, 0.4 + Math.random() * 1.2);
  }

  function inject() {
    ring.clear();
    nodes.forEach((n) => (n.flagged = false));
    const pool = [...Array(N).keys()].sort(() => Math.random() - 0.5);
    ringOrder = pool.slice(0, 3 + ((Math.random() * 2) | 0));
    ringOrder.forEach((i) => ring.add(i));
    ringStart = performance.now(); ringUntil = ringStart + 9000; caught = false;
    out.time.textContent = '—';
    out.status.textContent = `ring injected · ${ringOrder.length} wallets cycling volume`;
    out.status.dataset.state = 'armed';
  }

  function step(dt) {
    const now = performance.now();
    acc += dt;
    while (acc > 0.03) { acc -= 0.03; organic(); if (Math.random() < 0.6) organic(); }
    if (now < ringUntil && Math.random() < dt * 22) {
      const k = (Math.random() * ringOrder.length) | 0;
      transfer(ringOrder[k], ringOrder[(k + 1) % ringOrder.length], 1.6, true);
    }
    const decay = Math.pow(0.5, dt / HALF_LIFE);
    let flaggedCount = 0, falsePos = 0;
    nodes.forEach((n) => {
      n.gross *= decay; n.net *= decay;
      const cancel = n.gross > 0 ? 1 - Math.abs(n.net) / n.gross : 0;
      n.cancel = cancel;
      n.flagged = n.gross > GROSS_MIN && cancel > CANCEL_MIN;
      if (n.flagged) { flaggedCount++; if (!ring.has(n.id)) falsePos++; }
      n.pulse = Math.max(0, n.pulse - dt * 2);
    });
    const ringFlagged = ringOrder.filter((i) => nodes[i].flagged).length;
    if (!caught && ring.size && ringFlagged >= Math.min(2, ring.size)) {
      caught = true;
      out.time.textContent = `${((now - ringStart) / 1000).toFixed(1)}s`;
      out.status.textContent = `ring caught · ${ringFlagged}/${ring.size} wallets flagged`;
      out.status.dataset.state = 'caught';
      ringOrder.forEach((i) => (nodes[i].pulse = 1));
    }
    if (ring.size && now > ringUntil + 6000) { ring.clear(); ringOrder = []; out.status.textContent = 'monitoring organic traffic'; out.status.dataset.state = ''; }
    txWindow = txWindow.filter((t) => now - t < 1000);
    out.tx.textContent = txCount.toLocaleString();
    out.rate.textContent = `${txWindow.length}/s`;
    out.flag.textContent = `${flaggedCount}${falsePos ? ` (${falsePos} false)` : ''}`;
    packets.forEach((p) => (p.t += dt * p.speed));
    for (let i = packets.length - 1; i >= 0; i--) if (packets[i].t >= 1) packets.splice(i, 1);
  }

  function draw() {
    const cs = getComputedStyle(root);
    const fg = cs.getPropertyValue('--fg').trim() || '#fff';
    const accent = '#ffb21f', bad = cs.getPropertyValue('--bad').trim() || '#ff3d5a';
    ctx.clearRect(0, 0, W, H);
    // ring edges
    if (ringOrder.length) {
      ctx.strokeStyle = caught ? bad : 'rgba(255,178,31,.45)';
      ctx.lineWidth = caught ? 2 : 1;
      ctx.setLineDash(caught ? [] : [4, 6]);
      ctx.beginPath();
      ringOrder.forEach((i, k) => { const n = nodes[i]; k ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y); });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    }
    packets.forEach((p) => {
      const A = nodes[p.a], B = nodes[p.b];
      const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
      ctx.globalAlpha = 0.85 * Math.sin(p.t * Math.PI);
      ctx.fillStyle = p.wash ? accent : fg;
      ctx.beginPath(); ctx.arc(x, y, p.wash ? 2.6 : 1.6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    nodes.forEach((n) => {
      const r = 5 + Math.min(10, n.gross * 0.35);
      if (n.pulse > 0) { ctx.strokeStyle = bad; ctx.globalAlpha = n.pulse; ctx.beginPath(); ctx.arc(n.x, n.y, r + (1 - n.pulse) * 26, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.fillStyle = n.flagged ? bad : 'transparent';
      ctx.strokeStyle = n.flagged ? bad : fg;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    step(dt); draw();
    requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; last = 0; layout(); requestAnimationFrame(loop); }
  function stop() { running = false; }

  root.querySelector('[data-flow-inject]').addEventListener('click', inject);
  root.querySelector('[data-flow-reset]').addEventListener('click', () => {
    nodes.forEach((n) => { n.gross = 0; n.net = 0; n.flagged = false; });
    ring.clear(); ringOrder = []; packets.length = 0; txCount = 0;
    out.status.textContent = 'monitoring organic traffic'; out.status.dataset.state = ''; out.time.textContent = '—';
  });
  addEventListener('resize', () => running && layout());
  return { start, stop };
}
