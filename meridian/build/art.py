"""
MERIDIAN — procedural artwork generator.

Emits a family of light-study SVGs into assets/art/. Everything is deterministic
(seeded), so a rebuild reproduces byte-identical files.

The whole set is built from one idea: light at a given hour. A phase fixes the
palette and the sun's position; the generator varies form around it. That keeps
twenty separate artworks reading as one body of work rather than twenty stock
images that happen to share a filter.

These occupy the same slots photography would. See README "Media slots".
"""
import math
import pathlib
import random

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "art"

PAPER = "#FBF8F3"
INK = "#2A2724"

# Each phase: accent hue, a secondary, and where the sun sits (x, y in 0..1).
# y > 1 puts it below the horizon — that is what makes "deep" read as night.
PHASES = {
    "dawn":     {"hue": "#E8A87C", "second": "#F0C9A4", "sun": (0.18, 0.74), "wash": "#F7E6D6"},
    "meridian": {"hue": "#DFB55A", "second": "#EBD08A", "sun": (0.50, 0.20), "wash": "#F8EFD9"},
    "dusk":     {"hue": "#C98E86", "second": "#E0B3A6", "sun": (0.82, 0.72), "wash": "#F4E1DA"},
    "deep":     {"hue": "#7A8CA0", "second": "#A9B7C4", "sun": (0.62, 1.16), "wash": "#E4E8ED"},
    "sage":     {"hue": "#7D9070", "second": "#AFBFA2", "sun": (0.35, 0.42), "wash": "#E9EDE2"},
}


def _uid(name):
    """Stable per-artwork id prefix, so inlined SVGs never share a def."""
    return "".join(ch if ch.isalnum() else "-" for ch in name)


def _defs_grain(idx, opacity=0.16, freq=0.9):
    """Film grain. Light grounds need far less than dark ones or it reads as dirt."""
    return f"""<filter id="g{idx}" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="4" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer>
</filter>"""


def _grain_rect(idx, w, h):
    return f'<rect width="{w}" height="{h}" filter="url(#g{idx})" opacity="0.55" style="mix-blend-mode:multiply"/>'


def light_study(name, phase, w=1600, h=900, seed=0):
    u = _uid(name)
    """Sky wash + sun glow + haze bands. The core image of the set."""
    p = PHASES[phase]
    rng = random.Random(seed)
    sx, sy = p["sun"]
    cx, cy = sx * w, sy * h
    r = max(w, h) * 0.72

    bands = []
    for i in range(4):
        y = h * (0.52 + i * 0.11) + rng.uniform(-14, 14)
        amp = rng.uniform(8, 22)
        op = 0.16 - i * 0.03
        d = (f'M0 {y:.0f} C {w*0.28:.0f} {y-amp:.0f} {w*0.62:.0f} {y+amp:.0f} {w} {y-amp*0.4:.0f} '
             f'L {w} {h} L 0 {h} Z')
        bands.append(f'<path d="{d}" fill="url(#{u}-band)" opacity="{op:.3f}"/>')

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs>
<linearGradient id="{u}-sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="{p['wash']}"/><stop offset="0.62" stop-color="{PAPER}"/>
<stop offset="1" stop-color="{p['second']}" stop-opacity="0.42"/>
</linearGradient>
<radialGradient id="{u}-sun" cx="{sx:.3f}" cy="{sy:.3f}" r="0.72">
<stop offset="0" stop-color="{p['hue']}" stop-opacity="0.92"/>
<stop offset="0.30" stop-color="{p['hue']}" stop-opacity="0.34"/>
<stop offset="1" stop-color="{p['hue']}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="{u}-band" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="{p['hue']}" stop-opacity="0.7"/>
<stop offset="1" stop-color="{p['second']}" stop-opacity="0.3"/>
</linearGradient>
{_defs_grain(f"{u}-1")}
</defs>
<rect width="{w}" height="{h}" fill="url(#{u}-sky)"/>
<rect width="{w}" height="{h}" fill="url(#{u}-sun)"/>
{''.join(bands)}
<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{w*0.052:.0f}" fill="{p['hue']}" opacity="0.30"/>
<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{w*0.030:.0f}" fill="{PAPER}" opacity="0.62"/>
{_grain_rect(f"{u}-1", w, h)}
</svg>
"""
    (OUT / f"{name}.svg").write_text(svg)
    return name


def ripple(name, phase, w=1200, h=1500, seed=0):
    u = _uid(name)
    """Concentric rings — a drop meeting still water, squashed into perspective."""
    p = PHASES[phase]
    rng = random.Random(seed)
    cx, cy = w * rng.uniform(0.42, 0.58), h * rng.uniform(0.46, 0.56)
    rings = []
    n = 22
    for i in range(n):
        rx = (i + 1) * (w * 0.62 / n)
        ry = rx * 0.34
        op = 0.62 * (1 - i / n) ** 1.2 + 0.10
        sw = 2.4 if i % 4 else 5.0
        rings.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{rx:.0f}" ry="{ry:.0f}" '
                     f'fill="none" stroke="{p["hue"]}" stroke-opacity="{op:.3f}" stroke-width="{sw}"/>')
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs>
<linearGradient id="{u}-bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="{PAPER}"/><stop offset="1" stop-color="{p['wash']}"/>
</linearGradient>
<radialGradient id="{u}-glow" cx="0.5" cy="0.5" r="0.6">
<stop offset="0" stop-color="{p['second']}" stop-opacity="0.55"/>
<stop offset="1" stop-color="{p['second']}" stop-opacity="0"/>
</radialGradient>
{_defs_grain(f"{u}-2")}
</defs>
<rect width="{w}" height="{h}" fill="url(#{u}-bg)"/>
<rect width="{w}" height="{h}" fill="url(#{u}-glow)"/>
{''.join(rings)}
{_grain_rect(f"{u}-2", w, h)}
</svg>
"""
    (OUT / f"{name}.svg").write_text(svg)
    return name


def dune(name, phase, w=1200, h=1500, seed=0):
    u = _uid(name)
    """Stacked contour bands — landform, breath, a slow line."""
    p = PHASES[phase]
    rng = random.Random(seed)
    layers = []
    n = 7
    for i in range(n):
        y = h * (0.30 + i * 0.098)
        amp = rng.uniform(30, 80)
        ph = rng.uniform(0, math.pi * 2)
        pts = []
        for x in range(0, w + 60, 60):
            yy = y + math.sin(x / w * math.pi * 2 + ph) * amp + math.sin(x / w * math.pi * 5 + ph) * amp * 0.28
            pts.append(f"{x} {yy:.0f}")
        d = "M" + " L".join(pts) + f" L{w} {h} L0 {h} Z"
        t = i / (n - 1)
        op = 0.10 + t * 0.30
        col = p["hue"] if i % 2 else p["second"]
        layers.append(f'<path d="{d}" fill="{col}" opacity="{op:.3f}"/>')
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs>
<linearGradient id="{u}-bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="{p['wash']}"/><stop offset="0.55" stop-color="{PAPER}"/>
</linearGradient>
{_defs_grain(f"{u}-3")}
</defs>
<rect width="{w}" height="{h}" fill="url(#{u}-bg)"/>
{''.join(layers)}
{_grain_rect(f"{u}-3", w, h)}
</svg>
"""
    (OUT / f"{name}.svg").write_text(svg)
    return name


def bloom(name, phase, w=1200, h=1500, seed=0):
    u = _uid(name)
    """Soft overlapping blooms — used where a photograph of a person will go."""
    p = PHASES[phase]
    rng = random.Random(seed)
    blobs = []
    cols = [p["hue"], p["second"], PHASES["sage"]["hue"], PHASES["sage"]["second"]]
    for i in range(5):
        cx = rng.uniform(0.16, 0.84) * w
        cy = rng.uniform(0.18, 0.80) * h
        r = rng.uniform(0.20, 0.42) * w
        col = cols[i % len(cols)]
        blobs.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="{col}" '
                     f'opacity="{rng.uniform(0.16, 0.34):.3f}" filter="url(#{u}-soft)"/>')
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
<defs>
<filter id="{u}-soft" x="-40%" y="-40%" width="180%" height="180%">
<feGaussianBlur stdDeviation="{w*0.075:.0f}"/></filter>
{_defs_grain(f"{u}-4", opacity=0.20)}
</defs>
<rect width="{w}" height="{h}" fill="{PAPER}"/>
{''.join(blobs)}
{_grain_rect(f"{u}-4", w, h)}
</svg>
"""
    (OUT / f"{name}.svg").write_text(svg)
    return name


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    made = []

    # Hero + phase light studies (wide)
    made.append(light_study("hero-dawn", "dawn", 1400, 1080, seed=11))
    for i, ph in enumerate(("dawn", "meridian", "dusk", "deep")):
        made.append(light_study(f"phase-{ph}", ph, 1400, 900, seed=20 + i))
        made.append(light_study(f"phase-{ph}-wide", ph, 1600, 700, seed=40 + i))

    # Practices (portrait cards)
    for i, (n, ph, fn) in enumerate([
        ("practice-breath", "dawn", ripple),          # Dawn
        ("practice-movement", "meridian", dune),      # Meridian
        ("practice-sound", "dusk", ripple),           # Dusk
        ("practice-restore", "deep", dune),           # Deep
        ("practice-nourish", "meridian", bloom),      # Meridian — same hour as
                                                      # movement, so a different
                                                      # form keeps them apart
    ]):
        made.append(fn(n, ph, 1200, 1500, seed=60 + i))

    # Guides (portrait slots — photography goes here)
    for i, ph in enumerate(("sage", "dawn", "dusk", "meridian")):
        made.append(bloom(f"guide-{i+1}", ph, 1100, 1375, seed=80 + i))

    # Journal thumbnails — one per article, tinted to the hour it is filed under
    # (see JOURNAL in build.py; order must match).
    for i, (ph, fn) in enumerate([
        ("dawn", dune), ("meridian", ripple), ("dusk", light_study),
        ("deep", dune), ("dawn", bloom), ("meridian", light_study),
    ]):
        made.append(fn(f"journal-{i+1}", ph, 1200, 800, seed=100 + i))

    # Wide bands heading the pages that had no artwork of their own
    made.append(light_study("band-membership", "meridian", 1600, 620, seed=140))
    made.append(dune("band-visit", "sage", 1600, 620, seed=141))
    made.append(light_study("band-statement", "dusk", 1600, 900, seed=142))

    # Retreats (wide)
    for i, (ph, fn) in enumerate([("dusk", dune), ("sage", light_study), ("deep", dune)]):
        made.append(fn(f"retreat-{i+1}", ph, 1600, 1000, seed=120 + i))

    print(f"{len(made)} artworks -> {OUT}")
    return made


if __name__ == "__main__":
    build()
