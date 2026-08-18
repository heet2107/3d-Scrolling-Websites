#!/usr/bin/env python3
"""Stamp the shared chrome into every page and write the site to the repo root.

Usage:  python3 build/build.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from partials import head, header, footer, ticker, cta_band, icon  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --------------------------------------------------------------------------
# reusable content blocks
# --------------------------------------------------------------------------

EXPERTISE = [
    (
        "Defense Manufacturing",
        "flask",
        "High-precision components for tanks, pistons and critical military assemblies, "
        "produced to stringent defense standards.",
        "assets/img/poster-drop-forging.jpg",
        "defense.html",
    ),
    (
        "Railway Components",
        "train",
        "Forged and machined railway parts — from braking components to engine and bogie "
        "hardware — built for durability.",
        "assets/img/lhb-coaches.webp",
        "railway.html",
    ),
    (
        "Diverse Industries",
        "factory",
        "Automotive, agriculture, earthmoving, oil &amp; gas and general engineering, each "
        "served with tailored solutions.",
        "assets/img/poster-rolling-mill.jpg",
        "industries.html",
    ),
    (
        "Quality Assurance",
        "shield",
        "Spectrometer, UTM, hardness, crack-detection and Izod impact testing on every "
        "critical batch we release.",
        "assets/img/spectrometer-lab.webp",
        "manufacturing.html",
    ),
    (
        "Innovative Designs",
        "bulb",
        "AutoCAD design, in-house tool room and continuous process development turn a "
        "drawing into a repeatable part.",
        "assets/img/bogie-assembly-drawing.webp",
        "solutions.html",
    ),
    (
        "Customer Focused",
        "target",
        "Your requirement drives every phase — feasibility, material selection, sampling, "
        "production and dispatch.",
        "assets/img/poster-quality-lab.jpg",
        "contact.html",
    ),
]


def expertise_cards(items=None):
    out = []
    for i, (title, ic, text, img, href) in enumerate(items or EXPERTISE):
        out.append(f"""      <article class="xcard tilt" data-tilt="7" data-reveal data-reveal-delay="{(i % 3) * 110}">
        <a class="xcard__media" href="{href}">
          <img src="{img}" alt="{title}" loading="lazy" decoding="async">
          <span class="xcard__more">Read more</span>
        </a>
        <div class="xcard__body">
          <span class="xcard__icon">{icon(ic)}</span>
          <div>
            <h3><a href="{href}">{title}</a></h3>
            <p>{text}</p>
          </div>
        </div>
      </article>""")
    return "\n".join(out)


PRODUCTS = [
    ("Forged Plug &amp; Stem", "part-forged-plug.webp", "defense", "Closed-die forging"),
    ("Lever Arm Forging", "part-lever-arm.webp", "railway", "Hammer forged, machined"),
    ("Machined Sleeve", "part-sleeve.webp", "railway", "CNC turned"),
    ("Taper Plug", "part-taper-pin.webp", "defense", "Alloy steel"),
    ("Forged Ring", "part-forged-ring.webp", "industry", "Seamless rolled"),
    ("Mounting Bracket", "part-bracket.webp", "railway", "Drop forged"),
    ("Brake Disc Hub", "part-brake-disc.webp", "railway", "Turned &amp; ground"),
    ("Machined Hub", "part-machined-hub.webp", "industry", "VMC finished"),
    ("Tie Rod Assembly", "part-tie-rod.webp", "industry", "Forged &amp; welded"),
    ("Eye Link", "part-eye-link.webp", "railway", "Forged eye end"),
    ("Anchor Plate", "part-anchor-plate.webp", "defense", "Heat treated"),
    ("Slotted Block", "part-slotted-block.webp", "industry", "Precision milled"),
]


def product_tiles(filter_cats=None, limit=None):
    rows = [p for p in PRODUCTS if not filter_cats or p[2] in filter_cats]
    if limit:
        rows = rows[:limit]
    out = []
    for i, (name, img, cat, note) in enumerate(rows):
        out.append(f"""      <article class="tile tilt" data-tilt="9" data-category="{cat}" data-reveal="zoom" data-reveal-delay="{(i % 4) * 90}">
        <img src="assets/img/{img}" alt="{name}" loading="lazy" decoding="async">
        <h3>{name}</h3>
        <span>{note}</span>
      </article>""")
    return "\n".join(out)


def flip_cards(items):
    out = []
    for i, (title, kicker, img, bullets, href) in enumerate(items):
        lis = "".join("<li>%s</li>" % b for b in bullets)
        out.append(f"""      <article class="flip" data-reveal data-reveal-delay="{(i % 3) * 110}">
        <div class="flip__inner">
          <div class="flip__face flip__front">
            <img src="{img}" alt="{title}" loading="lazy" decoding="async">
            <span>{kicker}</span>
            <h3>{title}</h3>
          </div>
          <div class="flip__face flip__back">
            <h3>{title}</h3>
            <ul>{lis}</ul>
            <a class="flip__link" href="{href}">Explore {icon('arrow', 'nav__caret')}</a>
          </div>
        </div>
      </article>""")
    return "\n".join(out)


def accordion(items, ident="faq"):
    out = []
    for i, (q, a) in enumerate(items):
        expanded = "true" if i == 0 else "false"
        out.append(f"""      <div class="accordion__item">
        <h3 style="margin:0">
          <button class="accordion__btn" type="button" aria-expanded="{expanded}" aria-controls="{ident}-{i}">
            {q}<span class="accordion__sign" aria-hidden="true">+</span>
          </button>
        </h3>
        <div class="accordion__panel" id="{ident}-{i}"{'' if i == 0 else ' style="height:0"'}>
          <p>{a}</p>
        </div>
      </div>""")
    return '<div class="accordion" data-reveal>\n' + "\n".join(out) + "\n    </div>"


def checklist(items):
    lis = "".join(
        "<li>%s<span>%s</span></li>" % (icon("check"), t) for t in items
    )
    return '<ul class="checklist">%s</ul>' % lis


def banner(title, lede, crumb, video=None, poster=None, image=None):
    if video:
        media = (
            f'<video src="assets/video/{video}" poster="{poster}" autoplay muted loop '
            f'playsinline preload="none" aria-hidden="true"></video>'
        )
    else:
        media = f'<img src="{image}" alt="" aria-hidden="true">'
    return f"""<section class="banner">
  <div class="banner__media" data-parallax="0.12">{media}</div>
  <div class="shell">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="index.html">Home</a> / <span>{crumb}</span>
    </nav>
    <h1 data-reveal>{title}</h1>
    <p data-reveal data-reveal-delay="120">{lede}</p>
  </div>
</section>
"""


# --------------------------------------------------------------------------
# pages
# --------------------------------------------------------------------------

def page_index():
    faq = [
        ("What does Monga Brothers manufacture?",
         "We manufacture forged and machined components for the defense and railway sectors, "
         "along with alloy steel rounds and custom parts for automotive, agricultural, "
         "earthmoving and general engineering customers. Everything is produced in house — "
         "from melting scrap in our induction furnace through to the finished, inspected part."),
        ("Can you work from our drawings and specifications?",
         "Yes. We are specialists in manufacturing forged components to customer drawings and "
         "specifications, and we manufacture to international standards. Our tool room and "
         "AutoCAD design team develop the dies and fixtures needed for your part."),
        ("What testing facilities do you have?",
         "Our laboratory is equipped with a spectrometer, universal testing machine, microscope, "
         "hardness testing, crack detection and Izod impact testing, supported by heat treatment, "
         "press and machining facilities."),
        ("How do I place an order or request a quotation?",
         "Send your drawing, specification or sample requirement through the contact form, by "
         "email to info@mongabrothers.com, or call +91 70 8748 0555. We respond with feasibility, "
         "material options and lead time."),
        ("Where are you located?",
         "B-16, Phase-2, Focal Point, Ludhiana-141010, Punjab, India — in the heart of one of "
         "India's largest engineering clusters, with road and rail links to every major port."),
    ]

    quotes = [
        ("Monga Brothers transformed our supply chain with their defense components. "
         "Dimensional consistency batch after batch.", "Procurement Lead", "Defense sector"),
        ("Their railway parts are top-notch. Across three years of supply we have not had "
         "a single field failure.", "Rolling Stock Engineer", "Railway operator"),
        ("From enquiry to first article in weeks, not months. The tool room capability makes "
         "the difference.", "Design Manager", "Heavy engineering"),
        ("Fast delivery and superior product quality. Monga Brothers is our go-to forging "
         "partner in North India.", "Logistics Manager", "OEM supplier"),
    ]
    quote_html = "\n".join(
        f"""      <figure class="quote" data-reveal data-reveal-delay="{i * 100}" style="margin:0">
        <span class="quote__mark" aria-hidden="true">&ldquo;</span>
        <blockquote style="margin:0"><p>{t}</p></blockquote>
        <footer><b>{who}</b><span>{role}</span></footer>
      </figure>"""
        for i, (t, who, role) in enumerate(quotes)
    )

    capabilities = [
        ("01", "Induction Furnace", "Scrap is melted and chemistry corrected in our own melting "
         "shop, so the steel that becomes your component is under our control from day one."),
        ("02", "Re-Rolling Unit", "Billets are rolled into alloy steel rounds and bars in the "
         "sizes our forging lines and our customers need."),
        ("03", "Drop Forging Unit", "Hammers and presses form the part hot, giving the grain flow "
         "that makes a forging stronger than a cut or cast equivalent."),
        ("04", "Heat Treatment", "Normalising, hardening and tempering bring the component to the "
         "mechanical properties called out on the drawing."),
        ("05", "Machining Unit", "CNC turning centres and vertical machining centres take the "
         "forging to final dimensions and surface finish."),
        ("06", "Inspection &amp; Despatch", "Spectrometer, UTM, hardness, crack detection and Izod "
         "impact testing before the batch is packed and released."),
    ]
    cap_html = "\n".join(
        f"""      <article class="ucard" data-reveal="zoom" data-reveal-delay="{(i % 3) * 100}">
        <span class="ucard__num">{n}</span>
        <h3>{t}</h3>
        <p>{d}</p>
      </article>"""
        for i, (n, t, d) in enumerate(capabilities)
    )

    areas = flip_cards([
        ("Defense", "Critical engineering",
         "assets/img/poster-drop-forging.jpg",
         ["Tank and vehicle components", "Pistons and pressure parts",
          "Batch traceability", "Government &amp; contractor supply"],
         "defense.html"),
        ("Railway", "Heavy-duty components",
         "assets/img/lhb-coaches.webp",
         ["Braking system parts", "Bogie and coupling hardware",
          "Engine components", "Conformance to railway standards"],
         "railway.html"),
        ("Manufacturing", "Scrap to finished goods",
         "assets/img/rolling-mill-wide.webp",
         ["Melting and re-rolling", "Drop forging and pressing",
          "CNC machining", "In-house tool room"],
         "manufacturing.html"),
    ])

    body = f"""<main id="main">

<section class="hero">
  <div class="hero__media" data-parallax="0.16">
    <video src="assets/video/foundry-pour.mp4" poster="assets/img/poster-foundry-pour.jpg"
           autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
  </div>
  <div class="shell">
    <div class="hero__inner">
      <span class="hero__tag" data-reveal>Monga Brothers Ltd.</span>
      <h1 data-reveal data-reveal-delay="90">Trusted <em>manufacturing</em> partner</h1>
      <p class="hero__lede" data-reveal data-reveal-delay="180">
        Precision forged and machined components for defense and railway industries —
        engineered in Ludhiana, delivered to specification, backed by complete in-house
        capability from scrap metal to finished goods.
      </p>
      <div class="hero__actions" data-reveal data-reveal-delay="260">
        <a class="btn" href="solutions.html">Our solutions</a>
        <a class="btn btn--ghost" href="contact.html">Get a quote</a>
      </div>
      <p class="hero__rotator" data-reveal data-reveal-delay="340">
        <span>Now forging</span>
        <b data-rotate="Defense components|Railway hardware|Alloy steel rounds|Custom forgings">Defense components</b>
      </p>
    </div>
  </div>
  <span class="hero__scroll" aria-hidden="true"><i></i>Scroll</span>
</section>

{ticker(["ISO 9001:2015", "In-house melting", "Drop forging", "CNC machining", "Heat treatment", "Testing laboratory"])}

<section class="section">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">What we deliver</p>
      <h2>Our expertise</h2>
    </div>
    <div class="grid grid--3">
{expertise_cards()}
    </div>
  </div>
</section>

<section class="split">
  <div class="split__media">
    <img src="assets/img/forge-worker.webp" alt="Forging operator at the hammer" loading="lazy"
         data-parallax="0.08">
    <div class="tabs" data-tabs data-reveal="right">
      <button role="tab" aria-selected="true" aria-controls="ab-1" id="tab-1">
        <span class="tabs__tick">{icon('check')}</span>
        <span><strong>About us</strong><small>Company overview</small></span>
      </button>
      <button role="tab" aria-selected="false" aria-controls="ab-2" id="tab-2">
        <span class="tabs__tick">{icon('check')}</span>
        <span><strong>Our journey</strong><small>Manufacturing milestones</small></span>
      </button>
      <button role="tab" aria-selected="false" aria-controls="ab-3" id="tab-3">
        <span class="tabs__tick">{icon('check')}</span>
        <span><strong>Manufacturing</strong><small>Precision &amp; process</small></span>
      </button>
      <button role="tab" aria-selected="false" aria-controls="ab-4" id="tab-4">
        <span class="tabs__tick">{icon('check')}</span>
        <span><strong>Technology</strong><small>Modern engineering</small></span>
      </button>
    </div>
  </div>
  <div class="split__body">
    <div class="heading" data-reveal="right">
      <p class="eyebrow">Welcome to Monga Brothers</p>
      <h2>About us</h2>
    </div>

    <div class="tabpanel" id="ab-1" role="tabpanel" aria-labelledby="tab-1">
      <p>Monga Brothers is one of the leading Indian manufacturers with complete in-house
      facilities running from scrap metal all the way to end goods. We specialise in precision
      engineering for the defense and railway industries, and we deliver components that meet
      demanding performance and safety standards.</p>
    </div>
    <div class="tabpanel" id="ab-2" role="tabpanel" aria-labelledby="tab-2" hidden>
      <p>What began as a forging shop in Ludhiana's Focal Point has grown into an integrated
      plant with its own induction furnace, re-rolling unit, drop forging unit and machining
      unit — each step added so that quality never has to be sub-contracted out.</p>
    </div>
    <div class="tabpanel" id="ab-3" role="tabpanel" aria-labelledby="tab-3" hidden>
      <p>We have the requisite infrastructure with the latest machinery and equipment to
      develop any type of forging component, and we manufacture to international standards as
      specialists in forged components made to drawings and specifications.</p>
    </div>
    <div class="tabpanel" id="ab-4" role="tabpanel" aria-labelledby="tab-4" hidden>
      <p>A well-equipped laboratory, a fully dedicated tool room, the latest AutoCAD design
      systems and heat treatment, press and machining facilities sit behind every part —
      supported by professionally qualified, well-motivated and trained staff.</p>
    </div>

    <div class="stats">
      <div class="stat" data-reveal data-reveal-delay="0">
        <span class="stat__icon">{icon('users')}</span>
        <span class="stat__num" data-count="240"><span>+</span></span>
        <p>Engineers &amp; technicians</p>
      </div>
      <div class="stat" data-reveal data-reveal-delay="120">
        <span class="stat__icon">{icon('factory')}</span>
        <span class="stat__num" data-count="4"><span> units</span></span>
        <p>Integrated production lines</p>
      </div>
      <div class="stat" data-reveal data-reveal-delay="240">
        <span class="stat__icon">{icon('gear')}</span>
        <span class="stat__num" data-count="3250"><span>+</span></span>
        <p>Components delivered</p>
      </div>
    </div>
  </div>
</section>

<section class="section section--dark projects">
  <img class="projects__bg" src="assets/img/forge-shop-collage.webp" alt="" aria-hidden="true"
       data-parallax="0.1" loading="lazy">
  <div class="shell">
    <div class="projects__head heading" data-reveal style="max-width:none;margin-bottom:2.8rem">
      <div>
        <p class="eyebrow">Our works</p>
        <h2>Latest projects</h2>
      </div>
      <a class="btn" href="products.html">More projects</a>
    </div>
    <div class="grid grid--4">
      <article class="pcard" data-reveal="zoom" data-reveal-delay="0">
        <div class="pcard__media"><img src="assets/img/part-anchor-plate.webp" alt="Defense component" loading="lazy"></div>
        <div class="pcard__body"><h3>Defense components</h3><span>Critical engineering</span></div>
      </article>
      <article class="pcard" data-reveal="zoom" data-reveal-delay="90">
        <div class="pcard__media"><img src="assets/img/forging-press.webp" alt="Railway forging" loading="lazy"></div>
        <div class="pcard__body"><h3>Railway forgings</h3><span>Heavy-duty components</span></div>
      </article>
      <article class="pcard" data-reveal="zoom" data-reveal-delay="180">
        <div class="pcard__media"><img src="assets/img/cnc-turning-centre.webp" alt="CNC turning centre" loading="lazy"></div>
        <div class="pcard__body"><h3>Precision machining</h3><span>Industrial manufacturing</span></div>
      </article>
      <article class="pcard" data-reveal="zoom" data-reveal-delay="270">
        <div class="pcard__media"><img src="assets/img/component-family.webp" alt="Custom engineered parts" loading="lazy"></div>
        <div class="pcard__body"><h3>Custom engineering</h3><span>Tailored solutions</span></div>
      </article>
    </div>
  </div>
</section>

<section class="section section--dark" style="background:var(--ink-2)">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">How a part is made</p>
      <h2>From scrap metal to finished goods</h2>
    </div>
    <div class="rail">
{cap_html}
    </div>
    <p style="margin-top:1.2rem;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;color:var(--steel)">
      Drag or scroll sideways &rarr;
    </p>
  </div>
</section>

<section class="section section--tint">
  <div class="shell">
    <div class="heading heading--center" data-reveal>
      <p class="eyebrow">Where we work</p>
      <h2>Service areas</h2>
    </div>
    <div class="grid grid--3">
{areas}
    </div>
    <p style="text-align:center;margin-top:2.4rem" data-reveal>
      <a class="btn btn--dark" href="industries.html">See all industries served</a>
    </p>
  </div>
</section>

<section class="section section--dark">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">What clients say</p>
      <h2>Trusted on the shop floor</h2>
    </div>
    <div class="grid grid--4">
{quote_html}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell grid grid--2" style="align-items:start">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Your questions, answered</p>
        <h2>Frequently asked</h2>
      </div>
      <p class="lede">If your question is not here, send us the drawing and we will answer it
      with a feasibility note instead of a brochure.</p>
      <p><a class="btn btn--dark" href="contact.html">Ask an engineer</a></p>
    </div>
    <div data-reveal="right">
    {accordion(faq)}
    </div>
  </div>
</section>

{cta_band()}
</main>
"""
    return (
        head("Precision Forging & Machining for Defense and Railways",
             "Monga Brothers Ltd. — ISO 9001:2015 manufacturer of forged and machined "
             "components for defense, railway and general engineering. Ludhiana, Punjab, India.")
        + header("index.html")
        + body
        + footer()
    )


def page_about():
    values = [
        ("Quality", "shield", "Unmatched quality in every product we deliver, verified in our own "
         "laboratory before despatch."),
        ("Reliability", "check", "Dependable components that stand the test of time in service, "
         "batch after batch."),
        ("Innovation", "bulb", "Constantly evolving processes, tooling and design capability to "
         "meet changing industry demands."),
    ]
    val_html = "\n".join(
        f"""      <article class="ucard" data-reveal data-reveal-delay="{i * 110}">
        <span class="ucard__num">0{i + 1}</span>
        <h3>{t}</h3>
        <p>{d}</p>
      </article>"""
        for i, (t, ic, d) in enumerate(values)
    )

    journey = [
        ("Melting", "Induction furnace commissioned so steel chemistry is set in house."),
        ("Rolling", "Re-rolling unit added to produce alloy steel rounds and bars."),
        ("Forging", "Drop forging unit with hammers and presses for components to drawing."),
        ("Machining", "CNC turning and vertical machining centres for finished parts."),
        ("Assurance", "Laboratory, tool room and AutoCAD design complete the loop."),
    ]
    j_html = "\n".join(
        f"""      <article class="ucard" data-reveal="zoom" data-reveal-delay="{(i % 3) * 100}">
        <span class="ucard__num">{i + 1:02d}</span>
        <h3>{t}</h3>
        <p>{d}</p>
      </article>"""
        for i, (t, d) in enumerate(journey)
    )

    body = f"""<main id="main">
{banner("About Monga Brothers",
        "One of the leading Indian manufacturers with complete in-house facilities — from "
        "scrap metal to end goods — serving defense, railway and general engineering.",
        "About", video="rolling-mill.mp4", poster="assets/img/poster-rolling-mill.jpg")}

{ticker(["Ludhiana, Punjab", "ISO 9001:2015", "Forging &amp; machining", "Since generations", "Made to drawing"])}

<section class="section">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Who we are</p>
        <h2>Engineering that industries depend on</h2>
      </div>
      <p>Monga Brothers is a trusted manufacturer specialising in precision engineering for the
      defense and railway industries. With a strong focus on quality, reliability and innovation,
      we deliver components that meet demanding performance and safety standards.</p>
      <p>The company has the requisite infrastructure, with all the latest machinery and equipment,
      to develop any type of forging component. We are manufacturers of alloy steel rounds, and we
      hold the state-of-the-art machinery and hammers to forge to your requirement. We manufacture
      as per international standards and are specialists in forged components made to drawings and
      specifications.</p>
      <p>Above all, we have professionally qualified staff and a well-motivated, trained workforce
      supporting production and every other operational activity.</p>
    </div>
    <div data-reveal="right">
      <img src="assets/img/induction-furnace-pour.webp" alt="Molten steel being poured in the melting shop"
           loading="lazy" style="width:100%">
    </div>
  </div>
</section>

<section class="section section--dark">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Our journey</p>
      <h2>Manufacturing milestones</h2>
    </div>
    <div class="rail">
{j_html}
    </div>
  </div>
</section>

<section class="section section--tint">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <img src="assets/img/spectrometer-lab.webp" alt="Metallurgical testing laboratory" loading="lazy"
           style="width:100%">
    </div>
    <div data-reveal="right">
      <div class="heading">
        <p class="eyebrow">Quality assurance</p>
        <h2>Tested before it leaves</h2>
      </div>
      <p>We have a well-equipped laboratory with all kinds of testing facilities, a fully dedicated
      tool room, the latest AutoCAD designing systems, and heat treatment, press and machining
      facilities.</p>
      {checklist([
        "Spectrometer for chemical composition",
        "Universal testing machine for tensile properties",
        "Microscope for microstructure examination",
        "Hardness testing across the batch",
        "Crack detection on critical components",
        "Izod impact testing",
      ])}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="heading heading--center" data-reveal>
      <p class="eyebrow">Our promise</p>
      <h2>What we deliver</h2>
    </div>
    <div class="grid grid--3" style="--card:1">
{val_html.replace('class="ucard"', 'class="ucard" style="background:var(--paper-2);border-color:var(--line-dark)"')}
    </div>
  </div>
</section>

{cta_band("Let's talk about your component",
          "Tell us the material, the quantity and the standard you work to — we will tell you how we would make it.")}
</main>
"""
    return (
        head("About Us", "Monga Brothers Ltd. is an integrated Indian manufacturer with in-house "
             "melting, re-rolling, drop forging, machining and testing for defense and railway parts.")
        + header("about.html") + body + footer()
    )


def page_solutions():
    body = f"""<main id="main">
{banner("Solutions",
        "Three core lines of work, one integrated plant. Whatever the sector, the route from "
        "molten steel to inspected component stays under our own roof.",
        "Solutions", video="cnc-machining.mp4", poster="assets/img/poster-cnc-machining.jpg")}

{ticker(["Defense manufacturing", "Railway components", "Manufacturing facilities", "Custom forgings"])}

<section class="section">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <img src="assets/img/poster-drop-forging.jpg" alt="Drop forging hammer striking a hot billet" loading="lazy" style="width:100%">
    </div>
    <div data-reveal="right">
      <div class="heading">
        <p class="eyebrow">01 &mdash; Defense</p>
        <h2>Defense manufacturing</h2>
      </div>
      <p>High-precision components essential for national security — parts used in defense
      mechanisms including tanks, pistons and other intricate components integral to military
      operations, produced to the stringent standards defense agencies require.</p>
      {checklist([
        "Decades of experience in high-precision defense components",
        "Trusted partner for government bodies and defense contractors",
        "Complete solutions from component production to supply chain management",
      ])}
      <p style="margin-top:1.6rem"><a class="btn btn--dark" href="defense.html">Defense capability</a></p>
    </div>
  </div>
</section>

<section class="section section--tint">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left" style="order:2">
      <img src="assets/img/lhb-coaches.webp" alt="Modern railway coaches in a maintenance shed" loading="lazy" style="width:100%">
    </div>
    <div data-reveal="right" style="order:1">
      <div class="heading">
        <p class="eyebrow">02 &mdash; Railway</p>
        <h2>Railway components</h2>
      </div>
      <p>A wide range of forged and machined parts integral to the performance and reliability of
      trains — from braking systems to engine components — manufactured to the rigorous standards
      required by railway authorities.</p>
      {checklist([
        "Braking, bogie and engine components",
        "Built to withstand the challenging conditions of railway operation",
        "Tailored solutions that enhance fleet performance and reliability",
      ])}
      <p style="margin-top:1.6rem"><a class="btn btn--dark" href="railway.html">Railway capability</a></p>
    </div>
  </div>
</section>

<section class="section">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <img src="assets/img/rolling-mill-wide.webp" alt="Hot steel bar leaving the rolling mill" loading="lazy" style="width:100%">
    </div>
    <div data-reveal="right">
      <div class="heading">
        <p class="eyebrow">03 &mdash; Manufacturing</p>
        <h2>Manufacturing on demand</h2>
      </div>
      <p>Complete in-house facilities from scrap metal to end goods: an induction furnace, a
      re-rolling unit, a drop forging unit and a machining unit, backed by heat treatment, a tool
      room and a full testing laboratory.</p>
      {checklist([
        "Alloy steel rounds rolled to the sizes you need",
        "Forged components made to drawings and specifications",
        "CNC turning and vertical machining to final dimensions",
      ])}
      <p style="margin-top:1.6rem"><a class="btn btn--dark" href="manufacturing.html">Inside the plant</a></p>
    </div>
  </div>
</section>

<section class="section section--dark">
  <div class="shell">
    <div class="heading heading--center" data-reveal>
      <p class="eyebrow">Also serving</p>
      <h2>Beyond defense and rail</h2>
    </div>
    <div class="grid grid--3">
{expertise_cards([EXPERTISE[2], EXPERTISE[3], EXPERTISE[5]])}
    </div>
  </div>
</section>

{cta_band()}
</main>
"""
    return (
        head("Solutions", "Defense manufacturing, railway components and full manufacturing "
             "facilities from Monga Brothers Ltd., Ludhiana.")
        + header("solutions.html") + body + footer()
    )


def page_defense():
    blocks = [
        ("Expertise in defense manufacturing", [
            "Decades of experience producing high-precision defense components",
            "Specialised in parts for tanks, pistons and other critical military equipment",
            "Proven track record against stringent defense industry standards",
        ]),
        ("State-of-the-art facilities", [
            "Advanced manufacturing technology for precision and repeatability",
            "Highly skilled workforce committed to top-tier defense products",
            "Continuous investment in innovation",
        ]),
        ("Partnership with government and contractors", [
            "Trusted partner for government bodies and defense contractors worldwide",
            "Collaborative development of parts that exceed client expectations",
            "Tailored solutions for the specific needs of each defense project",
        ]),
        ("Commitment to quality and reliability", [
            "Stringent quality control at every phase of manufacture",
            "Adherence to the highest standards throughout the process",
            "Focus on parts that are crucial to national security",
        ]),
        ("Comprehensive support services", [
            "Complete solutions from component production to supply chain management",
            "Dedicated support across the project lifecycle",
            "Seamless integration of our products into defense systems",
        ]),
        ("Role in national security", [
            "Advancing defense technology through innovative manufacturing",
            "Precision-engineered components that help safeguard nations",
            "Enhancing the security and defense capability of our clients",
        ]),
    ]
    blocks_html = "\n".join(
        f"""      <article class="ucard" data-reveal data-reveal-delay="{(i % 3) * 100}">
        <span class="ucard__num">{i + 1:02d}</span>
        <h3>{t}</h3>
        {checklist(items)}
      </article>"""
        for i, (t, items) in enumerate(blocks)
    )

    body = f"""<main id="main">
{banner("Defense manufacturing",
        "Redefining engineering — high-precision components essential to national security, "
        "produced to the standards defense agencies demand.",
        "Defense", video="drop-forging.mp4", poster="assets/img/poster-drop-forging.jpg")}

{ticker(["Tanks", "Pistons", "Pressure parts", "Batch traceability", "Defense standards"])}

<section class="section">
  <div class="shell grid grid--2" style="align-items:start">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Overview</p>
        <h2>A leading manufacturer in the defense industry</h2>
      </div>
      <p>Monga Brothers specialises in the production of high-precision components essential for
      national security. With decades of experience, the company has earned a reputation for
      excellence in manufacturing critical parts used in defense mechanisms — including tanks,
      pistons and various other intricate components integral to military operations.</p>
      <p>We understand the importance of reliability and durability in defense equipment. Our
      manufacturing facilities are equipped with cutting-edge technology and operated by a team of
      highly skilled professionals. We work closely with government bodies and defense contractors
      to develop and produce parts that not only meet but exceed expectations.</p>
      <p>Our expertise extends beyond manufacturing to comprehensive support services. Whether it
      is producing a single component or managing the entire supply chain for a defense project,
      Monga Brothers stands as a trusted partner — committed to innovation, precision and
      excellence.</p>
    </div>
    <div data-reveal="right">
      <img src="assets/img/component-family.webp" alt="Family of forged defense components" loading="lazy" style="width:100%">
      <img src="assets/img/forging-press.webp" alt="Forging press in operation" loading="lazy"
           style="width:100%;margin-top:1.4rem">
    </div>
  </div>
</section>

<section class="section section--dark">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Why Monga Brothers</p>
      <h2>Defense capability in detail</h2>
    </div>
    <div class="grid grid--3">
{blocks_html}
    </div>
  </div>
</section>

<section class="section section--tint">
  <div class="shell">
    <div class="projects__head heading" data-reveal style="max-width:none">
      <div>
        <p class="eyebrow">Representative parts</p>
        <h2>Defense components</h2>
      </div>
      <a class="btn btn--dark" href="products.html">See all</a>
    </div>
    <div class="grid grid--4">
{product_tiles(filter_cats=["defense", "industry"], limit=4)}
    </div>
  </div>
</section>

{cta_band("Working to a defense specification?",
          "Send the drawing and the standard. We will respond with material options, process route and lead time.")}
</main>
"""
    return (
        head("Defense Manufacturing", "High-precision forged and machined defense components — "
             "tanks, pistons and critical assemblies — from Monga Brothers Ltd.")
        + header("defense.html") + body + footer()
    )


def page_railway():
    blocks = [
        ("Expertise in railway components", [
            "High-quality components essential to railway systems",
            "From braking systems through to engine components",
            "Products that meet the standards of global railway authorities",
        ]),
        ("State-of-the-art facilities", [
            "Advanced technology for durable, reliable railway components",
            "Skilled workforce focused on safety and efficiency",
            "Continuous investment to stay at the forefront",
        ]),
        ("Customised solutions for operators", [
            "Close collaboration to understand and meet specific needs",
            "Tailored solutions that enhance fleet performance",
            "Products that support safe, efficient train operation",
        ]),
        ("Commitment to safety and reliability", [
            "Stringent quality control for the highest standards of safety",
            "Components designed for challenging railway conditions",
            "Focus on the longevity and efficiency of railway systems",
        ]),
        ("Comprehensive support services", [
            "Manufacturing and support throughout the project lifecycle",
            "Ongoing assistance for seamless integration",
            "Best possible solutions for railway operators",
        ]),
        ("Contribution to the railway industry", [
            "Partnering with operators and manufacturers to advance technology",
            "Helping create safer, more reliable, more efficient networks",
            "A strong commitment to quality, innovation and customer satisfaction",
        ]),
    ]
    blocks_html = "\n".join(
        f"""      <article class="ucard" data-reveal data-reveal-delay="{(i % 3) * 100}">
        <span class="ucard__num">{i + 1:02d}</span>
        <h3>{t}</h3>
        {checklist(items)}
      </article>"""
        for i, (t, items) in enumerate(blocks)
    )

    body = f"""<main id="main">
{banner("Railway components",
        "Railways reimagined — forged and machined parts for the smooth and safe operation of "
        "rail systems, built to the standards railway authorities require.",
        "Railway", video="railway-track.mp4", poster="assets/img/poster-railway-track.jpg")}

{ticker(["Braking systems", "Bogie hardware", "Couplings", "Engine components", "Rolling stock"])}

<section class="section">
  <div class="shell grid grid--2" style="align-items:start">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Overview</p>
        <h2>A trusted name in the railway industry</h2>
      </div>
      <p>Monga Brothers specialises in manufacturing high-quality components essential for the
      smooth and safe operation of rail systems. With a deep understanding of the unique demands of
      the railway sector, we produce a wide range of parts integral to the performance and
      reliability of trains, from braking systems to engine components.</p>
      <p>Our manufacturing facilities are designed to produce durable components that withstand the
      challenging conditions of railway operations. Leveraging advanced technology and a team of
      skilled professionals, we deliver products that ensure the safety, efficiency and longevity
      of railway systems.</p>
      <p>By partnering with railway operators and manufacturers, Monga Brothers contributes to the
      advancement of railway technology — helping to create safer, more reliable and more efficient
      rail networks.</p>
    </div>
    <div data-reveal="right">
      <img src="assets/img/bogie-assembly-drawing.webp" alt="Bogie assembly engineering drawing" loading="lazy" style="width:100%;background:#fff">
      <img src="assets/img/lhb-coaches.webp" alt="Railway coaches in the shed" loading="lazy"
           style="width:100%;margin-top:1.4rem">
    </div>
  </div>
</section>

<section class="section section--dark">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Why Monga Brothers</p>
      <h2>Railway capability in detail</h2>
    </div>
    <div class="grid grid--3">
{blocks_html}
    </div>
  </div>
</section>

<section class="section section--tint">
  <div class="shell">
    <div class="projects__head heading" data-reveal style="max-width:none">
      <div>
        <p class="eyebrow">Representative parts</p>
        <h2>Our railway components</h2>
      </div>
      <a class="btn btn--dark" href="products.html">See all</a>
    </div>
    <div class="grid grid--4">
{product_tiles(filter_cats=["railway"], limit=4)}
    </div>
  </div>
</section>

{cta_band("Need a railway component to drawing?",
          "Braking, bogie, coupling or engine hardware — send the specification and we will quote the complete route.")}
</main>
"""
    return (
        head("Railway Components", "Forged and machined railway components — braking, bogie, "
             "coupling and engine hardware — manufactured by Monga Brothers Ltd.")
        + header("railway.html") + body + footer()
    )


def page_manufacturing():
    units = [
        ("Induction Furnace", "assets/img/induction-furnace-pour-2.webp",
         "Melting shop",
         "Scrap is charged and melted in our own induction furnace, with chemistry corrected "
         "before teeming. Controlling the melt is what lets us stand behind the finished part."),
        ("Re-Rolling Unit", "assets/img/rolling-mill-bars.webp",
         "Bar &amp; round mill",
         "Billets are re-heated and rolled into alloy steel rounds and bars, in the sizes our own "
         "forging lines and our customers require."),
        ("Drop Forging Unit", "assets/img/forging-hammer-floor.webp",
         "Hammers &amp; presses",
         "State-of-the-art machinery and hammers forge components hot to drawing, giving the grain "
         "flow that makes a forging stronger than a machined-from-solid equivalent."),
        ("Machining Unit", "assets/img/cnc-vertical-machining.webp",
         "CNC turning &amp; milling",
         "CNC turning centres and vertical machining centres bring the forging to final dimensions, "
         "tolerances and surface finish."),
    ]
    unit_html = ""
    for i, (title, img, kicker, text) in enumerate(units):
        flip = " style=\"order:2\"" if i % 2 else ""
        flip2 = " style=\"order:1\"" if i % 2 else ""
        tint = ' section--tint' if i % 2 else ''
        unit_html += f"""
<section class="section{tint}">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left"{flip}>
      <img src="{img}" alt="{title}" loading="lazy" style="width:100%">
    </div>
    <div data-reveal="right"{flip2}>
      <div class="heading">
        <p class="eyebrow">{i + 1:02d} &mdash; {kicker}</p>
        <h2>{title}</h2>
      </div>
      <p>{text}</p>
    </div>
  </div>
</section>
"""

    gallery = [
        ("assets/img/heat-treatment-furnace.webp", "Heat treatment furnace"),
        ("assets/img/control-panels.webp", "Plant control panels"),
        ("assets/img/spectrometer-lab.webp", "Spectrometer and testing laboratory"),
        ("assets/img/cnc-turning-centre.webp", "CNC turning centre"),
        ("assets/img/rolling-mill-hot-bar.webp", "Hot bar on the rolling line"),
        ("assets/img/forge-shop-collage.webp", "Forge shop"),
        ("assets/img/rolling-mill-hot-bar-2.webp", "Rolling mill in operation"),
        ("assets/img/forge-worker.webp", "Operator at the hammer"),
    ]
    gal_html = "\n".join(
        f"""      <figure class="pcard" data-reveal="zoom" data-reveal-delay="{(i % 4) * 90}" style="margin:0">
        <div class="pcard__media"><img src="{src}" alt="{alt}" loading="lazy"></div>
        <figcaption class="pcard__body"><h3 style="font-size:.95rem">{alt}</h3></figcaption>
      </figure>"""
        for i, (src, alt) in enumerate(gallery)
    )

    body = f"""<main id="main">
{banner("Manufacturing facilities",
        "Manufacturing on demand — one of the leading Indian manufacturers with complete in-house "
        "facilities from scrap metal to end goods.",
        "Manufacturing", video="rolling-mill.mp4", poster="assets/img/poster-rolling-mill.jpg")}

{ticker(["Induction furnace", "Re-rolling unit", "Drop forging unit", "Machining unit", "Heat treatment", "Tool room"])}

<section class="section">
  <div class="shell">
    <div class="heading heading--center" data-reveal>
      <p class="eyebrow">Description</p>
      <h2>Four units, one continuous process</h2>
    </div>
    <p class="lede" style="margin-inline:auto;text-align:center" data-reveal>
      The company has the requisite infrastructure with all the latest machinery and equipment to
      develop any type of forging component. We are manufacturers of alloy steel rounds, we
      manufacture as per international standards, and we are specialists in forged components made
      to drawings and specifications.
    </p>
  </div>
</section>
{unit_html}
<section class="section section--dark">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Behind the units</p>
        <h2>Laboratory, tool room and design</h2>
      </div>
      <p>A well-equipped laboratory with all kinds of testing facilities, a fully dedicated tool
      room, the latest AutoCAD designing systems, and heat treatment, press and machining
      facilities — supported by professionally qualified staff and a well-motivated, trained
      workforce.</p>
      {checklist([
        "Spectrometer",
        "Universal testing machine",
        "Microscope and microstructure analysis",
        "Hardness testing",
        "Crack detection facility",
        "Izod impact test",
      ])}
    </div>
    <div data-reveal="right">
      <video src="assets/video/quality-lab.mp4" poster="assets/img/poster-quality-lab.jpg"
             muted loop playsinline autoplay preload="none" style="width:100%"
             aria-label="Quality engineer measuring a machined component"></video>
    </div>
  </div>
</section>

<section class="section section--tint">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Plant gallery</p>
      <h2>Inside the works</h2>
    </div>
    <div class="grid grid--4">
{gal_html}
    </div>
  </div>
</section>

{cta_band("Want to see the process on your part?",
          "We will walk you through melt, forge, heat treat, machine and test for your specific component.")}
</main>
"""
    return (
        head("Manufacturing Facilities", "Induction furnace, re-rolling unit, drop forging unit and "
             "machining unit — Monga Brothers manufactures from scrap metal to finished goods.")
        + header("manufacturing.html") + body + footer()
    )


def page_industries():
    areas = [
        ("Defense", "flask", "Tanks, pistons and critical military assemblies produced to "
         "stringent defense standards.", "defense.html"),
        ("Railway", "train", "Braking, bogie, coupling and engine components for rolling stock "
         "and infrastructure.", "railway.html"),
        ("Automotive", "gear", "Forged and machined parts for vehicle drivetrain, steering and "
         "suspension applications.", "products.html"),
        ("Agriculture", "leaf", "Hard-wearing forgings for tractors, harvesters and implements "
         "that work long seasons.", "products.html"),
        ("Earthmoving &amp; Mining", "factory", "Heavy components for excavators, loaders and "
         "plant working in abrasive conditions.", "products.html"),
        ("Oil, Gas &amp; Energy", "shield", "Pressure-retaining and structural components for "
         "process, refinery and energy plant.", "products.html"),
        ("General Engineering", "gear", "Alloy steel rounds, bars and made-to-drawing forgings "
         "for engineering workshops.", "manufacturing.html"),
        ("Custom Projects", "target", "One-off or repeat components developed with our tool room "
         "and AutoCAD design team.", "contact.html"),
    ]
    area_html = "\n".join(
        f"""      <article class="ucard" data-reveal data-reveal-delay="{(i % 4) * 90}"
               style="background:#fff;border-color:var(--line-dark)">
        <span class="stat__icon" style="margin-bottom:1.2rem">{icon(ic)}</span>
        <h3 style="color:var(--ink)">{t}</h3>
        <p>{d}</p>
        <p style="margin:1rem 0 0"><a class="flip__link" style="color:var(--yellow-dark)" href="{href}">Learn more {icon('arrow', 'nav__caret')}</a></p>
      </article>"""
        for i, (t, ic, d, href) in enumerate(areas)
    )

    regions = [
        ("North India", "Ludhiana, Delhi NCR, Punjab, Haryana, Himachal, Rajasthan — served "
         "directly from the plant by road."),
        ("Pan-India", "Regular despatch to Maharashtra, Gujarat, Tamil Nadu, Karnataka, West "
         "Bengal and the eastern industrial belt."),
        ("Export", "Consignments routed through Mundra, Nhava Sheva and Kolkata for customers "
         "in the Gulf, South-East Asia, Europe and Africa."),
    ]
    region_html = "\n".join(
        f"""      <article class="ucard" data-reveal="zoom" data-reveal-delay="{i * 110}">
        <span class="ucard__num">{i + 1:02d}</span>
        <h3>{t}</h3>
        <p>{d}</p>
      </article>"""
        for i, (t, d) in enumerate(regions)
    )

    body = f"""<main id="main">
{banner("Service areas &amp; industries",
        "We cater to a wide spread of sectors, providing tailored solutions that meet unique "
        "industry demands — and we deliver across India and to export markets.",
        "Industries", image="assets/img/poster-rolling-mill.jpg")}

{ticker(["Defense", "Railway", "Automotive", "Agriculture", "Earthmoving", "Oil &amp; gas", "General engineering"])}

<section class="section">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Sectors we serve</p>
      <h2>Industry versatility</h2>
    </div>
    <div class="grid grid--4">
{area_html}
    </div>
  </div>
</section>

<section class="section section--dark">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Where we deliver</p>
      <h2>Supply coverage</h2>
    </div>
    <div class="grid grid--3">
{region_html}
    </div>
  </div>
</section>

<section class="section section--tint">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">How we engage</p>
        <h2>From enquiry to first article</h2>
      </div>
      {checklist([
        "Share the drawing, sample or specification",
        "Feasibility review — material, process route, tooling",
        "Quotation with lead time and tooling cost",
        "Die and fixture development in our own tool room",
        "First article inspection and dimensional report",
        "Series production with batch testing and despatch",
      ])}
      <p style="margin-top:1.6rem"><a class="btn btn--dark" href="contact.html">Start an enquiry</a></p>
    </div>
    <div data-reveal="right">
      <img src="assets/img/component-family.webp" alt="Range of forged components" loading="lazy" style="width:100%">
    </div>
  </div>
</section>

{cta_band("Not sure which service area fits?",
          "Describe the application and we will tell you whether it belongs on the forging line, the mill or the machining cell.")}
</main>
"""
    return (
        head("Service Areas & Industries", "Defense, railway, automotive, agriculture, earthmoving, "
             "oil and gas and general engineering — the industries Monga Brothers Ltd. supplies.")
        + header("industries.html") + body + footer()
    )


def page_products():
    body = f"""<main id="main">
{banner("Product range",
        "A representative selection of the forged and machined components we produce. Almost "
        "everything we make is to a customer drawing — treat this as a capability sample.",
        "Products", image="assets/img/component-family.webp")}

{ticker(["Closed-die forgings", "Alloy steel rounds", "CNC turned parts", "Heat treated components"])}

<section class="section">
  <div class="shell">
    <div class="heading" data-reveal>
      <p class="eyebrow">Our work</p>
      <h2>Components gallery</h2>
    </div>

    <div class="filters" data-filter-group="#product-grid" data-reveal role="group" aria-label="Filter products">
      <button type="button" data-filter="all" aria-pressed="true">All</button>
      <button type="button" data-filter="defense" aria-pressed="false">Defense</button>
      <button type="button" data-filter="railway" aria-pressed="false">Railway</button>
      <button type="button" data-filter="industry" aria-pressed="false">General industry</button>
    </div>

    <div class="grid grid--4" id="product-grid">
{product_tiles()}
    </div>
  </div>
</section>

<section class="section section--dark">
  <div class="shell grid grid--2" style="align-items:center">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Materials</p>
        <h2>What we forge in</h2>
      </div>
      {checklist([
        "Carbon steels — as rolled, normalised or heat treated",
        "Alloy steels including chrome-moly and nickel grades",
        "Case-hardening and through-hardening grades",
        "Free-cutting grades for high-volume machined parts",
        "Customer-nominated grades supplied against test certificate",
      ])}
    </div>
    <div data-reveal="right">
      <video src="assets/video/cnc-machining.mp4" poster="assets/img/poster-cnc-machining.jpg"
             muted loop playsinline autoplay preload="none" style="width:100%"
             aria-label="CNC machining a forged steel component"></video>
    </div>
  </div>
</section>

{cta_band("Your part is not in the gallery?",
          "That is normal — most of what we make is made to order. Send the drawing and we will quote it.")}
</main>
"""
    return (
        head("Products", "Forged and machined components from Monga Brothers Ltd. — defense, "
             "railway and general industry parts made to customer drawings.")
        + header("products.html") + body + footer()
    )


def page_contact():
    body = f"""<main id="main">
{banner("Contact us",
        "Ready to elevate your project? Send us a drawing, a specification or simply a question — "
        "our engineers reply within one working day.",
        "Contact", video="quality-lab.mp4", poster="assets/img/poster-quality-lab.jpg")}

<section class="section">
  <div class="shell grid grid--2" style="align-items:start;gap:clamp(2rem,4vw,3.4rem)">
    <div data-reveal="left">
      <div class="heading">
        <p class="eyebrow">Send us your query</p>
        <h2>Request a quotation</h2>
      </div>
      <form class="form" data-mock-submit novalidate>
        <div class="field">
          <label for="f-name">Your name</label>
          <input id="f-name" name="name" type="text" required autocomplete="name">
        </div>
        <div class="field">
          <label for="f-company">Company</label>
          <input id="f-company" name="company" type="text" autocomplete="organization">
        </div>
        <div class="field">
          <label for="f-email">Email</label>
          <input id="f-email" name="email" type="email" required autocomplete="email">
        </div>
        <div class="field">
          <label for="f-phone">Phone</label>
          <input id="f-phone" name="phone" type="tel" autocomplete="tel">
        </div>
        <div class="field field--wide">
          <label for="f-area">Service area</label>
          <select id="f-area" name="area">
            <option>Defense manufacturing</option>
            <option>Railway components</option>
            <option>Forging &amp; machining</option>
            <option>Alloy steel rounds</option>
            <option>Other / not sure</option>
          </select>
        </div>
        <div class="field field--wide">
          <label for="f-msg">Your requirement</label>
          <textarea id="f-msg" name="message" required
            placeholder="Part description, material grade, quantity, standard, target delivery…"></textarea>
        </div>
        <p class="form__status" role="status" hidden></p>
        <p class="form__note">This demonstration form does not transmit data anywhere. Connect it to
        your mail handler or CRM endpoint before going live.</p>
        <div class="field--wide">
          <button class="btn" type="submit">Send enquiry {icon('arrow', 'nav__caret')}</button>
        </div>
      </form>
    </div>

    <aside data-reveal="right">
      <div class="infobox">
        <h3>Monga Brothers Ltd.</h3>
        <dl>
          <div>
            <dt>Works &amp; office</dt>
            <dd>B-16, Phase-2, Focal Point<br>Ludhiana-141010, Punjab, India</dd>
          </div>
          <div>
            <dt>Call us</dt>
            <dd><a href="tel:+917087480555">+91 70 8748 0555</a></dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd><a href="mailto:info@mongabrothers.com">info@mongabrothers.com</a></dd>
          </div>
          <div>
            <dt>Working hours</dt>
            <dd>Monday to Saturday, 9:00 – 18:30 IST</dd>
          </div>
          <div>
            <dt>Certification</dt>
            <dd>ISO 9001:2015 certified company</dd>
          </div>
        </dl>
        <p style="margin:1.8rem 0 0">
          <a class="btn" target="_blank" rel="noopener"
             href="https://www.google.com/maps/search/?api=1&amp;query=B-16%2C+Phase-2%2C+Focal+Point%2C+Ludhiana+141010">
            Open in Google Maps {icon('arrow', 'nav__caret')}
          </a>
        </p>
      </div>
    </aside>
  </div>
</section>

<section class="section section--tint">
  <div class="shell">
    <div class="heading heading--center" data-reveal>
      <p class="eyebrow">Before you write</p>
      <h2>What helps us quote faster</h2>
    </div>
    <div class="grid grid--4">
      <article class="ucard" data-reveal style="background:#fff;border-color:var(--line-dark)">
        <span class="ucard__num">01</span><h3 style="color:var(--ink)">The drawing</h3>
        <p>A PDF or DXF with dimensions and tolerances tells us more than any description.</p>
      </article>
      <article class="ucard" data-reveal data-reveal-delay="90" style="background:#fff;border-color:var(--line-dark)">
        <span class="ucard__num">02</span><h3 style="color:var(--ink)">Material grade</h3>
        <p>Nominated grade, or the mechanical properties the part has to reach.</p>
      </article>
      <article class="ucard" data-reveal data-reveal-delay="180" style="background:#fff;border-color:var(--line-dark)">
        <span class="ucard__num">03</span><h3 style="color:var(--ink)">Quantity</h3>
        <p>Annual volume and batch size — it changes the tooling and the price.</p>
      </article>
      <article class="ucard" data-reveal data-reveal-delay="270" style="background:#fff;border-color:var(--line-dark)">
        <span class="ucard__num">04</span><h3 style="color:var(--ink)">Standard</h3>
        <p>Any inspection, testing or certification your sector requires.</p>
      </article>
    </div>
  </div>
</section>
</main>
"""
    return (
        head("Contact", "Contact Monga Brothers Ltd., B-16 Phase-2 Focal Point, Ludhiana — "
             "+91 70 8748 0555, info@mongabrothers.com.")
        + header("contact.html") + body + footer()
    )


PAGES = {
    "index.html": page_index,
    "about.html": page_about,
    "solutions.html": page_solutions,
    "defense.html": page_defense,
    "railway.html": page_railway,
    "manufacturing.html": page_manufacturing,
    "industries.html": page_industries,
    "products.html": page_products,
    "contact.html": page_contact,
}


def main():
    for name, fn in PAGES.items():
        path = os.path.join(ROOT, name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(fn())
        print("wrote", name)


if __name__ == "__main__":
    main()
