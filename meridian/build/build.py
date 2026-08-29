"""
MERIDIAN — page builder.

Content lives here, chrome lives in partials.py. Run this to write the eight
HTML files:  python3 build/build.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import partials as P  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------
# Content
# --------------------------------------------------------------------------

PRACTICES = [
    {"slug": "breath", "alt": "Mist rising off a still river between forested banks.", "name": "Breath", "phase": "Dawn", "art": "practice-breath",
     "dur": "25–45 min", "kind": "Solo or guided",
     "lede": "Downregulate on command.",
     "body": "Nasal mechanics, CO₂ tolerance, and the long exhale. You learn to move "
             "yourself from wired to steady in under four minutes — then you practise it "
             "until it works on a bad day, not just a good one.",
     "chips": ["Pranayama", "CO₂ tolerance", "Coherence", "Cold exposure"]},
    {"slug": "movement", "alt": "Two walkers climbing a stone-stepped path through woodland.", "name": "Movement", "phase": "Meridian", "art": "practice-movement",
     "dur": "50–60 min", "kind": "Small group",
     "lede": "Strength that keeps its range.",
     "body": "Slow loaded movement through full range — hips, spine, shoulders, feet. "
             "Not a workout that leaves you wrecked; a practice that leaves you longer "
             "than it found you, three times a week, for thirty years.",
     "chips": ["Mobility", "Slow strength", "Gait", "Load"]},
    {"slug": "sound", "alt": "A hand-beaten singing bowl with its wooden striker resting inside.", "name": "Sound", "phase": "Dusk", "art": "practice-sound",
     "dur": "45 min", "kind": "Group",
     "lede": "Resonance you feel in the sternum.",
     "body": "Bowls, gong, and voice in a room built for it. Sound is the fastest route "
             "we know into a parasympathetic state for people who cannot sit still and "
             "cannot be told to relax.",
     "chips": ["Sound bath", "Overtone", "Humming", "Group"]},
    {"slug": "restore", "alt": "Snow-capped peaks mirrored in a completely still lake.", "name": "Restore", "phase": "Deep", "art": "practice-restore",
     "dur": "60–75 min", "kind": "Guided",
     "lede": "The practice you sleep after.",
     "body": "Yin holds, yoga nidra, and legs-up-the-wall in a dim room at the end of the "
             "day. We treat this as training, not as a reward — it is where the adaptation "
             "from everything else actually lands.",
     "chips": ["Yin", "Nidra", "Sleep protocol", "Dim room"]},
    {"slug": "nourish", "alt": "The scored crust of a rustic loaf, close up.", "name": "Nourish", "phase": "Meridian", "art": "practice-nourish",
     "dur": "Ongoing",  "kind": "1:1 + kitchen",
     "lede": "Eat with the light.",
     "body": "Front-load the day, close the window early, and cook things that were grown "
             "within a hundred miles of the Ojai valley. Seasonal menus, a working kitchen, "
             "and no supplement you cannot pronounce.",
     "chips": ["Seasonal", "Timing", "Kitchen", "Local"]},
]

GUIDES = [
    {"name": "Inés Aldana", "role": "Founder · Breath", "art": "guide-1", "since": "Est. 2016",
     "bio": "Trained in Buteyko and clinical respiratory physiology, then spent six years "
            "unlearning most of the theatre around both. Opened MERIDIAN after a decade of "
            "teaching breath in hospitals, where nobody has time for incense."},
    {"name": "Tomás Okafor", "role": "Movement", "art": "guide-2", "since": "12 yrs teaching",
     "bio": "Ex-dancer, now a strength coach who programmes for range first and load second. "
            "Will happily spend an entire session on your feet, and you will understand why "
            "by the end of it."},
    {"name": "Neve Lindqvist", "role": "Sound & Stillness", "art": "guide-3", "since": "9 yrs teaching",
     "bio": "Studied composition before she studied practice, which is why her sound sessions "
            "have structure instead of drift. Also runs the Deep hour and the sleep clinic."},
    {"name": "Priya Raman", "role": "Nourishment", "art": "guide-4", "since": "Chef · RD",
     "bio": "A chef who went back for a nutrition degree because she got tired of arguing "
            "with bad advice. Runs the kitchen, writes the seasonal menus, and holds the "
            "1:1 food sessions."},
]

JOURNAL = [
    {"t": "The first ninety minutes", "sub": "What light does before coffee does anything",
     "phase": "Dawn", "read": "6 min", "art": "journal-1", "date": "12 Aug 2026"},
    {"t": "Your 3pm is not a coffee problem", "sub": "The afternoon dip is a scheduling failure",
     "phase": "Meridian", "read": "8 min", "art": "journal-2", "date": "29 Jul 2026"},
    {"t": "The pink moment", "sub": "What dusk light does to a nervous system",
     "phase": "Dusk", "read": "5 min", "art": "journal-3", "date": "14 Jul 2026"},
    {"t": "Sleep is the practice", "sub": "Everything else is preparation for it",
     "phase": "Deep", "read": "9 min", "art": "journal-4", "date": "02 Jul 2026"},
    {"t": "Against the 5am club", "sub": "Chronotype is not a character flaw",
     "phase": "Dawn", "read": "7 min", "art": "journal-5", "date": "18 Jun 2026"},
    {"t": "Eating with the light", "sub": "Front-loading, and closing the window early",
     "phase": "Meridian", "read": "6 min", "art": "journal-6", "date": "04 Jun 2026"},
]

RETREATS = [
    {"t": "Four Hours", "len": "3 days · 2 nights", "when": "18–20 Sep 2026",
     "price": "$1,180", "art": "retreat-1", "left": "6 places left",
     "body": "The whole arc, lived once properly. Three days on the full rhythm — dawn "
             "breath on the ridge, loaded movement at midday, sound at the pink moment, "
             "and a genuinely dark room at night."},
    {"t": "The Long Exhale", "len": "Weekend", "when": "24–26 Oct 2026",
     "price": "$740", "art": "retreat-2", "left": "Waitlist",
     "body": "Two days on downregulation alone, for people whose engine will not idle. "
             "Breath, yin, sound and silence, with a working measure of where your "
             "baseline actually sits on arrival and on leaving."},
    {"t": "Deep Winter", "len": "5 days", "when": "12–16 Jan 2027",
     "price": "$2,150", "art": "retreat-3", "left": "Opens Sep",
     "body": "The sleep intensive. Five days in the short-light season rebuilding a night "
             "from the ground up — light exposure, temperature, timing, and the wind-down "
             "hour most people skip."},
]

TIERS = [
    {"name": "Sunrise", "price": "$95", "cycle": "per month",
     "blurb": "One hour of the day, done properly.",
     "feats": ["Any one phase — Dawn, Meridian or Dusk", "Open practice room, 05:30–20:00",
               "Seasonal breath and movement library", "Quarterly rhythm review",
               ("Sound and Restore sessions", False), ("1:1 guide hours", False)]},
    {"name": "Full Day", "price": "$185", "cycle": "per month", "feature": True,
     "flag": "Most members", "blurb": "The whole arc, all four hours.",
     "feats": ["Everything in Sunrise", "All four phases, unlimited", "Sound and Restore sessions",
               "One 1:1 guide hour a month", "Kitchen table dinners", "Two guest passes a month"]},
    {"name": "Solstice", "price": "$420", "cycle": "per month",
     "blurb": "A guide, a plan, and the long view.",
     "feats": ["Everything in Full Day", "Weekly 1:1 with your guide", "Sleep and recovery tracking",
               "Seasonal nutrition planning", "Priority retreat placement", "Off-hours room booking"]},
]

SCHEDULE = [
    ("dawn", "Dawn", "05:45", "Breath — long exhale", "Inés", "45 min"),
    ("dawn", "Dawn", "07:00", "Movement — full range", "Tomás", "60 min"),
    ("dawn", "Dawn", "08:15", "Open practice", "—", "Open"),
    ("meridian", "Meridian", "11:30", "Movement — loaded", "Tomás", "60 min"),
    ("meridian", "Meridian", "12:45", "Kitchen table", "Priya", "50 min"),
    ("dusk", "Dusk", "16:45", "Sound — bowls & gong", "Neve", "45 min"),
    ("dusk", "Dusk", "18:00", "Breath — coherence", "Inés", "40 min"),
    ("deep", "Deep", "19:15", "Restore — yin & nidra", "Neve", "75 min"),
]

FAQ = [
    ("Do I have to come four times a day?",
     "No — and almost nobody does. The four phases are a map of when things work best, not "
     "a schedule you owe us. Most members practise three or four times a week and pick the "
     "hour that fits their life. Sunrise membership deliberately gives you one phase only."),
    ("I'm not a morning person. Is this for me?",
     "Yes. Chronotype is real and we programme around it — 'Dawn' means the first ninety "
     "minutes of <em>your</em> day, whenever that starts. We run the same sequence at 05:45 "
     "and at 08:15 for exactly this reason."),
    ("Is this a gym, a yoga studio, or a clinic?",
     "None of the three, which is occasionally inconvenient to explain. There is load and "
     "there are barbells; there is breath and there is stillness; and there is a dietitian. "
     "What holds it together is the timing, not the modality."),
    ("What actually happens on a first visit?",
     "Ninety minutes with a guide. We walk your current day hour by hour, take some simple "
     "baselines — breath-hold, grip, range, a sleep questionnaire — and leave you with one "
     "practice to start. No package is sold to you in that room."),
    ("Can I come without a membership?",
     "Drop-in is $34 a session, and the first visit is free. Retreats are open to "
     "non-members, though members get first placement."),
]


# --------------------------------------------------------------------------
# Components
# --------------------------------------------------------------------------

def practice_card(p, href=True):
    chips = "".join(f'<li class="chip">{c}</li>' for c in p["chips"][:3])
    link = (f'<a class="btn btn--ghost" href="/practices#{p["slug"]}">Read more '
            f'<span class="arrow">&rarr;</span></a>') if href else ""
    return f"""<article class="card reveal">
  <div class="card__art">
    <span class="badge">{p["phase"]}</span>
    <img src="/assets/img/{p["art"]}.webp" width="1200" height="1500" loading="lazy" decoding="async"
         alt="{p["alt"]}">
  </div>
  <div class="card__body">
    <p class="card__meta">{p["dur"]} &middot; {p["kind"]}</p>
    <h3 class="display">{p["name"]}</h3>
    <p>{p["lede"]}</p>
    <ul class="chips">{chips}</ul>
    <div class="card__foot">{link}</div>
  </div>
</article>"""


def guide_card(g):
    return f"""<article class="card reveal">
  <div class="card__art">
    <span class="badge">{g["since"]}</span>
    <img src="/assets/art/{g["art"]}.svg" width="1100" height="1375" loading="lazy" decoding="async"
         alt="Soft abstract bloom standing in for a portrait of {g["name"]}.">
  </div>
  <div class="card__body">
    <h3 class="display">{g["name"]}</h3>
    <p class="card__meta" style="margin:.35rem 0 .7rem">{g["role"]}</p>
    <p>{g["bio"]}</p>
  </div>
</article>"""


def retreat_card(r):
    return f"""<article class="card reveal">
  <div class="card__art card__art--wide">
    <span class="badge">{r["left"]}</span>
    <img src="/assets/img/{r["art"]}.webp" width="1600" height="1000" loading="lazy" decoding="async"
         alt="Landscape photograph for the {r["t"]} retreat.">
  </div>
  <div class="card__body">
    <p class="card__meta">{r["len"]} &middot; {r["when"]}</p>
    <h3 class="display">{r["t"]}</h3>
    <p>{r["body"]}</p>
    <div class="card__foot">
      <span class="card__price">{r["price"]}</span>
      <a class="btn btn--ghost" href="/visit#book">Enquire <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</article>"""


def journal_row(a, thumb=False):
    art = (f'<span class="row__img"><img src="/assets/img/{a["art"]}.webp" width="1200" '
           f'height="800" loading="lazy" decoding="async" alt=""></span>') if thumb else ""
    return f"""<a class="row{' row--thumb' if thumb else ''}" href="/journal">
  <span class="row__k">{a["phase"]}</span>
  {art}
  <span class="row__t">{a["t"]}<span>{a["sub"]}</span></span>
  <span class="row__m">{a["date"]} &middot; {a["read"]}</span>
  <span class="row__a" aria-hidden="true">&rarr;</span>
</a>"""


def phase_block(ph, art_suffix=""):
    return f"""<article class="phase reveal" style="--pc:{ph['colour']}" data-hour="{ph['key']}">
  <p class="phase__hour"><i></i>{ph['hours']}</p>
  <div class="phase__body">
    <h3 class="display">{ph['name']}</h3>
    <p style="margin:.35rem 0 .6rem;color:var(--ink);font-size:1.02rem">{ph['line']}</p>
    <p>{ph['body']}</p>
  </div>
  <div class="phase__art">
    <img src="/assets/img/phase-{ph['key']}{art_suffix}.webp" width="1600" height="700"
         loading="lazy" decoding="async"
         alt="The {ph['name'].lower()} hour: {ph['alt']}">
  </div>
</article>"""


def phase_sequence(idprefix="seq"):
    """The four hours as one pinned stage that crossfades on scroll.

    Rendered as a plain stacked list first; the sticky behaviour is added by
    the .js class, so this degrades to readable content without JavaScript.
    """
    panels = ""
    for i, ph in enumerate(P.PHASES):
        panels += f"""<article class="phaseseq__panel{' is-on' if i == 0 else ''}"
         style="--pc:{ph['colour']}" data-hour="{ph['key']}">
  <div>
    <p class="phaseseq__hour"><i></i>{ph['hours']}</p>
    <h3 class="display">{ph['name']}</h3>
    <p class="phaseseq__lead">{ph['line']}</p>
    <p class="lede">{ph['body']}</p>
  </div>
  <div class="phaseseq__art" data-par>
    <img src="/assets/img/phase-{ph['key']}.webp" width="1400" height="900"
         loading="lazy" decoding="async"
         alt="The {ph['name'].lower()} hour: {ph['alt']}">
  </div>
</article>"""

    return f"""<section class="phaseseq" id="{idprefix}">
  <div class="phaseseq__track" data-seq>
    <div class="phaseseq__stage">
      <div class="wrap phaseseq__panels">{panels}</div>
      <div class="wrap">
        <p class="phaseseq__count" aria-hidden="true">The hours <b data-seq-num>01</b>&thinsp;/&thinsp;04</p>
        {P.arc(idprefix + "Arc")}
      </div>
    </div>
  </div>
</section>"""


def statement(words, art=None):
    """A line that lights word by word as it is scrolled through."""
    spans = " ".join(
        f'<span class="w">{w}</span>' if not w.startswith("<") else w
        for w in words.split(" "))
    return f"""<section class="statement section--tint">
  <div class="statement__track" data-statement>
    <div class="statement__stage">
      <div class="wrap">
        <p class="statement__line">{spans}</p>
      </div>
    </div>
  </div>
</section>"""


def tier_block(t):
    feats = ""
    for f in t["feats"]:
        if isinstance(f, tuple):
            feats += f'<li class="off">{f[0]}</li>'
        else:
            feats += f"<li>{f}</li>"
    flag = f'<span class="tier__flag">{t["flag"]}</span>' if t.get("flag") else ""
    cls = "tier tier--feature reveal" if t.get("feature") else "tier reveal"
    btn = "btn btn--solid btn--block" if t.get("feature") else "btn btn--block"
    return f"""<article class="{cls}">
  {flag}
  <h3 class="display">{t["name"]}</h3>
  <p style="color:var(--ink-3);font-size:.92rem;margin:.4rem 0 0">{t["blurb"]}</p>
  <p class="tier__price"><b>{t["price"]}</b></p>
  <p class="tier__cycle">{t["cycle"]}</p>
  <ul class="tier__feats">{feats}</ul>
  <a class="{btn}" href="/visit#book">Start with a first visit</a>
</article>"""


def faq_block(items=None):
    items = items or FAQ
    rows = "".join(
        f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in items)
    return f'<div class="faq">{rows}</div>'


def swipe_hint(n=3):
    dots = "".join(f'<span class="{"on" if i == 0 else ""}"></span>' for i in range(n))
    return (f'<p class="swipe-hint" aria-hidden="true">Swipe'
            f'<span class="swipe-hint__dots">{dots}</span></p>')


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------

def home():
    stats = [("4", "hours in the arc"), ("11", "guides & practitioners"),
             ("620", "members practising"), ("2016", "practising since")]
    stat_html = "".join(
        f'<div class="hero__stat"><b data-count="{v}">{v}</b><span>{k}</span></div>'
        for v, k in stats)

    body = f"""<section class="hero">
  <div class="wrap">
    <div class="hero__grid">
      <div>
        <p class="eyebrow reveal">{P.CITY}</p>
        <h1 class="display hero__title" id="heroTitle">
          <span class="w">Wellness</span> <span class="w">in</span> <span class="w">rhythm</span>
          <span class="w">with</span> <span class="w">the</span> <span class="w"><em>day.</em></span>
        </h1>
        <p class="lede reveal">Your body is not the same at six in the morning as it is at six at
          night, and it should not be trained as though it were. MERIDIAN is a practice built on
          the four hours of the day — and on doing the right thing in each of them.</p>
        <div class="btn-row reveal" style="margin-top:1.75rem">
          <a class="btn btn--solid" href="/visit#book">Book a first visit <span class="arrow">&rarr;</span></a>
          <a class="btn" href="/rhythm">Understand the rhythm</a>
        </div>
      </div>
      <div class="hero__media reveal" data-par>
        <img src="/assets/img/hero.webp" width="1400" height="1080" fetchpriority="high" decoding="async"
             alt="Layered hills under low morning fog, warm light across the ridges.">
      </div>
    </div>
    <div class="hero__foot reveal">{stat_html}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section__head section__head--center reveal">
      <div>
        <p class="eyebrow eyebrow--plain">The rhythm</p>
        <h2 class="display">A day has four hours<br>that actually matter.</h2>
        <p class="lede" style="margin-top:1.1rem">Not twenty-four equal ones. Four windows where
          your physiology is primed for something specific — and largely deaf to everything else.</p>
      </div>
    </div>
    <div class="reveal" style="max-width:900px;margin:0 auto clamp(2rem,5vh,3.5rem)">{P.arc("homeArc")}</div>
    <div class="phases">{''.join(phase_block(p, '-wide') for p in P.PHASES)}</div>
    <div class="btn-row reveal" style="justify-content:center;margin-top:2.25rem">
      <a class="btn" href="/rhythm">The full method <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</section>

{statement("Most people are not <em>unmotivated.</em> They are doing the right thing at the wrong hour.")}

<section class="section section--tint">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <p class="eyebrow">Practices</p>
        <h2 class="display">Five things,<br>done seriously.</h2>
      </div>
      <p class="lede">We would rather do a short list well than a long one adequately. Each practice
        belongs to an hour, and each has a guide who has spent a decade inside it.</p>
    </div>
    <div class="grid grid--3 grid--rail" id="practiceGrid">
      {''.join(practice_card(p) for p in PRACTICES[:3])}
    </div>
    {swipe_hint(3)}
    <div class="grid grid--2" style="margin-top:clamp(1rem,2vw,1.6rem)">
      {''.join(practice_card(p) for p in PRACTICES[3:])}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <figure class="quote reveal">
      <blockquote>&ldquo;Nobody needs another routine. What people need is permission to stop
        doing the wrong thing at the wrong hour.&rdquo;</blockquote>
      <figcaption>Inés Aldana &middot; Founder</figcaption>
    </figure>
  </div>
</section>

<section class="section section--tint">
  <div class="wrap">
    <div class="section__head reveal">
      <div><p class="eyebrow">Guides</p><h2 class="display">Who you'll<br>actually work with.</h2></div>
      <p class="lede">Eleven practitioners, four of whom hold the phases. Every one of them still
        practises daily and still teaches the early session.</p>
    </div>
    <div class="grid grid--4 grid--rail" id="guideGrid">{''.join(guide_card(g) for g in GUIDES)}</div>
    {swipe_hint(4)}
    <div class="btn-row reveal" style="margin-top:2rem"><a class="btn" href="/guides">Meet everyone <span class="arrow">&rarr;</span></a></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section__head reveal">
      <div><p class="eyebrow">Journal</p><h2 class="display">Notes from<br>the practice.</h2></div>
      <p class="lede">What we are reading, testing and arguing about. No listicles, no supplements
        to sell you.</p>
    </div>
    <div class="rows reveal">{''.join(journal_row(a) for a in JOURNAL[:4])}</div>
    <div class="btn-row reveal" style="margin-top:1.75rem"><a class="btn" href="/journal">All writing <span class="arrow">&rarr;</span></a></div>
  </div>
</section>

{P.cta()}"""
    return P.page("index", f"{P.SITE} — {P.TAGLINE}",
                  "A wellness practice in Ojai, California built on the four hours of the body's day: "
                  "Dawn, Meridian, Dusk and Deep. Breath, movement, sound, restoration and food.",
                  body)


def rhythm():
    body = P.phead("The Rhythm", "The method", "Four hours,<br>not twenty-four.",
                   "Chronobiology is not a wellness trend; it is the least controversial thing in "
                   "physiology. Body temperature, cortisol, grip strength, alertness and digestion "
                   "all run on a daily curve. MERIDIAN is what happens when a practice is built on "
                   "that curve instead of on a class timetable.",
                   '<div class="btn-row" style="margin-top:1.5rem"><a class="btn btn--solid" href="/visit#book">Map your day <span class="arrow">&rarr;</span></a></div>')

    body += f"""

{phase_sequence("rhythmSeq")}

<section class="section section--tint">
  <div class="wrap">
    <div class="section__head reveal">
      <div><p class="eyebrow">How it's built</p><h2 class="display">Three rules<br>behind the map.</h2></div>
      <p class="lede">The rhythm is simple to state and genuinely hard to hold. These are the
        principles a guide will keep returning you to.</p>
    </div>
    <div class="grid grid--3">
      <article class="card reveal"><div class="card__body">
        <p class="card__meta">01</p><h3 class="display">Light leads</h3>
        <p>Every downstream rhythm — sleep, appetite, mood, temperature — is anchored by when
          light hits your eyes. It is the cheapest, most powerful lever available, and almost
          nobody pulls it deliberately.</p></div></article>
      <article class="card reveal"><div class="card__body">
        <p class="card__meta">02</p><h3 class="display">Load at the peak</h3>
        <p>Strength, power and coordination top out in the afternoon for most people. Training
          hard at 05:00 because it feels virtuous costs you output and buys you nothing your
          nervous system wanted.</p></div></article>
      <article class="card reveal"><div class="card__body">
        <p class="card__meta">03</p><h3 class="display">Protect the dark</h3>
        <p>Deep is the only phase where adaptation happens. The other three hours exist partly to
          make that one work. If a practice costs you sleep, it is not a practice — it is a debt.</p>
        </div></article>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap wrap--narrow">
    <div class="section__head section__head--center reveal">
      <div><p class="eyebrow eyebrow--plain">Questions</p><h2 class="display">The ones<br>we get most.</h2></div>
    </div>
    <div class="reveal">{faq_block()}</div>
  </div>
</section>

{P.cta("Start with one hour.", "You do not have to rebuild your whole day to feel the difference. Pick the phase that is worst right now — most people say Deep — and start there.")}"""
    return P.page("rhythm", f"The Rhythm — {P.SITE}",
                  "The four phases of the MERIDIAN method: Dawn, Meridian, Dusk and Deep — what "
                  "each hour is for and how to practise in it.", body)


def practices():
    detail = ""
    for i, p in enumerate(PRACTICES):
        chips = "".join(f'<li class="chip">{c}</li>' for c in p["chips"])
        flip = "direction:rtl" if i % 2 else ""
        detail += f"""<section class="section stack__item{' section--tint' if i % 2 else ''}" id="{p['slug']}">
  <div class="wrap">
    <div class="section__head" style="{flip};align-items:center;margin-bottom:0">
      <div class="reveal" style="direction:ltr">
        <p class="eyebrow">{p['phase']} &middot; {p['dur']}</p>
        <h2 class="display">{p['name']}</h2>
        <p class="lede" style="margin:1rem 0 1.1rem;color:var(--ink);font-size:1.15rem">{p['lede']}</p>
        <p class="lede">{p['body']}</p>
        <ul class="chips" style="margin-top:1.25rem">{chips}</ul>
        <div class="btn-row"><a class="btn" href="/visit#book">Try {p['name'].lower()} <span class="arrow">&rarr;</span></a></div>
      </div>
      <div class="reveal" style="direction:ltr">
        <div class="hero__media" style="aspect-ratio:4/3.4" data-par>
          <img src="/assets/img/{p['art']}.webp" width="1200" height="1500" loading="lazy" decoding="async"
               alt="{p['alt']}">
        </div>
      </div>
    </div>
  </div>
</section>"""
    detail = f'<div class="stack">{detail}</div>'

    body = P.phead("Practices", "What we do", "Five practices,<br>four hours.",
                   "Each practice belongs to a phase, has a guide who has lived inside it for a "
                   "decade, and earns its place by doing something the other four cannot. There is "
                   "no sixth thing we are quietly working up to.")
    body += f"""<section class="section section--tight"><div class="wrap">
      <div class="grid grid--3 grid--rail" id="practiceGrid">{''.join(practice_card(p, href=False) for p in PRACTICES[:3])}</div>
      {swipe_hint(3)}
      <div class="grid grid--2" style="margin-top:clamp(1rem,2vw,1.6rem)">{''.join(practice_card(p, href=False) for p in PRACTICES[3:])}</div>
    </div></section>{detail}{P.cta()}"""
    return P.page("practices", f"Practices — {P.SITE}",
                  "Breath, Movement, Sound, Restore and Nourish — the five MERIDIAN practices and "
                  "the hour each one belongs to.", body)


def retreats():
    body = P.phead("Retreats", "Away", "The rhythm,<br>lived properly once.",
                   "A week of doing it right teaches more than a year of doing it approximately. "
                   "Retreats run in the Ojai valley and on the ridge above it, capped at sixteen "
                   "people so a guide can actually see you.")
    body += f"""<section class="section section--tight"><div class="wrap">
      <div class="grid grid--3 grid--rail" id="retreatGrid">{''.join(retreat_card(r) for r in RETREATS)}</div>
      {swipe_hint(3)}
    </div></section>

<section class="section section--tint"><div class="wrap">
  <div class="section__head reveal">
    <div><p class="eyebrow">A day away</p><h2 class="display">What a retreat<br>day looks like.</h2></div>
    <p class="lede">The same arc as at home, with the friction removed and the light better. No
      phones in practice rooms; no schedule after the Deep hour begins.</p>
  </div>
  <div class="rows reveal">
    <div class="row"><span class="row__k">05:45</span><span class="row__t">Ridge breath<span>Long exhale as the valley lights</span></span><span class="row__m">Dawn</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">07:30</span><span class="row__t">Breakfast<span>Front-loaded, cooked in the open kitchen</span></span><span class="row__m">Dawn</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">11:30</span><span class="row__t">Loaded movement<span>Full range, under weight, at the peak</span></span><span class="row__m">Meridian</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">14:00</span><span class="row__t">Open hours<span>Walk, swim, read, or nothing at all</span></span><span class="row__m">Meridian</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">16:45</span><span class="row__t">Sound at the pink moment<span>Bowls as the Topatopas turn</span></span><span class="row__m">Dusk</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">19:15</span><span class="row__t">Restore, then dark<span>Yin, nidra, and a genuinely dark room</span></span><span class="row__m">Deep</span><span class="row__a">&mdash;</span></div>
  </div>
</div></section>

{P.cta("Hold a place.", "Retreats are capped at sixteen and members get first placement. Tell us which one and we will hold a spot for seven days, no deposit.", "Enquire about a retreat")}"""
    return P.page("retreats", f"Retreats — {P.SITE}",
                  "Three residential retreats in the Ojai valley: Four Hours, The Long Exhale and "
                  "Deep Winter. Capped at sixteen people.", body)


def guides():
    body = P.phead("Guides", "The practice", "Eleven people,<br>one rhythm.",
                   "Four guides hold the phases; seven more practitioners cover bodywork, sleep, "
                   "and the kitchen. Everyone here still practises daily, and everyone still teaches "
                   "the unglamorous early session.")
    body += f"""<section class="section section--tight"><div class="wrap">
      <div class="grid grid--4 grid--rail" id="guideGrid">{''.join(guide_card(g) for g in GUIDES)}</div>
      {swipe_hint(4)}
    </div></section>

<section class="section section--tint"><div class="wrap">
  <div class="section__head reveal">
    <div><p class="eyebrow">Also here</p><h2 class="display">The rest<br>of the room.</h2></div>
    <p class="lede">Seven practitioners rotate through the studio each week — you will meet them
      through your guide rather than by booking blind.</p>
  </div>
  <div class="rows reveal">
    <div class="row"><span class="row__k">Bodywork</span><span class="row__t">Marta Vieira<span>Structural integration, ten sessions</span></span><span class="row__m">Tue &middot; Thu</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">Sleep</span><span class="row__t">Dr Owen Feltz<span>Behavioural sleep medicine</span></span><span class="row__m">Wed</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">Movement</span><span class="row__t">Aiko Tanaka<span>Gait, feet, and the long walk</span></span><span class="row__m">Mon &middot; Fri</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">Breath</span><span class="row__t">Samuel Adeyemi<span>Freediving background, CO₂ work</span></span><span class="row__m">Sat</span><span class="row__a">&mdash;</span></div>
    <div class="row"><span class="row__k">Kitchen</span><span class="row__t">Rosa Delgado<span>Seasonal menus, Ojai growers</span></span><span class="row__m">Daily</span><span class="row__a">&mdash;</span></div>
  </div>
</div></section>

{P.cta("Work with a guide.", "Every membership above Sunrise includes guide hours. The first visit is with one of the four — you choose, or we match you on what your day actually looks like.")}"""
    return P.page("guides", f"Guides — {P.SITE}",
                  "The practitioners at MERIDIAN: Inés Aldana, Tomás Okafor, Neve Lindqvist and "
                  "Priya Raman, plus the wider practice.", body)


def journal():
    body = P.phead("Journal", "Writing", "Notes from<br>the practice.",
                   "What we are reading, testing, and occasionally getting wrong. Written by the "
                   "guides, edited lightly, and never in service of selling you a supplement.")
    feat = JOURNAL[0]
    body += f"""<section class="section section--tight"><div class="wrap">
  <article class="card reveal" style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)">
    <div class="card__art card__art--wide" style="aspect-ratio:auto">
      <span class="badge">{feat['phase']}</span>
      <img src="/assets/img/{feat['art']}.webp" width="1200" height="800" decoding="async"
           alt="Photograph heading the featured article.">
    </div>
    <div class="card__body" style="justify-content:center;padding:clamp(1.5rem,3vw,2.75rem)">
      <p class="card__meta">Featured &middot; {feat['date']} &middot; {feat['read']}</p>
      <h2 class="display">{feat['t']}</h2>
      <p style="margin-top:.6rem">{feat['sub']}. The case for treating the first ninety minutes as
        the highest-leverage block in the day — and the small, unglamorous protocol we give every
        new member to start it.</p>
      <div class="card__foot"><a class="btn btn--ghost" href="/journal">Read the piece <span class="arrow">&rarr;</span></a></div>
    </div>
  </article>
</div></section>

<section class="section"><div class="wrap">
  <div class="section__head reveal">
    <div><p class="eyebrow">Archive</p><h2 class="display">Everything else.</h2></div>
    <p class="lede">Filed by the phase it belongs to. Roughly two pieces a month, whenever there
      is genuinely something to say.</p>
  </div>
  <div class="rows reveal">{''.join(journal_row(a, thumb=True) for a in JOURNAL)}</div>
</div></section>

<section class="section section--tint"><div class="wrap wrap--narrow">
  <div class="panel reveal">
    <div style="text-align:center;max-width:520px;margin:0 auto">
      <p class="eyebrow eyebrow--plain" style="justify-content:center">The letter</p>
      <h2 class="display" style="font-size:clamp(1.6rem,3vw,2.3rem)">One note, on the first of the month.</h2>
      <p class="lede" style="margin:.9rem auto 1.5rem">What we changed, what we read, and the one
        practice worth trying this season. No sequence, no upsell.</p>
    </div>
    <form id="letterForm" novalidate style="max-width:460px;margin:0 auto">
      <div class="field">
        <label for="l-email">Email</label>
        <input id="l-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
      </div>
      <button class="btn btn--solid btn--block" type="submit">Send me the letter</button>
      <p class="form-note">Monthly. Unsubscribe in one click. This demo form sends nothing.</p>
      <p class="form-ok" id="letterOk" role="status" hidden></p>
    </form>
  </div>
</div></section>"""
    return P.page("journal", f"Journal — {P.SITE}",
                  "Writing from the MERIDIAN guides on chronobiology, breath, sleep, load and food.",
                  body)


def membership():
    body = P.phead("Membership", "Join", "Pick the hours<br>you'll actually use.",
                   "Month to month, no joining fee, cancel from your account. Every tier starts "
                   "with the same free ninety-minute first visit, and nobody will sell you a "
                   "package in that room.")
    body += f"""<section class="section section--tight"><div class="wrap">
  <div class="hero__media reveal" data-par style="aspect-ratio:16/5;margin-bottom:clamp(2rem,5vh,3.5rem)">
    <img src="/assets/img/band-membership.webp" width="1600" height="620" loading="lazy" decoding="async"
         alt="Wide landscape at golden hour heading the membership tiers.">
  </div>
  <div class="tiers">{''.join(tier_block(t) for t in TIERS)}</div>
  <p class="form-note reveal" style="margin-top:2rem">Drop-in $34 &middot; First visit free &middot;
    Students and NHS/teacher rates at 30% &mdash; just ask.</p>
</div></section>

<section class="section"><div class="wrap">
  <div class="section__head reveal">
    <div><p class="eyebrow">Included everywhere</p><h2 class="display">What every<br>tier gets.</h2></div>
    <p class="lede">The floor is deliberately high. We would rather charge for guide time than
      ration the basics.</p>
  </div>
  <div class="grid grid--4">
    <article class="card reveal"><div class="card__body"><h3 class="display">Open practice</h3>
      <p>The room, the light, the equipment, and a guide on the floor from 05:30 to 20:00.</p></div></article>
    <article class="card reveal"><div class="card__body"><h3 class="display">Rhythm review</h3>
      <p>A quarterly sit-down where we look at what your day actually became, not what you planned.</p></div></article>
    <article class="card reveal"><div class="card__body"><h3 class="display">The library</h3>
      <p>Every sequence we teach, recorded plainly, for the mornings you cannot get here.</p></div></article>
    <article class="card reveal"><div class="card__body"><h3 class="display">No contract</h3>
      <p>Month to month. Cancel in your account in about four seconds. Freeze for up to three months.</p></div></article>
  </div>
</div></section>

<section class="section section--tint"><div class="wrap wrap--narrow">
  <div class="section__head section__head--center reveal">
    <div><p class="eyebrow eyebrow--plain">Questions</p><h2 class="display">Before you join.</h2></div>
  </div>
  <div class="reveal">{faq_block()}</div>
</div></section>

{P.cta()}"""
    return P.page("membership", f"Membership — {P.SITE}",
                  "Three MERIDIAN memberships: Sunrise, Full Day and Solstice. Month to month, "
                  "first visit free.", body)


def visit():
    rows = ""
    for key, phase, time, what, who, dur in SCHEDULE:
        rows += (f'<div class="row" data-hour="{key}"><span class="row__k">{time}</span>'
                 f'<span class="row__t">{what}<span>{phase} &middot; {who}</span></span>'
                 f'<span class="row__m">{dur}</span><span class="row__a">&mdash;</span></div>')

    body = P.phead("Visit", "Come in", "Matilija Street,<br>Ojai.",
                   "A converted citrus packing house two blocks off the arcade, with a west wall of "
                   "glass pointed straight at the Topatopas. Park behind the building; the front lot "
                   "belongs to the bakery and they will tell you so.")
    body += f"""<section class="section section--tight"><div class="wrap">
  <div class="hero__media reveal" data-par style="aspect-ratio:16/5;margin-bottom:clamp(2rem,5vh,3.5rem)">
    <img src="/assets/img/band-visit.webp" width="1600" height="620" loading="lazy" decoding="async"
         alt="Coastal hills and a footpath, heading the visit page.">
  </div>
  <div class="section__head" style="align-items:start;margin-bottom:clamp(1.5rem,3vw,2.5rem)">
    <div class="reveal">
      <p class="eyebrow">Today</p>
      <h2 class="display" style="font-size:clamp(1.7rem,3vw,2.4rem)">A typical weekday</h2>
      <p class="lede" style="margin-top:.9rem">Sessions repeat across the week; the arc is the same
        every day. Open practice runs in every gap.</p>
      <div class="rows" style="margin-top:1.5rem">{rows}</div>
    </div>

    <div class="reveal">
      <div class="panel" style="padding:0;overflow:hidden">
        <div style="position:relative;aspect-ratio:4/3.2;background:var(--paper-3)">
          <svg viewBox="0 0 400 320" style="width:100%;height:100%" role="img"
               aria-label="Stylised map of MERIDIAN on Matilija Street in Ojai, with the Topatopa mountains to the north.">
            <rect width="400" height="320" fill="#F5F0E7"/>
            <path d="M0 74 C 60 40, 110 58, 165 34 S 280 44, 340 22 L400 34 V0 H0 Z" fill="#E7DFD1"/>
            <path d="M0 74 C 60 40, 110 58, 165 34 S 280 44, 340 22 L400 34" fill="none" stroke="#C9BEA9" stroke-width="1.5"/>
            <text x="14" y="24" fill="#8C8377" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="1.6">TOPATOPA MTNS</text>
            <g stroke="#DED5C4" stroke-width="1.2" fill="none">
              <path d="M0 130H400M0 178H400M0 226H400M0 274H400"/>
              <path d="M64 96V320M148 96V320M232 96V320M316 96V320"/>
            </g>
            <path d="M0 178H400" stroke="#BDB3A0" stroke-width="3.5" fill="none"/>
            <text x="252" y="171" fill="#8C8377" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="1.4">MATILIJA ST</text>
            <path d="M148 96V320" stroke="#CFC5B2" stroke-width="2.4" fill="none"/>
            <text x="154" y="308" fill="#A79D8C" font-family="DM Sans, sans-serif" font-size="8.5" letter-spacing="1.2">N SIGNAL</text>
            <circle cx="196" cy="178" r="19" fill="#DFB55A" opacity="0.22"/>
            <circle cx="196" cy="178" r="6.5" fill="#5E7154"/>
          </svg>
          <div style="position:absolute;left:1rem;bottom:1rem;right:1rem;background:rgba(251,248,243,.94);backdrop-filter:blur(8px);border:1px solid var(--line);border-radius:var(--r);padding:.9rem 1.05rem">
            <h3 class="display" style="font-size:1.1rem;margin-bottom:.3rem">{P.SITE} &middot; Ojai</h3>
            <p style="font-size:.85rem;color:var(--ink-2);margin:0">{P.ADDRESS}<br>
              <a href="tel:{P.PHONE_TEL}" style="color:var(--sage-2)">{P.PHONE_HUMAN}</a> &middot;
              <a href="mailto:{P.EMAIL}" style="color:var(--sage-2)">{P.EMAIL}</a></p>
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top:clamp(1rem,2vw,1.5rem)" id="book">
        <h2 class="display" style="font-size:clamp(1.5rem,2.6vw,2rem)">Book a first visit</h2>
        <p style="color:var(--ink-3);font-size:.92rem;margin:.5rem 0 1.5rem">Ninety minutes with a
          guide, free, no card. Tell us roughly when your day starts and we will match you.</p>
        <form id="bookForm" novalidate>
          <div class="field-row">
            <div class="field"><label for="b-name">Name</label>
              <input id="b-name" name="name" type="text" autocomplete="name" placeholder="Alex Moreau" required></div>
            <div class="field"><label for="b-email">Email</label>
              <input id="b-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="b-phase">Which hour is worst right now?</label>
              <select id="b-phase" name="phase">
                <option>Deep — I don't sleep well</option>
                <option>Dawn — mornings are a write-off</option>
                <option>Meridian — I crash mid-afternoon</option>
                <option>Dusk — I can't switch off</option>
              </select></div>
            <div class="field"><label for="b-when">Preferred time</label>
              <select id="b-when" name="when">
                <option>Early (05:30–09:00)</option><option>Midday (11:00–14:00)</option>
                <option>Evening (16:30–20:00)</option><option>Weekend</option>
              </select></div>
          </div>
          <div class="field"><label for="b-note">Anything we should know</label>
            <textarea id="b-note" name="note" placeholder="Injuries, sleep history, what you've already tried."></textarea></div>
          <button class="btn btn--solid btn--block" type="submit">Request the visit</button>
          <p class="form-note">No card. No contract. This demo form sends nothing anywhere.</p>
          <p class="form-ok" id="bookOk" role="status" hidden></p>
        </form>
      </div>
    </div>
  </div>
</div></section>"""
    return P.page("visit", f"Visit — {P.SITE}",
                  "Find MERIDIAN at 412 Matilija Street, Ojai. Weekly schedule, directions, and a "
                  "free ninety-minute first visit.", body)


PAGES = {
    "index.html": home, "rhythm.html": rhythm, "practices.html": practices,
    "retreats.html": retreats, "guides.html": guides, "journal.html": journal,
    "membership.html": membership, "visit.html": visit,
}


def sitemap():
    """An eight-page site should tell crawlers what it has."""
    from datetime import date
    today = date.today().isoformat()
    urls = ""
    for filename in PAGES:
        slug = "" if filename == "index.html" else "/" + filename[:-5]
        priority = "1.0" if filename == "index.html" else "0.8"
        urls += (f"  <url><loc>{P.BASE_URL}{slug}</loc>"
                 f"<lastmod>{today}</lastmod><priority>{priority}</priority></url>\n")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{urls}</urlset>\n")


def robots():
    return f"User-agent: *\nAllow: /\n\nSitemap: {P.BASE_URL}/sitemap.xml\n"


def build():
    for filename, fn in PAGES.items():
        (ROOT / filename).write_text(fn())
        print(f"  {filename}")
    (ROOT / "sitemap.xml").write_text(sitemap())
    (ROOT / "robots.txt").write_text(robots())
    print("  sitemap.xml\n  robots.txt")
    print(f"{len(PAGES)} pages -> {ROOT}")


if __name__ == "__main__":
    build()
