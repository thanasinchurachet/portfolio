/* Paper-cut dioramas behind the two characters (hero = standing, section 2 = seated).
   - The hero card gets an SVG "tunnel" of stacked paper arches (light outside -> deep inside), a sky with sun and
     clouds, rolling hills and paper flowers. Colours come from the palette tokens (--mint, --green, --yellow, --coral …).
   - Section 2 gets the same tunnel with a warm sunset sky and low hills for the props (books, plant, coffee).
   - Every layer has a depth: scrolling and moving the mouse shift the layers by different amounts (parallax). */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", W = 580, H = 688;   // set per scene before building it
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function f1(n) { return Math.round(n * 10) / 10; }

  // an arch-shaped hole (semicircle on top of a rectangle) with a hand-cut wobbly edge
  function archHole(inset, top, seed) {
    var r = rnd(seed), cx = W / 2, rad = W / 2 - inset, cy = top + rad, pts = [], n = 90, i, a, w;
    var ph = r() * 6, k1 = 5 + Math.floor(r() * 4), k2 = 13 + Math.floor(r() * 6);
    for (i = 0; i <= n; i++) {                                   // left side up, arch over, right side down
      var t = i / n, x, y, nx, ny;
      if (t < .25) { y = H + 20 - (H + 20 - cy) * (t / .25); x = cx - rad; nx = -1; ny = 0; }
      else if (t < .75) { a = Math.PI + Math.PI * (t - .25) / .5; x = cx + Math.cos(a) * rad; y = cy + Math.sin(a) * rad; nx = Math.cos(a); ny = Math.sin(a); }
      else { y = cy + (H + 20 - cy) * ((t - .75) / .25); x = cx + rad; nx = 1; ny = 0; }
      w = 5 * Math.sin(t * k1 * 6.283 + ph) + 2.2 * Math.sin(t * k2 * 6.283 + ph * 2);
      pts.push(f1(x + nx * w) + " " + f1(y + ny * w));
    }
    return "M-20 -20H" + (W + 20) + "V" + (H + 20) + "H-20Z M" + pts.join(" L") + "Z";
  }
  // a hill: wavy top edge, filled to the bottom
  function hill(y, amp, waves, seed, x0, x1) {
    var r = rnd(seed), ph = r() * 6, pts = [], n = 60, i;
    x0 = x0 == null ? -20 : x0; x1 = x1 == null ? W + 20 : x1;
    for (i = 0; i <= n; i++) { var t = i / n, x = x0 + (x1 - x0) * t; pts.push(f1(x) + " " + f1(y - amp * Math.sin(t * waves * 3.1416 + ph) - amp * .35 * Math.sin(t * waves * 7.1 + ph * 3))); }
    return "M" + x0 + " " + (H + 30) + " L" + pts.join(" L") + " L" + x1 + " " + (H + 30) + "Z";
  }
  function cloud(g, x, y, s) {
    var c = el("g", { class: "dio-cloud", transform: "translate(" + x + " " + y + ") scale(" + s + ")" }, g);
    el("path", { d: "M-46 10 a18 18 0 0 1 14-26 a24 24 0 0 1 44-6 a20 20 0 0 1 34 12 a14 14 0 0 1 2 24 Z", fill: "#fffdf7" }, c);
    return c;
  }
  function flower(g, x, y, size, color, center, stem, seed) {
    var r = rnd(seed), f = el("g", { class: "dio-flower", style: "--d:" + (-r() * 4).toFixed(2) + "s;--a:" + (2 + r() * 3).toFixed(1) + "deg", transform: "translate(" + x + " " + y + ")" }, g);
    var sway = el("g", { class: "sway" }, f);
    if (stem) {
      el("path", { d: "M0 0 Q" + f1(r() * 8 - 4) + " " + f1(stem * .5) + " 0 " + stem, stroke: "var(--dio-stem)", "stroke-width": 3.2, fill: "none", "stroke-linecap": "round" }, sway);
      el("path", { d: "M0 " + f1(stem * .6) + " q12 -10 22 -4 q-10 10 -22 4Z", fill: "var(--dio-leaf)" }, sway);
    }
    var head = el("g", { class: "head" }, sway), n = 5 + Math.floor(r() * 2), i;
    for (i = 0; i < n; i++) el("ellipse", { cx: 0, cy: f1(-size * .62), rx: f1(size * .38), ry: f1(size * .6), fill: color, transform: "rotate(" + f1(i * 360 / n + r() * 8) + ")" }, head);
    el("circle", { cx: 0, cy: 0, r: f1(size * .34), fill: center }, head);
    el("circle", { cx: f1(-size * .08), cy: f1(-size * .1), r: f1(size * .1), fill: "rgba(255,255,255,.45)" }, head);
    return f;
  }
  function tuft(g, x, y, s, fill) {
    el("path", { d: "M" + x + " " + y + " l" + f1(-6 * s) + " " + f1(-22 * s) + " l" + f1(9 * s) + " " + f1(16 * s) + " l" + f1(3 * s) + " " + f1(-26 * s) + " l" + f1(5 * s) + " " + f1(25 * s) + " l" + f1(9 * s) + " " + f1(-17 * s) + " l" + f1(-4 * s) + " " + f1(24 * s) + "Z", fill: fill }, g);
  }

  function buildScene(card) {
    W = 580; H = 688;
    var svg = el("svg", { class: "dio", viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" });
    var L = function (depth, cls) { return el("g", { class: "dio-l " + (cls || ""), "data-depth": depth }, svg); };
    // sky
    var sky = L(0, "flat");
    el("rect", { x: -20, y: -20, width: W + 40, height: H + 40, fill: "var(--dio-sky)" }, sky);
    var sun = L(.15); el("circle", { cx: W / 2, cy: 250, r: 150, fill: "var(--dio-sun)" }, sun); el("circle", { cx: W / 2, cy: 250, r: 112, fill: "var(--dio-sun2)" }, sun);
    var clouds = L(.35, "clouds"); cloud(clouds, 120, 150, 1.05); cloud(clouds, 460, 110, .8); cloud(clouds, 430, 300, .62);
    // far hills inside the tunnel
    var far = L(.5); el("path", { d: hill(470, 26, 3, 7), fill: "var(--dio-h1)" }, far);
    var mid = L(.7); el("path", { d: hill(520, 30, 2.4, 11), fill: "var(--dio-h2)" }, mid);
    [[90, 500, 14, "#fff4d9", "var(--yellow)"], [500, 506, 13, "var(--coral)", "#fff4d9"], [460, 480, 10, "#fff4d9", "var(--coral)"]].forEach(function (p, i) { flower(mid, p[0], p[1], p[2], p[3], p[4], 30, 40 + i); });
    // the stacked paper arches (tunnel), deepest first so the lighter outer ones sit on top
    [[150, 132, "var(--dio-r4)", .95], [112, 102, "var(--dio-r3)", 1.15], [74, 72, "var(--dio-r2)", 1.35], [36, 42, "var(--dio-r1)", 1.55], [6, 14, "var(--dio-r0)", 1.75]].forEach(function (a, i) {
      var g = L(a[3], "ring"); el("path", { d: archHole(a[0], a[1], 101 + i * 17), fill: a[2], "fill-rule": "evenodd" }, g);
    });
    // foreground hills + flowers (the character stands on these)
    var fh1 = L(1.9); el("path", { d: hill(590, 22, 2.2, 23), fill: "var(--dio-f1)" }, fh1);
    tuft(fh1, 70, 584, 1, "var(--dio-leaf)"); tuft(fh1, 520, 588, .9, "var(--dio-leaf)");
    [[46, 560, 20, "var(--coral)", "#fff4d9", 44], [100, 572, 15, "#fff4d9", "var(--yellow)", 34], [496, 560, 19, "var(--yellow)", "var(--coral)", 42], [548, 574, 14, "#f6b7c9", "#fff4d9", 30]].forEach(function (p, i) { flower(fh1, p[0], p[1], p[2], p[3], p[4], p[5], 70 + i); });
    var fh2 = L(2.3); el("path", { d: hill(648, 16, 3, 31), fill: "var(--dio-f2)" }, fh2);
    [[18, 640, 16, "#fff4d9", "var(--coral)"], [150, 652, 12, "var(--coral)", "var(--yellow)"], [430, 650, 13, "#fff4d9", "var(--yellow)"], [566, 638, 17, "var(--coral)", "#fff4d9"]].forEach(function (p, i) { flower(fh2, p[0], p[1], p[2], p[3], p[4], 0, 90 + i); });
    // butterfly
    var bf = L(1.2, "bfly"), b = el("g", { class: "dio-bfly", transform: "translate(470 210)" }, bf);
    el("path", { class: "wl", d: "M0 0 C-22 -26 -36 -4 -18 8 C-30 18 -14 30 0 6Z", fill: "var(--coral)" }, b);
    el("path", { class: "wr", d: "M0 0 C22 -26 36 -4 18 8 C30 18 14 30 0 6Z", fill: "var(--yellow)" }, b);
    el("rect", { x: -2, y: -8, width: 4, height: 18, rx: 2, fill: "#3a2a20" }, b);
    return svg;
  }


  // section 2: the seated character in the arch-shaped card. A warm sunset inside the paper tunnel; low hills for the props.
  function buildSeated(card) {
    W = 600; H = 577;
    var svg = el("svg", { class: "dio", viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" });
    var L = function (depth, cls) { return el("g", { class: "dio-l " + (cls || ""), "data-depth": depth }, svg); };
    var sky = L(0, "flat"); el("rect", { x: -20, y: -20, width: W + 40, height: H + 40, fill: "var(--dio-dusk)" }, sky);
    var sun = L(.12); el("circle", { cx: W / 2, cy: 250, r: 158, fill: "var(--dio-sun)" }, sun); el("circle", { cx: W / 2, cy: 250, r: 120, fill: "var(--dio-sun2)" }, sun);
    var stars = L(.3, "clouds");
    [[150, 120, 9], [455, 96, 7], [500, 200, 5], [110, 230, 6], [300, 70, 5]].forEach(function (p) {
      var x = p[0], y = p[1], r = p[2];
      el("path", { d: "M" + x + " " + (y - r * 2) + " Q" + x + " " + y + " " + (x + r * 2) + " " + y + " Q" + x + " " + y + " " + x + " " + (y + r * 2) + " Q" + x + " " + y + " " + (x - r * 2) + " " + y + " Q" + x + " " + y + " " + x + " " + (y - r * 2) + "Z", fill: "#fffaf0" }, stars);
    });
    cloud(stars, 470, 300, .7);
    var far = L(.45); el("path", { d: hill(400, 24, 2.6, 13), fill: "var(--dio-h1)" }, far);
    var mid = L(.65); el("path", { d: hill(440, 26, 2.2, 17), fill: "var(--dio-h2)" }, mid);
    [[150, 120, "var(--dio-r4)", .9], [112, 92, "var(--dio-r3)", 1.1], [74, 62, "var(--dio-r2)", 1.3], [38, 34, "var(--dio-r1)", 1.5]].forEach(function (a, i) {
      var g = L(a[3], "ring"); el("path", { d: archHole(a[0], a[1], 211 + i * 13), fill: a[2], "fill-rule": "evenodd" }, g);
    });
    var fh1 = L(1.7); el("path", { d: hill(468, 18, 2, 41), fill: "var(--yellow)" }, fh1);
    tuft(fh1, 40, 468, .9, "var(--dio-leaf)"); tuft(fh1, 560, 470, .8, "var(--dio-leaf)");
    [[26, 446, 15, "var(--coral)", "#fff4d9", 30], [576, 448, 13, "#fff4d9", "var(--coral)", 26]].forEach(function (p, i) { flower(fh1, p[0], p[1], p[2], p[3], p[4], p[5], 120 + i); });
    var fh2 = L(2.1); el("path", { d: hill(528, 12, 3, 47), fill: "var(--coral)" }, fh2);
    return svg;
  }

  /* ---------- parallax: scroll + pointer ---------- */
  var scenes = [], px = 0, py = 0, tick = false;
  function update() {
    tick = false;
    scenes.forEach(function (s) {
      var r = s.card.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
      var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;          // -1 … 1 while the card passes the screen
      s.layers.forEach(function (l) { var d = l.d; l.el.style.transform = "translate(" + f1(-px * d * 7) + "px," + f1(p * d * 26 - py * d * 4) + "px)"; });
    });
  }
  function ask() { if (!tick) { tick = true; requestAnimationFrame(update); } }

  function initScene() {
    document.querySelectorAll(".stage-card.paper-avatar-card, .scene3d.paper-avatar-card").forEach(function (card) {
      if (card.querySelector(".dio")) return;
      var hero = !!card.closest(".art"), seated = card.classList.contains("scene3d"); if (!hero && !seated) return;
      var svg = hero ? buildScene(card) : buildSeated(card); card.insertBefore(svg, card.firstChild); card.classList.add("has-dio");
      var layers = Array.prototype.map.call(svg.querySelectorAll(".dio-l"), function (g) { return { el: g, d: +g.getAttribute("data-depth") }; });
      scenes.push({ card: card, layers: layers });
    });
    // phones: no scroll parallax (moving filtered SVG layers every frame made scrolling stutter); the scene stays still
    if (matchMedia("(pointer: coarse), (max-width: 800px)").matches) return;
    addEventListener("scroll", ask, { passive: true }); addEventListener("resize", ask);
    addEventListener("pointermove", function (e) { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; ask(); }, { passive: true });
    ask();
  }

  function start() { initScene(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
