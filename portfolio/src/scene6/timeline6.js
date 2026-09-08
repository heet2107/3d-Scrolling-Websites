// Act VI's beats.
//
// Everything that matters here is SCROLL-based, which is the opposite choice
// to act two. The gather is the visitor arriving: if it ran on a timer it
// would finish while they were still three screens away, and the contact card
// would be waiting for them instead of being reached. The only thing the clock
// drives is the drift and the flicker — the life the frame keeps whether or
// not anyone is scrolling.
//
//   0.00  the pin engages; the field is still adrift, the bed barely warm
//   0.14  the collapse begins
//   0.55  the core is bright enough for the rake to come up
//   0.92  settled — the name is standing in its own light
//
// The last eight per cent of the travel is deliberately spent: a gather that
// completes exactly at the document's last pixel can never be seen finishing,
// because there is no scroll left to watch it in.

import { clamp, span, lerp, smoothstep, easeOutCubic } from '../lib/ease.js';

export const T6 = {
  gatherIn: 0.14,
  gatherOut: 0.92,
  rake: 0.55,
};

export function sample6(t, scroll) {
  const p = clamp(scroll);

  // eased rather than linear: the field hangs, falls, and then arrives softly,
  // which is what makes the last screen feel like landing instead of stopping
  const gather = easeOutCubic(span(p, T6.gatherIn, T6.gatherOut));

  return {
    t,
    gather,
    // how lit the wordmark is by what has collected behind it
    lit: smoothstep(0, 1, span(p, T6.gatherIn, 1)),
    // the grain calms as the frame settles, the way a projector steadies
    grain: lerp(0.062, 0.030, gather),
    // for the DOM: the card warms as the field arrives
    progress: p,
    home: p >= T6.rake,
  };
}
