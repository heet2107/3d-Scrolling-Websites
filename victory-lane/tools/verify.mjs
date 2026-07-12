// End-to-end verification: drives the page in headless Chromium and asserts
// every scroll animation actually works. Screenshots land in ../shots/.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const fails = [];
const check = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails.push(name);
};

page.on('pageerror', e => { console.log('PAGE ERROR:', e.message); fails.push('pageerror: ' + e.message); });
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()); });

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 30000 });

// Lenis active?
check('Lenis smooth scroll initialised', await page.evaluate(() =>
  document.documentElement.classList.contains('lenis') && !!window.__VL.lenis));

// Wheel input produces eased (multi-step) scrolling, not a jump
const samples = await page.evaluate(async () => {
  const out = [];
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 1200, bubbles: true, cancelable: true }));
  for (let i = 0; i < 30; i++) {
    await new Promise(r => requestAnimationFrame(r));
    out.push(window.scrollY);
  }
  return out;
});
const distinct = new Set(samples.map(Math.round)).size;
check('Wheel scroll is smooth/eased via Lenis', distinct > 5 && samples.at(-1) > 0, `${distinct} distinct positions, end=${samples.at(-1).toFixed(0)}`);

// helper: jump scroll (immediate) and settle
const go = async y => {
  await page.evaluate(y => window.__VL.lenis.scrollTo(y, { immediate: true, force: true }), y);
  await page.waitForTimeout(700); // let the scrub smoothing (scrub: 0.4) settle on target
};
await go(0);
await page.waitForTimeout(300);

// grab pinned ScrollTrigger ranges keyed by section id
const st = await page.evaluate(() => {
  const map = {};
  ScrollTrigger.getAll().forEach(t => {
    const id = t.trigger?.id || t.trigger?.className;
    if (t.pin || ['signature'].includes(id)) map[id] = { start: t.start, end: t.end };
    else if (!map[id]) map[id] = { start: t.start, end: t.end };
  });
  return map;
});
console.log('scrolltrigger ranges:', JSON.stringify(st));

const frameOf = name => page.evaluate(n => window.__VL.scrubbers[n].drawn, name);
const mid = r => r.start + (r.end - r.start) * 0.5;

/* ---- HERO ---- */
await go(1); // top
const heroF0 = await frameOf('hero');
const cueOp0 = await page.evaluate(() => +getComputedStyle(document.getElementById('scroll-cue')).opacity);
await page.screenshot({ path: join(SHOTS, '01-hero-top.png') });

await go(st.hero.start + (st.hero.end - st.hero.start) * 0.25);
const heroF25 = await frameOf('hero');
await page.screenshot({ path: join(SHOTS, '02-hero-25.png') });

await go(mid(st.hero));
const heroF50 = await frameOf('hero');
const titleOp = await page.evaluate(() => +getComputedStyle(document.querySelector('#hero-title .ch')).opacity);
await page.screenshot({ path: join(SHOTS, '03-hero-50.png') });

await go(st.hero.start + (st.hero.end - st.hero.start) * 0.98);
const heroF98 = await frameOf('hero');
const copyOp = await page.evaluate(() => +getComputedStyle(document.querySelector('.hero-copy')).opacity);
const cueOp98 = await page.evaluate(() => +getComputedStyle(document.getElementById('scroll-cue')).opacity);
await page.screenshot({ path: join(SHOTS, '04-hero-98.png') });

check('Hero orbit scrubs with scroll', heroF0 < 8 && heroF25 > 30 && heroF50 > heroF25 && heroF98 > 180,
  `frames 0%→${heroF0} 25%→${heroF25} 50%→${heroF50} 98%→${heroF98} of 192`);
check('Hero title letters tracked in by mid-pin', titleOp > 0.95, `char opacity=${titleOp}`);
check('Hero copy fades out at end of pin', copyOp < 0.1, `opacity=${copyOp}`);
check('Scroll cue visible at top, gone after scroll', cueOp0 > 0.9 && cueOp98 < 0.05, `${cueOp0}→${cueOp98}`);

/* ---- STORY ---- */
const stStory = st.story;
const lineOpsAt = async f => {
  await go(stStory.start + (stStory.end - stStory.start) * f);
  return page.evaluate(() => [...document.querySelectorAll('.story-line')].map(el => +getComputedStyle(el).opacity));
};
const s1 = await lineOpsAt(0.15);
const wsF15 = await frameOf('workshop');
await page.screenshot({ path: join(SHOTS, '05-story-line1.png') });
const s2 = await lineOpsAt(0.5);
const wsF50 = await frameOf('workshop');
await page.screenshot({ path: join(SHOTS, '06-story-line2.png') });
const s3 = await lineOpsAt(0.95);
await page.screenshot({ path: join(SHOTS, '07-story-line3.png') });
check('Workshop dolly scrubs behind story lines', wsF50 > wsF15 + 20, `frames ${wsF15}→${wsF50}`);
check('Story line 1 shows alone, then hands over to 2, then 3',
  s1[0] > 0.5 && s1[2] < 0.1 && s2[1] > 0.5 && s2[0] < 0.4 && s3[2] > 0.9 && s3[1] < 0.1,
  `t.15=${s1.map(v => v.toFixed(2))} t.5=${s2.map(v => v.toFixed(2))} t.95=${s3.map(v => v.toFixed(2))}`);

/* ---- MACRO ---- */
const stM = st.macro;
await go(stM.start + 5);
const macroF0 = await frameOf('macro');
await go(stM.start + (stM.end - stM.start) * 0.45);
const macroF45 = await frameOf('macro');
const co2 = await page.evaluate(() => +getComputedStyle(document.querySelectorAll('#macro [data-callout]')[1]).opacity);
await page.screenshot({ path: join(SHOTS, '08-macro-mid.png') });
await go(stM.start + (stM.end - stM.start) * 0.97);
const macroF97 = await frameOf('macro');
check('Macro fly-through scrubs with scroll', macroF0 < 10 && macroF45 > 50 && macroF97 > 150,
  `frames ${macroF0}→${macroF45}→${macroF97} of 160`);
check('Macro callout 2 visible mid-scrub', co2 > 0.5, `opacity=${co2}`);

/* ---- ENGINEERING ---- */
const stE = st.engineering;
await go(stE.start + (stE.end - stE.start) * 0.12);
const engTitleOp = await page.evaluate(() => +getComputedStyle(document.getElementById('eng-title')).opacity);
const asmF12 = await frameOf('assembly');
await page.screenshot({ path: join(SHOTS, '09-eng-title.png') });
await go(stE.start + (stE.end - stE.start) * 0.72);
const specOps = await page.evaluate(() => [...document.querySelectorAll('#engineering [data-spec]')].map(el => +getComputedStyle(el).opacity));
const asmF72 = await frameOf('assembly');
await page.screenshot({ path: join(SHOTS, '10-eng-specs.png') });
await go(stE.start + (stE.end - stE.start) * 0.97);
const statsOp = await page.evaluate(() => +getComputedStyle(document.getElementById('stats')).opacity);
const asmF97 = await frameOf('assembly');
await page.screenshot({ path: join(SHOTS, '11-eng-stats.png') });
check('Assembly scrubs with scroll', asmF12 > 5 && asmF72 > asmF12 && asmF97 > 180,
  `frames 12%→${asmF12} 72%→${asmF72} 97%→${asmF97} of 192`);
check('Engineering headline reveals early', engTitleOp > 0.5, `opacity=${engTitleOp}`);
check('Spec callouts revealed by 72%', specOps.filter(o => o > 0.5).length >= 3, `${specOps.map(v => v.toFixed(2))}`);
check('Stats strip revealed at end', statsOp > 0.8, `opacity=${statsOp}`);

/* ---- SIGNATURE (ambient loop) ---- */
await page.evaluate(() => window.__VL.lenis.scrollTo('#signature', { immediate: true, force: true }));
await page.waitForTimeout(400);
const atmoA = await frameOf('atmosphere');
await page.waitForTimeout(700);
const atmoB = await frameOf('atmosphere');
const sigOp = await page.evaluate(() => +getComputedStyle(document.querySelector('.sig-copy')).opacity);
await page.screenshot({ path: join(SHOTS, '12-signature.png') });
check('Atmosphere loop plays without scrolling', atmoA !== atmoB, `frame ${atmoA} → ${atmoB}`);
check('Signature copy revealed', sigOp > 0.7, `opacity=${sigOp}`);

/* ---- RESERVE ---- */
await page.evaluate(() => window.__VL.lenis.scrollTo(document.body.scrollHeight, { immediate: true, force: true }));
await page.waitForTimeout(700);
const resOp = await page.evaluate(() => +getComputedStyle(document.querySelector('.reserve-inner')).opacity);
await page.screenshot({ path: join(SHOTS, '13-reserve.png') });
await page.fill('input[name=name]', 'Test Driver');
await page.fill('input[name=phone]', '9999999999');
await page.fill('input[name=car]', 'Porsche 911');
await page.click('#reserve-form button');
const doneVisible = await page.evaluate(() => getComputedStyle(document.getElementById('form-done')).display === 'block');
check('Reserve section reveals + form submits to confirmation', resOp > 0.7 && doneVisible, `opacity=${resOp}, done=${doneVisible}`);

/* ---- reverse scrub sanity ---- */
await go(mid(st.hero));
const heroBack = await frameOf('hero');
check('Scrubbing backwards rewinds the orbit', Math.abs(heroBack - heroF50) < 6, `back to frame ${heroBack} (was ${heroF50})`);

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILURES: ${fails.join(', ')}` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
