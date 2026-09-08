// The opening sequence.
//
// One clock drives everything, and the beats deliberately OVERLAP: the letters
// are still resolving when the lede drops, the chips are still sliding when the
// signal inside the letterforms begins to run. That overlap is the difference
// between a title sequence and a queue of fades.
//
//   0.0  black
//   0.3  the signal field condenses out of the dark
//   1.9  HEET BAROT materialises, centre letters first
//   2.6  the field starts to run inside the letterforms
//   2.9  the lede drops from above and overshoots
//   3.2  the role and location chips arrive from the left and the right
//   3.5  the tick marks and the corner dot grid snap into place
//   4.4  the header draws itself in
//   6.1  settled — ambient life and pointer parallax take over

import { clamp, span, lerp, easeOutCubic, easeOutExpo, easeOutQuint, smoothstep }
  from '../lib/ease.js';

export const T = {
  fieldIn: 0.30,
  fieldInDur: 2.10,
  letters: 1.90,
  letterStagger: 0.135,
  letterDur: 1.60,
  signal: 2.60,
  ember: 2.35,
  lede: 2.90,
  role: 3.18,
  place: 3.32,
  marks: 3.48,
  dots: 3.64,
  header: 4.40,
  settled: 6.10,
};

/** Reveal order: centre outward, so the wordmark grows from the middle. */
export function letterOrder(letters) {
  const ranked = letters
    .map((l, i) => ({ i, d: Math.abs((l.u0 + l.u1) / 2 - 0.5) }))
    .sort((a, b) => a.d - b.d);
  const out = new Array(letters.length);
  ranked.forEach((x, rank) => { out[x.i] = rank; });
  return out;
}

export function sample(t, nLetters, order) {
  // ---- the field --------------------------------------------------------
  const fp = span(t, T.fieldIn, T.fieldIn + T.fieldInDur);
  const field = {
    reveal: fp,
    opacity: smoothstep(0, 0.35, fp),
    // it arrives compressed and expands into the frame
    scale: lerp(0.90, 1, easeOutQuint(fp)),
    // how fast the signal runs: still at first, streaming once it is lit
    flow: smoothstep(0, 1, span(t, T.signal, T.signal + 2.4)),
  };

  // ---- letters ----------------------------------------------------------
  const letters = [];
  for (let i = 0; i < nLetters; i++) {
    const t0 = T.letters + order[i] * T.letterStagger;
    const p = span(t, t0, t0 + T.letterDur);
    const e = easeOutExpo(p);
    letters.push({
      // the dissolve resolves slightly ahead of the transform settling
      reveal: span(t, t0, t0 + T.letterDur * 0.80),
      opacity: smoothstep(0, 0.18, p),
      dy: lerp(0.30, 0, e),                     // rises into place
      soften: lerp(1, 0, easeOutCubic(clamp(p * 1.15))),
      edge: smoothstep(0.35, 1, p),
    });
  }

  // ---- atmosphere -------------------------------------------------------
  const ember = smoothstep(0, 1, span(t, T.ember, T.ember + 2.3));
  // a single soft pulse as the wordmark lands: light, not a strobe
  const flash = Math.max(
    0.16 * bell(span(t, T.letters + 0.25, T.letters + 1.25)),
    0.09 * bell(span(t, T.lede, T.lede + 0.5)),
  );
  const grain = lerp(0.078, 0.032, smoothstep(0, 1, span(t, 0.2, 3.2)));

  return {
    field, letters, ember, flash, grain,
    settled: t >= T.settled,
    progress: clamp(t / T.settled),
  };
}

function bell(p) {
  if (p <= 0 || p >= 1) return 0;
  return Math.sin(p * Math.PI) ** 2;
}

/** DOM cues: [time, name]. main.js flips a class on the root for each. */
export const CUES = [
  [T.lede, 'lede'],
  [T.role, 'role'],
  [T.place, 'place'],
  [T.marks, 'marks'],
  [T.dots, 'dots'],
  [T.header, 'header'],
  [T.settled, 'settled'],
];
