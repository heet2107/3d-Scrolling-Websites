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

  // hero copy reveal fired
  const heroRevealed = await page.evaluate(() =>
    [...document.querySelectorAll('.ph-copy [data-reveal]')].every(el => el.classList.contains('in')));

  // scroll to bottom: all reveals eventually fire
  await page.evaluate(() => window.__VL.lenis.scrollTo(document.body.scrollHeight, { immediate: true, force: true }));
  await page.waitForTimeout(900);
  const revealStats = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-reveal]')];
    return { total: all.length, in: all.filter(el => el.classList.contains('in')).length };
  });

  check(`${p}: loads clean, canvas animates, reveals fire`,
    ready && errors.length === 0 && f2 !== f1 && heroRevealed && revealStats.in >= revealStats.total - 1,
    `errors=${errors.length} frames ${f1}→${f2} reveals ${revealStats.in}/${revealStats.total}`);
  page.off('pageerror', onErr);
}

// portfolio filter
await page.goto('http://localhost:4173/portfolio.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.click('.pf-chip[data-cat="Mechanical"]');
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
