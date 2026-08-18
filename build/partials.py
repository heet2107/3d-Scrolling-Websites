"""Shared chrome for the Monga Brothers site — "Forged" theme.

Static HTML output, no runtime framework. ``python3 build/build.py`` stamps
this chrome into every page and writes the final files to the repo root.
Design system: graphite/navy darks, logo-gold accent, Anton display type,
IBM Plex Sans body, IBM Plex Mono for technical labels.
"""

COMPANY = {
    "name": "Monga Brothers Ltd.",
    "tagline": "An ISO 9001:2015 Company",
    "address_1": "B-16, Phase-2, Focal Point",
    "address_2": "Ludhiana-141010, Punjab, India",
    "phone": "+91 70 8748 0555",
    "phone_href": "+917087480555",
    "email": "info@mongabrothers.com",
}

ICONS = {
    "arrow": '<path d="M13.2 5.4 11.8 6.8 16 11H4v2h12l-4.2 4.2 1.4 1.4L19.8 12Z"/>',
    "arrow-up": '<path d="m12 5 7 7-1.4 1.4L13 8.8V20h-2V8.8l-4.6 4.6L5 12Z"/>',
    "check": '<path d="m4.5 12.5 5 5 10-11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    "shield": '<path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5Zm-1.2 15L6.6 11.8 8 10.4l2.8 2.8 5.6-5.6L17.8 9Z"/>',
    "train": '<path d="M12 2c-4 0-8 .5-8 4v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5v.5h12v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-3.58-4-8-4ZM7.5 17A1.5 1.5 0 1 1 9 15.5 1.5 1.5 0 0 1 7.5 17Zm3.5-7H6V6h5Zm2 0V6h5v4Zm3.5 7a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5Z"/>',
    "factory": '<path d="M2 20h20v2H2Zm0-2V9l6 3.5V9l6 3.5V9l6 3.5V18Zm14-9.9V2h4v8.1l-2-1.2Z"/>',
    "gear": '<path d="m19.4 13-.1-1 .1-1 2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a7.3 7.3 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a7.3 7.3 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.6L4.6 11l-.1 1 .1 1-2.1 1.6a.5.5 0 0 0-.1.6l2 3.4a.5.5 0 0 0 .6.2l2.5-1a7.3 7.3 0 0 0 1.7 1l.4 2.6a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.6a7.3 7.3 0 0 0 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.6ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/>',
    "bulb": '<path d="M9 21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9Zm3-19A7 7 0 0 0 8 14.9V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 12 2Z"/>',
    "target": '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6Zm0-9a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z"/>',
    "flask": '<path d="M14 3v6.3l5.3 9.2A2 2 0 0 1 17.6 21H6.4a2 2 0 0 1-1.7-2.5L10 9.3V3H9V1h6v2Zm-2 0h-.1v6.8L8.6 15h6.8L12 9.8Z"/>',
    "leaf": '<path d="M17 8C8 10 5.9 16.2 3.8 21.7l1.9.7.5-1.4c1-.1 1.9-.2 2.8-.2 8 0 12-4.6 12-12.8 0-1-.2-2-.5-3-1 1-2.9 2-5.5 3.5Z"/>',
    "facebook": '<path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5h1.65V4.6A22 22 0 0 0 14.3 4.5c-2.4 0-4 1.45-4 4.1v2.3H7.6V14h2.7v8Z"/>',
    "linkedin": '<path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 8.5h3.9V21H3Zm6.5 0h3.7v1.7h.05a4.1 4.1 0 0 1 3.7-2c3.95 0 4.7 2.6 4.7 6V21h-3.9v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9.5Z"/>',
    "sun": '<circle cx="12" cy="12" r="4.4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>',
    "moon": '<path d="M20.4 13.6A8.5 8.5 0 1 1 10.4 3.6a6.8 6.8 0 0 0 10 10Z"/>',
    "whatsapp": '<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.35A10 10 0 1 0 12 2Zm5.1 13.9c-.25.7-1.45 1.35-2 1.4-.5.05-1.15.1-3.65-.9-3.1-1.25-5-4.4-5.15-4.6-.15-.2-1.2-1.6-1.2-3.05S5.85 7.6 6.1 7.3a.85.85 0 0 1 .6-.3h.45c.15 0 .35-.05.55.4s.7 1.7.75 1.85a.45.45 0 0 1 0 .45 5.4 5.4 0 0 1-.45.6c-.2.2-.4.45-.2.8a11.8 11.8 0 0 0 2.15 2.65 10.4 10.4 0 0 0 2 1.25c.25.1.4.1.55-.05s.65-.75.8-1 .35-.2.55-.15 1.4.65 1.65.8.4.2.45.3a2 2 0 0 1-.1 1Z"/>',
}


def icon(name, cls=""):
    c = ' class="%s"' % cls if cls else ""
    return '<svg%s viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">%s</svg>' % (
        c, ICONS.get(name, ""))


NAV = [
    ("Home", "index.html", None),
    ("About", "about.html", None),
    ("Solutions", "solutions.html", [
        ("Defense Manufacturing", "defense.html"),
        ("Railway Components", "railway.html"),
        ("Manufacturing Facilities", "manufacturing.html"),
    ]),
    ("Industries", "industries.html", None),
    ("Products", "products.html", None),
    ("Contact", "contact.html", None),
]


def head(title, description):
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Monga Brothers Ltd.</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#f7f5ef">
<script>(function() {{
  try {{
    var t = localStorage.getItem("mb-theme");
    if (t === "dark") document.documentElement.removeAttribute("data-theme");
    else if (t === "light") document.documentElement.setAttribute("data-theme", "light");
  }} catch (e) {{}}
}})();</script>
<meta property="og:title" content="{title} | Monga Brothers Ltd.">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/img/plant-wide.webp">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
"""


def header(current=""):
    items, mitems = [], []
    for label, href, sub in NAV:
        cur = ' class="is-current"' if href == current else ""
        if sub:
            links = "".join('<li><a href="%s">%s</a></li>' % (h, t) for t, h in sub)
            items.append(
                f'<li{cur}><a href="{href}">{label}'
                f'<svg class="nav__caret" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5Z"/></svg>'
                f'</a><ul class="submenu">{links}</ul></li>')
            mitems.append(
                f'<li><a href="{href}">{label}</a>'
                f'<ul class="mnav__sub">{links}</ul></li>')
        else:
            items.append(f'<li{cur}><a href="{href}">{label}</a></li>')
            mitems.append(f'<li><a href="{href}">{label}</a></li>')

    c = COMPANY
    return f"""<a class="skip-link" href="#main">Skip to content</a>
<span class="progress" aria-hidden="true"></span>

<header class="site-head">
  <div class="shell site-head__inner">
    <a class="brand" href="index.html">
      <img class="brand__on-dark" src="assets/img/logo-monga-brothers-light.png" width="1140" height="177"
           alt="Monga Brothers Ltd. — an ISO 9001:2015 company">
      <img class="brand__on-light" src="assets/img/logo-monga-brothers.png" width="1140" height="177"
           alt="Monga Brothers Ltd. — an ISO 9001:2015 company">
    </a>
    <nav aria-label="Primary">
      <ul class="nav">{''.join(items)}</ul>
    </nav>
    <a class="btn" href="contact.html">Get a quote {icon('arrow')}</a>
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch theme">
      <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true">{ICONS['sun']}</svg>
      <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true">{ICONS['moon']}</svg>
    </button>
    <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Menu">
      <i></i><i></i><i></i>
    </button>
  </div>
</header>

<nav class="mnav" id="mnav" aria-label="Mobile">
  <ul>{''.join(mitems)}</ul>
  <p class="mnav__meta">
    <a href="tel:{c['phone_href']}">{c['phone']}</a> &middot;
    <a href="mailto:{c['email']}">{c['email']}</a><br>
    {c['address_1']}, {c['address_2']}
  </p>
</nav>
"""


def marquee(words):
    spans = "".join("<span>%s</span>" % w for w in words)
    return f'<div class="marquee" aria-hidden="true"><div class="marquee__track">{spans}</div></div>'


def cta_band(
    title="Send us the drawing. We'll forge the rest.",
    text="Share a drawing or specification and our engineers reply with feasibility, "
         "material options and lead time — within one working day.",
):
    return f"""<section class="cta">
  <div class="shell cta__inner">
    <div data-anim="left">
      <p class="kicker">Start a project</p>
      <h2>{title}</h2>
    <p>{text}</p>
    </div>
    <a class="btn" href="contact.html" data-anim="right">Request a quotation {icon('arrow')}</a>
  </div>
</section>
"""


def footer():
    c = COMPANY
    return f"""<footer class="footer">
  <div class="shell">
    <div class="footer__grid">
      <div>
        <img class="footer__logo" src="assets/img/logo-monga-brothers-light.png" width="1140" height="177"
             alt="Monga Brothers Ltd." loading="lazy">
        <p>Precision forged and machined components for defense, railway and heavy industry.
        Complete in-house capability — from scrap metal to finished, inspected goods.</p>
        <div class="socials">
          <a href="#" aria-label="Facebook">{icon('facebook')}</a>
          <a href="#" aria-label="LinkedIn">{icon('linkedin')}</a>
          <a href="https://wa.me/{c['phone_href'].lstrip('+')}" aria-label="WhatsApp">{icon('whatsapp')}</a>
        </div>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="manufacturing.html">Facilities</a></li>
          <li><a href="industries.html">Industries</a></li>
          <li><a href="products.html">Products</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Solutions</h4>
        <ul>
          <li><a href="defense.html">Defense manufacturing</a></li>
          <li><a href="railway.html">Railway components</a></li>
          <li><a href="manufacturing.html">Forging &amp; machining</a></li>
          <li><a href="solutions.html">All solutions</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li>{c['address_1']}, {c['address_2']}</li>
          <li><a href="tel:{c['phone_href']}">{c['phone']}</a></li>
          <li><a href="mailto:{c['email']}">{c['email']}</a></li>
          <li>Mon &ndash; Sat &middot; 9:00 &ndash; 18:30 IST</li>
        </ul>
      </div>
    </div>
    <div class="footer__bar">
      <span>&copy; 2026 Monga Brothers Ltd. All rights reserved.</span>
      <span>Ludhiana, Punjab, India &middot; ISO 9001:2015</span>
    </div>
  </div>
</footer>

<button class="totop" type="button" aria-label="Back to top">{icon('arrow-up')}</button>
<script src="assets/js/vendor/gsap.min.js" defer></script>
<script src="assets/js/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/js/site.js" defer></script>
</body>
</html>
"""
