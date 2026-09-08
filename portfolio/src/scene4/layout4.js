// Act IV — the deck's geometry.
//
// The deck is a corridor, not a scatter: one slot per project, threaded along
// a shallow S so the plate you are reading is dead centre and the rest step
// away behind it. Everything below is a function of ONE number — d, how many
// slots this plate is from the one holding the frame — which is what lets the
// scroll scrub the whole thing by moving a single scalar.
//
// The plate's world size is fixed and the CAMERA moves to frame it. Fitting by
// resizing the plate instead would change the deck's proportions with every
// viewport: the same corridor would read as a room on a laptop and as a stack
// of billboards on a phone.

import { smoothstep } from '../lib/ease.js';

export const FOV = 0.80;              // radians
export const PLATE_W = 2.45;          // world units, constant
export const PLATE_ASPECT = 1.6;      // matches the atlas tile

const HALF_W = PLATE_W * 0.5;
const HALF_H = HALF_W / PLATE_ASPECT;

/** How much of the frame's half-width the active plate is allowed to take. */
const FIT = 0.50;
const FIT_PORTRAIT = 0.84;

export function deckConfig(aspect, portrait) {
  const t = Math.tan(FOV * 0.5);
  const fit = portrait ? FIT_PORTRAIT : FIT;
  const z0 = HALF_W / (fit * t * aspect);

  // the spacing is expressed in camera distances, so the corridor keeps its
  // shape when the camera has to back off to fit a narrow viewport
  const step = z0 * (portrait ? 0.62 : 0.78);
  const baseY = z0 * 0.030;

  return {
    t,
    z0,
    step,
    baseY,
    // how far along the frame each successive plate steps. Solved in SCREEN
    // space, not world space: a fixed world offset shrinks with depth, so the
    // deck stacks up dead behind the active plate and the room loses its
    // corridor entirely — which is exactly what a lateral world offset did.
    swing: portrait ? 0.80 : 1.05,
    swingK: portrait ? 0.55 : 0.62,
    // the floor sits just under the plate, not at some fixed altitude: the
    // hover gap is what makes the reflection detach and read as a reflection
    floorY: baseY - HALF_H - HALF_H * (portrait ? 0.10 : 0.09),
    // a lens shift rather than a camera move. The plate stays square to the
    // frame (so its artwork stays readable) while the composition slides over
    // to leave the copy a column of its own.
    shift: portrait ? [0, 0.36] : [-0.24, -0.08],
    vis: portrait ? 2.6 : 4.4,
    halfW: HALF_W,
    halfH: HALF_H,
    portrait,
    aspect,
  };
}

/**
 * Where slot `d` sits, and how much attention it gets. d = 0 is the plate the
 * visitor is on; positive is deeper into the room, negative has already gone
 * past the camera.
 */
export function pose(d, cfg, out = {}) {
  // plates that have passed slow down rather than rushing the lens: at full
  // step they would be inside the near plane two thirds of a slot later, and
  // the exit would be a flash instead of a departure
  const zd = d >= 0 ? d : d * 0.52;
  const past = Math.max(0, -d);

  out.z = -(cfg.z0 + zd * cfg.step);
  const dist = Math.max(0.4, -out.z);

  // the step along the frame decelerates, so the deck crowds toward the far
  // corner the way a real receding row does instead of marching off the edge
  const sx = cfg.swing * (1 - Math.exp(-cfg.swingK * d))
           + 0.05 * Math.sin(d * 1.9);
  out.x = sx * dist * cfg.t * cfg.aspect;

  // height, on the other hand, stays in WORLD space: every plate stands the
  // same distance above the floor, which is the only way seven reflections
  // agree with one another and with the ground they are lying in
  out.y = cfg.baseY + cfg.z0 * 0.020 * Math.sin(d * 0.85);

  // partially turned toward the camera. Fully facing would flatten the deck
  // into a row of billboards; not turning at all shows the far ones edge-on.
  out.ry = -0.62 * Math.atan2(out.x, dist);
  out.rx = 0.030 * Math.sin(d * 0.7);
  out.rz = 0.016 * Math.sin(d * 1.1 + 0.6) - past * 0.20;

  out.focus = Math.exp(-d * d * 1.30);
  out.alpha = smoothstep(-0.88, -0.16, d)
            * (1 - smoothstep(cfg.vis - 1.0, cfg.vis, d));
  return out;
}

/** Painter's order for a deck centred on `head`: furthest drawn first. */
export function order(n, head) {
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  return idx.sort((a, b) => Math.abs(b - head) - Math.abs(a - head));
}

/** Whether a slot is worth a draw call at all. */
export function visible(d, cfg) {
  return d > -0.95 && d < cfg.vis
      && cfg.z0 + (d >= 0 ? d : d * 0.52) * cfg.step > 0.35;
}
