#!/usr/bin/env bash
# Turn the Higgsfield hero film into the two WebP frame sets the hero scrubs.
#
#   bash build/extract_frames.sh path/to/film.mp4
#
# Writes:
#   assets/frames/d/0001..0240.webp   16:9, 1440x810, 16 fps  (landscape screens)
#   assets/frames/m/0001..0180.webp   3:4 centre crop, 640x853, 12 fps (portrait screens)
#   assets/img/hero-poster.jpg        the film's first frame, doubles as frame zero
#
# Light temporal denoising (hqdn3d) is applied first: it removes the shimmer
# between adjacent frames that a held still would otherwise show, and it cuts
# the WebP size by roughly a third. The counts are hard coded in index.html
# (data-frames / data-mframes) — keep them in sync if you change the rates.
set -euo pipefail

FILM="${1:?usage: extract_frames.sh film.mp4}"
FF="${FFMPEG:-ffmpeg}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
D="$ROOT/assets/frames/d"
M="$ROOT/assets/frames/m"

rm -rf "$D" "$M"
mkdir -p "$D" "$M"

"$FF" -hide_banner -loglevel error -y -i "$FILM" \
  -vf "hqdn3d=2:1.5:4:4,fps=16,scale=1440:-2:flags=lanczos" -frames:v 240 \
  -c:v libwebp -quality 60 -compression_level 6 -preset picture -pix_fmt yuv420p "$D/%04d.webp"

"$FF" -hide_banner -loglevel error -y -i "$FILM" \
  -vf "hqdn3d=2:1.5:4:4,fps=12,crop=810:1080:555:0,scale=640:-2:flags=lanczos" -frames:v 180 \
  -c:v libwebp -quality 54 -compression_level 6 -preset picture -pix_fmt yuv420p "$M/%04d.webp"

"$FF" -hide_banner -loglevel error -y -i "$FILM" \
  -frames:v 1 -vf "hqdn3d=2:1.5:4:4,scale=1600:-2:flags=lanczos" -q:v 3 "$ROOT/assets/img/hero-poster.jpg"

echo "desktop: $(ls "$D" | wc -l) frames, $(du -sh "$D" | cut -f1)"
echo "mobile:  $(ls "$M" | wc -l) frames, $(du -sh "$M" | cut -f1)"
