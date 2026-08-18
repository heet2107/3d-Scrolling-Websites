/* ==========================================================================
   Monga Brothers Ltd. — interaction layer
   Vanilla ES2019, no dependencies. Every behaviour degrades to a plain,
   readable page if JS is off, and all motion is disabled when the visitor
   asks for reduced motion.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---------------------------------------------------------------- nav --- */

  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#primary-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    // On touch layouts the first tap on a parent item opens its submenu
    // instead of following the link.
    $$(".nav > li > a[data-submenu]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (!matchMedia("(max-width: 980px)").matches) return;
        var li = link.parentElement;
        if (!li.classList.contains("is-open")) {
          e.preventDefault();
          $$(".nav > li.is-open").forEach(function (other) {
            if (other !== li) other.classList.remove("is-open");
          });
          li.classList.add("is-open");
        }
      });
    });

    // Close the drawer when the layout grows back to desktop.
    window.addEventListener("resize", function () {
      if (!matchMedia("(max-width: 980px)").matches) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        $$(".nav > li.is-open").forEach(function (li) { li.classList.remove("is-open"); });
      }
    });
  }

  /* --------------------------------------------------- scroll reveal ------ */

  // Elements still waiting to be revealed, swept on every scroll frame.
  var pending = [];

  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion.matches) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    items.forEach(function (el, i) {
      // Stagger siblings that share a parent so grids cascade in.
      var stagger = el.hasAttribute("data-reveal-delay")
        ? parseInt(el.getAttribute("data-reveal-delay"), 10)
        : (i % 4) * 90;
      el.style.setProperty("--reveal-delay", stagger + "ms");
    });

    pending = items;
    sweepReveal();

    // Safety net: media loading in (videos especially) can reflow the page
    // without firing a scroll event, leaving something above the fold that the
    // last sweep never saw. A slow idle tick guarantees it still appears.
    var tick = setInterval(function () {
      sweepReveal();
      if (!pending.length) clearInterval(tick);
    }, 700);
  }

  // A geometry sweep rather than an IntersectionObserver: an observer only
  // fires when a threshold is *crossed*, so an element that travels from below
  // the fold to above it inside a single frame — a flick scroll, a jump to an
  // anchor, an automated screenshot pass — never gets its callback and would
  // stay stuck at opacity 0. Checking positions each frame cannot miss one.
  function sweepReveal() {
    if (!pending.length) return;

    // At the very bottom of the document there is no scrolling left to do, so
    // anything still below the trigger line could never reach it. Release the
    // remainder rather than leaving the last rows of the page invisible.
    var atBottom =
      window.innerHeight + window.pageYOffset >=
      document.documentElement.scrollHeight - 2;

    var trigger = window.innerHeight * 0.92;
    var still = [];

    for (var i = 0; i < pending.length; i++) {
      var el = pending[i];
      if (atBottom || el.getBoundingClientRect().top < trigger) {
        el.classList.add("is-in");
      } else {
        still.push(el);
      }
    }
    pending = still;
  }

  /* ------------------------------------------------------- parallax ------- */

  function initParallax() {
    var layers = $$("[data-parallax]");
    var progress = $(".progress");
    var navbar = $(".navbar");
    var totop = $(".totop");
    // No early return: this handler also drives the reveal sweep.

    var ticking = false;

    function frame() {
      ticking = false;
      var y = window.pageYOffset;

      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      }

      if (navbar) navbar.classList.toggle("is-stuck", y > 12);
      if (totop) totop.classList.toggle("is-on", y > 500);

      if (!reduceMotion.matches) {
        layers.forEach(function (layer) {
          var rect = layer.getBoundingClientRect();
          if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
          var speed = parseFloat(layer.getAttribute("data-parallax")) || 0.15;
          // Offset relative to the layer's own position in the viewport,
          // so each band drifts independently of page length.
          var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
          layer.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
        });
      }
    }

    function onScroll() {
      // Reveal synchronously against the position that actually triggered this
      // event. Deferring it to the rAF frame reads geometry that may already be
      // one scroll behind, which loses whatever passed the fold in between.
      sweepReveal();

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Images settling in can push content past the fold without any scrolling.
    window.addEventListener("load", sweepReveal);
    frame();
  }

  /* ------------------------------------------------------ 3D tilt --------- */

  function initTilt() {
    if (reduceMotion.matches) return;
    // Pointer tilt is a fine-pointer affordance; skip it on touch devices
    // where it would fight with scrolling.
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    $$("[data-tilt]").forEach(function (card) {
      var max = parseFloat(card.getAttribute("data-tilt")) || 8;
      var raf = null;

      function apply(e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform =
            "perspective(1000px) rotateX(" + (-py * max).toFixed(2) + "deg) rotateY(" +
            (px * max).toFixed(2) + "deg) translateZ(6px)";
        });
      }

      function reset() {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      }

      card.addEventListener("pointermove", apply);
      card.addEventListener("pointerleave", reset);
      card.addEventListener("blur", reset, true);
    });
  }

  /* ------------------------------------------------------ counters -------- */

  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (reduceMotion.matches) {
        el.firstChild.nodeValue = String(target);
        return;
      }
      var start = performance.now();
      var dur = 1600;
      (function step(now) {
        var t = Math.min((now - start) / dur, 1);
        // ease-out cubic
        var eased = 1 - Math.pow(1 - t, 3);
        el.firstChild.nodeValue = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    nums.forEach(function (el) {
      el.insertBefore(document.createTextNode("0"), el.firstChild);
      io.observe(el);
    });
  }

  /* ------------------------------------------------------ accordion ------- */

  function initAccordion() {
    $$(".accordion").forEach(function (acc) {
      var buttons = $$(".accordion__btn", acc);

      buttons.forEach(function (btn) {
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (!panel) return;

        if (btn.getAttribute("aria-expanded") === "true") {
          panel.style.height = "auto";
        }

        btn.addEventListener("click", function () {
          var open = btn.getAttribute("aria-expanded") === "true";

          // single-open accordion
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

  /* ---------------------------------------------------------- tabs -------- */

  function initTabs() {
    $$("[data-tabs]").forEach(function (group) {
      var buttons = $$("[role='tab']", group);

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          buttons.forEach(function (other) {
            var panel = document.getElementById(other.getAttribute("aria-controls"));
            var on = other === btn;
            other.setAttribute("aria-selected", String(on));
            if (panel) panel.hidden = !on;
          });
        });
      });
    });
  }

  /* -------------------------------------------------------- filters ------- */

  function initFilters() {
    $$("[data-filter-group]").forEach(function (group) {
      var buttons = $$("button", group);
      var targetSel = group.getAttribute("data-filter-group");
      var items = $$(targetSel + " [data-category]");

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var want = btn.getAttribute("data-filter");
          buttons.forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
          items.forEach(function (item) {
            var cats = (item.getAttribute("data-category") || "").split(" ");
            item.hidden = want !== "all" && cats.indexOf(want) === -1;
          });
        });
      });
    });
  }

  /* ------------------------------------------------------- rotator -------- */

  function initRotator() {
    $$("[data-rotate]").forEach(function (el) {
      var words = (el.getAttribute("data-rotate") || "").split("|");
      if (words.length < 2) return;
      var i = 0;
      el.textContent = words[0];
      if (reduceMotion.matches) return;

      setInterval(function () {
        i = (i + 1) % words.length;
        el.style.transition = "opacity .3s ease, transform .3s ease";
        el.style.opacity = "0";
        el.style.transform = "translateY(-8px)";
        setTimeout(function () {
          el.textContent = words[i];
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, 320);
      }, 3200);
    });
  }

  /* ---------------------------------------------------------- forms ------- */

  function initForms() {
    $$("form[data-mock-submit]").forEach(function (form) {
      var status = $(".form__status", form);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        if (status) {
          status.hidden = false;
          status.textContent =
            "Thank you — your enquiry has been recorded. Our team replies within one working day. " +
            "For urgent requirements call +91 70 8748 0555.";
        }
        form.reset();
      });
    });
  }

  /* ----------------------------------------------------- ticker fill ------ */

  function initTicker() {
    // Duplicate the track so the marquee loops without a visible gap.
    $$(".ticker").forEach(function (ticker) {
      var track = $(".ticker__track", ticker);
      if (!track) return;
      var clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      ticker.appendChild(clone);
    });
  }

  /* ------------------------------------------------------- back to top ---- */

  function initToTop() {
    var btn = $(".totop");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    });
  }

  /* --------------------------------------------------------- current ------ */

  function markCurrent() {
    var here = location.pathname.split("/").pop() || "index.html";
    $$(".nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href && href === here) {
        var top = a.closest(".nav > li");
        if (top) top.classList.add("is-current");
      }
    });
  }

  /* ------------------------------------------------------------ boot ------ */

  function boot() {
    initNav();
    initReveal();
    initParallax();
    initTilt();
    initCounters();
    initAccordion();
    initTabs();
    initFilters();
    initRotator();
    initForms();
    initTicker();
    initToTop();
    markCurrent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
