#!/usr/bin/env bash
# Stamp every stylesheet and script reference in index.html with a short hash of
# the file it points at, so a changed asset gets a new URL.
#
# The page's HTML always revalidates but its assets are cached, so without this a
# returning visitor can run new HTML against an old stylesheet, which paints the
# page with unstyled icons and empty sections. Run this after touching anything
# under assets/css or assets/js, and commit the result:
#
#   bash build/stamp_assets.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

page=index.html
[ -f "$page" ] || { echo "no $page here" >&2; exit 1; }

# Every asset path the page references, minus any stamp already on it.
paths=$(grep -oE '(href|src)="/assets/(css|js)/[^"?]+\.(css|js)' "$page" \
  | sed -E 's/^(href|src)="//' | sort -u)

changed=0
for path in $paths; do
  file=".${path}"
  if [ ! -f "$file" ]; then
    echo "  missing  ${path}" >&2
    continue
  fi
  hash=$(sha256sum "$file" | cut -c1-8)
  # Replace the reference whether or not it already carries a stamp.
  before=$(sha256sum "$page")
  python3 - "$page" "$path" "$hash" <<'PY'
import io, re, sys
page, path, hash_ = sys.argv[1], sys.argv[2], sys.argv[3]
s = io.open(page, encoding='utf-8').read()
s = re.sub(re.escape(path) + r'(\?v=[0-9a-f]+)?(?=")', path + '?v=' + hash_, s)
io.open(page, 'w', encoding='utf-8').write(s)
PY
  after=$(sha256sum "$page")
  [ "$before" = "$after" ] || changed=$((changed + 1))
  echo "  ${path}?v=${hash}"
done

echo "stamped $(echo "$paths" | wc -w) references, ${changed} changed"
