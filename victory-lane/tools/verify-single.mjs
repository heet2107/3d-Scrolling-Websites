// Sanity check: open dist/victory-lane.html via file:// and confirm the core
// scroll machinery works with embedded frames.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto('file:///home/user/victory-lane/dist/victory-lane.html');
await page.waitForFunction(() => window.__VL && window.__VL.ready, null, { timeout: 60000 });
console.log('ready: true, page errors:', errors.length ? errors : 'none');

const counts = await page.evaluate(() =>
  Object.fromEntries(Object.entries(window.__VL.scrubbers).map(([k, s]) => [k, s.count])));
console.log('embedded frame counts:', JSON.stringify(counts));

const go = async y => {
  await page.evaluate(y => window.__VL.lenis.scrollTo(y, { immediate: true, force: true }), y);
  await page.waitForTimeout(700);
};
const st = await page.evaluate(() => {
  const t = ScrollTrigger.getAll().find(t => t.trigger?.id === 'hero');
  return { start: t.start, end: t.end };
});
await go(1);
const f0 = await page.evaluate(() => window.__VL.scrubbers.hero.drawn);
await go(st.start + (st.end - st.start) * 0.5);
const f50 = await page.evaluate(() => window.__VL.scrubbers.hero.drawn);
await go(st.start + (st.end - st.start) * 0.98);
const f98 = await page.evaluate(() => window.__VL.scrubbers.hero.drawn);
console.log(`hero scrub on file://: 0%%→${f0} 50%%→${f50} 98%%→${f98} of ${counts.hero}`);

const bottom = await page.evaluate(() => document.body.scrollHeight);
await go(bottom);
await page.waitForTimeout(600);
const formOk = await page.evaluate(() => !!document.getElementById('reserve-form'));
await page.screenshot({ path: '/home/user/victory-lane/shots/single-file-hero.png' });
const pass = errors.length === 0 && f0 < 5 && f50 > 40 && f98 > 100 && formOk;
console.log(pass ? 'SINGLE-FILE CHECK PASSED' : 'SINGLE-FILE CHECK FAILED');
await browser.close();
process.exit(pass ? 0 : 1);
