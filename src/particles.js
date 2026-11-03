import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  Points, ShaderMaterial, Color, AdditiveBlending, NormalBlending, Vector2,
} from 'three';
import gsap from 'gsap';

const vert = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aRand;   // x: delay, y: size, z: color mix, w: phase
  attribute vec3 aDir;
  uniform float uTime;
  uniform float uProgress;
  uniform float uScatter;
  uniform float uSize;
  uniform float uPixel;
  uniform vec2  uMouse;
  uniform vec2  uHalf;
  uniform float uDist;
  uniform float uForce;
  uniform float uVel;
  uniform float uSwirl;
  varying float vMix;
  varying float vAlpha;

  float easeInOut(float t) { return t < .5 ? 4.*t*t*t : 1. - pow(-2.*t + 2., 3.) / 2.; }

  void main() {
    float t = clamp(uProgress * 1.45 - aRand.x * .45, 0., 1.);
    float e = easeInOut(t);
    vec3 p = mix(aFrom, aTo, e);
    // explode outward mid-transition
    p += aDir * sin(t * 3.14159) * uScatter;
    // idle breathing
    float ph = aRand.w * 6.2831;
    p += vec3(sin(uTime * .7 + ph), cos(uTime * .6 + ph * 1.3), sin(uTime * .5 + ph * .7)) * .018;
    // swirl (storm)
    float ang = uSwirl * uTime * (.15 + aRand.y * .35);
    float cs = cos(ang), sn = sin(ang);
    p.xz = mat2(cs, -sn, sn, cs) * p.xz;

    vec4 mv = modelViewMatrix * vec4(p, 1.);
    // pointer repulsion in view space
    vec2 m = uMouse * uHalf * (-mv.z / uDist);
    vec2 d = mv.xy - m;
    float len = length(d);
    float r = .9;
    float f = smoothstep(r, 0., len) * uForce;
    mv.xy += normalize(d + 1e-5) * f * .55;
    mv.z += f * .6;
    // scroll velocity stretch
    mv.y += uVel * (aRand.y - .5) * .25;

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixel * (.45 + aRand.y * .9) * (1. + f * 1.5) / -mv.z;
    vMix = aRand.z + f;
    vAlpha = .55 + aRand.y * .45;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform float uAccentShare;
  uniform float uAlpha;
  varying float vMix;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - .5;
    float d = length(c);
    if (d > .5) discard;
    float a = smoothstep(.5, .1, d) * vAlpha;
    vec3 col = vMix > (1. - uAccentShare) ? uColB : uColA;
    gl_FragColor = vec4(col, a * uAlpha);
  }
`;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

export class ParticleField {
  constructor(canvas, { count } = {}) {
    this.canvas = canvas;
    const mobile = matchMedia('(max-width: 760px)').matches;
    this.count = count ?? (mobile ? 9000 : 15000);
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene = new Scene();
    this.dist = 10;
    this.camera = new PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
    this.camera.position.z = this.dist;
    this.mouse = new Vector2(9, 9);
    this.mouseTarget = new Vector2(9, 9);
    this.shape = 'name';
    this.spin = 0;
    this.spinAxis = 'y';
    this.morphTween = null;

    const n = this.count;
    const geo = new BufferGeometry();
    this.from = new Float32Array(n * 3);
    this.to = new Float32Array(n * 3);
    const r = new Float32Array(n * 4);
    const dir = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      r[i * 4] = Math.random();
      r[i * 4 + 1] = Math.random();
      r[i * 4 + 2] = Math.random();
      r[i * 4 + 3] = Math.random();
      const th = rand(0, Math.PI * 2), ph = Math.acos(rand(-1, 1)), m = rand(0.5, 2.2);
      dir[i * 3] = Math.sin(ph) * Math.cos(th) * m;
      dir[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * m;
      dir[i * 3 + 2] = Math.cos(ph) * m;
      // start as a deep, wide cloud
      this.from[i * 3] = rand(-12, 12);
      this.from[i * 3 + 1] = rand(-8, 8);
      this.from[i * 3 + 2] = rand(-14, 4);
    }
    this.rnd = r;
    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aFrom', new BufferAttribute(this.from, 3));
    geo.setAttribute('aTo', new BufferAttribute(this.to, 3));
    geo.setAttribute('aRand', new BufferAttribute(r, 4));
    geo.setAttribute('aDir', new BufferAttribute(dir, 3));
    this.geo = geo;

    this.uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uScatter: { value: 0 },
      uSize: { value: mobile ? 30 : 46 },
      uPixel: { value: this.renderer.getPixelRatio() },
      uMouse: { value: this.mouse },
      uHalf: { value: new Vector2(1, 1) },
      uDist: { value: this.dist },
      uForce: { value: 1 },
      uVel: { value: 0 },
      uSwirl: { value: 0 },
      uColA: { value: new Color('#f1ede4') },
      uColB: { value: new Color('#ff5a1f') },
      uAccentShare: { value: 0.16 },
      uAlpha: { value: 1 },
    };
    this.material = new ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.points = new Points(geo, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    addEventListener('resize', () => { clearTimeout(this._rt); this._rt = setTimeout(this.resize, 150); });
    addEventListener('pointermove', (e) => {
      this.mouseTarget.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    }, { passive: true });
    document.addEventListener('pointerleave', () => this.mouseTarget.set(9, 9));
    this.resize(true);
  }

  async init() {
    try { await document.fonts.load('800 200px "Inter Tight Variable"'); } catch (e) { /* ignore */ }
    this.shapes = this.buildShapes();
    this.to.set(this.shapes.name.pos);
    this.geo.attributes.aTo.needsUpdate = true;
    gsap.ticker.add(this.tick);
  }

  /** world-space size of the view plane at z = 0 */
  view() {
    const h = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.dist;
    return { w: h * this.camera.aspect, h };
  }

  resize(first) {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const v = this.view();
    this.uniforms.uHalf.value.set(v.w / 2, v.h / 2);
    if (first === true || !this.shapes) return;
    this.shapes = this.buildShapes();
    // snap to current shape with new proportions
    this.morph(this.shape, { duration: 1.2, scatter: 0.2, force: true });
  }

  // ---------- shape builders ----------
  sampleCanvas(draw, cw, ch, worldW, worldH, depth = 0.25) {
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';
    draw(ctx, cw, ch);
    const data = ctx.getImageData(0, 0, cw, ch).data;
    const pts = [];
    for (let y = 0; y < ch; y += 2) for (let x = 0; x < cw; x += 2) if (data[(y * cw + x) * 4 + 3] > 140) pts.push(x, y);
    const n = this.count, out = new Float32Array(n * 3);
    const total = pts.length / 2;
    if (!total) return out;
    for (let i = 0; i < n; i++) {
      const k = (Math.random() * total) | 0;
      const px = pts[k * 2] + rand(-1, 1), py = pts[k * 2 + 1] + rand(-1, 1);
      out[i * 3] = (px / cw - 0.5) * worldW;
      out[i * 3 + 1] = -(py / ch - 0.5) * worldH;
      out[i * 3 + 2] = rand(-depth, depth);
    }
    return out;
  }

  buildShapes() {
    const v = this.view();
    const portrait = v.w < v.h;
    const n = this.count;

    // NAME — fit "SIDHARTH" to the viewport
    const nameW = v.w * (portrait ? 0.9 : 0.84);
    const cw = 1400, ch = portrait ? 560 : 300;
    const nameH = nameW * (ch / cw);
    const name = this.sampleCanvas((ctx) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '-2px';
      if (portrait) {
        ctx.font = '800 255px "Inter Tight Variable", "Inter Tight", Arial Black, sans-serif';
        ctx.fillText('SIDHARTH', cw / 2, 150);
        ctx.font = '800 288px "Inter Tight Variable", "Inter Tight", Arial Black, sans-serif';
        ctx.fillText('MONANGI', cw / 2, 410);
      } else {
        ctx.font = '800 250px "Inter Tight Variable", "Inter Tight", Arial Black, sans-serif';
        ctx.fillText('SIDHARTH', cw / 2, ch / 2 + 10);
      }
    }, cw, ch, nameW, nameH, 0.3);
    if (portrait) for (let i = 0; i < n; i++) name[i * 3 + 1] += v.h * 0.03;

    // GLOBE — fibonacci sphere with lat/long banding
    const R = Math.min(v.w, v.h) * (portrait ? 0.36 : 0.34);
    const globe = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      const s = i % 7 === 0 ? 1.18 + Math.random() * 0.25 : 1; // orbiting dust
      globe[i * 3] = Math.cos(th) * rr * R * s;
      globe[i * 3 + 1] = y * R * s;
      globe[i * 3 + 2] = Math.sin(th) * rr * R * s;
    }

    // SHIELD — outline, inner glow and a check mark
    const sh = Math.min(v.h * 0.62, v.w * 0.7);
    const shield = this.sampleCanvas((ctx, w, h) => {
      const path = new Path2D();
      const cx = w / 2;
      path.moveTo(cx, 30);
      path.lineTo(w - 70, 95);
      path.lineTo(w - 70, 250);
      path.bezierCurveTo(w - 70, 400, cx + 90, 470, cx, 500);
      path.bezierCurveTo(cx - 90, 470, 70, 400, 70, 250);
      path.lineTo(70, 95);
      path.closePath();
      ctx.lineWidth = 26; ctx.lineJoin = 'round'; ctx.stroke(path);
      ctx.globalAlpha = 0.6; ctx.lineWidth = 6;
      ctx.save(); ctx.translate(cx, 270); ctx.scale(0.78, 0.78); ctx.translate(-cx, -270); ctx.stroke(path); ctx.restore();
      ctx.globalAlpha = 1; ctx.lineWidth = 30; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 80, 265); ctx.lineTo(cx - 20, 325); ctx.lineTo(cx + 95, 195); ctx.stroke();
    }, 440, 530, sh * (440 / 530), sh, 0.35);

    // STORM — flattened vortex disc
    const storm = new Float32Array(n * 3);
    const SR = Math.max(v.w, v.h) * 0.55;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const rr = Math.pow(Math.random(), 0.6) * SR;
      const arm = Math.sin(a * 3 + rr * 0.6) * 0.5;
      storm[i * 3] = Math.cos(a + arm) * rr;
      storm[i * 3 + 1] = (Math.random() - 0.5) * (0.4 + rr * 0.12);
      storm[i * 3 + 2] = Math.sin(a + arm) * rr - 2;
    }

    // HELIX — DNA-like double strand with rungs
    const helix = new Float32Array(n * 3);
    const HH = v.h * 1.05, HR = Math.min(v.w * 0.16, 1.6);
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const a = t * Math.PI * 7;
      const y = (t - 0.5) * HH;
      const k = Math.random();
      if (k < 0.82) {
        const strand = i % 2 ? Math.PI : 0;
        const j = rand(-0.06, 0.06);
        helix[i * 3] = Math.cos(a + strand) * (HR + j);
        helix[i * 3 + 1] = y + j;
        helix[i * 3 + 2] = Math.sin(a + strand) * (HR + j);
      } else {
        const tt = Math.round(t * 60) / 60;
        const aa = tt * Math.PI * 7;
        const s = rand(-1, 1);
        helix[i * 3] = Math.cos(aa) * HR * s;
        helix[i * 3 + 1] = (tt - 0.5) * HH;
        helix[i * 3 + 2] = Math.sin(aa) * HR * s;
      }
    }

    // RING — tilted torus portal
    const ring = new Float32Array(n * 3);
    const RR = Math.min(v.w, v.h) * (portrait ? 0.42 : 0.4), rt = RR * 0.08;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), b = rand(0, Math.PI * 2);
      const tube = rt * Math.pow(Math.random(), 0.5);
      ring[i * 3] = (RR + Math.cos(b) * tube) * Math.cos(a);
      ring[i * 3 + 1] = (RR + Math.cos(b) * tube) * Math.sin(a);
      ring[i * 3 + 2] = Math.sin(b) * tube;
    }

    const side = portrait ? 0 : v.w * 0.3;
    return {
      name: { alpha: 1, pos: name, x: 0, y: 0, spin: 0, tilt: 0, swirl: 0, accent: 0.16 },
      globe: { alpha: 0.5, pos: globe, x: side, y: portrait ? -v.h * 0.1 : 0, spin: 0.12, tilt: 0.35, swirl: 0, accent: 0.22 },
      shield: { alpha: 0.6, pos: shield, x: portrait ? 0 : v.w * 0.26, y: 0, spin: 0.25, tilt: 0, swirl: 0, accent: 0.3 },
      storm: { alpha: 0.55, pos: storm, x: 0, y: 0, spin: 0, tilt: 0.5, swirl: 0.9, accent: 0.25 },
      helix: { alpha: portrait ? 0.32 : 0.55, pos: helix, x: portrait ? v.w * 0.36 : -v.w * 0.4, y: 0, spin: 0.35, tilt: 0.2, swirl: 0, accent: 0.3 },
      ring: { alpha: portrait ? 0.4 : 0.8, pos: ring, x: portrait ? 0 : v.w * 0.22, y: 0, spin: 0.18, tilt: 0.9, swirl: 0, accent: 0.35 },
    };
  }

  /** capture currently rendered (pre-noise) positions into aFrom */
  captureCurrent() {
    const p = this.uniforms.uProgress.value;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const t = Math.min(Math.max(p * 1.45 - this.rnd[i * 4] * 0.45, 0), 1);
      const e = easeInOut(t);
      for (let k = 0; k < 3; k++) {
        const j = i * 3 + k;
        this.from[j] = this.from[j] + (this.to[j] - this.from[j]) * e;
      }
    }
  }

  morph(key, { duration = 2.2, scatter = 1.6, force = false } = {}) {
    if (!this.shapes || (!force && key === this.shape)) return;
    const s = this.shapes[key];
    if (!s) return;
    this.shape = key;
    this.captureCurrent();
    this.to.set(s.pos);
    this.geo.attributes.aFrom.needsUpdate = true;
    this.geo.attributes.aTo.needsUpdate = true;
    this.uniforms.uProgress.value = 0;
    this.morphTween?.kill();
    const u = this.uniforms;
    this.morphTween = gsap.timeline()
      .to(u.uProgress, { value: 1, duration, ease: 'none' }, 0)
      .fromTo(u.uScatter, { value: 0 }, { value: scatter, duration: duration * 0.5, ease: 'power2.out', yoyo: true, repeat: 1 }, 0)
      .to(u.uSwirl, { value: s.swirl, duration }, 0)
      .to(u.uAccentShare, { value: s.accent, duration }, 0)
      .to(u.uAlpha, { value: s.alpha ?? 1, duration: duration * 0.6 }, 0);
    gsap.to(this.points.position, { x: s.x, y: s.y, duration: duration * 0.9, ease: 'power3.inOut' });
    gsap.to(this.points.rotation, { x: s.tilt * 0.5, duration, ease: 'power3.inOut' });
    this.spinTarget = s.spin;
    if (s.spin === 0) {
      // unwind to the nearest front-facing angle
      const ry = this.points.rotation.y;
      const target = Math.round(ry / (Math.PI * 2)) * Math.PI * 2;
      gsap.to(this.points.rotation, { y: target, duration, ease: 'power3.inOut' });
    }
  }

  setTheme(theme) {
    const light = theme === 'light';
    this.material.blending = light ? NormalBlending : AdditiveBlending;
    this.material.needsUpdate = true;
    const a = new Color(light ? '#1a1916' : '#f1ede4');
    const b = new Color(light ? '#e8440c' : '#ff5a1f');
    gsap.to(this.uniforms.uColA.value, { r: a.r, g: a.g, b: a.b, duration: 0.8 });
    gsap.to(this.uniforms.uColB.value, { r: b.r, g: b.g, b: b.b, duration: 0.8 });
  }

  setVelocity(v) { this.velTarget = v; }

  tick(time, dt) {
    const u = this.uniforms;
    u.uTime.value = time;
    this.mouse.lerp(this.mouseTarget, 0.12);
    u.uVel.value += ((this.velTarget || 0) - u.uVel.value) * 0.1;
    this.spin += ((this.spinTarget || 0) - this.spin) * 0.03;
    if (this.spinTarget) this.points.rotation.y += this.spin * (dt / 1000);
    if (this.hidden) return;
    this.renderer.render(this.scene, this.camera);
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}
