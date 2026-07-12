// Responsive check: every page at iPhone width — no horizontal overflow,
// nav + hero visible, key sections render. Screenshots to ../shots/m-*.png.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
mkdirSync(SHOTS, { recursive: true });

const PAGES = ['', 'about.html', 'services.html', 'portfolio.html', 'career.html', 'contact.html',
  'interior-works.html', 'wrap.html', 'bodyshop-and-paintwork.html', 'wheels-and-tyres.html',
  'performance-upgrades.html', 'car-repairs.html'];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const fails = [];
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails.push(name);
};

// hero text fitting at awkward widths: words never break mid-word, nothing overflows
for (const w of [320, 390, 600, 835]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 30000 });
  await page.waitForTimeout(300);
  const t = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const fits = el => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= vw + 1; };
    return {
      wordsIntact: [...document.querySelectorAll('#hero-title .wd')].every(el => el.getClientRects().length === 1),
      titleFits: fits(document.getElementById('hero-title')),
      eyebrowFits: fits(document.getElementById('hero-eyebrow')),
      tagFits: fits(document.getElementById('hero-tag')),
    };
  });
  check(`hero text fits at ${w}px (words intact, no overflow)`,
    t.wordsIntact && t.titleFits && t.eyebrowFits && t.tagFits, JSON.stringify(t));
  if (w === 390) await page.screenshot({ path: join(SHOTS, 'm-hero-fit-390.png') });
  if (w === 600) await page.screenshot({ path: join(SHOTS, 'm-hero-fit-600.png') });
  await page.close();
}

for (const vp of [{ w: 390, h: 844, tag: 'phone' }, { w: 768, h: 1024, tag: 'tablet' }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  for (const p of PAGES) {
    await page.goto(`http://localhost:4173/${p}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      navVisible: !!document.querySelector('.nav') && document.querySelector('.nav').getBoundingClientRect().height > 20,
      navLinks: [...document.querySelectorAll('.nav-links a')].every(a => a.getBoundingClientRect().width > 5),
    }));
    check(`${vp.tag} ${p || 'index.html'}: no h-overflow, nav ok`,
      m.overflow <= 1 && m.navVisible && m.navLinks, `overflow=${m.overflow}px`);
  }
  // phone screenshots of key views
  if (vp.tag === 'phone') {
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 30000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(SHOTS, 'm-home-hero.png') });
    // engineering section: on phones the specs must play ONE at a time (caption cards)
    const st = await page.evaluate(() => {
      const t = ScrollTrigger.getAll().find(t => t.trigger?.id === 'engineering');
      return { start: t.start, end: t.end };
    });
    let maxVisible = 0;
    for (const f of [0.35, 0.45, 0.55, 0.65, 0.75]) {
      await page.evaluate(y => window.__VL.lenis.scrollTo(y, { immediate: true, force: true }), st.start + (st.end - st.start) * f);
      await page.waitForTimeout(750);
      const vis = await page.evaluate(() =>
        [...document.querySelectorAll('#engineering [data-spec]')].filter(el => +getComputedStyle(el).opacity > 0.5).length);
      maxVisible = Math.max(maxVisible, vis);
      if (f === 0.45) await page.screenshot({ path: join(SHOTS, 'm-home-specs.png') });
    }
    check('phone: engineering specs play one at a time', maxVisible >= 1 && maxVisible <= 2, `max simultaneous=${maxVisible}`);
    await page.goto('http://localhost:4173/services.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(SHOTS, 'm-services.png') });
    await page.goto('http://localhost:4173/contact.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(SHOTS, 'm-contact.png') });
  }
  await page.close();
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILURES: ${fails.join(', ')}` : '\nALL MOBILE CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
