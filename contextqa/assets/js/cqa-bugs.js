/* ==========================================================================
   ContextQA — the bug hunt.
   A fixed canvas behind every section. Small beetles crawl across the page;
   every few seconds a cyan reticle locks onto one, it bursts into sparks and
   fragments, and a check mark is left where it was. A faint scan band sweeps
   the viewport the whole time. It is the product story as ambient motion:
   bugs found, reproduced, closed.

   Cheap by design: a dozen glyphs, a few dozen particles at most, one
   requestAnimationFrame loop that pauses while the hero film covers the
   viewport or the tab is hidden, and nothing at all under reduced motion.
   Colours are read from the CSS tokens so the layer follows the theme.
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('bugs');
  if (!canvas || !canvas.getContext) return;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) { canvas.hidden = true; return; }

  var ctx = canvas.getContext('2d');
  var MOBILE = window.matchMedia('(max-width: 900px)').matches;
  var hero = document.querySelector('.hero');
  var tally = document.getElementById('bugTally');
  var TAU = Math.PI * 2;
  var COUNT = MOBILE ? 7 : 14;

  var W = 0, H = 0;
  var C = {};
  var bugs = [], sparks = [], rings = [], shards = [], checks = [];
  var respawn = [];
  var hunter = null;
  var nextHunt = 1.4;
  var kills = 0;
  var scan = { y: -0.25, speed: 0.07 };
  var last = 0, raf = 0, running = false, cleared = false;

  var rand = function (a, b) { return a + Math.random() * (b - a); };

  /* ---------- Colours from the theme tokens ------------------------------ */
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    var v = function (name, fallback) { var s = cs.getPropertyValue(name).trim(); return s || fallback; };
    C.bug = v('--magenta-rgb', '192, 132, 252');
    C.bug2 = v('--violet-rgb', '139, 92, 246');
    C.cyan = v('--cyan-rgb', '61, 220, 255');
    C.ok = v('--ok-rgb', '92, 242, 176');
    C.light = document.documentElement.getAttribute('data-theme') === 'light';
    C.bugAlpha = C.light ? 0.9 : 0.78;
  }
  document.addEventListener('cqa:theme', readColors);

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Population -------------------------------------------------- */
  function spawnBug(fromEdge) {
    var b = { s: rand(9, 15), v: rand(10, 26), a: rand(0, TAU), phase: rand(0, TAU), turn: rand(-0.4, 0.4), life: 0, state: 'crawl', tint: Math.random() < 0.35 };
    if (fromEdge) {
      var side = Math.floor(rand(0, 4));
      b.x = side === 0 ? -24 : side === 1 ? W + 24 : rand(0, W);
      b.y = side === 2 ? -24 : side === 3 ? H + 24 : rand(0, H);
      b.a = Math.atan2(H / 2 - b.y, W / 2 - b.x) + rand(-0.7, 0.7);
    } else {
      b.x = rand(0, W); b.y = rand(0, H);
    }
    bugs.push(b);
  }

  function pickTarget() {
    var pool = bugs.filter(function (b) {
      return b.state === 'crawl' && b.life > 0.9 && b.x > 40 && b.x < W - 40 && b.y > 90 && b.y < H - 40;
    });
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function kill(b) {
    b.state = 'dead';
    kills++;
    if (tally) tally.textContent = String(kills);
    rings.push({ x: b.x, y: b.y, r: 6, t: 0 });
    for (var i = 0; i < 12; i++) {
      var a = rand(0, TAU), sp = rand(70, 170);
      sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: rand(0.35, 0.65) });
    }
    for (var k = 0; k < 5; k++) {
      var a2 = rand(0, TAU);
      shards.push({ x: b.x, y: b.y, vx: Math.cos(a2) * rand(24, 64), vy: Math.sin(a2) * rand(24, 64), rot: rand(0, TAU), vr: rand(-6, 6), s: b.s * rand(0.25, 0.45), t: 0 });
    }
    checks.push({ x: b.x, y: b.y, t: 0 });
    respawn.push(rand(0.6, 1.6));
  }

  /* ---------- Simulation ---------------------------------------------------- */
  function step(dt) {
    bugs.forEach(function (b) {
      if (b.state === 'dead') return;
      b.life = Math.min(1, b.life + dt * 1.2);
      b.phase += dt * (b.state === 'locked' ? 24 : 12);
      if (b.state === 'crawl') {
        b.turn = Math.max(-0.9, Math.min(0.9, b.turn + rand(-1.2, 1.2) * dt));
        b.a += b.turn * dt;
        var m = 60;
        if (b.x < m || b.x > W - m || b.y < m || b.y > H - m) {
          var want = Math.atan2(H / 2 - b.y, W / 2 - b.x);
          var d = Math.atan2(Math.sin(want - b.a), Math.cos(want - b.a));
          b.a += d * dt * 1.6;
        }
        b.x += Math.cos(b.a) * b.v * dt;
        b.y += Math.sin(b.a) * b.v * dt;
      } else if (b.state === 'locked') {
        // Pinned by the reticle: it can only twitch.
        b.x += rand(-1, 1) * 20 * dt;
        b.y += rand(-1, 1) * 20 * dt;
      }
    });
    bugs = bugs.filter(function (b) { return b.state !== 'dead'; });

    for (var i = respawn.length - 1; i >= 0; i--) {
      respawn[i] -= dt;
      if (respawn[i] <= 0) { respawn.splice(i, 1); spawnBug(true); }
    }
    while (bugs.length + respawn.length < COUNT) spawnBug(true);

    if (!hunter) {
      nextHunt -= dt;
      if (nextHunt <= 0) {
        var t = pickTarget();
        if (t) { t.state = 'locked'; hunter = { b: t, t: 0, rot: rand(0, TAU) }; }
        else nextHunt = 0.5;
      }
    } else {
      hunter.t += dt;
      hunter.rot += dt * 3;
      if (hunter.t >= 0.8) { kill(hunter.b); hunter = null; nextHunt = rand(2.2, 3.8); }
    }

    rings.forEach(function (r) { r.t += dt; r.r += dt * 95; });
    rings = rings.filter(function (r) { return r.t < 0.55; });
    sparks.forEach(function (p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; });
    sparks = sparks.filter(function (p) { return p.t < p.life; });
    shards.forEach(function (s) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt; });
    shards = shards.filter(function (s) { return s.t < 0.6; });
    checks.forEach(function (c) { c.t += dt; });
    checks = checks.filter(function (c) { return c.t < 1.3; });

    scan.y += scan.speed * dt;
    if (scan.y > 1.25) scan.y = -0.25;
  }

  /* ---------- Drawing ------------------------------------------------------- */
  function drawBug(b) {
    var alpha = C.bugAlpha * b.life;
    var col = b.tint ? C.bug2 : C.bug;
    var s = b.s * (b.state === 'locked' ? 1 + 0.08 * Math.sin(b.phase) : 1);
    var wob = Math.sin(b.phase) * 0.6;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a);
    ctx.strokeStyle = 'rgba(' + col + ',' + alpha + ')';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = Math.max(1, s * 0.11);
    ctx.lineCap = 'round';
    // Three legs a side, alternating with the walk cycle.
    for (var i = -1; i <= 1; i++) {
      var lx = i * s * 0.32;
      var sway = wob * (i === 0 ? -1 : 1);
      ctx.beginPath(); ctx.moveTo(lx, -s * 0.22); ctx.lineTo(lx + sway * s * 0.18, -s * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx, s * 0.22); ctx.lineTo(lx - sway * s * 0.18, s * 0.6); ctx.stroke();
    }
    // Antennae
    ctx.beginPath();
    ctx.moveTo(s * 0.45, -s * 0.12); ctx.lineTo(s * 0.82, -s * 0.38);
    ctx.moveTo(s * 0.45, s * 0.12); ctx.lineTo(s * 0.82, s * 0.38);
    ctx.stroke();
    // Body and head
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.55, 0, s * 0.17, 0, TAU); ctx.fill();
    // Wing seam
    ctx.strokeStyle = 'rgba(' + (C.light ? '244, 246, 251' : '5, 7, 11') + ',' + (alpha * 0.7) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
    ctx.restore();
  }

  function drawReticle(x, y, r, rot, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(' + C.cyan + ',' + alpha + ')';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    for (var k = 0; k < 4; k++) {
      ctx.beginPath(); ctx.arc(0, 0, r, k * Math.PI / 2 + 0.28, (k + 1) * Math.PI / 2 - 0.28); ctx.stroke();
      var ang = k * Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(ang) * (r + 4), Math.sin(ang) * (r + 4)); ctx.lineTo(Math.cos(ang) * (r + 11), Math.sin(ang) * (r + 11)); ctx.stroke();
    }
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawCheck(x, y, r, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(' + C.ok + ',' + alpha + ')';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.1, r * 0.38); ctx.lineTo(r * 0.5, -r * 0.35); ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    var sy = scan.y * H;
    var g = ctx.createLinearGradient(0, sy - 100, 0, sy + 8);
    g.addColorStop(0, 'rgba(' + C.cyan + ',0)');
    g.addColorStop(0.86, 'rgba(' + C.cyan + ',' + (C.light ? 0.11 : 0.08) + ')');
    g.addColorStop(1, 'rgba(' + C.cyan + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, sy - 100, W, 108);

    bugs.forEach(drawBug);

    shards.forEach(function (s) {
      var a = 1 - s.t / 0.6;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.fillStyle = 'rgba(' + C.bug + ',' + (a * 0.85) + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, s.s, s.s * 0.6, 0, 0, TAU); ctx.fill();
      ctx.restore();
    });
    sparks.forEach(function (p) {
      var a = 1 - p.t / p.life;
      ctx.fillStyle = 'rgba(' + C.cyan + ',' + a + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + a * 1.5, 0, TAU); ctx.fill();
    });
    rings.forEach(function (r) {
      var a = 1 - r.t / 0.55;
      ctx.strokeStyle = 'rgba(' + C.cyan + ',' + (a * 0.9) + ')';
      ctx.lineWidth = 0.6 + 2 * a;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    });
    checks.forEach(function (c) {
      var scale = c.t < 0.25 ? 0.4 + (c.t / 0.25) * 0.6 : 1;
      var a = c.t < 0.9 ? 1 : Math.max(0, 1 - (c.t - 0.9) / 0.4);
      drawCheck(c.x, c.y, 11 * scale, a);
    });
    if (hunter) {
      var k = Math.min(1, hunter.t / 0.8);
      drawReticle(hunter.b.x, hunter.b.y, 48 - 32 * Math.min(1, k * 1.25), hunter.rot, 0.5 + 0.5 * k);
    }
  }

  /* ---------- Loop ---------------------------------------------------------- */
  function loop(now) {
    if (!running) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    // Nothing to see while the hero film still covers the viewport.
    if (hero && window.scrollY < hero.offsetHeight - H * 0.6) {
      if (!cleared) { ctx.clearRect(0, 0, W, H); cleared = true; }
      return;
    }
    cleared = false;
    step(dt);
    draw();
  }
  function setRunning(on) {
    running = on;
    if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }

  readColors();
  resize();
  for (var i = 0; i < COUNT; i++) spawnBug(false);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { setRunning(!document.hidden); });
  window.__cqaBugs = { stats: function () { return { bugs: bugs.length, kills: kills, hunting: !!hunter }; } };
  setRunning(!document.hidden);
})();
