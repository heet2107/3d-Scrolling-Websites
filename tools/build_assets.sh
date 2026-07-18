#!/usr/bin/env bash
# Rebuild the site's video-derived assets from the three source clips.
#
# Usage:
#   tools/build_assets.sh <orbit.mp4> <builder.mp4> <closer.mp4>
#
# Produces:
#   assets/frames/orbit_0001..0120.jpg  — hero orbit scroll-scrub sequence (15fps x 8s)
#   assets/video/builder.mp4            — pillars background (720p, muted)
#   assets/video/closer.mp4             — work background (720p, muted)
#   assets/img/poster.jpg               — hero poster (orbit frame 1)
#   assets/img/og.jpg                   — social share image
set -euo pipefail

ORBIT=${1:?orbit clip path}
BUILDER=${2:?builder clip path}
CLOSER=${3:?closer clip path}

REPO="$(cd "$(dirname "$0")/.." && pwd)"
FF=${FFMPEG:-$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null || echo ffmpeg)}

mkdir -p "$REPO/assets/frames" "$REPO/assets/video" "$REPO/assets/img"
rm -f "$REPO/assets/frames"/orbit_*.jpg

echo "==> extracting orbit frames"
"$FF" -y -hide_banner -loglevel error -i "$ORBIT" \
  -vf "fps=15,scale=1536:-2" -frames:v 120 -q:v 4 \
  "$REPO/assets/frames/orbit_%04d.jpg"

echo "==> poster + og image"
"$FF" -y -hide_banner -loglevel error -i "$ORBIT" \
  -vf "select=eq(n\,0),scale=1536:-2" -frames:v 1 -q:v 3 "$REPO/assets/img/poster.jpg"
"$FF" -y -hide_banner -loglevel error -i "$ORBIT" \
  -vf "select=eq(n\,0),scale=1200:-2" -frames:v 1 -q:v 4 "$REPO/assets/img/og.jpg"

echo "==> transcoding background videos (h264 + vp9)"
for pair in "builder:$BUILDER" "closer:$CLOSER"; do
  name="${pair%%:*}"; src="${pair#*:}"
  "$FF" -y -hide_banner -loglevel error -i "$src" \
    -vf "scale=1280:-2" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -an \
    "$REPO/assets/video/$name.mp4"
  "$FF" -y -hide_banner -loglevel error -i "$src" \
    -vf "scale=1280:-2" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -pix_fmt yuv420p -an \
    "$REPO/assets/video/$name.webm"
done

echo "==> done"
ls "$REPO/assets/frames" | head -3
du -sh "$REPO/assets/frames" "$REPO/assets/video"
