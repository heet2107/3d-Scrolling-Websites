/* ==========================================================================
   Monga Brothers Ltd. — interaction layer
   GSAP + ScrollTrigger drive the scroll choreography; everything is applied
   *from* JS (gsap.from / classes added at runtime), so with JS or the CDN
   unavailable the page renders complete and static. All motion honours
   prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ chrome --- */

  function initChrome() {
    var head = $(".site-head");
    var totop = $(".totop");

    function onScroll() {
      var y = window.pageYOffset;
      if (head) head.classList.toggle("is-solid", y > 24);
      if (totop) totop.classList.toggle("is-on", y > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (totop) {
      totop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      });
    }

    // fallback progress bar when GSAP is absent
    if (!window.gsap) {
      var bar = $(".progress");
      if (bar) {
        window.addEventListener("scroll", function () {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = "scaleX(" + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0) + ")";
        }, { passive: true });
      }
    }
  }

  function initMenu() {
    var burger = $(".burger");
    var mnav = $("#mnav");
    if (!burger || !mnav) return;

    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mnav.classList.toggle("is-open", !open);
      document.documentElement.style.overflow = open ? "" : "hidden";
    });

    $$("a", mnav).forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        mnav.classList.remove("is-open");
        document.documentElement.style.overflow = "";
      });
    });
  }

  function markCurrent() {
    var here = location.pathname.split("/").pop() || "index.html";
    if (!/\.html$/.test(here)) here += ".html"; // Vercel cleanUrls serves /about
    $$(".nav > li > a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href === here) a.parentElement.classList.add("is-current");
    });
  }

  /* ------------------------------------------------------------- tilt ---- */

  function initTilt() {
    if (reduce) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    $$("[data-tilt]").forEach(function (card) {
      var max = parseFloat(card.getAttribute("data-tilt")) || 7;
      var raf = null;

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform =
            "perspective(950px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" +
            (px * max).toFixed(2) + "deg) translateZ(8px)";
        });
      });
      function reset() {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      }
      card.addEventListener("pointerleave", reset);
      card.addEventListener("blur", reset, true);
    });
  }

  /* --------------------------------------------------------- widgets ----- */

  function initAccordion() {
    $$(".accordion").forEach(function (acc) {
      var buttons = $$(".accordion__btn", acc);
      buttons.forEach(function (btn) {
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (!panel) return;
        if (btn.getAttribute("aria-expanded") === "true") panel.style.height = "auto";

        btn.addEventListener("click", function () {
          var open = btn.getAttribute("aria-expanded") === "true";
          buttons.forEach(function (other) {
            if (other === btn) return;
            var op = document.getElementById(other.getAttribute("aria-controls"));
            other.setAttribute("aria-expanded", "false");
            if (op) op.style.height = "0px";
          });
          btn.setAttribute("aria-expanded", String(!open));
          panel.style.height = open ? "0px" : panel.scrollHeight + "px";
        });
      });
    });
  }

  function initFilters() {
    $$("[data-filter-group]").forEach(function (group) {
      var buttons = $$("button", group);
      var items = $$(group.getAttribute("data-filter-group") + " [data-category]");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var want = btn.getAttribute("data-filter");
          buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
          items.forEach(function (item) {
            var cats = (item.getAttribute("data-category") || "").split(" ");
            item.hidden = want !== "all" && cats.indexOf(want) === -1;
          });
        });
      });
    });
  }

  function initForms() {
    $$("form[data-mock-submit]").forEach(function (form) {
      var status = $(".form__status", form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        if (status) {
          status.hidden = false;
          status.textContent =
            "Thank you — your enquiry has been recorded. Our team replies within one " +
            "working day. For urgent requirements call +91 70 8748 0555.";
        }
        form.reset();
      });
    });
  }

  function initMarquees() {
    $$(".marquee, .prodstrip").forEach(function (m) {
      var track = m.firstElementChild;
      if (!track) return;
      var clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      m.appendChild(clone);
    });
  }

  /* ------------------------------------------------- GSAP choreography --- */

  function initScrollFX() {
    var railwraps = $$(".railwrap");
    var hasGsap = window.gsap && window.ScrollTrigger && !reduce;

    if (!hasGsap) {
      // static fallbacks: everything already visible, rails scroll natively
      railwraps.forEach(function (w) { w.classList.add("is-static"); });
      $$(".statement").forEach(function (st) {
        $$(".w", st).forEach(function (w) { w.classList.add("lit"); });
      });
      initCountersFallback();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* progress bar */
    var bar = $(".progress");
    if (bar) {
      gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
      });
      gsap.set(bar, { scaleX: 0 });
    }

    /* hero entrance + scrub */
    var hero = $(".hero");
    if (hero) {
      var lines = $$(".hero h1 .line > span", hero);
      var intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (lines.length) {
        intro.from(lines, { yPercent: 110, duration: 1.05, stagger: 0.12 });
      }
      intro.from($$(".hero__eyebrow, .hero__lede, .hero__actions", hero),
        { y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, "-=0.55");
      var stats = $$(".hero__stat", hero);
      if (stats.length) {
        intro.from(stats, { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.08 }, "-=0.4");
      }

      var media = $(".hero__media", hero);
      if (media) {
        gsap.to(media, {
          yPercent: 18, scale: 1.08, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
        });
      }
      gsap.to($(".hero__inner", hero), {
        yPercent: -8, autoAlpha: 0.25, ease: "none",
        scrollTrigger: { trigger: hero, start: "60% 60%", end: "bottom top", scrub: true }
      });
    }

    /* generic reveals — explicit set() + to() rather than from(): end values
       are fixed constants, so nothing depends on the computed state at boot
       and a ScrollTrigger refresh can never re-capture a hidden state. */
    $$("[data-anim]").forEach(function (el) {
      var kind = el.getAttribute("data-anim") || "up";
      var start = { autoAlpha: 0, x: 0, y: 0 };
      if (kind === "left") start.x = -56;
      else if (kind === "right") start.x = 56;
      else if (kind === "zoom") start.scale = 0.94;
      else start.y = 48;
      gsap.set(el, start);
      gsap.to(el, {
        autoAlpha: 1, x: 0, y: 0, scale: 1,
        duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        onComplete: function () { gsap.set(el, { clearProps: "transform" }); }
      });
    });

    /* stagger groups */
    $$("[data-anim-group]").forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children);
      if (!kids.length) return;
      gsap.set(kids, { autoAlpha: 0, y: 44 });
      gsap.to(kids, {
        autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out",
        stagger: { each: 0.06, from: "start" },
        scrollTrigger: { trigger: group, start: "top 88%" },
        onComplete: function () { gsap.set(kids, { clearProps: "transform" }); }
      });
    });

    /* parallax media */
    $$("[data-plx]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-plx")) || 12;
      gsap.fromTo(el, { yPercent: -amt / 2 }, {
        yPercent: amt / 2, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* pinned horizontal rail (desktop only) */
    railwraps.forEach(function (wrap) {
      var rail = $(".rail", wrap);
      if (!rail) return;

      ScrollTrigger.matchMedia({
        "(min-width: 961px)": function () {
          // The rail starts at the centered shell's left offset, so it must
          // travel that far extra — and stop with the last card aligned to the
          // shell's right edge, not the viewport's.
          var getDist = function () {
            var shellLeft = rail.parentElement.offsetLeft;
            return Math.max(0, rail.scrollWidth + 2 * shellLeft - wrap.clientWidth);
          };
          gsap.to(rail, {
            x: function () { return -getDist(); },
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "center center",
              end: function () { return "+=" + (getDist() + 200); },
              pin: true,
              scrub: 0.5,
              invalidateOnRefresh: true
            }
          });
        },
        "(max-width: 960px)": function () {
          wrap.classList.add("is-static");
        }
      });
    });

    /* statement word scrub */
    $$(".statement").forEach(function (st) {
      var words = $$(".w", st);
      if (!words.length) return;
      ScrollTrigger.create({
        trigger: st,
        start: "top 78%",
        end: "bottom 45%",
        scrub: 0.4,
        onUpdate: function (self) {
          var lit = Math.round(self.progress * words.length);
          words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
        }
      });
    });

    /* sticky stack: card settles + dims slightly as the next one covers it */
    $$(".stack__item").forEach(function (card, i, all) {
      if (i === all.length - 1) return;
      gsap.to(card, {
        scale: 0.94, autoAlpha: 0.55, ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top " + (72 + 12) + "px",
          end: "bottom top",
          scrub: true
        }
      });
    });

    /* counters */
    $$("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var obj = { v: 0 };
      var node = document.createTextNode("0");
      el.insertBefore(node, el.firstChild);
      gsap.to(obj, {
        v: target, duration: 1.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 95%" },
        onUpdate: function () { node.nodeValue = String(Math.round(obj.v)); }
      });
    });
  }

  function initCountersFallback() {
    $$("[data-count]").forEach(function (el) {
      el.insertBefore(
        document.createTextNode(el.getAttribute("data-count")), el.firstChild);
    });
  }

  /* -------------------------------------------- statement word wrapping -- */

  function splitStatements() {
    $$(".statement").forEach(function (st) {
      var frag = document.createDocumentFragment();
      Array.prototype.slice.call(st.childNodes).forEach(function (node) {
        var em = node.nodeType === 1 && node.tagName === "EM";
        var text = node.textContent;
        text.split(/\s+/).forEach(function (word) {
          if (!word) return;
          var span = document.createElement("span");
          span.className = "w" + (em ? " em" : "");
          span.textContent = word;
          frag.appendChild(span);
          frag.appendChild(document.createTextNode(" "));
        });
      });
      st.textContent = "";
      st.appendChild(frag);
    });
  }

  /* ------------------------------------------------------------- boot ---- */

  function boot() {
    splitStatements();
    initChrome();
    initMenu();
    markCurrent();
    initTilt();
    initAccordion();
    initFilters();
    initForms();
    initMarquees();
    initScrollFX();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
