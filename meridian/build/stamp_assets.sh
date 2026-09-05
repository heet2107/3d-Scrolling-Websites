#!/usr/bin/env bash
# Stamp every stylesheet and script reference in this site's pages with a short
# hash of the file it points at, so a changed asset gets a new URL.
#
# The pages always revalidate but their assets are cached, so without this a
# returning visitor can run new markup against an old stylesheet, which paints
# the page with unstyled icons and empty sections. Run this after touching
# anything under assets/css or assets/js, and commit the result:
#
#   bash build/stamp_assets.sh
#
# On a generated site run it after the generator, since regenerating a page
# rewrites its tags and drops the stamps.
#
set -euo pipefail
cd "$(dirname "$0")/.."

python3 - "$PWD" <<'PY'
import hashlib
import os
import re
import sys

root = sys.argv[1]
pages = sorted(f for f in os.listdir(root) if f.endswith('.html'))
if not pages:
    sys.exit('no .html pages in %s' % root)

# Both link styles appear across these sites: root absolute (/assets/...) and
# relative (assets/...). Keep whichever a page already uses.
ref = re.compile(r'(?P<attr>href|src)="(?P<path>/?assets/(?:css|js)/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"')

digests = {}
def digest(path):
    if path not in digests:
        disk = os.path.join(root, path.lstrip('/'))
        if not os.path.isfile(disk):
            digests[path] = None
        else:
            with open(disk, 'rb') as fh:
                digests[path] = hashlib.sha256(fh.read()).hexdigest()[:8]
    return digests[path]

missing, changed, total = set(), 0, 0
for page in pages:
    full = os.path.join(root, page)
    with open(full, encoding='utf-8') as fh:
        before = fh.read()

    def sub(m):
        global total
        h = digest(m.group('path'))
        if h is None:
            missing.add(m.group('path'))
            return m.group(0)
        total += 1
        return '%s="%s?v=%s"' % (m.group('attr'), m.group('path'), h)

    after = ref.sub(sub, before)
    if after != before:
        with open(full, 'w', encoding='utf-8') as fh:
            fh.write(after)
        changed += 1

for path in sorted(digests):
    if digests[path]:
        print('  %s?v=%s' % (path, digests[path]))
for path in sorted(missing):
    print('  MISSING %s' % path, file=sys.stderr)

print('stamped %d references across %d pages, %d pages changed'
      % (total, len(pages), changed))
if missing:
    sys.exit('%d referenced asset(s) not on disk' % len(missing))
PY
