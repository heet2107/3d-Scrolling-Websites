"""Shared chrome for every MERIDIAN page — written once, stamped into all eight."""

SITE = "MERIDIAN"
# Canonical origin, used for the sitemap and canonical tags.
# Change this one line when a custom domain is attached.
BASE_URL = "https://meridian-wellness.vercel.app"
TAGLINE = "Wellness in rhythm with the day."
CITY = "Ojai, California"
ADDRESS = "412 Matilija Street, Ojai, CA 93023"
PHONE_HUMAN = "(805) 555-0172"
PHONE_TEL = "+18055550172"
EMAIL = "hello@meridian.practice"

NAV = [
    ("The Rhythm", "rhythm"),
    ("Practices", "practices"),
    ("Retreats", "retreats"),
    ("Guides", "guides"),
    ("Journal", "journal"),
    ("Membership", "membership"),
]

# The four hours the whole site is built on.
PHASES = [
    {"key": "dawn", "name": "Dawn", "hours": "05:30 — 09:00", "colour": "#E8A87C",
     "line": "Wake the body before you wake the phone.",
     "body": "Light first, then breath, then movement. The first ninety minutes set the "
             "slope of everything after them — we spend them deliberately."},
    {"key": "meridian", "name": "Meridian", "hours": "11:00 — 14:00", "colour": "#DFB55A",
     "line": "Hold the peak without burning it.",
     "body": "Your core temperature, grip strength and alertness top out around now. "
             "This is the hour for load, for focus, and for eating like you mean it."},
    {"key": "dusk", "name": "Dusk", "hours": "16:30 — 19:30", "colour": "#C98E86",
     "line": "Come down on purpose, not by collapse.",
     "body": "Ojai's pink moment is our cue. Long exhales, slow tissue, warm light, and "
             "sound — the practices that tell a nervous system the day is closing."},
    {"key": "deep", "name": "Deep", "hours": "21:00 — 05:00", "collapse": True, "colour": "#7A8CA0",
     "line": "The work you don't feel yourself doing.",
     "body": "Repair happens in the dark. We treat sleep as the primary practice and "
             "build the other three hours to protect it."},
]


def head(title, desc, page, depth_note=""):
    return f"""<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#FBF8F3">

<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="/assets/art/hero-dawn.svg">

<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23FBF8F3'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23DFB55A'/%3E%3Cpath d='M3 22h26' stroke='%235E7154' stroke-width='2'/%3E%3C/svg%3E">

<script>document.documentElement.className="js";</script>

<link rel="preload" href="/assets/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/meridian-fonts.css">
<link rel="stylesheet" href="/assets/css/meridian.css">
</head>
<body data-page="{page}">

<div class="grain-page" aria-hidden="true"></div>
"""


def mark():
    """The house mark: a sun crossing the meridian."""
    return ('<svg class="nav__mark" viewBox="0 0 24 24" aria-hidden="true">'
            '<circle cx="12" cy="10.5" r="5.2" fill="#DFB55A"/>'
            '<path d="M1.5 18.5h21" stroke="#5E7154" stroke-width="1.8" stroke-linecap="round"/>'
            '</svg>')


def nav(current):
    def cur(slug):
        return ' aria-current="page"' if slug == current else ""
    links = "".join(f'<li><a href="/{slug}"{cur(slug)}>{label}</a></li>' for label, slug in NAV)
    menu = "".join(f'<a href="/{slug}"{cur(slug)}>{label}</a>' for label, slug in NAV)
    return f"""<header class="nav" id="nav">
  <div class="nav__inner">
    <a class="nav__logo" href="/" aria-label="{SITE}, home">{mark()}{SITE}</a>
    <nav aria-label="Primary"><ul class="nav__links">{links}</ul></nav>
    <a class="btn btn--solid nav__book" href="/visit#book">Book a first visit</a>
    <button class="nav__burger" id="burger" aria-expanded="false" aria-controls="navMenu">
      <span>Menu</span><i aria-hidden="true"></i>
    </button>
  </div>
  <div class="nav__menu" id="navMenu">
    {menu}<a href="/visit">Visit</a>
    <a class="btn btn--solid btn--block" href="/visit#book">Book a first visit</a>
  </div>
</header>

<main>
"""


def arc(idprefix="arc"):
    """The day arc — sun path from dawn to deep, used as a scroll indicator."""
    return f"""<div class="arc" id="{idprefix}">
<svg viewBox="0 0 900 180" role="img" aria-label="The arc of a day, from dawn through meridian and dusk into deep night.">
  <path class="arc__path" d="M20 150 C 200 10, 700 10, 880 150"/>
  <path class="arc__prog" id="{idprefix}Prog" d="M20 150 C 200 10, 700 10, 880 150"/>
  <circle class="arc__sun" id="{idprefix}Sun" cx="20" cy="150" r="9" fill="#E8A87C"/>
  <text class="arc__tick" x="20"  y="174" text-anchor="middle">DAWN</text>
  <text class="arc__tick" x="316" y="174" text-anchor="middle">MERIDIAN</text>
  <text class="arc__tick" x="600" y="174" text-anchor="middle">DUSK</text>
  <text class="arc__tick" x="880" y="174" text-anchor="middle">DEEP</text>
</svg>
</div>"""


def cta(title="Begin where the day begins.",
        body="Your first visit is a ninety-minute session with a guide: we map your day, "
             "test where the energy actually goes, and pick one practice to start.",
        label="Book a first visit", href="/visit#book"):
    return f"""<section class="section section--sage">
  <div class="wrap">
    <div class="section__head section__head--center reveal">
      <div>
        <p class="eyebrow eyebrow--plain">First visit</p>
        <h2 class="display">{title}</h2>
        <p class="lede" style="margin-top:1.15rem">{body}</p>
        <div class="btn-row" style="justify-content:center;margin-top:1.75rem">
          <a class="btn btn--solid" href="{href}">{label} <span class="arrow">&rarr;</span></a>
          <a class="btn" href="/membership">See membership</a>
        </div>
      </div>
    </div>
  </div>
</section>"""


def footer():
    nav_links = "".join(f'<li><a href="/{s}">{l}</a></li>' for l, s in NAV)
    return f"""</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot__grid">
      <div>
        <p class="foot__logo">{SITE}</p>
        <p class="foot__tag">{TAGLINE} A practice in {CITY}, built around the four hours of the body's day.</p>
        <a class="btn" href="/visit#book">Book a first visit <span class="arrow">&rarr;</span></a>
      </div>
      <div>
        <h4>Practice</h4>
        <ul>{nav_links}</ul>
      </div>
      <div>
        <h4>Find us</h4>
        <address>
          {ADDRESS}<br>
          <a href="tel:{PHONE_TEL}">{PHONE_HUMAN}</a><br>
          <a href="mailto:{EMAIL}">{EMAIL}</a>
        </address>
      </div>
      <div>
        <h4>Doors</h4>
        <ul>
          <li>Mon&ndash;Fri &nbsp; 05:30&ndash;20:00</li>
          <li>Saturday &nbsp; 06:30&ndash;17:00</li>
          <li>Sunday &nbsp;&nbsp; 07:30&ndash;14:00</li>
          <li><a href="/visit">Full schedule</a></li>
        </ul>
      </div>
    </div>
    <div class="foot__base">
      <span>&copy; 2026 {SITE} Practice &middot; A fictional studio, built as a demo.</span>
      <span>{CITY} &middot; 34.4480&deg; N, 119.2429&deg; W</span>
    </div>
  </div>
</footer>

<script src="/assets/js/vendor/gsap.min.js"></script>
<script src="/assets/js/vendor/ScrollTrigger.min.js"></script>
<script src="/assets/js/meridian.js"></script>
</body>
</html>
"""


def page(slug, title, desc, body):
    return head(title, desc, slug) + nav(slug) + body + footer()


def phead(crumb, eyebrow, title, lede, extra=""):
    """Standard inner-page header."""
    return f"""<section class="phead">
  <div class="wrap">
    <p class="crumb"><a href="/">{SITE}</a> &nbsp;/&nbsp; {crumb}</p>
    <div class="phead__grid">
      <div class="reveal">
        <p class="eyebrow">{eyebrow}</p>
        <h1 class="display">{title}</h1>
      </div>
      <div class="reveal">
        <p class="lede">{lede}</p>
        {extra}
      </div>
    </div>
  </div>
</section>"""
