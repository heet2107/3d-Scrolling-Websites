// The film store: a strip of stills, fetched in the order they are needed.
//
// Frames rather than a <video> because this act is SCRUBBED, and scrubbing a
// video by currentTime is at the mercy of the decoder's keyframe spacing.
// Seeking backwards in particular can stall for hundreds of milliseconds,
// which reads as the room sticking under the visitor's hand. A decoded still
// is instant, in both directions, every time.
//
// Two things make the wait invisible. A coarse pass lands first — every eighth
// frame — so the strip is scrubbable end to end after roughly a tenth of the
// bytes; the gaps then fill in behind it. And nothing ever waits: asking for a
// frame that has not arrived yet returns the nearest one that has, so early
// scrolling steps through the coarse pass instead of stalling on black.

const COARSE = 8;          // stride of the first pass
const LANES = 6;           // parallel fetches; more just queues in the socket

export class Film {
  constructor(manifest, { stride = 1 } = {}) {
    this.man = manifest;
    // a phone does not need every frame: half the strip is half the bytes and
    // half the decoded pixels held live, and a scrubbed 6fps still reads as
    // continuous because the visitor sets the rate
    this.stride = stride;
    this.index = [];
    for (let i = 0; i < manifest.count; i += stride) this.index.push(i);
    this.frames = new Array(this.index.length).fill(null);
    this.loaded = 0;
    this.ready = false;
  }

  get length() { return this.index.length; }

  /** URL of the nth frame of the strip, 1-based in the manifest's numbering. */
  url(n) {
    const digits = this.man.pattern.match(/%0(\d)d/);
    const pad = digits ? Number(digits[1]) : 3;
    return this.man.pattern.replace(/%0\d+d/,
      String(this.index[n] + 1).padStart(pad, '0'));
  }

  /**
   * The nearest frame that has actually arrived.
   *
   * Searching outwards rather than clamping forwards matters while the coarse
   * pass is still landing: the visitor scrolling into the middle of the act
   * gets the nearer of the two frames bracketing them, not whichever one
   * happens to sit earlier in the strip.
   */
  nearest(i) {
    const n = this.frames.length;
    const c = Math.max(0, Math.min(n - 1, i));
    if (this.frames[c]) return this.frames[c];
    for (let d = 1; d < n; d++) {
      if (this.frames[c - d]) return this.frames[c - d];
      if (this.frames[c + d]) return this.frames[c + d];
    }
    return null;
  }

  /**
   * Fetch the strip. `onFirst` fires as soon as anything is drawable, and
   * `onFrame` after every arrival so the caller can repaint the frame it is
   * currently sitting on.
   */
  async load({ onFirst, onFrame } = {}) {
    const n = this.frames.length;
    const order = [];
    for (let i = 0; i < n; i += COARSE) order.push(i);
    for (let i = 0; i < n; i++) if (i % COARSE) order.push(i);

    let cursor = 0;
    let announced = false;
    const lane = async () => {
      while (cursor < order.length) {
        const i = order[cursor++];
        const img = await grab(this.url(i));
        if (!img) continue;
        this.frames[i] = img;
        this.loaded++;
        if (!announced) { announced = true; onFirst?.(); }
        onFrame?.(i);
      }
    };
    await Promise.all(Array.from({ length: LANES }, lane));
    this.ready = true;
  }
}

/**
 * One frame, decoded before it is handed back.
 *
 * decode() is the whole point: without it the first drawImage of a fresh
 * image decodes synchronously on the main thread, and 120 of those land as
 * 120 dropped frames spread through the scroll.
 */
function grab(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const done = () => resolve(img);
      if (img.decode) img.decode().then(done, done);
      else done();
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadManifest(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`film manifest ${res.status}`);
  return res.json();
}
