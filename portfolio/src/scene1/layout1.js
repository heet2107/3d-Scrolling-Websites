// Composition geometry for the opening.
//
// The wordmark is fitted to whatever viewport it lands in without ever
// changing its own width : cap-height ratio. Landscape sets HEET BAROT on one
// line; portrait stacks it, because a 5.5:1 wordmark on a phone is either
// three storeys of empty screen above it or a strip of unreadable hairlines.

import { measureRatio } from './type.js';

export const REF = {
  wordWidth: 0.880,      // fraction of viewport width, landscape
  capHeight: 0.290,      // fraction of viewport height, landscape
  vCentre: 0.520,        // vertical centre of the ink box
};

let RATIO_ONE = 0;       // 'HEET BAROT'
let RATIO_TWO = 0;       // max('HEET', 'BAROT')

function ratios() {
  if (!RATIO_ONE) {
    RATIO_ONE = measureRatio('HEET BAROT');
    RATIO_TWO = Math.max(measureRatio('HEET'), measureRatio('BAROT'));
  }
  return { RATIO_ONE, RATIO_TWO };
}

export function computeLayout(w, h) {
  const portrait = h / w > 1.02;
  const narrow = w < 760;
  const { RATIO_ONE: one, RATIO_TWO: two } = ratios();

  const lines = portrait ? ['HEET', 'BAROT'] : ['HEET BAROT'];
  const ratio = portrait ? two : one;
  // two lines occupy 1 cap + 1 leading of vertical space
  const linesTall = portrait ? 1 + 1.16 : 1;

  // fit by whichever axis binds first, preserving the wordmark's proportions
  const byWidth = ((portrait ? 0.930 : REF.wordWidth) * w) / ratio;
  const byHeight = (REF.capHeight * h * (portrait ? 2.4 : 1)) / linesTall;
  const capH = Math.min(byWidth, byHeight);

  const wordW = capH * ratio;
  const wordH = capH * linesTall;
  const cx = w * 0.5;
  const vCentre = portrait ? h * 0.485 : h * REF.vCentre;
  const top = vCentre - wordH * 0.5;

  const word = {
    x: cx - wordW * 0.5,
    y: top,
    w: wordW,
    h: wordH,
    capH,
    baseline: top + wordH,
    lines,
    ratio,
  };

  return {
    w,
    h,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    portrait,
    narrow,
    word,
    // the ember sits behind the wordmark and lights it from within
    ember: { x: 0.5, y: vCentre / h },
    // furniture, in CSS pixels
    lede: portrait ? { y: top - h * 0.085 } : { y: h * 0.178 },
    role: portrait
      ? { x: w * 0.5, y: word.baseline + h * 0.055, centre: true }
      : { x: w * 0.028, y: h * 0.700 },
    place: portrait
      ? { x: w * 0.5, y: top - h * 0.042, centre: true }
      : { x: w * 0.905, y: h * 0.262 },
    marks: { left: 0.020, right: 0.974, top: 0.352, bottom: 0.628, count: 5 },
    dots: { x: 0.982, y: 0.945 },
  };
}
