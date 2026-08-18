#!/usr/bin/env python3
"""Add intrinsic width/height to every local <img> in the generated pages.

Without them a lazy image occupies no space until it decodes, so everything
below it jumps down as the page loads. That layout shift is bad on its own, and
it also means a reader who scrolls quickly can end up past content that had not
been laid out yet. Stamping the real pixel size reserves the box up front.

Run after build.py:  python3 build/stamp_dimensions.py
"""

import glob
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

IMG_TAG = re.compile(r"<img\b[^>]*>", re.I)
SRC = re.compile(r'src="([^"]+)"')
HAS_DIMS = re.compile(r'\bwidth=', re.I)


def size_of(rel_path, cache={}):
    if rel_path not in cache:
        full = os.path.join(ROOT, rel_path)
        if not os.path.exists(full):
            cache[rel_path] = None
        else:
            with Image.open(full) as im:
                cache[rel_path] = im.size
    return cache[rel_path]


def stamp(tag):
    if HAS_DIMS.search(tag):
        return tag
    m = SRC.search(tag)
    if not m or m.group(1).startswith(("http", "data:")):
        return tag
    size = size_of(m.group(1))
    if not size:
        print("  ! missing file:", m.group(1))
        return tag
    return tag[:-1].rstrip() + ' width="%d" height="%d">' % size


def main():
    missing = 0
    for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        html = open(path, encoding="utf-8").read()
        new = IMG_TAG.sub(lambda m: stamp(m.group(0)), html)
        if new != html:
            open(path, "w", encoding="utf-8").write(new)
        missing += new.count("! missing")
        print("stamped", os.path.basename(path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
