// Act V, typeset.
//
// This act is a DOCUMENT, not a stage. Everything a recruiter came for is in
// the markup this file writes, which is why it runs before anything that could
// throw: if WebGL is missing, or the plate fails to compile, what is left
// behind is still the whole résumé in the right reading order.
//
// The heading order is load-bearing. index.html supplies the h2 and the two
// h3s; a company and a credential are h4s under them, so the outline a screen
// reader walks is Record > Experience > ContextQA and never skips a level.

import { ME, EXPERIENCE, CREDENTIALS } from '../data/content.js';

const no = (i) => String(i + 1).padStart(2, '0');

export function typeset() {
  stats();
  rail();
  deck();
}

/** The three counters. They are written at their FINAL value, so a browser
 *  that never runs the count-up still shows the truth. */
function stats() {
  const list = document.getElementById('recordStats');
  if (!list) return;
  list.innerHTML = ME.stats.map((s, i) => `
    <li class="stat" style="--i:${i}">
      <span class="stat__n" data-n="${s.n}">${s.n}</span>
      <span class="stat__l">${s.label}</span>
    </li>`).join('');
}

function rail() {
  const ol = document.getElementById('expRail');
  if (!ol) return;
  ol.innerHTML = EXPERIENCE.map((job, i) => `
    <li class="xp">
      <p class="xp__no" aria-hidden="true">${no(i)}</p>
      <h4 class="xp__co">${job.company}</h4>
      <p class="xp__role">${job.role}</p>
      <p class="xp__meta">
        <span class="xp__when">${job.when}</span>
        <span class="xp__type">${job.type}</span>
        <span class="xp__where">${job.where}</span>
      </p>
      <ul class="xp__points">${job.points.map((p, j) =>
        `<li style="--i:${j}">${p}</li>`).join('')}</ul>
      <ul class="xp__stack" aria-label="Stack at ${job.company}">${
        job.stack.map((s) => `<li>${s}</li>`).join('')}</ul>
    </li>`).join('');
}

function deck() {
  const ul = document.getElementById('credDeck');
  if (!ul) return;
  // the badge doubles as the card's variant: Certified, Degree and Bootcamp
  // are three different KINDS of thing, and five identical panels would say
  // they were the same one five times
  ul.innerHTML = CREDENTIALS.map((c, i) => `
    <li class="cred cred--${c.badge.toLowerCase()}" style="--i:${i}">
      <p class="cred__badge">${c.badge}</p>
      <h4 class="cred__title">${c.title}</h4>
      <p class="cred__issuer">${c.issuer}</p>
      <p class="cred__body">${c.body}</p>
      <span class="cred__no" aria-hidden="true">${no(i)}</span>
    </li>`).join('');
}
