#!/usr/bin/env python3
"""Stamp the shared chrome into every page and write the site to the repo root.

Usage:  python3 build/build.py && python3 build/stamp_dimensions.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from partials import head, header, footer, marquee, cta_band, icon  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ARROW = icon("arrow")
CHECK = icon("check")


# --------------------------------------------------------------------------
# shared fragments
# --------------------------------------------------------------------------

def banner(title, lede, crumb, video=None, poster=None, image=None):
    if video:
        media = (
            f'<video src="assets/video/{video}" poster="{poster}" autoplay muted loop '
            f'playsinline preload="none" aria-hidden="true"></video>'
        )
    else:
        media = f'<img src="{image}" alt="" aria-hidden="true">'
    return f"""<section class="banner">
  <div class="banner__media" data-plx="14">{media}</div>
  <div class="shell">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="index.html">Home</a> / <b>{crumb}</b>
    </nav>
    <h1 data-anim>{title}</h1>
    <p data-anim>{lede}</p>
  </div>
</section>
"""


def ticks(items):
    lis = "".join(
        '<li><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg><span>%s</span></li>'
        % ('<path d="m4.5 12.5 5 5 10-11" fill="none" stroke="currentColor" '
           'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', t)
        for t in items)
    return '<ul class="ticks">%s</ul>' % lis


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
    return '<div class="accordion">\n' + "\n".join(out) + "\n    </div>"


def stack_items(items):
    """Sticky-stacking full-width panels. items: (idx, title, text, media_html, href, link_label)"""
    out = []
    for idx, title, text, media, href, label in items:
        out.append(f"""      <article class="stack__item">
        <div class="stack__media">{media}</div>
        <div class="stack__body">
          <span class="stack__idx">{idx}</span>
          <h3>{title}</h3>
          <p>{text}</p>
          <p style="margin:1.4rem 0 0"><a class="btn btn--line" href="{href}">{label} {ARROW}</a></p>
        </div>
      </article>""")
    return '<div class="stack">\n' + "\n".join(out) + "\n    </div>"


def rows(items, start=1):
    """Editorial index rows. items: (title, bullets)"""
    out = []
    for i, (title, bullets) in enumerate(items, start):
        lis = "".join("<li>%s</li>" % b for b in bullets)
        out.append(f"""      <div class="row" data-anim>
        <span class="row__num">{i:02d}</span>
        <h3>{title}</h3>
        <ul>{lis}</ul>
      </div>""")
    return '<div class="rows">\n' + "\n".join(out) + "\n    </div>"


PRODUCTS = [
    ("Forged Flange", "prod-flange.webp", "industry", "Closed-die forged"),
    ("Gear Blank", "prod-gear.webp", "industry", "Forged &amp; hobbed"),
    ("Eye Bolt Link", "prod-eyelink.webp", "railway", "Forged eye end"),
    ("Mounting Bracket", "prod-bracket.webp", "railway", "Drop forged"),
    ("Machined Hub", "prod-hub.webp", "industry", "VMC finished"),
    ("Rolled Ring", "prod-ring.webp", "defense", "Seamless rolled"),
    ("Brake Disc Hub", "prod-brakedisc.webp", "railway", "Turned &amp; ground"),
    ("Taper Plug", "prod-taperpin.webp", "defense", "Heat treated"),
    ("Lever Arm", "prod-leverarm.webp", "railway", "Hammer forged"),
    ("Connecting Rod", "prod-conrod.webp", "defense", "Shot blasted"),
    ("Anchor Plate", "prod-anchor.webp", "railway", "Dark oxide finish"),
    ("Lifting Hook", "prod-hook.webp", "industry", "Proof load tested"),
]


def product_tiles(filter_cats=None, limit=None, tilt=True, anim=True):
    items = [p for p in PRODUCTS if not filter_cats or p[2] in filter_cats]
    if limit:
        items = items[:limit]
    out = []
    t = ' data-tilt="6"' if tilt else ""
    for name, img, cat, note in items:
        out.append(f"""      <article class="tile"{t} data-category="{cat}">
        <div class="tile__media"><img src="assets/img/{img}" alt="{name}" loading="lazy" decoding="async"></div>
        <div class="tile__body"><h3>{name}</h3><span>{note}</span></div>
      </article>""")
    return "\n".join(out)


# --------------------------------------------------------------------------
# pages
# --------------------------------------------------------------------------

def page_index():
    process = [
        ("01", "Induction Furnace",
         "Scrap is melted and chemistry corrected in our own melting shop — the steel that "
         "becomes your component is under our control from the first minute."),
        ("02", "Re-Rolling Unit",
         "Billets are rolled into alloy steel rounds and bars, in exactly the sizes our "
         "forging lines and our customers need."),
        ("03", "Drop Forging",
         "Hammers and presses form the part hot, giving the grain flow that makes a forging "
         "stronger than a cut or cast equivalent."),
        ("04", "Heat Treatment",
         "Normalising, hardening and tempering bring the component to the mechanical "
         "properties called out on the drawing."),
        ("05", "CNC Machining",
         "Turning centres and vertical machining centres take the forging to final "
         "dimensions and surface finish."),
        ("06", "Test &amp; Despatch",
         "Spectrometer, UTM, hardness, crack detection and Izod impact testing before the "
         "batch is packed and released."),
    ]
    stages = "\n".join(
        f"""        <article class="stage">
          <span class="stage__num">{n}</span>
          <h3>{t}</h3>
          <p>{d}</p>
        </article>"""
        for n, t, d in process)

    quotes = [
        ("Monga Brothers transformed our supply chain with their defense components. "
         "Dimensional consistency, batch after batch.", "Procurement Lead", "Defense sector"),
        ("Their railway parts are top-notch. Across three years of supply we have not had "
         "a single field failure.", "Rolling Stock Engineer", "Railway operator"),
        ("From enquiry to first article in weeks, not months. The in-house tool room makes "
         "the difference.", "Design Manager", "Heavy engineering"),
        ("Fast delivery and superior product quality. Our go-to forging partner in North "
         "India.", "Logistics Manager", "OEM supplier"),
    ]
    quote_html = "\n".join(
        f"""      <figure class="quote">
        <span class="quote__mark" aria-hidden="true">&ldquo;</span>
        <blockquote style="margin:0"><p>{t}</p></blockquote>
        <footer><b>{who}</b><span>{role}</span></footer>
      </figure>"""
        for t, who, role in quotes)

    faq = [
        ("What does Monga Brothers manufacture?",
         "Forged and machined components for the defense and railway sectors, plus alloy "
         "steel rounds and custom parts for automotive, agricultural, earthmoving and "
         "general engineering customers — all produced in house, from melting scrap in our "
         "induction furnace to the finished, inspected part."),
        ("Can you work from our drawings and specifications?",
         "Yes. We are specialists in manufacturing forged components to customer drawings "
         "and specifications, to international standards. Our tool room and AutoCAD design "
         "team develop the dies and fixtures your part needs."),
        ("What testing facilities do you have?",
         "Spectrometer, universal testing machine, microscope, hardness testing, crack "
         "detection and Izod impact testing — supported by heat treatment, press and "
         "machining facilities."),
        ("How do I place an order?",
         "Send your drawing, specification or sample requirement through the contact form, "
         "by email to info@mongabrothers.com, or call +91 70 8748 0555. We respond with "
         "feasibility, material options and lead time."),
        ("Where are you located?",
         "B-16, Phase-2, Focal Point, Ludhiana-141010, Punjab, India — in the heart of one "
         "of India's largest engineering clusters."),
    ]

    stack = stack_items([
        ("SECTOR / DEFENSE", "Defense manufacturing",
         "High-precision components for tanks, pistons and critical military assemblies — "
         "produced to the stringent standards defense agencies demand, with batch "
         "traceability from melt to despatch.",
         '<video src="assets/video/drop-forging.mp4" poster="assets/img/poster-drop-forging.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "defense.html", "Defense capability"),
        ("SECTOR / RAILWAY", "Railway components",
         "Forged and machined parts integral to the performance of trains — braking "
         "systems, bogie hardware, couplings and engine components built to the standards "
         "of railway authorities worldwide.",
         '<img src="assets/img/svc-railway.webp" alt="Railway bogie wheelset in a maintenance depot" loading="lazy">',
         "railway.html", "Railway capability"),
        ("SECTOR / MANUFACTURING", "Manufacturing on demand",
         "Complete in-house facilities from scrap metal to end goods: induction furnace, "
         "re-rolling unit, drop forging unit and machining unit, backed by a testing "
         "laboratory and a dedicated tool room.",
         '<video src="assets/video/rolling-mill.mp4" poster="assets/img/poster-rolling-mill.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "manufacturing.html", "Inside the plant"),
    ])

    body = f"""<main id="main">

<section class="hero">
  <div class="hero__media">
    <video src="assets/video/foundry-pour.mp4" poster="assets/img/poster-foundry-pour.jpg"
           autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
  </div>
  <div class="shell hero__inner">
    <p class="hero__eyebrow">Ludhiana &middot; Punjab &middot; India</p>
    <h1>
      <span class="line"><span>Steel,</span></span>
      <span class="line"><span>shaped to</span></span>
      <span class="line"><span><em>specification</em></span></span>
    </h1>
    <p class="hero__lede">Monga Brothers forges and machines precision components for
    defense and railway industries — with complete in-house capability from scrap metal
    to finished, inspected goods.</p>
    <div class="hero__actions">
      <a class="btn" href="solutions.html">Explore solutions {ARROW}</a>
      <a class="btn btn--line" href="contact.html">Get a quote</a>
    </div>
    <div class="hero__foot">
      <div class="hero__stat"><b><span data-count="40"></span><i>+</i></b><span>Years of forging</span></div>
      <div class="hero__stat"><b><span data-count="4"></span></b><span>Integrated units</span></div>
      <div class="hero__stat"><b><span data-count="3250"></span><i>+</i></b><span>Components delivered</span></div>
      <div class="hero__stat"><b>ISO</b><span>9001:2015 certified</span></div>
    </div>
  </div>
  <span class="hero__scroll" aria-hidden="true">Scroll<i></i></span>
</section>

{marquee(["Defense components", "Railway hardware", "Alloy steel rounds", "Drop forging",
          "CNC machining", "Heat treatment", "Testing laboratory"])}

<section class="section">
  <div class="shell">
    <div class="hd hd--split" data-anim>
      <div>
        <p class="kicker">What we deliver</p>
        <h2>Built for critical industries</h2>
      </div>
      <a class="btn btn--line" href="solutions.html">All solutions {ARROW}</a>
    </div>

    <div class="bento" data-anim-group>
      <a class="bento__cell bento__cell--tall bento__cell--wide" href="defense.html">
        <img src="assets/img/svc-defense.webp" alt="Precision defense components in a dark machine shop" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <p class="bento__kick">Core sector</p>
        <h3>Defense manufacturing</h3>
        <p>Tank, piston and critical military components engineered to stringent defense
        standards with full batch traceability.</p>
      </a>
      <a class="bento__cell bento__cell--wide" href="railway.html">
        <img src="assets/img/svc-railway.webp" alt="Railway bogie and wheelset" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <p class="bento__kick">Core sector</p>
        <h3>Railway components</h3>
        <p>Braking, bogie and engine hardware built for durability.</p>
      </a>
      <a class="bento__cell" href="manufacturing.html">
        <img src="assets/img/svc-quality.webp" alt="Coordinate measuring machine probing a component" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <p class="bento__kick">Assurance</p>
        <h3>Quality lab</h3>
      </a>
      <a class="bento__cell" href="solutions.html">
        <img src="assets/img/svc-design.webp" alt="CAD workstation with a 3D component model" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <p class="bento__kick">Engineering</p>
        <h3>Design &amp; tooling</h3>
      </a>
      <a class="bento__cell bento__cell--wide" href="industries.html">
        <img src="assets/img/plant-wide.webp" alt="Wide view of the forging plant" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <p class="bento__kick">Beyond rail &amp; defense</p>
        <h3>Diverse industries</h3>
        <p>Automotive, agriculture, earthmoving, oil &amp; gas and general engineering.</p>
      </a>
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell" style="display:grid;gap:clamp(2rem,5vw,4rem);grid-template-columns:1fr;align-items:start">
    <p class="kicker" data-anim>Why Monga Brothers</p>
    <p class="statement">We don't just manufacture — we control every step. One plant takes
    <em>scrap metal</em> to <em>finished component</em>: melted, rolled, forged, treated,
    machined and <em>proven in our own lab</em> before it ships.</p>
    <div class="stats" data-anim-group style="max-width:900px">
      <div class="stat"><b><span data-count="240"></span><i>+</i></b><span>Engineers &amp; technicians</span></div>
      <div class="stat"><b><span data-count="640"></span><i>+</i></b><span>Manufacturing capabilities</span></div>
      <div class="stat"><b><span data-count="3250"></span><i>+</i></b><span>Projects delivered</span></div>
    </div>
  </div>
</section>

<section class="section section--flush railwrap" style="padding-block:clamp(4rem,8vw,6rem)">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">How a part is made</p>
      <h2>Scrap to finished goods</h2>
    </div>
  </div>
  <div class="shell">
    <div class="rail">
{stages}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Where we work</p>
      <h2>Three sectors, one standard</h2>
    </div>
    {stack}
  </div>
</section>

<section class="section section--flush" style="padding-block:clamp(3.5rem,6vw,5rem)">
  <div class="shell hd hd--split" style="margin-bottom:2rem" data-anim>
    <div>
      <p class="kicker">Made in-house</p>
      <h2>Recent components</h2>
    </div>
    <a class="btn btn--line" href="products.html">Full product range {ARROW}</a>
  </div>
  <div class="prodstrip">
    <div class="prodstrip__track">
{product_tiles(limit=8, tilt=False)}
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">What clients say</p>
      <h2>Trusted on the shop floor</h2>
    </div>
    <div class="quotes-offset" data-anim-group>
{quote_html}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell grid grid--2" style="align-items:start">
    <div data-anim="left">
      <p class="kicker">Your questions, answered</p>
      <h2>Frequently asked</h2>
      <p class="lede">If your question is not here, send us the drawing — we answer with a
      feasibility note, not a brochure.</p>
      <p style="margin-top:1.8rem"><a class="btn" href="contact.html">Ask an engineer {ARROW}</a></p>
    </div>
    <div data-anim="right">
    {accordion(faq)}
    </div>
  </div>
</section>

{cta_band()}
</main>
"""
    return (head("Precision Forging & Machining for Defense and Railways",
                 "Monga Brothers Ltd. — ISO 9001:2015 manufacturer of forged and machined "
                 "components for defense, railway and heavy industry. Ludhiana, Punjab, India.")
            + header("index.html") + body + footer())


def page_about():
    journey = [
        ("Melting", "Induction furnace commissioned so steel chemistry is set in house, "
         "not bought in on trust."),
        ("Rolling", "Re-rolling unit added to produce alloy steel rounds and bars in the "
         "sizes the forge needs."),
        ("Forging", "Drop forging unit with hammers and presses for components made to "
         "drawing."),
        ("Machining", "CNC turning and vertical machining centres bring forgings to final "
         "dimensions."),
        ("Assurance", "Laboratory, tool room and AutoCAD design close the loop from melt "
         "to certificate."),
    ]
    tline = "\n".join(
        f"""      <div class="tline__item" data-anim>
        <span class="tline__tag">Milestone</span>
        <h3>{t}</h3>
        <p>{d}</p>
      </div>"""
        for t, d in journey)

    body = f"""<main id="main">
{banner("The company behind the components",
        "One of the leading Indian manufacturers with complete in-house facilities — from "
        "scrap metal to end goods — serving defense, railway and general engineering.",
        "About", video="rolling-mill.mp4", poster="assets/img/poster-rolling-mill.jpg")}

{marquee(["Ludhiana, Punjab", "ISO 9001:2015", "Forging &amp; machining", "Made to drawing",
          "In-house testing"])}

<section class="section">
  <div class="shell panel">
    <div class="panel__media">
      <img src="assets/img/plant-wide.webp" alt="Inside the forging plant" data-plx="16" loading="lazy">
      <span class="panel__tag">Focal Point, Ludhiana</span>
    </div>
    <div data-anim="right">
      <p class="kicker">Who we are</p>
      <h2>Engineering industries depend on</h2>
      <p>Monga Brothers is a trusted manufacturer specialising in precision engineering for
      the defense and railway industries. With a strong focus on quality, reliability and
      innovation, we deliver components that meet demanding performance and safety
      standards.</p>
      <p>We hold the infrastructure and the latest machinery to develop any type of forging
      component. We manufacture alloy steel rounds, we forge to international standards, and
      we specialise in components made to customer drawings and specifications — supported
      by professionally qualified staff and a trained, motivated workforce.</p>
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell grid grid--2" style="align-items:start">
    <div data-anim="left">
      <p class="kicker">Our journey</p>
      <h2>Built unit by unit</h2>
      <p class="lede">Each capability was added for one reason: so quality never has to be
      sub-contracted out.</p>
    </div>
    <div class="tline">
{tline}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell panel panel--rev">
    <div class="panel__media">
      <video src="assets/video/quality-lab.mp4" poster="assets/img/poster-quality-lab.jpg"
             muted loop playsinline autoplay preload="none"
             aria-label="Quality engineer measuring a machined component"></video>
      <span class="panel__tag">Testing laboratory</span>
    </div>
    <div data-anim="left">
      <p class="kicker">Quality assurance</p>
      <h2>Tested before it leaves</h2>
      <p>A well-equipped laboratory, a fully dedicated tool room, the latest AutoCAD design
      systems, and heat treatment, press and machining facilities sit behind every part.</p>
      {ticks([
        "Spectrometer for chemical composition",
        "Universal testing machine for tensile properties",
        "Microscope and microstructure analysis",
        "Hardness testing across the batch",
        "Crack detection on critical components",
        "Izod impact testing",
      ])}
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell">
    <p class="kicker" data-anim>Our promise</p>
    <p class="statement">Expect <em>quality</em> that is verified, <em>reliability</em> that
    outlasts the contract, and <em>innovation</em> that keeps pace with the industries we
    serve.</p>
  </div>
</section>

{cta_band("Let's talk about your component",
          "Tell us the material, the quantity and the standard you work to — we will tell you exactly how we would make it.")}
</main>
"""
    return (head("About Us", "Monga Brothers Ltd. is an integrated Indian manufacturer with "
                 "in-house melting, rolling, forging, machining and testing for defense and "
                 "railway parts.")
            + header("about.html") + body + footer())


def page_solutions():
    stack = stack_items([
        ("SOLUTION / 01", "Defense manufacturing",
         "High-precision components essential for national security — parts for tanks, "
         "pistons and intricate military assemblies, produced to the stringent standards "
         "defense agencies require, with collaborative development alongside government "
         "bodies and contractors.",
         '<img src="assets/img/svc-defense.webp" alt="Machined defense components" loading="lazy">',
         "defense.html", "Defense capability"),
        ("SOLUTION / 02", "Railway components",
         "A wide range of forged and machined parts integral to the performance and "
         "reliability of trains — from braking systems to engine components — manufactured "
         "to the rigorous standards required by railway authorities worldwide.",
         '<img src="assets/img/svc-railway.webp" alt="Railway bogie in a depot" loading="lazy">',
         "railway.html", "Railway capability"),
        ("SOLUTION / 03", "Manufacturing facilities",
         "Complete in-house capability from scrap metal to end goods: induction furnace, "
         "re-rolling unit, drop forging unit and machining unit — backed by heat treatment, "
         "a tool room and a full testing laboratory.",
         '<video src="assets/video/cnc-machining.mp4" poster="assets/img/poster-cnc-machining.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "manufacturing.html", "Inside the plant"),
    ])

    body = f"""<main id="main">
{banner("Solutions", "Three lines of work, one integrated plant. Whatever the sector, the "
        "route from molten steel to inspected component stays under our own roof.",
        "Solutions", video="cnc-machining.mp4", poster="assets/img/poster-cnc-machining.jpg")}

{marquee(["Defense manufacturing", "Railway components", "Manufacturing facilities",
          "Custom forgings", "Alloy steel rounds"])}

<section class="section">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">What we offer</p>
      <h2>Choose your route in</h2>
    </div>
    {stack}
  </div>
</section>

<section class="section section--raised">
  <div class="shell">
    <p class="kicker" data-anim>The common thread</p>
    <p class="statement">Every solution shares the same spine: <em>our melt</em>, <em>our
    dies</em>, <em>our machines</em> and <em>our lab</em> — so accountability never leaves
    the building.</p>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="hd hd--split" data-anim>
      <div>
        <p class="kicker">Also serving</p>
        <h2>Beyond defense and rail</h2>
      </div>
      <a class="btn btn--line" href="industries.html">All industries {ARROW}</a>
    </div>
    <div class="bento" data-anim-group>
      <a class="bento__cell bento__cell--wide" href="industries.html">
        <img src="assets/img/ind-automotive.webp" alt="Automotive production line" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <h3>Automotive</h3>
      </a>
      <a class="bento__cell" href="industries.html">
        <img src="assets/img/ind-agriculture.webp" alt="Forged agricultural parts" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <h3>Agriculture</h3>
      </a>
      <a class="bento__cell" href="industries.html">
        <img src="assets/img/ind-earthmoving.webp" alt="Excavator bucket teeth" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <h3>Earthmoving</h3>
      </a>
      <a class="bento__cell" href="industries.html">
        <img src="assets/img/ind-oilgas.webp" alt="Refinery pipework at golden hour" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <h3>Oil &amp; gas</h3>
      </a>
      <a class="bento__cell" href="industries.html">
        <img src="assets/img/ind-engineering.webp" alt="Precision machined gears" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <h3>Engineering</h3>
      </a>
    </div>
  </div>
</section>

{cta_band()}
</main>
"""
    return (head("Solutions", "Defense manufacturing, railway components and complete "
                 "manufacturing facilities from Monga Brothers Ltd., Ludhiana.")
            + header("solutions.html") + body + footer())


def page_defense():
    caps = rows([
        ("Expertise in defense manufacturing",
         ["Decades of experience in high-precision defense components",
          "Specialised in parts for tanks, pistons and critical military equipment",
          "Proven record against stringent defense industry standards"]),
        ("State-of-the-art facilities",
         ["Advanced manufacturing technology for precision and repeatability",
          "Highly skilled workforce committed to top-tier defense products",
          "Continuous investment in innovation"]),
        ("Government &amp; contractor partnerships",
         ["Trusted partner for government bodies and defense contractors",
          "Collaborative development that exceeds client expectations",
          "Tailored solutions for each defense project"]),
        ("Quality and reliability",
         ["Stringent quality control at every phase of manufacture",
          "Adherence to the highest standards throughout the process",
          "Parts crucial to national security, treated that way"]),
        ("Comprehensive support",
         ["From single components to full supply-chain management",
          "Dedicated support across the project lifecycle",
          "Seamless integration into existing defense systems"]),
        ("Role in national security",
         ["Advancing defense technology through innovative manufacturing",
          "Precision-engineered components that help safeguard nations",
          "Strengthening clients' security and defense capability"]),
    ])

    body = f"""<main id="main">
{banner("Defense manufacturing",
        "Redefining engineering — high-precision components essential to national "
        "security, produced to the standards defense agencies demand.",
        "Defense", video="drop-forging.mp4", poster="assets/img/poster-drop-forging.jpg")}

{marquee(["Tank components", "Pistons", "Pressure parts", "Batch traceability",
          "Defense standards"])}

<section class="section">
  <div class="shell panel">
    <div class="panel__media">
      <img src="assets/img/svc-defense.webp" alt="Precision defense components" data-plx="14" loading="lazy">
      <span class="panel__tag">Defense workshop</span>
    </div>
    <div data-anim="right">
      <p class="kicker">Overview</p>
      <h2>A leading manufacturer in the defense industry</h2>
      <p>With decades of experience, Monga Brothers has earned a reputation for excellence
      in manufacturing critical parts used in defense mechanisms — tanks, pistons and the
      intricate components integral to military operations.</p>
      <p>Our facilities are equipped with cutting-edge technology and operated by highly
      skilled professionals. We work closely with government bodies and defense contractors
      to develop parts that not only meet but exceed expectations — and our support extends
      from single components to managing the entire supply chain of a defense project.</p>
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Capability</p>
      <h2>Defense, in detail</h2>
    </div>
    {caps}
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="hd hd--split" data-anim>
      <div>
        <p class="kicker">Representative parts</p>
        <h2>Defense components</h2>
      </div>
      <a class="btn btn--line" href="products.html">See all products {ARROW}</a>
    </div>
    <div class="grid grid--3" data-anim-group>
{product_tiles(filter_cats=["defense"], limit=3)}
    </div>
  </div>
</section>

{cta_band("Working to a defense specification?",
          "Send the drawing and the standard. We respond with material options, process route and lead time.")}
</main>
"""
    return (head("Defense Manufacturing", "High-precision forged and machined defense "
                 "components — tanks, pistons and critical assemblies — from Monga Brothers Ltd.")
            + header("defense.html") + body + footer())


def page_railway():
    caps = rows([
        ("Railway component expertise",
         ["High-quality components essential to rail systems",
          "From braking systems through to engine components",
          "Meets the standards of global railway authorities"]),
        ("Purpose-built facilities",
         ["Advanced technology for durable, reliable railway parts",
          "Skilled workforce focused on safety and efficiency",
          "Continuous investment to stay at the forefront"]),
        ("Solutions for operators",
         ["Close collaboration to understand specific fleet needs",
          "Tailored parts that enhance performance and reliability",
          "Support for the safe, efficient operation of trains"]),
        ("Safety and reliability",
         ["Stringent quality control to the highest safety standards",
          "Components designed for challenging railway conditions",
          "Focused on the longevity of railway systems"]),
        ("Lifecycle support",
         ["Manufacturing plus support across the project lifecycle",
          "Ongoing assistance for seamless integration",
          "Best-possible outcomes for railway operators"]),
        ("Advancing the industry",
         ["Partnering with operators and manufacturers on technology",
          "Helping create safer, more efficient rail networks",
          "Committed to quality, innovation and satisfaction"]),
    ])

    body = f"""<main id="main">
{banner("Railway components",
        "Railways reimagined — forged and machined parts for the smooth and safe operation "
        "of rail systems, built to the standards railway authorities require.",
        "Railway", video="railway-track.mp4", poster="assets/img/poster-railway-track.jpg")}

{marquee(["Braking systems", "Bogie hardware", "Couplings", "Engine components",
          "Rolling stock"])}

<section class="section">
  <div class="shell panel">
    <div class="panel__media">
      <img src="assets/img/svc-railway.webp" alt="Railway bogie wheelset in a depot" data-plx="14" loading="lazy">
      <span class="panel__tag">Rolling stock depot</span>
    </div>
    <div data-anim="right">
      <p class="kicker">Overview</p>
      <h2>A trusted name in the railway industry</h2>
      <p>With a deep understanding of the unique demands of the railway sector, we produce
      parts integral to the performance and reliability of trains — from braking systems to
      engine components — built to withstand the challenging conditions of railway
      operations.</p>
      <p>By partnering with railway operators and manufacturers, Monga Brothers contributes
      to the advancement of railway technology: safer, more reliable, more efficient rail
      networks connecting people and goods across vast distances.</p>
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Capability</p>
      <h2>Railway, in detail</h2>
    </div>
    {caps}
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="hd hd--split" data-anim>
      <div>
        <p class="kicker">Representative parts</p>
        <h2>Railway components</h2>
      </div>
      <a class="btn btn--line" href="products.html">See all products {ARROW}</a>
    </div>
    <div class="grid grid--3" data-anim-group>
{product_tiles(filter_cats=["railway"], limit=3)}
    </div>
  </div>
</section>

{cta_band("Need a railway component to drawing?",
          "Braking, bogie, coupling or engine hardware — send the specification and we will quote the complete route.")}
</main>
"""
    return (head("Railway Components", "Forged and machined railway components — braking, "
                 "bogie, coupling and engine hardware — manufactured by Monga Brothers Ltd.")
            + header("railway.html") + body + footer())


def page_manufacturing():
    stack = stack_items([
        ("UNIT / 01", "Induction furnace",
         "Scrap is charged, melted and chemistry-corrected in our own melting shop before "
         "teeming. Controlling the melt is what lets us stand behind the finished part.",
         '<video src="assets/video/foundry-pour.mp4" poster="assets/img/poster-foundry-pour.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "contact.html", "Discuss your material"),
        ("UNIT / 02", "Re-rolling unit",
         "Billets are re-heated and rolled into alloy steel rounds and bars — in the sizes "
         "our own forging lines and our customers require.",
         '<video src="assets/video/rolling-mill.mp4" poster="assets/img/poster-rolling-mill.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "products.html", "Alloy steel rounds"),
        ("UNIT / 03", "Drop forging unit",
         "State-of-the-art hammers and presses forge components hot to drawing, giving the "
         "grain flow that makes a forging stronger than a machined-from-solid equivalent.",
         '<video src="assets/video/drop-forging.mp4" poster="assets/img/poster-drop-forging.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "solutions.html", "Forging capability"),
        ("UNIT / 04", "Machining unit",
         "CNC turning centres and vertical machining centres bring each forging to final "
         "dimensions, tolerances and surface finish.",
         '<video src="assets/video/cnc-machining.mp4" poster="assets/img/poster-cnc-machining.jpg" '
         'autoplay muted loop playsinline preload="none" aria-hidden="true"></video>',
         "products.html", "Machined parts"),
    ])

    gallery = [
        ("assets/img/plant-wide.webp", "The forging hall"),
        ("assets/img/svc-quality.webp", "Metrology laboratory"),
        ("assets/img/ind-engineering.webp", "Precision gear machining"),
        ("assets/img/svc-design.webp", "AutoCAD design office"),
        ("assets/img/svc-customer.webp", "On the production floor"),
        ("assets/img/svc-defense.webp", "Finished component store"),
    ]
    mosaic = "\n".join(
        f"""      <figure><img src="{src}" alt="{alt}" loading="lazy"><figcaption>{alt}</figcaption></figure>"""
        for src, alt in gallery)

    body = f"""<main id="main">
{banner("Manufacturing facilities",
        "Manufacturing on demand — one of the leading Indian manufacturers with complete "
        "in-house facilities from scrap metal to end goods.",
        "Manufacturing", video="rolling-mill.mp4", poster="assets/img/poster-rolling-mill.jpg")}

{marquee(["Induction furnace", "Re-rolling unit", "Drop forging unit", "Machining unit",
          "Heat treatment", "Tool room"])}

<section class="section">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">The plant</p>
      <h2>Four units, one continuous process</h2>
    </div>
    {stack}
  </div>
</section>

<section class="section section--raised">
  <div class="shell panel panel--rev">
    <div class="panel__media">
      <video src="assets/video/quality-lab.mp4" poster="assets/img/poster-quality-lab.jpg"
             muted loop playsinline autoplay preload="none"
             aria-label="Quality engineer measuring a machined component"></video>
      <span class="panel__tag">Laboratory</span>
    </div>
    <div data-anim="left">
      <p class="kicker">Behind the units</p>
      <h2>Laboratory, tool room &amp; design</h2>
      <p>A well-equipped laboratory with all kinds of testing facilities, a fully dedicated
      tool room, the latest AutoCAD designing systems, and heat treatment, press and
      machining facilities — run by professionally qualified, trained staff.</p>
      {ticks([
        "Spectrometer",
        "Universal testing machine",
        "Microscope &amp; microstructure analysis",
        "Hardness testing",
        "Crack detection facility",
        "Izod impact test",
      ])}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Plant gallery</p>
      <h2>Inside the works</h2>
    </div>
    <div class="mosaic" data-anim>
{mosaic}
    </div>
  </div>
</section>

{cta_band("Want to see the process on your part?",
          "We will walk you through melt, forge, heat-treat, machine and test — for your specific component.")}
</main>
"""
    return (head("Manufacturing Facilities", "Induction furnace, re-rolling unit, drop "
                 "forging unit and machining unit — Monga Brothers manufactures from scrap "
                 "metal to finished goods.")
            + header("manufacturing.html") + body + footer())


def page_industries():
    sectors = [
        ("Defense", "ind-custom", "svc-defense",
         "Tanks, pistons and critical military assemblies produced to stringent defense "
         "standards.", "defense.html"),
        ("Railway", "svc-railway", "svc-railway",
         "Braking, bogie, coupling and engine components for rolling stock and "
         "infrastructure.", "railway.html"),
        ("Automotive", "ind-automotive", "ind-automotive",
         "Forged and machined parts for drivetrain, steering and suspension applications.",
         "products.html"),
        ("Agriculture", "ind-agriculture", "ind-agriculture",
         "Hard-wearing forgings for tractors, harvesters and implements that work long "
         "seasons.", "products.html"),
        ("Earthmoving &amp; mining", "ind-earthmoving", "ind-earthmoving",
         "Heavy components for excavators, loaders and plant working in abrasive "
         "conditions.", "products.html"),
        ("Oil, gas &amp; energy", "ind-oilgas", "ind-oilgas",
         "Pressure-retaining and structural components for process, refinery and energy "
         "plant.", "products.html"),
        ("General engineering", "ind-engineering", "ind-engineering",
         "Alloy steel rounds, bars and made-to-drawing forgings for engineering workshops.",
         "manufacturing.html"),
        ("Custom projects", "ind-custom", "ind-custom",
         "One-off and repeat components developed with our tool room and design team.",
         "contact.html"),
    ]
    cells = []
    for i, (title, img, _, text, href) in enumerate(sectors):
        wide = ' bento__cell--wide' if i in (0, 5) else ''
        cells.append(f"""      <a class="bento__cell{wide}" href="{href}">
        <img src="assets/img/{img}.webp" alt="{title}" loading="lazy">
        <span class="bento__arrow">{ARROW}</span>
        <h3>{title}</h3>
        <p>{text}</p>
      </a>""")

    steps = [
        ("Enquiry", "Share the drawing, sample or specification."),
        ("Feasibility", "Material, process route and tooling reviewed by our engineers."),
        ("Quotation", "Pricing with lead time and tooling cost, within one working day."),
        ("Tooling", "Dies and fixtures developed in our own tool room."),
        ("First article", "Sample inspection with a full dimensional report."),
        ("Production", "Series manufacture with batch testing and despatch."),
    ]
    tline = "\n".join(
        f"""      <div class="tline__item" data-anim>
        <span class="tline__tag">Step {i + 1}</span>
        <h3>{t}</h3>
        <p>{d}</p>
      </div>"""
        for i, (t, d) in enumerate(steps))

    body = f"""<main id="main">
{banner("Industries &amp; service areas",
        "We cater to a wide spread of sectors with tailored solutions — delivered across "
        "India and to export markets through Mundra, Nhava Sheva and Kolkata.",
        "Industries", image="assets/img/plant-wide.webp")}

{marquee(["Defense", "Railway", "Automotive", "Agriculture", "Earthmoving", "Oil &amp; gas",
          "General engineering"])}

<section class="section">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Sectors we serve</p>
      <h2>Industry versatility</h2>
    </div>
    <div class="bento" data-anim-group>
{chr(10).join(cells)}
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell grid grid--2" style="align-items:start">
    <div data-anim="left">
      <p class="kicker">How we engage</p>
      <h2>From enquiry to first article</h2>
      <p class="lede">A defined route from your drawing to series production — the same six
      steps for a defense contractor or a farm-equipment OEM.</p>
      <p style="margin-top:1.8rem"><a class="btn" href="contact.html">Start an enquiry {ARROW}</a></p>
    </div>
    <div class="tline">
{tline}
    </div>
  </div>
</section>

<section class="section">
  <div class="shell">
    <p class="kicker" data-anim>Supply coverage</p>
    <p class="statement">Served directly from the plant across <em>North India</em>,
    despatched <em>pan-India</em> by road and rail, and exported to the <em>Gulf</em>,
    <em>South-East Asia</em>, <em>Europe</em> and <em>Africa</em>.</p>
  </div>
</section>

{cta_band("Not sure which service area fits?",
          "Describe the application — we will tell you whether it belongs on the forging line, the mill or the machining cell.")}
</main>
"""
    return (head("Industries & Service Areas", "Defense, railway, automotive, agriculture, "
                 "earthmoving, oil & gas and general engineering — industries served by "
                 "Monga Brothers Ltd.")
            + header("industries.html") + body + footer())


def page_products():
    body = f"""<main id="main">
{banner("Product range",
        "A representative selection of the forged and machined components we produce. "
        "Almost everything we make is to a customer drawing — treat this as a capability "
        "sample.",
        "Products", image="assets/img/ind-engineering.webp")}

{marquee(["Closed-die forgings", "Alloy steel rounds", "CNC turned parts",
          "Heat treated components", "Proof load tested"])}

<section class="section">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Made in-house</p>
      <h2>Components gallery</h2>
    </div>

    <div class="filters" data-filter-group="#product-grid" data-anim role="group" aria-label="Filter products">
      <button type="button" data-filter="all" aria-pressed="true">All</button>
      <button type="button" data-filter="defense" aria-pressed="false">Defense</button>
      <button type="button" data-filter="railway" aria-pressed="false">Railway</button>
      <button type="button" data-filter="industry" aria-pressed="false">General industry</button>
    </div>

    <div class="grid grid--4" id="product-grid" data-anim-group>
{product_tiles()}
    </div>
  </div>
</section>

<section class="section section--raised">
  <div class="shell panel">
    <div class="panel__media">
      <video src="assets/video/cnc-machining.mp4" poster="assets/img/poster-cnc-machining.jpg"
             muted loop playsinline autoplay preload="none"
             aria-label="CNC machining a forged steel component"></video>
      <span class="panel__tag">Machining unit</span>
    </div>
    <div data-anim="right">
      <p class="kicker">Materials</p>
      <h2>What we forge in</h2>
      {ticks([
        "Carbon steels — as rolled, normalised or heat treated",
        "Alloy steels including chrome-moly and nickel grades",
        "Case-hardening and through-hardening grades",
        "Free-cutting grades for high-volume machined parts",
        "Customer-nominated grades against test certificate",
      ])}
    </div>
  </div>
</section>

{cta_band("Your part is not in the gallery?",
          "That is normal — most of what we make is made to order. Send the drawing and we will quote it.")}
</main>
"""
    return (head("Products", "Forged and machined components from Monga Brothers Ltd. — "
                 "defense, railway and general industry parts made to customer drawings.")
            + header("products.html") + body + footer())


def page_contact():
    body = f"""<main id="main">
{banner("Contact us",
        "Ready to move a project forward? Send a drawing, a specification or a question — "
        "our engineers reply within one working day.",
        "Contact", video="quality-lab.mp4", poster="assets/img/poster-quality-lab.jpg")}

<section class="section">
  <div class="shell grid grid--2" style="align-items:start;gap:clamp(2rem,4vw,3.4rem)">
    <div data-anim="left">
      <p class="kicker">Send us your query</p>
      <h2>Request a quotation</h2>
      <form class="form" data-mock-submit novalidate style="margin-top:2rem">
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
            placeholder="Part description, material grade, quantity, standard, target delivery&hellip;"></textarea>
        </div>
        <p class="form__status" role="status" hidden></p>
        <p class="form__note">This demonstration form does not transmit data anywhere.
        Connect it to your mail handler or CRM endpoint before going live.</p>
        <div class="field--wide">
          <button class="btn" type="submit">Send enquiry {ARROW}</button>
        </div>
      </form>
    </div>

    <aside data-anim="right">
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
            <dd>Monday to Saturday, 9:00 &ndash; 18:30 IST</dd>
          </div>
          <div>
            <dt>Certification</dt>
            <dd>ISO 9001:2015 certified company</dd>
          </div>
        </dl>
        <p style="margin:1.8rem 0 0">
          <a class="btn btn--line" target="_blank" rel="noopener"
             href="https://www.google.com/maps/search/?api=1&amp;query=B-16%2C+Phase-2%2C+Focal+Point%2C+Ludhiana+141010">
            Open in Google Maps {ARROW}
          </a>
        </p>
      </div>
    </aside>
  </div>
</section>

<section class="section section--raised">
  <div class="shell">
    <div class="hd" data-anim>
      <p class="kicker">Before you write</p>
      <h2>What helps us quote faster</h2>
    </div>
    {rows([
      ("The drawing", ["A PDF or DXF with dimensions and tolerances tells us more than any description."]),
      ("Material grade", ["The nominated grade, or the mechanical properties the part must reach."]),
      ("Quantity", ["Annual volume and batch size — both change the tooling and the price."]),
      ("Standard", ["Any inspection, testing or certification your sector requires."]),
    ])}
  </div>
</section>
</main>
"""
    return (head("Contact", "Contact Monga Brothers Ltd., B-16 Phase-2 Focal Point, "
                 "Ludhiana — +91 70 8748 0555, info@mongabrothers.com.")
            + header("contact.html") + body + footer())


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
        with open(os.path.join(ROOT, name), "w", encoding="utf-8") as fh:
            fh.write(fn())
        print("wrote", name)


if __name__ == "__main__":
    main()
