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

// index.html with everything inlined
let html = read('index.html');
// single-file build is the home page only — swap the multi-page nav for the Reserve anchor
html = html.replace(/<nav class="nav-links">[\s\S]*?<\/nav>/, '<a class="nav-cta" href="#reserve">Reserve</a>');
html = html.replace('<link rel="stylesheet" href="css/pages.css">', () => `<style>\n${read('css/pages.css')}\n</style>`);
html = html.replace('<link rel="icon" type="image/png" href="assets/logo.png">', () => `<link rel="icon" type="image/png" href="${b64('assets/logo.png', 'image/png')}">`);
html = html.replace('<link rel="stylesheet" href="fonts/fonts.css">', () => `<style>\n${fontsCss}\n</style>`);
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${read('css/style.css')}\n</style>`);
html = html.replace('src="assets/logo.webp"', () => `src="${b64('assets/logo.webp', 'image/webp')}"`);
html = html.replace('<script src="vendor/lenis.min.js"></script>', () => `<script>window.EMBEDDED_FRAMES = ${JSON.stringify(embedded)};</script>\n<script>\n${read('vendor/lenis.min.js')}\n</script>`);
html = html.replace('<script src="vendor/gsap.min.js"></script>', () => `<script>\n${read('vendor/gsap.min.js')}\n</script>`);
html = html.replace('<script src="vendor/ScrollTrigger.min.js"></script>', () => `<script>\n${read('vendor/ScrollTrigger.min.js')}\n</script>`);
html = html.replace('<script src="js/main.js"></script>', () => `<script>\n${mainJs}\n</script>`);

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', 'victory-lane.html');
writeFileSync(out, html);
console.log(`wrote ${out}: ${(html.length / 1024 / 1024).toFixed(1)} MB`);
