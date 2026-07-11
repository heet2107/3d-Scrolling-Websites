// Builds a single self-contained victory-lane.html — every asset (CSS, JS, fonts,
// logo, frame sequences) inlined as data URIs so the file opens anywhere by
// double-click. Frames are halved (every 2nd) and re-encoded 960px WebP to keep
// the file portable; the repo version remains the full-quality build.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const b64 = (p, mime) => `data:${mime};base64,${readFileSync(join(ROOT, p)).toString('base64')}`;

const SEQS = ['hero', 'macro', 'assembly', 'atmosphere', 'workshop'];
console.log('re-encoding frames (every 2nd, 960px webp)...');
const embedded = {};
for (const seq of SEQS) {
  const dir = join(ROOT, 'frames', seq);
  const files = readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
  const picked = files.filter((_, i) => i % 2 === 0);
  const uris = [];
  for (const f of picked) {
    const buf = await sharp(join(dir, f)).resize(960).webp({ quality: 52 }).toBuffer();
    uris.push(`data:image/webp;base64,${buf.toString('base64')}`);
  }
  embedded[seq] = uris;
  console.log(`  ${seq}: ${uris.length} frames`);
}

// fonts.css with woff2 files inlined
let fontsCss = read('fonts/fonts.css').replace(/url\((f_[a-z0-9]+\.woff2)\)/g,
  (_, f) => `url(${b64('fonts/' + f, 'font/woff2')})`);

// main.js patched to read embedded frames instead of the network
let mainJs = read('js/main.js');
const srcOld = `    src(i) {
      return \`frames/\${this.seq}/\${this.seq}_\${String(i + 1).padStart(4, '0')}.jpg\`;
    }`;
const srcNew = `    src(i) {
      return window.EMBEDDED_FRAMES[this.seq][i];
    }`;
const loadOld = `      try {
        const res = await fetch(\`frames/\${this.seq}/manifest.json\`);
        this.count = (await res.json()).count;
      } catch {
        // fetch() is blocked on file:// — fall back to the shipped frame counts
        // so the site also works when index.html is opened directly from disk
        this.count = { hero: 220, macro: 200, assembly: 200, atmosphere: 200, workshop: 200 }[this.seq] || 200;
      }`;
const loadNew = `      this.count = window.EMBEDDED_FRAMES[this.seq].length;`;
if (!mainJs.includes(srcOld) || !mainJs.includes(loadOld)) throw new Error('main.js anchors not found');
mainJs = mainJs.replace(srcOld, () => srcNew).replace(loadOld, () => loadNew);

// ---- embed all inner pages so the navbar works inside the one file ----
const PAGE_IDS = ['about', 'services', 'portfolio', 'career', 'contact', 'interior-works',
  'wrap', 'bodyshop-and-paintwork', 'wheels-and-tyres', 'performance-upgrades', 'car-repairs'];
// order matters: composite link first so it isn't half-replaced by the plain one
const LINK_MAP = [['contact.html#reserve-form', '#contact']];
for (const id of PAGE_IDS) LINK_MAP.push([`${id}.html`, `#${id}`]);
LINK_MAP.push(['index.html', '#home']);
const mapLinks = s => {
  for (const [from, to] of LINK_MAP) s = s.replaceAll(`href="${from}"`, `href="${to}"`);
  return s;
};
let pagesHtml = '';
for (const id of PAGE_IDS) {
  const src = read(`${id}.html`);
  const hero = src.match(/<section class="page-hero">[\s\S]*?<\/section>/)[0];
  const main = src.match(/<main class="page-main">[\s\S]*?<\/main>/)[0];
  pagesHtml += `<div class="vpage" id="vpage-${id}" style="display:none">\n${mapLinks(hero + '\n' + main)}\n</div>\n`;
}
pagesHtml = pagesHtml.replaceAll('aria-current="page"', '');

// index.html with everything inlined
let html = read('index.html');
html = mapLinks(html);
html = html.replace('</header>', '</header>\n<div id="page-home">');
html = html.replace('<link rel="stylesheet" href="css/pages.css">', () => `<style>\n${read('css/pages.css')}\n</style>`);
html = html.replace('<link rel="icon" type="image/png" href="assets/logo.png">', () => `<link rel="icon" type="image/png" href="${b64('assets/logo.png', 'image/png')}">`);
html = html.replace('<link rel="stylesheet" href="fonts/fonts.css">', () => `<style>\n${fontsCss}\n</style>`);
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${read('css/style.css')}\n</style>`);
html = html.replace('src="assets/logo.webp"', () => `src="${b64('assets/logo.webp', 'image/webp')}"`);
html = html.replace('<script src="vendor/lenis.min.js"></script>', () => `<script>window.EMBEDDED_FRAMES = ${JSON.stringify(embedded)};</script>\n<script>\n${read('vendor/lenis.min.js')}\n</script>`);
html = html.replace('<script src="vendor/gsap.min.js"></script>', () => `<script>\n${read('vendor/gsap.min.js')}\n</script>`);
html = html.replace('<script src="vendor/ScrollTrigger.min.js"></script>', () => `<script>\n${read('vendor/ScrollTrigger.min.js')}\n</script>`);
html = html.replace('<script src="js/main.js"></script>', () => `<script>\n${mainJs}\n</script>`);

// mount the embedded pages after the home wrapper, then add the hash router
const ROUTER_JS = `
(() => {
  const home = document.getElementById('page-home');
  const wrap = document.getElementById('vl-pages');
  const pages = Array.from(wrap.querySelectorAll('.vpage'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '10000px 0px -8% 0px', threshold: 0.05 });
  wrap.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  const canvases = Array.from(wrap.querySelectorAll('canvas[data-seq]')).map(c => ({
    c, ctx: c.getContext('2d'), last: -1,
    imgs: window.EMBEDDED_FRAMES[c.dataset.seq].filter((_, i) => i % 2 === 0)
      .map(u => { const im = new Image(); im.src = u; return im; }),
  }));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let t0 = null;
  const tick = ts => {
    if (t0 === null) t0 = ts;
    const p = 1 - Math.abs(1 - (((ts - t0) / 8000) % 2));
    for (const a of canvases) {
      if (!a.c.offsetParent) continue;
      const w = Math.round(a.c.clientWidth * dpr);
      if (a.c.width !== w) { a.c.width = w; a.c.height = Math.round(a.c.clientHeight * dpr); a.last = -1; }
      const k = Math.round(p * (a.imgs.length - 1)), im = a.imgs[k];
      if (k !== a.last && im.complete && im.naturalWidth) {
        a.last = k;
        const s = Math.max(a.c.width / im.naturalWidth, a.c.height / im.naturalHeight);
        a.ctx.drawImage(im, (a.c.width - im.naturalWidth * s) / 2, (a.c.height - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  wrap.addEventListener('submit', e => {
    e.preventDefault();
    e.target.querySelectorAll('input,textarea,button').forEach(el => (el.style.display = 'none'));
    const d = e.target.querySelector('.form-done'); if (d) d.style.display = 'block';
  });
  wrap.addEventListener('click', e => {
    const chip = e.target.closest('.pf-chip'); if (!chip) return;
    wrap.querySelectorAll('.pf-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.cat;
    wrap.querySelectorAll('.pf-card').forEach(card =>
      card.classList.toggle('hide', cat !== 'all' && !card.dataset.cat.includes(cat)));
  });
  function show(hash) {
    const id = (hash || '#home').replace('#', '');
    const target = document.getElementById('vpage-' + id);
    if (target) {
      home.style.display = 'none';
      wrap.style.display = '';
      pages.forEach(p => (p.style.display = p === target ? '' : 'none'));
      window.__VL.lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      wrap.style.display = 'none';
      home.style.display = '';
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (id === 'reserve') window.__VL.lenis.scrollTo('#reserve', { duration: 1.6 });
        else window.__VL.lenis.scrollTo(0, { immediate: true, force: true });
      });
    }
  }
  window.addEventListener('hashchange', () => show(location.hash));
  if (location.hash) show(location.hash);
})();`;
html = html.replace('<script>window.EMBEDDED_FRAMES',
  () => `</div>\n<div id="vl-pages" style="display:none">\n${pagesHtml}</div>\n<script>window.EMBEDDED_FRAMES`);
html = html.replace('</body>', () => `<script>\n${ROUTER_JS}\n</script>\n</body>`);

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', 'victory-lane.html');
writeFileSync(out, html);
console.log(`wrote ${out}: ${(html.length / 1024 / 1024).toFixed(1)} MB, pages embedded: ${PAGE_IDS.length}`);
