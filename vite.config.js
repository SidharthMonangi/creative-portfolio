import { defineConfig } from 'vite';
import { existsSync, readdirSync } from 'node:fs';

// Which optional media files exist, so the page never requests missing ones.
function media() {
  const shots = existsSync('public/shots') ? readdirSync('public/shots').filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)) : [];
  const photo = ['me.jpg', 'me.webp', 'me.png'].find((f) => existsSync(`public/${f}`)) || '';
  return { photo, shots };
}

// Absolute site URL for canonical / og:url / sitemap. Set SITE_URL yourself, or
// on Vercel it is picked up automatically from the production domain.
const SITE_URL = (process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/$/, '');

const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sidharth Monangi',
  jobTitle: 'Software Engineer (B.Tech CSE, VIT Vellore, 2027)',
  email: 'mailto:sidharthmonangi@gmail.com',
  alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'Vellore Institute of Technology' }],
  address: { '@type': 'PostalAddress', addressLocality: 'Vellore', addressCountry: 'IN' },
  knowsAbout: ['Full-stack development', 'Applied AI', 'LLM security', 'Prompt injection', 'Streaming algorithms', 'FPGA', 'Offline-first apps', 'CPU-GPU scheduling'],
  sameAs: ['https://github.com/SidharthMonangi', 'https://linkedin.com/in/sidharth-monangi'],
  ...(SITE_URL ? { url: `${SITE_URL}/` } : {}),
};

function seo() {
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      let out = html.replace('<html lang="en"', `<html lang="en" data-media='${JSON.stringify(media())}'`);
      out = out.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(person)}</script>\n</head>`);
      if (SITE_URL) {
        out = out
          .replace('content="./og.jpg"', `content="${SITE_URL}/og.jpg"`)
          .replace('</head>', `  <link rel="canonical" href="${SITE_URL}/" />\n  <meta property="og:url" content="${SITE_URL}/" />\n  <meta name="twitter:image" content="${SITE_URL}/og.jpg" />\n</head>`);
      }
      return out;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}` });
      if (SITE_URL) {
        const today = new Date().toISOString().slice(0, 10);
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n  <url><loc>${SITE_URL}/resume.pdf</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>\n</urlset>\n` });
      }
    },
  };
}

// Inline the stylesheet (removes a render-blocking request), preload the main
// font and start fetching the three.js chunk immediately.
function perf() {
  return {
    name: 'portfolio-perf',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const files = Object.values(ctx.bundle);
        const css = files.find((f) => f.type === 'asset' && f.fileName.endsWith('.css'));
        const font = files.find((f) => f.type === 'asset' && /inter-tight-latin-wght-normal.*\.woff2$/.test(f.fileName));
        const three = files.find((f) => f.type === 'chunk' && f.name === 'particles');
        let out = html;
        if (css) {
          const src = String(css.source).replace(/url\(\.\//g, 'url(./assets/');
          out = out.replace(new RegExp(`<link rel="stylesheet"[^>]*${css.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`), `<style>${src}</style>`);
          delete ctx.bundle[css.fileName];
        }
        const hints = [
          font && `<link rel="preload" href="./${font.fileName}" as="font" type="font/woff2" crossorigin>`,
          three && `<link rel="modulepreload" href="./${three.fileName}">`,
        ].filter(Boolean).join('\n  ');
        return out.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n  ${hints}`);
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [seo(), perf()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
