# Monga Brothers Ltd. — website

A static, dependency-free marketing site for **Monga Brothers Ltd.**, an ISO 9001:2015
manufacturer of forged and machined components for the defense and railway industries
(B-16, Phase-2, Focal Point, Ludhiana-141010, Punjab, India).

Content is drawn from the company's existing site and its own factory and product
photography; the cinematic background clips were generated for this build.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home — hero, expertise, about, process rail, projects, service areas, testimonials, FAQ |
| `about.html` | Company overview, journey, quality assurance, promise |
| `solutions.html` | The three core solution lines |
| `defense.html` | Defense manufacturing service area |
| `railway.html` | Railway components service area |
| `manufacturing.html` | The four production units and plant gallery |
| `industries.html` | Service areas, sectors served and supply coverage |
| `products.html` | Filterable component gallery and material range |
| `contact.html` | Enquiry form and contact details |

## Motion and 3D

All effects are hand-written CSS and vanilla JS — no animation library:

- **Scroll reveal** — a per-frame geometry sweep (not an IntersectionObserver, which
  can miss elements that cross the fold inside a single frame during a fast scroll).
- **Parallax** — hero, banner and section backgrounds drift at independent rates.
- **3D tilt** — pointer-tracked `rotateX/rotateY` on expertise cards and product tiles,
  with child elements pushed forward on the Z axis. Fine-pointer devices only.
- **3D flip cards** — service-area cards rotate on `rotateY` to reveal their detail face.
- **3D dropdowns** — nav submenus flip down from their top edge.
- **Counters, marquee ticker, accordion, tabs, product filters, scroll progress rail.**

Everything is disabled under `prefers-reduced-motion: reduce`.

## Responsive

One breakpoint system: 1080px, 980px (nav collapses to a drawer, split bands stack)
and 700px (single-column grids). Layout uses fluid `clamp()` type and CSS grid
throughout; media is `object-fit` cover so nothing distorts on a phone.

## Editing content

Pages are generated so the header, footer, nav and CTA band are written once:

```bash
python3 build/build.py     # rewrites the nine HTML files in the repo root
```

- `build/partials.py` — logo, navigation, contact details, footer, icon set.
- `build/build.py` — the content of each page.

The generated HTML is committed, so the site can also be edited directly and served
as-is; just avoid re-running the build afterwards, or your edits will be overwritten.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

Configured for Vercel as a static site (`vercel.json` sets clean URLs and cache
headers). No build step or framework is required.

## Notes

- The contact form is a front-end demonstration only — wire it to a mail handler or
  CRM endpoint before going live.
- Social links in the footer are placeholders.
