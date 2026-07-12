// Verifies every inner page: loads without errors, ambient canvas hero animates,
// reveal-on-scroll fires, nav is wired, portfolio filter + forms work.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
mkdirSync(SHOTS, { recursive: true });

const PAGES = ['about.html', 'services.html', 'portfolio.html', 'career.html', 'contact.html',
  'interior-works.html', 'wrap.html', 'bodyshop-and-paintwork.html', 'wheels-and-tyres.html',
  'performance-upgrades.html', 'car-repairs.html'];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const fails = [];
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails.push(name);
};

for (const p of PAGES) {
  const errors = [];
  const onErr = e => errors.push(e.message);
  page.on('pageerror', onErr);
  await page.goto(`http://localhost:4173/${p}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 20000 }).catch(() => {});
  const ready = await page.evaluate(() => !!(window.__VL && window.__VL.ready));

  // ambient canvas animates
  const f1 = await page.evaluate(() => window.__VL.ambient.frame);
  await page.waitForTimeout(500);
  const f2 = await page.evaluate(() => window.__VL.ambient.frame);

  // hero copy revealed (GSAP sets inline opacity; SplitText chars animate in)
  await page.waitForTimeout(1200);
  const heroRevealed = await page.evaluate(() =>
    [...document.querySelectorAll('.ph-copy [data-reveal]')].every(el => +getComputedStyle(el).opacity > 0.9));

  // scroll to bottom: all GSAP scroll reveals eventually fire
  await page.evaluate(() => window.__VL.lenis.scrollTo(document.body.scrollHeight, { immediate: true, force: true }));
  await page.waitForTimeout(1400);
  const revealStats = await page.evaluate(() => {
    const all = [...document.querySelectorAll('main [data-reveal]')];
    return { total: all.length, in: all.filter(el => +getComputedStyle(el).opacity > 0.85).length };
  });

  check(`${p}: loads clean, canvas animates, reveals fire`,
    ready && errors.length === 0 && f2 !== f1 && heroRevealed && revealStats.in >= revealStats.total - 1,
    `errors=${errors.length} frames ${f1}→${f2} reveals ${revealStats.in}/${revealStats.total}`);
  page.off('pageerror', onErr);
}

// gold-dust cursor effect spawns particles on pointer movement
await page.goto('http://localhost:4173/about.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.mouse.move(200, 300);
for (let i = 1; i <= 12; i++) await page.mouse.move(200 + i * 30, 300 + Math.sin(i) * 60);
const dust = await page.evaluate(() => window.__VL_DUST ? window.__VL_DUST.count : -1);
check('Gold dust particles spawn on mouse move', dust > 5, `live particles=${dust}`);

// SplitText hero headline split into animated chars
const chars = await page.evaluate(() => document.querySelectorAll('.ph-copy h1 div, .ph-copy h1 span').length);
check('Hero headline split into animated chars (SplitText)', chars > 5, `${chars} split nodes`);

// stat count-up lands on the real value
await page.evaluate(() => window.__VL.lenis.scrollTo('.stat-band', { immediate: true, force: true, offset: -300 }));
await page.waitForTimeout(2300);
const statText = await page.evaluate(() => document.querySelector('.stat-band strong').textContent);
check('Stat count-up lands on 15,000+', statText.replace(/ /g, ' ').trim() === '15,000+', `"${statText}"`);

// 3D tilt on service cards
await page.goto('http://localhost:4173/services.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.evaluate(() => window.__VL.lenis.scrollTo('.svc-grid', { immediate: true, force: true, offset: -200 }));
await page.waitForTimeout(900);
const cardBox = await page.evaluate(() => {
  const r = document.querySelector('.svc-card').getBoundingClientRect();
  return { x: r.left + r.width * 0.8, y: r.top + r.height * 0.3 };
});
await page.mouse.move(cardBox.x, cardBox.y);
await page.waitForTimeout(600);
const tilt = await page.evaluate(() => ({
  ry: +gsap.getProperty(document.querySelector('.svc-card'), 'rotationY'),
  rx: +gsap.getProperty(document.querySelector('.svc-card'), 'rotationX'),
}));
check('Service cards tilt in 3D on hover', Math.abs(tilt.ry) > 1, `rotationY=${tilt.ry.toFixed(1)} rotationX=${tilt.rx.toFixed(1)}`);

// portfolio filter (now FLIP-animated)
await page.goto('http://localhost:4173/portfolio.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.click('.pf-chip[data-cat="Mechanical"]');
await page.waitForTimeout(900);
const counts = await page.evaluate(() => ({
  visible: [...document.querySelectorAll('.pf-card:not(.hide)')].length,
  hidden: [...document.querySelectorAll('.pf-card.hide')].length,
}));
check('Portfolio filter (Mechanical) shows 7, hides rest', counts.visible === 7 && counts.hidden === 10,
  `visible=${counts.visible} hidden=${counts.hidden}`);
await page.evaluate(() => window.__VL.lenis.scrollTo(400, { immediate: true }));
await page.waitForTimeout(400);
await page.screenshot({ path: join(SHOTS, 'pg-portfolio.png') });

// contact form
await page.goto('http://localhost:4173/contact.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => window.__VL.lenis.scrollTo(document.body.scrollHeight, { immediate: true, force: true }));
await page.waitForTimeout(600);
await page.fill('input[name=name]', 'Test');
await page.fill('input[name=email]', 't@t.in');
await page.fill('input[name=phone]', '9999999999');
await page.fill('input[name=subject]', 'Service');
await page.click('#reserve-form button');
const done = await page.evaluate(() => getComputedStyle(document.getElementById('form-done')).display === 'block');
check('Contact form submits to confirmation', done);
await page.screenshot({ path: join(SHOTS, 'pg-contact.png') });

// nav from home to about works
await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 30000 });
await page.click('.nav-links a[href="about.html"]');
await page.waitForURL('**/about.html');
check('Nav link home → about navigates', true);
await page.waitForTimeout(800);
await page.screenshot({ path: join(SHOTS, 'pg-about.png') });
await page.goto('http://localhost:4173/services.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
await page.evaluate(() => window.__VL.lenis.scrollTo(700, { immediate: true }));
await page.waitForTimeout(700);
await page.screenshot({ path: join(SHOTS, 'pg-services.png') });

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILURES: ${fails.join(', ')}` : '\nALL PAGE CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
