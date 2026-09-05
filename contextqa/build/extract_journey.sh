#!/usr/bin/env bash
# Turn each act's film into a scroll scrubbable WebP frame sequence.
#
#   bash build/extract_journey.sh act1.mp4 act2.mp4 act3.mp4 act4.mp4
#
# Frames are painted on a canvas rather than played as a <video> because a
# video element cannot be seeked deterministically across engines: Safari in
# particular refuses to land on an exact frame while scrubbing. One WebP per
# frame trades a little bandwidth for a scrub that never tears or stalls.
#
# Writes assets/journey/aN/0001.webp … and aN/poster.jpg, and prints the frame
# count each act ended up with so index.html's data-frames can be checked.
set -euo pipefail
cd "$(dirname "$0")/.."

FFMPEG="${FFMPEG:-$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null || command -v ffmpeg)}"
[ -x "$FFMPEG" ] || { echo "no ffmpeg; set FFMPEG=/path/to/ffmpeg" >&2; exit 1; }

FPS=12          # 6s takes give 72 frames, enough for a smooth scrub
WIDTH=1120      # the act stage is a framed panel, not full bleed
QUALITY=72

act=0
for src in "$@"; do
  act=$((act + 1))
  [ -f "$src" ] || { echo "missing $src" >&2; exit 1; }
  out="assets/journey/a${act}"
  rm -rf "$out"; mkdir -p "$out"

  "$FFMPEG" -y -loglevel error -i "$src" \
    -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
    -c:v libwebp -quality "$QUALITY" -compression_level 6 -an \
    "$out/%04d.webp"

  # The poster is frame one, so the canvas has something to paint before any
  # frame has downloaded.
  "$FFMPEG" -y -loglevel error -i "$src" -frames:v 1 \
    -vf "scale=${WIDTH}:-2:flags=lanczos" -q:v 6 "$out/poster.jpg"

  n=$(ls "$out"/[0-9]*.webp | wc -l)
  bytes=$(du -sh "$out" | cut -f1)
  printf 'act %d: %3d frames, %s  -> %s (set data-frames="%d")\n' "$act" "$n" "$bytes" "$out" "$n"
done
