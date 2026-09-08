// Act IV's beats.
//
// Travel is SCROLL, with no time component at all: the visitor drives the deck
// through the room and can stop on any project for as long as they like. The
// only thing time drives is the act's arrival, so the first plate does not
// snap into existence the instant the section clears the fold.
//
// The scrub is not linear. A linear map would put every plate at a readable
// position for exactly one instant of the scroll, and a project would only be
// legible if you happened to stop on the right pixel. Instead each slot has a
// dwell: the deck holds a plate square to the frame through the middle of its
// scroll band and moves quickly between them.

import { clamp, smoothstep, span } from '../lib/ease.js';

export const T4 = {
  in: 0.06,          // scroll before the first plate is fully arrived
  out: 0.94,         // scroll after the last one has settled
  arrive: 1.10,      // seconds for the act to fade up, once
  dwellA: 0.22,      // where a slot starts moving on to the next
  dwellB: 0.78,      // where it has arrived
};

/** Scroll 0..1 -> a continuous position in the deck, with a dwell per slot. */
export function headAt(scroll, n) {
  const u = span(scroll, T4.in, T4.out) * (n - 1);
  const i = Math.floor(u);
  const f = u - i;
  return i + smoothstep(T4.dwellA, T4.dwellB, f);
}

/** The inverse, so a pip knows which scroll offset lands on its project. */
export function scrollFor(i, n) {
  if (n < 2) return 0.5;
  return T4.in + (i / (n - 1)) * (T4.out - T4.in);
}

export function sample4(t, scroll, n) {
  return {
    mat: smoothstep(0, 1, clamp(t / T4.arrive)),
    head: headAt(clamp(scroll), n),
  };
}
