// Canvas frame-sequence scrubber: preloads a webp sequence and draws
// the frame for a given 0..1 progress with cover-fit.
export class FrameScrubber {
  constructor(canvas, { base, count, pad = 4, ext = 'webp' }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = count;
    this.urls = Array.from({ length: count }, (_, i) =>
      `${base}/f_${String(i + 1).padStart(pad, '0')}.${ext}`
    );
    this.images = new Array(count).fill(null);
    this.current = 0;
    this.loaded = 0;
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.draw(this.current);
  }

  load(onProgress) {
    if (this._loading) return this._loading;
    this._loading = Promise.all(
      this.urls.map((url, i) =>
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            this.images[i] = img;
            this.loaded++;
            onProgress?.(this.loaded / this.count);
            if (i === this.current) this.draw(this.current);
            resolve(img);
          };
          img.onerror = () => resolve(null);
          img.src = url;
        })
      )
    );
    return this._loading;
  }

  // progress 0..1 -> nearest loaded frame
  frame(progress) {
    const target = Math.round(progress * (this.count - 1));
    let i = Math.max(0, Math.min(this.count - 1, target));
    // fall back to the nearest already-loaded frame while loading
    let step = 0;
    while (!this.images[i] && step < this.count) {
      step++;
      if (this.images[i - step]) { i -= step; break; }
      if (this.images[i + step]) { i += step; break; }
    }
    if (this.images[i]) {
      this.current = i;
      this.draw(i);
    }
  }

  draw(i) {
    const img = this.images[i];
    const { width: cw, height: ch } = this.canvas;
    if (!img || !cw || !ch) return;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    this.ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
}
