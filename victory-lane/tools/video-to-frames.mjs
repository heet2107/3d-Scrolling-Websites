// Converts Google Flow MP4s into the frame sequences the site scrubs.
// Usage:  node video-to-frames.mjs ../incoming/hero.mp4 hero [maxFrames=200]
//         (run once per clip: hero, macro, assembly, atmosphere)
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const [, , input, seq, maxFramesArg] = process.argv;
if (!input || !seq) {
  console.error('usage: node video-to-frames.mjs <video.mp4> <hero|macro|assembly|atmosphere> [maxFrames]');
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`not found: ${input}`);
  process.exit(1);
}
const maxFrames = Number(maxFramesArg ?? 200);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(ROOT, 'frames', seq);

// probe duration to spread maxFrames evenly across the whole clip
// (ffmpeg -i with no output exits non-zero; duration is in its stderr)
function durationOf(txt) {
  const m = txt.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : NaN;
}
let dur = NaN;
try { execFileSync(ffmpeg.path, ['-i', input], { stdio: 'pipe' }); }
catch (e) { dur = durationOf(String(e.stderr || '')); }
if (!dur || Number.isNaN(dur)) dur = 8;
const fps = Math.min(30, maxFrames / dur);

rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
execFileSync(ffmpeg.path, [
  '-i', input,
  '-vf', `fps=${fps.toFixed(4)},scale=1600:-2:flags=lanczos`,
  '-q:v', '3', '-an',
  join(dir, `${seq}_%04d.jpg`),
], { stdio: 'inherit' });

const count = readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ count, pattern: `${seq}_%04d.jpg`, placeholder: false }));
console.log(`${seq}: extracted ${count} frames (${fps.toFixed(1)} fps over ${dur.toFixed(1)}s) -> frames/${seq}/`);
