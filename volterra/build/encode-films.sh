#!/usr/bin/env bash
#
# Encode the source films for scroll scrubbing.
#
#   ./build/encode-films.sh <raw-dir>
#
# Higgsfield returns 1920x1080 HEVC 10-bit. Three things have to change
# before a browser can scrub it:
#
#   1. HEVC in an mp4 is not decodable in Firefox or in many Chromium
#      builds. Everything is re-encoded to 8-bit H.264 High.
#
#   2. A normal encode places a keyframe every couple of seconds, so
#      setting video.currentTime has to decode forward from the previous
#      keyframe — which stalls the moment a scroll flicks. `-g 1` makes
#      every frame a keyframe, so any seek lands on a real frame
#      immediately. It roughly triples the bitrate and it is the whole
#      reason the scrub feels like film rather than a slideshow.
#
#   3. H.264 is not universal. Chromium built without proprietary codecs
#      — the Linux distribution builds, and the Chromium that Playwright
#      ships — reports canPlayType('...avc1...') as "" and fails the load
#      with DEMUXER_ERROR_NO_SUPPORTED_STREAMS. Safari, meanwhile, is the
#      one engine that cannot be relied on for VP9. So each film also
#      ships as VP9/WebM and the player picks at runtime.
#
# Per film:
#   <name>.mp4      1280x720  H.264 CRF 24  — the desktop scrub source
#   <name>-sm.mp4    854x480  H.264 CRF 26  — served under 860px
#   <name>.webm     1280x720  VP9   CRF 40  — codec fallback, one size
#   <name>.jpg                              — poster / reduced-motion still
#
# WebM is 720p only on purpose. The engines that need it are desktop
# Chromium builds; shipping a second small rendition for them would add
# ~8 MB to the repository to serve a narrow window on a Linux desktop.
# The player falls back to the 720p WebM at every width instead.
#
# Idempotent: outputs newer than their input are left alone, so re-running
# after adding one film only encodes that film.

set -euo pipefail

RAW="${1:-}"
if [[ -z "$RAW" || ! -d "$RAW" ]]; then
  echo "usage: $0 <raw-dir>   (directory of source .mp4 files)" >&2
  exit 1
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VID="$HERE/public/assets/videos"
POS="$HERE/public/assets/posters"
mkdir -p "$VID" "$POS"

# ffmpeg-static is a devDependency so this script works straight after
# `npm install`. $FFMPEG overrides it if you would rather use your own build.
FF="${FFMPEG:-}"
if [[ -z "$FF" ]]; then
  FF="$(cd "$HERE" && node -e "process.stdout.write(require('ffmpeg-static'))" 2>/dev/null || true)"
fi
FF="${FF:-ffmpeg}"
if ! "$FF" -version >/dev/null 2>&1; then
  echo "no ffmpeg: run npm install, or set FFMPEG=/path/to/ffmpeg" >&2
  exit 1
fi

newer_than() { [[ -f "$1" && "$1" -nt "$2" ]]; }

shopt -s nullglob
for src in "$RAW"/*.mp4; do
  name="$(basename "$src" .mp4)"

  if newer_than "$VID/$name.mp4" "$src" && newer_than "$VID/$name.webm" "$src"; then
    echo "skip   $name (up to date)"
    continue
  fi
  echo "encode $name"

  "$FF" -y -loglevel error -i "$src" \
    -vf "scale=1280:-2:flags=lanczos,format=yuv420p" \
    -c:v libx264 -profile:v high -preset slow -crf 24 \
    -g 1 -keyint_min 1 -sc_threshold 0 \
    -an -movflags +faststart "$VID/$name.mp4"

  "$FF" -y -loglevel error -i "$src" \
    -vf "scale=854:-2:flags=lanczos,format=yuv420p" \
    -c:v libx264 -profile:v high -preset slow -crf 26 \
    -g 1 -keyint_min 1 -sc_threshold 0 \
    -an -movflags +faststart "$VID/$name-sm.mp4"

  # lag-in-frames 0 / auto-alt-ref 0: with every frame a keyframe there is
  # nothing for VP9's alt-ref machinery to do but add latency and size.
  "$FF" -y -loglevel error -i "$src" \
    -vf "scale=1280:-2:flags=lanczos,format=yuv420p" \
    -c:v libvpx-vp9 -crf 40 -b:v 0 \
    -g 1 -keyint_min 1 -lag-in-frames 0 -auto-alt-ref 0 \
    -deadline good -cpu-used 3 -row-mt 1 -tile-columns 2 \
    -an "$VID/$name.webm"

  "$FF" -y -loglevel error -i "$src" -frames:v 1 \
    -vf "scale=1280:-2:flags=lanczos" -q:v 4 "$POS/$name.jpg"
done

echo
printf 'mp4    '; du -ch "$VID"/*.mp4 2>/dev/null | tail -1
printf 'webm   '; du -ch "$VID"/*.webm 2>/dev/null | tail -1
printf 'poster '; du -ch "$POS"/*.jpg 2>/dev/null | tail -1
