// Act III's beats.
//
// The act plays the journey once, then hands it over. The hand starts parked
// on 2020, walks the whole timeline to 2026 while the rail draws itself and
// each year lights as the light reaches it, and only then does the pointer get
// the hand.
//
//   0.0  black
//   0.15 the room resolves — floor, horizon, the ring turning below
//   0.45 the rail draws itself from the first year outward
//   0.80 the clock's pivot fades up and the hand drops out of it
//   1.20 the hand walks 2020 → 2026; nodes and cards light as it passes
//   4.30 authority begins crossing from the sequence to the pointer
//   5.65 live
//
// The reveal is TIME-based, started when the section takes the frame, and the
// room's drift is SCROLL-based. Tying the walk to scroll would let a flick skip
// the one moment the act exists to show, and a slow drag would smear it into
// seven separate fades.

import { clamp, span, lerp, smoothstep, easeOutQuint, easeInOutCubic }
  from '../lib/ease.js';

export const T3 = {
  room: 0.15, roomDur: 1.30,
  rail: 0.45, railDur: 1.70,
  ball: 0.80, ballDur: 0.80,
  walk: 1.20, walkDur: 3.10,
  hand: 4.30, handDur: 1.35,
};

export function sample3(t, scroll, last) {
  const walk = easeInOutCubic(span(t, T3.walk, T3.walk + T3.walkDur));

  // The sequence's own idea of where the hand belongs. It is monotone, which
  // is what lets the reveal ride on it: a node that has been passed stays lit
  // even after the pointer drags the hand back over it.
  const scripted = walk * last;

  return {
    room: smoothstep(0, 1, span(t, T3.room, T3.room + T3.roomDur)),
    rail: easeOutQuint(span(t, T3.rail, T3.rail + T3.railDur)),
    ball: smoothstep(0, 1, span(t, T3.ball, T3.ball + T3.ballDur)),

    // how many years have been reached, fractional — the light runs slightly
    // ahead of the hand so a year is already glowing as the beam arrives
    // rather than switching on underneath it
    lit: Math.max(span(t, T3.rail, T3.rail + 0.55), clamp(scripted + 1.15, 0, last + 1)),

    scripted,
    // Control is handed over, not switched. Both sides are blended as TARGETS
    // and the hand damps toward the blend, so at the instant the pointer takes
    // over there is nothing to jump from.
    authority: smoothstep(0, 1, span(t, T3.hand, T3.hand + T3.handDur)),

    // the room breathes with the scroll while the act holds the frame
    drift: lerp(-1, 1, clamp(scroll)),
  };
}
