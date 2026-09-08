// Act II's beats.
//
// The materialisation is TIME-based, triggered when the section scrolls into
// view, and the dolly is SCROLL-based. Tying the arrival to scroll offset
// would let a fast flick skip the moment the act is built around, and a slow
// drag would smear it into exactly the one-by-one reveal it is not supposed to
// be. Tying the dolly to time would take the camera away from the visitor.

import { smoothstep, clamp } from '../lib/ease.js';

export const T2 = {
  matIn: 0.20,
  matDur: 1.55,
};

export function sample2(t, scroll) {
  return {
    // one scalar every card reads — there is deliberately no per-card stagger
    mat: smoothstep(0, 1, clamp((t - T2.matIn) / T2.matDur)),
    // the camera moves only while the section actually holds the frame
    dolly: clamp(scroll),
  };
}
