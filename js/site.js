/* Thanasin portfolio - merged from render.js + paper.js + works.js + chat.js (cleanup 2026-11-09). Data stays in data/content.js and data/chat.js. */

/* ===== render.js ===== */
;/* Builds the project cards, the journey timeline and the contact buttons from data/content.js.
   Runs synchronously BEFORE js/paper.js, so the scissor-cut edges, reveal animations and tilt pick the new elements up like normal ones. */
(function () {
  "use strict";
  var C = window.CONTENT; if (!C) { console.warn("data/content.js not loaded"); return; }
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, cls, text, attrs) {
    var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  var ARROW = function () { return el("span", null, "→", { "aria-hidden": "true" }); };
  var ICON = {
    facebook: '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 21v-7.6h2.6l.45-3.1H13.6V8.4c0-.9.3-1.5 1.6-1.5h1.5V4.2c-.3 0-1.2-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4v2.3H7.9v3.1h2.6V21z" fill="currentColor"/></svg>',
    instagram: '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16.9" cy="7.2" r="1.15" fill="currentColor"/></svg>',
    link: '<svg class="ci" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  // ---- works cards ----
  var works = $(".works"), paged = !!(works && works.hasAttribute("data-paged")), per = paged ? Math.max(1, (C.settings && C.settings.perPage) || 6) : 0, pages = [];
  if (works && C.projects) {
    var ROT = [-1.6, 1.2, -0.8];
    C.projects.forEach(function (p, i) {
      var c = p.card || {};
      var a = el("a", "work pc lift rv", null, { href: "projects.html", "data-p": String(i), "aria-haspopup": "dialog", "aria-label": c.label || p.title });
      a.style.cssText = "--r:" + ROT[i % ROT.length] + "deg;--d:" + (0.05 + 0.07 * i).toFixed(2) + "s";
      if (p.fx) a.setAttribute("data-fx", p.fx);
      var pin = el("div", "pc-in", null, { "data-cut": "3", "data-seed": String(51 + i) }); pin.style.setProperty("--c", c.color || "#bfeadd");
      pin.appendChild(el("span", "wtop", null, { "aria-hidden": "true" }));
      pin.appendChild(el("span", "num", ("0" + (i + 1)).slice(-2)));
      pin.appendChild(el("span", "ctx", c.ctx || ""));
      pin.appendChild(el("h3", null, c.title || p.title));
      pin.appendChild(el("p", null, c.text || p.desc));
      pin.appendChild(el("div", "stack", null, { "data-tools": "" }));
      pin.appendChild(el("span", "open-hint", c.hint || (p.demo ? "ดูเดโม ▶" : "ดูรายละเอียด ▶")));
      a.appendChild(pin);
      var host = works;
      if (per) {                                                       // projects.html: cards are grouped into pages; only one page is visible
        var pi = Math.floor(i / per);
        if (!pages[pi]) { pages[pi] = el("div", "works-page", null, { "data-page": String(pi + 1) }); works.appendChild(pages[pi]); }
        host = pages[pi];
      }
      host.appendChild(a);
    });
    var cnt = $("#proj-count"); if (cnt) cnt.textContent = "· ทั้งหมด " + C.projects.length + " ผลงาน";
  }

  // ---- pagination (projects.html) ----
  var pager = $("#pager");
  if (per && pager && pages.length) {
    var cur = 1, qs = /[?&]page=(\d+)/.exec(location.search); if (qs) cur = Math.min(pages.length, Math.max(1, +qs[1]));
    var btns = [];
    var mk = function (label, aria, fn, seed) {
      var b = el("button", "pg pc", null, { type: "button", "aria-label": aria }); b.appendChild(el("span", "pc-in", label, { "data-cut": "2", "data-seed": String(seed) }));
      b.addEventListener("click", fn); pager.appendChild(b); return b;
    };
    var prev = mk("‹", "หน้าก่อนหน้า", function () { go(cur - 1, true); }, 70);
    for (var n = 1; n <= pages.length; n++) (function (n) { btns[n] = mk(String(n), "ไปหน้า " + n, function () { go(n, true); }, 70 + n); })(n);
    var next = mk("›", "หน้าถัดไป", function () { go(cur + 1, true); }, 99);
    var go = function (n, scroll) {
      if (n < 1 || n > pages.length) return; cur = n;
      pages.forEach(function (p, i) { p.hidden = i + 1 !== n; });
      btns.forEach(function (b, i) { if (b) { if (i === n) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); } });
      prev.disabled = n === 1; next.disabled = n === pages.length;
      try { history.replaceState(null, "", n === 1 ? location.pathname + location.hash : "?page=" + n + location.hash); } catch (e) { }
      if (scroll) works.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    pager.hidden = pages.length < 2; go(cur, false);
  }

  // ---- journey ----
  var path = $("#journey .path");
  if (path && C.journey) {
    var idx = {}; (C.projects || []).forEach(function (p, i) { idx[p.id] = i; });
    C.journey.forEach(function (j, i) {
      var stop = el("div", "stop rv"), pc = el("div", "pc"), pin = el("div", "pc-in stitch", null, { "data-cut": "3", "data-seed": String(81 + i) });
      pin.appendChild(el("div", "when", j.when));
      pin.appendChild(el("h3", null, j.title));
      if (j.gpa) {
        var g = el("div", "gpa"); g.appendChild(el("b", null, j.gpa.value));
        var sp = el("span"); (j.gpa.label || []).forEach(function (t, k) { if (k) sp.appendChild(document.createElement("br")); sp.appendChild(document.createTextNode(t)); });
        g.appendChild(sp); pin.appendChild(g);
      }
      if (j.text) pin.appendChild(el("p", null, j.text));
      if (j.link && idx[j.link.project] != null) {
        var n = idx[j.link.project], l = el("a", "jlink", j.link.text + " ", { href: "#project-" + (n + 1), "data-open": String(n) }); l.appendChild(ARROW()); pin.appendChild(l);
      }
      pc.appendChild(pin); stop.appendChild(pc);
      var st = el("span", "stamp", (j.stamp && j.stamp.text) || ""); if (j.stamp && j.stamp.color) st.style.background = j.stamp.color;
      stop.appendChild(st); path.appendChild(stop);
    });
  }

  // ---- contact ----
  var ct = C.contact, mail = $("#contact .mail .in");
  if (ct && mail) {
    var set = function (sel, v) { var e = mail.querySelector(sel); if (e && v != null) e.textContent = v; };
    set(".eyebrow", ct.eyebrow); set("h2", ct.title); set("p", ct.text);
    var row = mail.querySelector(".row:not(.social)"), soc = mail.querySelector(".row.social");
    if (row) {
      row.textContent = "";
      if (ct.email) {
        var m = el("a", "btn pc", null, { href: "mailto:" + ct.email }); m.appendChild(el("span", "pc-in", "✉ " + ct.email, { "data-cut": "2", "data-seed": "96" })); row.appendChild(m);
      }
      if (ct.phone) {
        var t = el("a", "btn alt pc", null, { href: "tel:" + ct.phone.href });
        var ts = el("span", "pc-in", "☎ " + ct.phone.text, { "data-cut": "2", "data-seed": "97" });
        ts.style.cssText = "background-color:#fff4d9;border:0;color:#264a3c;box-shadow:inset 0 0 0 2px #33634f"; t.appendChild(ts); row.appendChild(t);
      }
    }
    if (soc) {
      soc.textContent = "";
      (ct.social || []).forEach(function (s, i) {
        var type = ICON[s.type] ? s.type : "link";
        var a = el("a", "btn pc " + (type === "facebook" ? "fb" : type === "instagram" ? "ig" : "other"), null, { href: s.url, target: "_blank", rel: "noopener" });
        var sp = el("span", "pc-in", null, { "data-cut": "2", "data-seed": String(98 + i) });
        sp.innerHTML = ICON[type]; sp.appendChild(document.createTextNode(s.label || s.type)); a.appendChild(sp); soc.appendChild(a);
      });
      if (!(ct.social || []).length) soc.remove();
    }
  }
})();

/* ===== paper.js ===== */
;/* Paper-cut home: scissor-cut edges, falling letter tiles, mouse-following head, moods, theme, reveal. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ---------- loading screen: waits for fonts + page + the 3D hero (max 9 s), then plays the intro ---------- */
  function loader() {
    var el = $("#loader"), fill = $("#ld-fill"), root = document.documentElement;
    if (!el) { root.classList.remove("loading"); root.classList.add("ready"); return; }
    // the page is shown only when BOTH paper characters (standing + seated) are decoded and drawn (or failed), so they never pop in late
    var chars = function () { var a = window.__paperAvatars || {}, ok = function (k) { return a[k] && (a[k].status === "ready" || a[k].status === "failed"); }; return ok("standing") && ok("seated"); };
    var st = { fonts: 0, load: document.readyState === "complete" ? 1 : 0, model: chars() ? 1 : 0 }, done = false, shown = 5;
    function target() { return 15 + st.fonts * 25 + st.load * 25 + st.model * 35; }
    function finish() {
      if (done) return; done = true; clearInterval(tick); fill.style.width = "100%";
      setTimeout(function () { el.classList.add("out"); root.classList.remove("loading"); root.classList.add("ready"); setTimeout(function () { el.remove(); }, 900); }, 280);
    }
    function check() { if (st.fonts && st.load && st.model) finish(); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { st.fonts = 1; check(); }); else st.fonts = 1;
    if (!st.load) addEventListener("load", function () { st.load = 1; check(); });
    if (!st.model) { var poll = setInterval(function () { if (chars()) { st.model = 1; clearInterval(poll); check(); } }, 100); setTimeout(function () { clearInterval(poll); }, 15000); }
    var tick = setInterval(function () { shown += (Math.min(target(), 96) - shown) * 0.12 + 0.15; fill.style.width = shown.toFixed(1) + "%"; }, 90);
    setTimeout(finish, 14000);                                          // never keep the visitor waiting (slow connections)
    check();
  }


  /* ---------- tool logos: a floating name appears on hover / keyboard focus (kept inside the hanging tag) ---------- */
  function tips() {
    $$(".lg").forEach(function (li) {
      li.tabIndex = 0;
      var place = function () {
        var tip = $("span", li), card = li.closest(".tag"); if (!tip || !card) return;
        li.style.setProperty("--dx", "0px");
        var cr = card.getBoundingClientRect(), tr = tip.getBoundingClientRect(), dx = 0;
        if (tr.left < cr.left + 8) dx = cr.left + 8 - tr.left; else if (tr.right > cr.right - 8) dx = cr.right - 8 - tr.right;
        li.style.setProperty("--dx", dx + "px");
      };
      li.addEventListener("pointerenter", place); li.addEventListener("focus", place);
    });
  }


  /* ---------- hanging tags: a small pendulum each. Idle = gentle sway, hover = calms down and stops, drag = fling it
     and it keeps swinging with the speed you let go with ---------- */
  function swing() {
    var tags = $$(".hang"); if (!tags.length) return;
    var K = 10, W0 = Math.sqrt(K), C0 = 0.9, AMP = reduce ? 0.016 : 0.028, items = [];
    tags.forEach(function (h, i) {
      var sw = document.createElement("div"); sw.className = "swing";
      while (h.firstChild) sw.appendChild(h.firstChild);
      h.appendChild(sw);
      var s = { h: h, sw: sw, th: 0, w: 0, ph: i * 1.37, hover: false, lock: false, drag: false, off: 0, lastTh: 0, lastT: 0, pivot: null };
      s.th = (Math.random() - 0.5) * 0.04;
      var ang = function (e) { var r = h.getBoundingClientRect(); return Math.atan2(-(e.clientX - (r.left + r.width / 2)), e.clientY - (r.top - 40)); };
      h.addEventListener("pointerenter", function (e) { if (e.pointerType !== "touch") s.hover = true; });
      h.addEventListener("pointerleave", function () { s.hover = false; if (!s.drag) s.lock = false; });
      h.addEventListener("pointerdown", function (e) {
        if (e.button > 0) return;
        s.drag = true; s.lock = true; s.off = s.th - ang(e); s.lastTh = s.th; s.lastT = performance.now(); s.w = 0;
        try { h.setPointerCapture(e.pointerId); } catch (x) {}
        h.classList.add("grabbing"); e.preventDefault();
      });
      h.addEventListener("pointermove", function (e) {
        if (!s.drag) return;
        var th = Math.max(-1.3, Math.min(1.3, ang(e) + s.off)), now = performance.now(), dt = Math.max((now - s.lastT) / 1000, 0.001);
        s.w = s.w * 0.6 + ((th - s.lastTh) / dt) * 0.4;                       // smoothed angular speed of your hand
        s.th = th; s.lastTh = th; s.lastT = now;
      });
      var up = function (e) {
        if (!s.drag) return; s.drag = false; h.classList.remove("grabbing");
        if (performance.now() - s.lastT > 90) s.w = 0;                          // you stopped before letting go
        s.w = Math.max(-6, Math.min(6, s.w));
        try { h.releasePointerCapture(e.pointerId); } catch (x) {}
      };
      h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up);
      h.addEventListener("dragstart", function (e) { e.preventDefault(); });
      items.push(s);
    });
    var visible = false, last = 0, t = 0;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe($(".tags"));
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) { last = now; return; }
      var dt = Math.min((now - (last || now)) / 1000, 0.05); last = now; t += dt;
      items.forEach(function (s) {
        if (s.drag) { s.sw.style.transform = "rotate(" + s.th.toFixed(4) + "rad)"; return; }
        var calm = s.hover && !s.lock, c = calm ? 6.4 : C0, drive = calm ? 0 : AMP * C0 * W0 * Math.sin(t * W0 + s.ph);
        for (var k = 0; k < 2; k++) {                                          // two sub-steps for stability
          var a = -K * Math.sin(s.th) - c * s.w + drive; s.w += a * dt / 2; s.th += s.w * dt / 2;
        }
        if (s.th > 1.3) { s.th = 1.3; s.w *= -0.35; } else if (s.th < -1.3) { s.th = -1.3; s.w *= -0.35; }
        s.sw.style.transform = "rotate(" + s.th.toFixed(4) + "rad)";
      });
    }
    requestAnimationFrame(frame);
  }

  /* ---------- seeded random ---------- */
  function rng(seed) { var s = (seed * 2654435761) >>> 0; return function () { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 3266489917) >>> 0; return s / 4294967296; }; }

  /* ---------- scissor-cut edges: clip-path polygon with hand-cut jitter ---------- */
  function cut(el) {
    var w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    var amp = +el.dataset.cut || 3, edges = el.dataset.edge || "tblr", seed = +el.dataset.seed || 1, r = rng(seed);
    var wave = (el.dataset.wave || "").split(",").map(Number), wa = wave[0] || 0, wp = wave[1] || 400;
    var step = Math.max(16, Math.min(46, w / 26)), pts = [];
    var jit = function (on) { return on ? r() * amp + (r() < 0.06 ? amp * 1.6 : 0) : 0; };
    var T = edges.indexOf("t") > -1, B = edges.indexOf("b") > -1, L = edges.indexOf("l") > -1, R = edges.indexOf("r") > -1;
    var nx = Math.max(2, Math.round(w / step)), ny = Math.max(2, Math.round(h / step)), i, x, y;
    for (i = 0; i <= nx; i++) {
      x = i / nx * w; y = jit(T);
      if (T && wa) y += (Math.sin(x / wp * Math.PI * 2 + seed) * 0.5 + 0.5) * wa + (Math.sin(x / (wp * 0.37) + seed * 2) * 0.5 + 0.5) * wa * 0.25;
      pts.push([x, y]);
    }
    for (i = 1; i <= ny; i++) pts.push([w - jit(R), i / ny * h]);
    for (i = nx - 1; i >= 0; i--) pts.push([i / nx * w, h - jit(B)]);
    for (i = ny - 1; i > 0; i--) pts.push([jit(L), i / ny * h]);
    el.style.clipPath = "polygon(" + pts.map(function (p) { return p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px"; }).join(",") + ")";
  }
  function initCuts() {
    var els = $$("[data-cut]");
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function (es) { es.forEach(function (e) { cut(e.target); }); });
      els.forEach(function (e) { ro.observe(e); });
    } else { els.forEach(cut); addEventListener("resize", function () { els.forEach(cut); }); }
  }

  /* ---------- title: cut-paper letter tiles ---------- */
  function letters() {
    var h = $("[data-letters]"); if (!h) return;
    var cols = ["#fff4d9", "#f5d37a", "#88d9c5", "#e77d79", "#fff4d9", "#88d9c5", "#f5d37a", "#e77d79"], rot = [-5, 3, -2, 5, -4, 2, -6, 4];
    h.textContent = "";
    "THANASIN".split("").forEach(function (c, i) {
      var s = document.createElement("span"); s.className = "letter pc";
      s.style.setProperty("--r", rot[i] + "deg"); s.style.setProperty("--i", i); s.setAttribute("aria-hidden", "true");
      var p = document.createElement("span"); p.className = "pc-in"; p.textContent = c; p.style.backgroundColor = cols[i];
      p.dataset.cut = 3; p.dataset.seed = i + 3;
      if (cols[i] === "#e77d79") p.style.color = "#fff";
      s.appendChild(p); h.appendChild(s);
    });
  }

  /* ---------- theme / menu ---------- */
  function chrome() {
    var root = document.documentElement, sw = $("#theme");
    function sync() {
      sw.setAttribute("aria-checked", String(root.dataset.theme === "dark"));
      var m = $('meta[name="theme-color"]'); if (m) m.content = root.dataset.theme === "dark" ? "#16231d" : "#33634f";
    }
    sync();
    sw.addEventListener("click", function () {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
      sync(); bits(sw, 14);
    });
    var b = $("#burger"), l = $("#links");
    // the nav's cut-paper edge is a clip-path, which would hide the dropdown below it: lift the clip while the menu is open
    var nav = b.closest(".nav");
    function setMenu(o) { l.classList.toggle("open", o); if (nav) nav.classList.toggle("menu-open", o); b.setAttribute("aria-expanded", String(o)); b.setAttribute("aria-label", o ? "ปิดเมนู" : "เปิดเมนู"); }
    b.addEventListener("click", function () { setMenu(!l.classList.contains("open")); });
    $$("a", l).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && l.classList.contains("open")) { setMenu(false); b.focus(); } });
    // slimmer nav while scrolling down, full size again when scrolling up (or near the top)
    if (nav) {
      var lastY = scrollY, compact = false, changedAt = 0;
      var setCompact = function (c) {
        if (c === compact) return; compact = c; changedAt = performance.now(); nav.classList.toggle("compact", c);
        root.style.setProperty("--nav-h", c ? "48px" : "64px");          // the chat string hangs from the nav edge (css/chat.css)
      };
      addEventListener("scroll", function () {
        var y = scrollY;
        if (y < 90) { lastY = y; setCompact(false); return; }               // near the top: always full size
        var d = y - lastY;
        if (Math.abs(d) < 24) return;                                        // needs a real scroll (24px) in one direction, not a jitter
        lastY = y;
        if (l.classList.contains("open") || performance.now() - changedAt < 350) return;   // let the size change finish first
        setCompact(d > 0);
      }, { passive: true });
    }
    document.addEventListener("click", function (e) { if (l.classList.contains("open") && nav && !nav.contains(e.target)) setMenu(false); });
    var map = { top: 0, about: 1, skills: 2, works: 3, contact: 4 }, links = $$("a", l);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id] != null) links.forEach(function (a, i) { if (i === map[e.target.id]) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "about", "skills", "works", "contact"].forEach(function (id) { var e = document.getElementById(id); if (e) io.observe(e); });
  }

  /* ---------- paper confetti ---------- */
  function bits(el, n) {                                                   // click confetti: the visitor asked for it, so it also plays with reduced motion
    var r = el.getBoundingClientRect(), cols = ["#e77d79", "#f5d37a", "#88d9c5", "#33634f", "#fff4d9"];
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i"), s = 8 + Math.random() * 10;
      p.style.cssText = "position:fixed;z-index:300;pointer-events:none;left:" + (r.left + r.width / 2) + "px;top:" + (r.top + r.height / 2) + "px;width:" + s + "px;height:" + s * (0.5 + Math.random() * 0.5) + "px;background:" + cols[i % 5] + ";clip-path:polygon(0 10%,100% 0,90% 100%,8% 90%);filter:drop-shadow(0 2px 1px rgba(0,0,0,.3))";
      document.body.appendChild(p);
      var a = Math.random() * 6.283, d = 60 + Math.random() * 120;
      p.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: "translate(" + Math.cos(a) * d + "px," + (Math.sin(a) * d + 90) + "px) rotate(" + Math.random() * 700 + "deg)", opacity: 0 }],
        { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = (function (q) { return function () { q.remove(); }; })(p);
    }
  }

  /* ---------- the character head: follows the pointer by swapping the poses from the character sheet ---------- */
  var POSES = ["left", "center", "right", "up", "down"];
  var MOODS = [["neutral", "ปกติ"], ["happy", "ดีใจ"], ["thinking", "คิด"], ["surprised", "ตกใจ"], ["focused", "โฟกัส"], ["excited", "ตื่นเต้น"]];
  var heads = [], mood = "neutral", lastMove = 0, mouse = { x: innerWidth / 2, y: innerHeight / 3 }, tmr, nextWander = 0;

  function mkHead(root) {
    var imgs = {};
    function add(n) { var i = new Image(); i.src = "assets/ref/" + n + ".webp"; i.alt = ""; i.decoding = "async"; i.draggable = false; root.appendChild(i); return i; }
    POSES.forEach(function (p) { imgs[p] = add("h_" + p); });
    MOODS.slice(1).forEach(function (m) { imgs[m[0]] = add("e_" + m[0]); });
    var hd = { root: root, imgs: imgs, shown: "", c: { x: 0, y: 0 } };
    root.addEventListener("pointerdown", function () {
      var pool = ["surprised", "happy", "excited"].filter(function (m) { return m !== mood; });
      setMood(pool[Math.floor(Math.random() * pool.length)], 1500); bits(root, 10);
    });
    heads.push(hd); return hd;
  }
  function show(hd, k) {
    if (hd.shown === k) return;
    if (hd.shown) hd.imgs[hd.shown].classList.remove("on");
    hd.imgs[k].classList.add("on"); hd.shown = k;
  }
  function setMood(m, ms) {
    clearTimeout(tmr); mood = m;
    window.dispatchEvent(new CustomEvent("charmood", { detail: m }));
    $$(".mood").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.m === m)); });
    if (ms) tmr = setTimeout(function () { setMood("neutral"); }, ms);
  }
  function update() {
    var now = performance.now();
    if (now - lastMove > 4000 && !reduce && now > nextWander) { // idle: look around by itself
      nextWander = now + 1200 + Math.random() * 1800;
      mouse = { x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.8 };
    }
    heads.forEach(function (hd) {
      var r = hd.root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var dx = Math.max(-1, Math.min(1, (mouse.x - (r.left + r.width / 2)) / (innerWidth * 0.32)));
      var dy = Math.max(-1, Math.min(1, (mouse.y - (r.top + r.height / 2)) / (innerHeight * 0.32)));
      var k;
      if (mood !== "neutral") k = mood;
      else if (Math.abs(dx) > 0.42 && Math.abs(dx) >= Math.abs(dy) * 0.8) k = dx < 0 ? "left" : "right";
      else if (dy < -0.5) k = "up"; else if (dy > 0.55) k = "down"; else k = "center";
      show(hd, k);
      hd.c.x += (dx - hd.c.x) * 0.12; hd.c.y += (dy - hd.c.y) * 0.12;
      var tilt = (k === "center" || mood !== "neutral") ? hd.c.x * 2.4 : 0;
      hd.root.style.setProperty("--hx", (hd.c.x * r.width * 0.03).toFixed(2) + "px");
      hd.root.style.setProperty("--hy", (hd.c.y * r.width * 0.02).toFixed(2) + "px");
      hd.root.style.setProperty("--hr", tilt.toFixed(2) + "deg");
    });
  }
  function tick() { update(); requestAnimationFrame(tick); }
  function initHeads() {
    if (!$("[data-head]") && !$(".moods")) return;
    var hs = $$("[data-head]").map(mkHead), box = $(".moods");
    if (box) MOODS.forEach(function (m) {
      var b = document.createElement("button"); b.className = "mood pc"; b.dataset.m = m[0]; b.type = "button";
      b.setAttribute("aria-pressed", String(m[0] === "neutral"));
      b.innerHTML = '<span class="pc-in" data-cut="1.6" data-seed="' + (m[0].length + 4) + '">' + m[1] + "</span>";
      b.addEventListener("click", function () { setMood(m[0]); if (m[0] === "excited" || m[0] === "happy") bits(b, 8); });
      box.appendChild(b);
    });
    addEventListener("pointermove", function (e) { mouse = { x: e.clientX, y: e.clientY }; lastMove = performance.now(); update(); }, { passive: true });
    hs.forEach(function (h) { show(h, "center"); });
    requestAnimationFrame(tick);
  }

  /* ---------- hero card tilt + floating shapes parallax ---------- */
  function parallax() {
    if (reduce) return;
    var art = $(".art-card"), shapes = $$("[data-depth]");
    addEventListener("pointermove", function (e) {
      var x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      if (art) art.style.transform = "rotate(" + (2.2 + x * 2.5) + "deg) translate(" + (x * -10) + "px," + (y * -8) + "px)";
      shapes.forEach(function (s) { var d = +s.dataset.depth; s.style.marginLeft = x * d + "px"; s.style.marginTop = y * d + "px"; });
    }, { passive: true });
  }

  /* ---------- reveal on scroll ---------- */
  function reveal() {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach(function (el, i) { el.style.setProperty("--rr", (i % 2 ? 2.2 : -2.2) + "deg"); io.observe(el); });
  }

  window.addEventListener("charbits", function (e) { bits(e.detail, 12); });

  document.addEventListener("DOMContentLoaded", function () {
    loader(); letters(); chrome(); initHeads(); initCuts(); parallax(); reveal(); tips(); swing();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { $$("[data-cut]").forEach(cut); });   // re-cut once the real fonts changed the sizes
    var cue = $(".scroll-cue");
    if (cue) addEventListener("scroll", function () { cue.classList.toggle("gone", scrollY > 80); }, { passive: true });
  });
})();

/* ===== works.js ===== */
;/* Works: tool icons on the project cards + a medium modal that embeds the project's demo in an iframe
   (plus a button to open the demo in a new tab). */
(function () {
  "use strict";
  var IC = function (slug) { return "https://cdn.simpleicons.org/" + slug; };
  var SVG = {
    ml: '<svg viewBox="0 0 24 24" fill="none" stroke="#33634f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="12" r="2.4"/><circle cx="19" cy="7" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 7l3 3.5M7 17l3-3.5M14.3 11l3-3M14.3 13l3 3"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="#33634f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4M10 4h4"/><circle cx="9.5" cy="13" r="1.2" fill="#33634f"/><circle cx="14.5" cy="13" r="1.2" fill="#33634f"/><path d="M9.5 16.5h5"/></svg>',
    rest: '<b class="glyph">{ }</b>'
  };
  // ---- the data lives in data/content.js (window.CONTENT.projects) ----
  var PROJECTS = (window.CONTENT && window.CONTENT.projects) || [];

  // ---- paper-cut trash sprites (rendered in Blender: blender/build_trash.py -> assets/trash/*.png) ----
  // inner = lying in the card (clipped by the paper edge), outer = peeking from behind the card; on hover everything jumps outwards.
  // s: css position, w: width px, r: resting rotation, h: [dx, dy, rotation] on hover, d: delay
  var TRASH = {
    inner: [
      { n: "bag",     w: 54, r: -8,  s: { right: 188, top: 42 }, h: [-12, -4, -18], d: .22 },
      { n: "paper",   w: 48, r: -14, s: { right: 150, top: 6 },  h: [-8, 6, -30],   d: 0 },
      { n: "can",     w: 38, r: -10, s: { right: 104, top: 8 },  h: [2, -6, 12],    d: .04 },
      { n: "glass",   w: 32, r: 14,  s: { right: 60,  top: 10 }, h: [6, -4, 26],     d: .08 },
      { n: "bottle",  w: 34, r: 18,  s: { right: 108, top: 52 }, h: [-8, 6, -20],   d: .12 },
      { n: "carton",  w: 36, r: 8,   s: { right: 64,  top: 58 }, h: [6, 6, 20],     d: .16 },
      { n: "banana",  w: 38, r: -22, s: { right: 12,  top: 12 }, h: [8, 8, -34],    d: .2 },
      { n: "battery", w: 28, r: 16,  s: { right: 20,  top: 56 }, h: [6, 4, 30],     d: .26 }
    ],
    outer: []
  };
  function sprite(it) {
    var s = document.createElement("span"); s.className = "tr";
    s.style.width = it.w + "px"; s.style.setProperty("--r", it.r + "deg");
    s.style.setProperty("--hx", it.h[0] + "px"); s.style.setProperty("--hy", it.h[1] + "px"); s.style.setProperty("--hr", (it.r + it.h[2]) + "deg"); s.style.setProperty("--d", it.d + "s");
    for (var k in it.s) s.style[k] = it.s[k] + "px";
    var im = new Image(); im.src = "assets/trash/" + it.n + ".png?v=1"; im.alt = ""; im.decoding = "async"; im.loading = "lazy"; im.draggable = false; s.appendChild(im);
    return s;
  }
  function addTrash(card) {
    var inner = document.createElement("span"); inner.className = "tr-layer"; inner.setAttribute("aria-hidden", "true");
    TRASH.inner.forEach(function (it) { inner.appendChild(sprite(it)); });
    var pin = card.querySelector(".pc-in"); if (pin) pin.insertBefore(inner, pin.firstChild);
    var outer = document.createElement("span"); outer.className = "tr-outer"; outer.setAttribute("aria-hidden", "true");
    TRASH.outer.forEach(function (it) { outer.appendChild(sprite(it)); });
    card.insertBefore(outer, card.firstChild);
  }


  // ---- 3D tilt cards: the card follows the cursor in 3D, with a soft glare that tracks the pointer ----
  function tilt(card) {
    var glare = document.createElement("span"); glare.className = "glare"; glare.setAttribute("aria-hidden", "true");
    var pin = card.querySelector(".pc-in"); if (pin) pin.appendChild(glare);
    card.addEventListener("pointerenter", function (e) { if (e.pointerType === "touch") return; card.classList.add("tilting"); });
    card.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return; card.classList.add("tilting");
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", ((x - 0.5) * 30).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 26).toFixed(2) + "deg");
      card.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); card.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--px", ((x - 0.5) * 2).toFixed(3)); card.style.setProperty("--py", ((y - 0.5) * 2).toFixed(3));
    });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("tilting");
      ["--rx", "--ry", "--px", "--py"].forEach(function (k) { card.style.removeProperty(k); });
    });
  }

  function chip(t, big) {
    var s = document.createElement("span"); s.className = "tool" + (big ? " big" : "");
    var i = document.createElement("i");
    if (t.slug) { var im = new Image(); im.src = IC(t.slug); im.alt = ""; im.width = big ? 22 : 16; im.height = big ? 22 : 16; im.loading = "lazy"; i.appendChild(im); } else i.innerHTML = SVG[t.svg];
    s.appendChild(i); s.appendChild(document.createTextNode(t.label)); return s;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cards = document.querySelectorAll(".work[data-p]"), dlg = document.getElementById("proj");
    cards.forEach(function (c) {
      var p = PROJECTS[+c.dataset.p], box = c.querySelector("[data-tools]"); if (!p || !box) return;
      box.textContent = ""; p.tools.forEach(function (t) { box.appendChild(chip(t)); });
    });
    document.querySelectorAll('.work[data-fx="trash"]').forEach(addTrash);
    cards.forEach(tilt);
    document.querySelectorAll(".stop > .pc").forEach(tilt);                                          // journey cards tilt too
    if (!dlg || typeof dlg.showModal !== "function") return;            // old browser: the cards just link to projects.html

    var $ = function (id) { return document.getElementById(id); }, frame = $("pd-iframe"), load = $("pd-load"), opener = null;

    // ---- picture viewer: its own modal <dialog>, so it stacks above the project popup (a plain overlay would sit behind it)
    var lb = document.createElement("dialog"); lb.className = "pm-lb"; lb.setAttribute("aria-label", "ดูภาพ");
    lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="pm-lb-x" aria-label="ปิดภาพ">✕</button>' +
      '<button type="button" class="pm-lb-nav prev" aria-label="ภาพก่อนหน้า">‹</button><button type="button" class="pm-lb-nav next" aria-label="ภาพถัดไป">›</button>';
    document.body.appendChild(lb);
    var lbList = [], lbAt = 0;
    function lbShow(k) {
      lbAt = (k + lbList.length) % lbList.length; var g = lbList[lbAt];
      lb.querySelector("img").src = g.src; lb.querySelector("img").alt = g.cap || "";
      lb.querySelector("figcaption").textContent = (lbList.length > 1 ? (lbAt + 1) + " / " + lbList.length + "   " : "") + (g.cap || "");
      lb.classList.toggle("tall", !!g.tall); lb.classList.toggle("single", lbList.length < 2);
    }
    function lbOpen(list, k) { lbList = list; lbShow(k); var v = dlg.querySelector(".pd-more video"); if (v) v.pause(); if (!lb.open) lb.showModal(); }
    lb.querySelector(".pm-lb-x").onclick = function () { lb.close(); };
    lb.querySelector(".prev").onclick = function () { lbShow(lbAt - 1); };
    lb.querySelector(".next").onclick = function () { lbShow(lbAt + 1); };
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    // one Esc must close only the picture, not the project popup underneath (Chrome may group the two dialogs)
    var lbClosedAt = 0; lb.addEventListener("close", function () { lbClosedAt = Date.now(); });
    dlg.addEventListener("cancel", function (e) { if (lb.open || Date.now() - lbClosedAt < 400) { e.preventDefault(); if (lb.open) lb.close(); } });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") lbShow(lbAt - 1); else if (e.key === "ArrowRight") lbShow(lbAt + 1); });

    var ICO = {   // line icons for the section titles
      sum: '<svg viewBox="0 0 24 24"><path d="M4 5h16M4 10h16M4 15h10M4 20h7"/></svg>',
      steps: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.5 6h4a3 3 0 0 1 3 3v.5M8.5 18h4a3 3 0 0 0 3-3v-.5"/></svg>',
      feats: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
      tools: '<svg viewBox="0 0 24 24"><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M9.5 6.5L6 3 3 6l3.5 3.5"/></svg>',
      clip: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg>',
      pics: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
      role: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
    };
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function sec(icon, title) { var s = el("section", "pm-sec"), h = el("h3"); h.innerHTML = ICO[icon]; h.appendChild(document.createTextNode(title)); s.appendChild(h); return s; }

    function buildMore(p) {
      var m = p.more || {}, gal = m.gallery || [], vid = p.video && p.video.src ? p.video : null;
      var box = el("div", "pd-more"), tog = el("button", "pm-tog"), body = el("div", "pm-body");
      tog.type = "button"; tog.setAttribute("aria-expanded", "false"); body.id = "pm-body"; tog.setAttribute("aria-controls", "pm-body"); body.hidden = true;
      // the strip: up to 3 little thumbnails + title + what is inside
      var th = el("span", "pm-thumbs"); th.setAttribute("aria-hidden", "true");
      var pics = (vid && vid.poster ? [vid.poster] : []).concat(gal.map(function (g) { return g.src; })).slice(0, 3);
      if (!pics.length) th.innerHTML = ICO.sum;
      pics.forEach(function (src) { var im = new Image(); im.src = src; im.alt = ""; im.loading = "lazy"; th.appendChild(im); });
      var tx = el("span", "pm-label"); tx.appendChild(el("b", null, "รายละเอียดโปรเจค"));
      var badges = el("span", "pm-badges"), bits = [];
      if (m.steps && m.steps.length) bits.push("ทำงานอย่างไร");
      if (vid) bits.push("คลิปของจริง");
      if (gal.length) bits.push(gal.length + " ภาพ");
      if (!bits.length) bits.push("ฟีเจอร์และเครื่องมือ");
      bits.forEach(function (b) { badges.appendChild(el("em", null, b)); });
      tx.appendChild(badges); tog.appendChild(th); tog.appendChild(tx);
      var arrow = el("i", "pm-arrow"); arrow.setAttribute("aria-hidden", "true"); arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>'; tog.appendChild(arrow);
      var hint = el("span", "pm-hint", "กดเพื่ออ่าน"); tog.appendChild(hint);

      // body: text column + media column
      var colT = el("div", "pm-col pm-text"), colM = el("div", "pm-col pm-media");
      if (m.summary || p.desc) { var s1 = sec("sum", "ภาพรวม"); s1.appendChild(el("div", "pm-lead", m.summary || p.desc)); if (m.role) { var r = el("div", "pm-role"); r.innerHTML = ICO.role; r.appendChild(el("span", null, m.role)); s1.appendChild(r); } colT.appendChild(s1); }
      if (m.steps && m.steps.length) { var s2 = sec("steps", "ทำงานอย่างไร"), ol = el("ol", "pm-steps"); m.steps.forEach(function (t) { ol.appendChild(el("li", null, t)); }); s2.appendChild(ol); colT.appendChild(s2); }
      if (p.feats && p.feats.length) { var s3 = sec("feats", "ฟีเจอร์หลัก"), ul = el("ul", "pm-feats"); p.feats.forEach(function (t) { ul.appendChild(el("li", null, t)); }); s3.appendChild(ul); colT.appendChild(s3); }
      if (p.tools && p.tools.length) { var s4 = sec("tools", "เครื่องมือที่ใช้"), tl = el("div", "pm-tools"); p.tools.forEach(function (t) { tl.appendChild(chip(t)); }); s4.appendChild(tl); colT.appendChild(s4); }
      var video = null;
      if (vid) {
        var s5 = sec("clip", vid.label || "คลิปของจริง"), vw = el("div", "pm-clip");
        video = document.createElement("video"); video.setAttribute("playsinline", ""); video.muted = true; video.controls = true; video.preload = "none";
        video.src = vid.src; if (vid.poster) video.poster = vid.poster;
        vw.appendChild(video); var vc = el("div", "pm-cap"); if (vid.note) vc.appendChild(el("b", null, vid.note)); vc.appendChild(el("span", null, vid.caption || "")); vw.appendChild(vc);
        s5.appendChild(vw); colM.appendChild(s5);
      }
      if (gal.length) {
        var s6 = sec("pics", "ภาพหน้าจอ"), grid = el("div", "pm-gal" + (gal.length === 1 ? " one" : gal.length % 2 ? " odd" : ""));
        gal.forEach(function (g, k) {
          var b = el("button", "pm-shot" + (g.tall ? " tall" : "")); b.type = "button"; b.setAttribute("aria-label", "ขยายภาพ: " + (g.cap || "ภาพที่ " + (k + 1)));
          var im = new Image(); im.src = g.src; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; b.appendChild(im);
          if (g.cap) b.appendChild(el("span", "pm-shot-cap", g.cap));
          b.onclick = function () { lbOpen(gal, k); }; grid.appendChild(b);
        });
        s6.appendChild(grid); colM.appendChild(s6);
      }
      if (m.note) colM.appendChild(el("div", "pm-note", m.note));
      body.appendChild(colT); if (colM.childNodes.length) body.appendChild(colM); else body.classList.add("solo");
      box.appendChild(tog); box.appendChild(body);

      tog.onclick = function () {
        var open = body.hidden; body.hidden = !open; tog.setAttribute("aria-expanded", String(open));
        box.classList.toggle("open", open); dlg.classList.toggle("reading", open);
        hint.textContent = open ? (p.demo ? "กลับไปดูเดโม" : "ย่อ") : "กดเพื่ออ่าน";
        if (open) body.scrollTop = 0; else if (video) video.pause();
      };
      return box;
    }
    function open(i, from) {
      var p = PROJECTS[i]; opener = from;
      $("pd-ctx").textContent = p.ctx; $("pd-title").textContent = p.title; $("pd-desc").textContent = p.desc;
      var tl = $("pd-tools"); tl.textContent = ""; p.tools.forEach(function (t) { tl.appendChild(chip(t, true)); });
      var fl = $("pd-feats"); fl.textContent = ""; p.feats.forEach(function (f) { var li = document.createElement("li"); li.textContent = f; fl.appendChild(li); });
      // fold-out "project details" strip between the header and the demo (every project gets one)
      var oldM = dlg.querySelector(".pd-more"); if (oldM) oldM.remove();
      dlg.classList.remove("reading");
      dlg.querySelector(".pd-head").insertAdjacentElement("afterend", buildMore(p));
      var hasDemo = !!p.demo; dlg.classList.toggle("nodemo", !hasDemo); dlg.classList.toggle("hasdemo", hasDemo);
      $("pd-tab").hidden = !hasDemo;
      // optional source-code link (CONTENT.projects[].repo) next to the demo button
      var gh = dlg.querySelector(".pd-btn.repo");
      if (!gh) {
        gh = document.createElement("a"); gh.className = "pd-btn repo"; gh.target = "_blank"; gh.rel = "noopener";
        gh.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg><span>ดูโค้ดบน GitHub</span>';
        $("pd-tab").insertAdjacentElement("afterend", gh);
      }
      gh.hidden = !p.repo; if (p.repo) gh.href = p.repo;
      if (hasDemo) {
        load.hidden = false; load.textContent = "กำลังโหลดเดโม…"; $("pd-url").textContent = p.url;
        frame.onload = function () { load.hidden = true; };
        frame.onerror = function () { load.textContent = "โหลดเดโมไม่สำเร็จ — ลอง ‘เปิดเดโมในแท็บใหม่’"; };
        frame.src = p.demo; $("pd-tab").href = p.demo;
      } else { frame.removeAttribute("src"); }
      dlg.showModal(); document.documentElement.classList.add("modal-open");
    }
    function close() { if (dlg.open) dlg.close(); }
    dlg.addEventListener("close", function () { var v = dlg.querySelector(".pd-more video"); if (v) v.pause(); dlg.classList.remove("reading"); frame.removeAttribute("src"); document.documentElement.classList.remove("modal-open"); if (opener) opener.focus(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });                         // click on the backdrop
    dlg.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", close); });
    cards.forEach(function (c) {
      c.addEventListener("click", function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); open(+c.dataset.p, c); });
    });
    document.querySelectorAll("[data-open]").forEach(function (b) {                                  // links from the journey cards
      b.addEventListener("click", function (e) { e.preventDefault(); open(+b.dataset.open, b); });
    });
    // deep links: index.html#demo opens BinBuddy, #project-2 / #project-3 open the others
    var m = /^#(demo|project-(\d))$/.exec(location.hash);
    if (m) { var idx = m[2] ? +m[2] - 1 : 0; setTimeout(function () { open(idx, null); }, 400); }
  });
})();

/* ===== chat.js ===== */
;/* "คุยกับ AI ของผม": a paper tag hanging on a string from the nav bar (it swings), which opens a paper chat panel.
   Answers: the Cloudflare Worker (Gemini) when CHAT.endpoint is set, otherwise / on any failure the built-in
   answers in data/chat.js. Suggested-question buttons always answer from the built-in data (instant, never fails). */
(function () {
  "use strict";
  var C = window.CHAT; if (!C) return;
  var KEY = "chat-log-v1", AI_TIMEOUT = 14000;

  // ------------------------------------------------------------------ built-in brain
  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  var LATIN = /^[a-z0-9 .'-]+$/;
  function localAnswer(q) {
    var t = " " + norm(q) + " ", best = null, bestScore = 0;
    C.qa.forEach(function (e) {
      var s = 0;
      e.keys.forEach(function (k) {
        k = norm(k);
        // English: whole word for short keys ("hi"), word start for longer ones ("skill" also finds "skills")
        var hit = LATIN.test(k) ? new RegExp("(^|[^a-z])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + (k.length < 4 ? "([^a-z]|$)" : "")).test(t) : t.indexOf(k) >= 0;
        if (hit) s += 1 + k.length / 12;
      });
      if (s > bestScore) { bestScore = s; best = e; }
    });
    if (!best) return { text: C.fallback, known: false };
    return best.a ? { text: best.a, known: true, id: best.id } : { text: C.fallback, known: false };
  }

  // ------------------------------------------------------------------ DOM
  var ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/></svg>';

  // ---- what hangs on the string: CHAT.tagStyle = "robot" | "me" | "bubble" | "tag" (preview any of them with ?aitag=robot)
  var STYLES = {
    // the felt "me" doll (assets/chat/doll.webp) — the string is tied to the tuft of hair on top
    doll: '<img class="aitag-art aitag-doll" src="assets/chat/doll.webp?v=1" alt="" width="207" height="400" decoding="async" draggable="false">',
    // A. paper-cut robot (antenna = where the string is tied)
    robot: '<svg class="aitag-art" viewBox="0 0 100 124" aria-hidden="true">' +
      '<g class="o" fill="#e77d79" stroke="#e77d79" stroke-width="7" stroke-linejoin="round">' +
      '<circle cx="50" cy="8" r="5"/><rect x="47.5" y="8" width="5" height="10"/><ellipse cx="16" cy="44" rx="8" ry="12"/><ellipse cx="84" cy="44" rx="8" ry="12"/>' +
      '<rect x="8" y="70" width="15" height="27" rx="7.5" transform="rotate(12 15 83)"/><rect x="77" y="70" width="15" height="27" rx="7.5" transform="rotate(-12 85 83)"/>' +
      '<rect x="29" y="96" width="18" height="20" rx="7"/><rect x="53" y="96" width="18" height="20" rx="7"/><rect x="25" y="64" width="50" height="38" rx="11"/><rect x="17" y="16" width="66" height="52" rx="13"/></g>' +
      '<circle cx="50" cy="8" r="4.2" fill="#f4a29d"/><rect x="48.6" y="12" width="2.8" height="6" fill="#6cc4ac"/>' +
      '<ellipse cx="16" cy="44" rx="6" ry="10" fill="#6cc4ac"/><ellipse cx="84" cy="44" rx="6" ry="10" fill="#6cc4ac"/>' +
      '<rect x="10" y="72" width="11" height="23" rx="5.5" fill="#6cc4ac" transform="rotate(12 15 83)"/><rect x="79" y="72" width="11" height="23" rx="5.5" fill="#6cc4ac" transform="rotate(-12 85 83)"/>' +
      '<rect x="31" y="98" width="14" height="16" rx="5" fill="#f4a29d"/><rect x="55" y="98" width="14" height="16" rx="5" fill="#f4a29d"/>' +
      '<rect x="27" y="66" width="46" height="34" rx="9" fill="#f5d37a"/><rect x="39" y="74" width="22" height="15" rx="3.5" fill="#6cc4ac"/>' +
      '<rect x="19" y="18" width="62" height="48" rx="11" fill="#f5d37a"/><rect x="25" y="23" width="50" height="38" rx="8" fill="#9be3d0"/>' +
      '<g class="eyes" fill="#3a2a20"><ellipse cx="39" cy="40" rx="3.6" ry="4.6"/><ellipse cx="61" cy="40" rx="3.6" ry="4.6"/></g>' +
      '<path d="M43.5 47.5 Q50 53.5 56.5 47.5" fill="none" stroke="#3a2a20" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="32.5" cy="48.5" r="3.4" fill="#f4a29d"/><circle cx="67.5" cy="48.5" r="3.4" fill="#f4a29d"/></svg>',
    // B. a little paper "me" (hair, round glasses) — the string is tied to the hair tuft
    me: '<svg class="aitag-art" viewBox="0 0 100 112" aria-hidden="true">' +
      '<path d="M50 4 C47 10 46 13 47 17" fill="none" stroke="#5a3b28" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="50" cy="62" rx="35" ry="33" fill="#f6dcc3" stroke="#fff4d9" stroke-width="5"/>' +
      '<path d="M14 58 C10 34 26 14 50 14 C76 14 92 34 86 60 C84 50 80 44 74 40 C74 48 70 50 66 50 C67 44 64 38 60 36 C58 44 52 46 46 46 C48 40 46 35 42 32 C38 40 30 44 22 44 C20 48 16 52 14 58Z" fill="#5a3b28" stroke="#fff4d9" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M30 22 C34 16 40 15 44 18 M60 18 C66 16 72 20 74 26" fill="none" stroke="#7a5236" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g fill="#3a2a20"><ellipse class="eye" cx="38" cy="66" rx="4.4" ry="5.4"/><ellipse class="eye" cx="62" cy="66" rx="4.4" ry="5.4"/></g>' +
      '<g fill="none" stroke="#5c4c40" stroke-width="2.2"><circle cx="38" cy="65" r="10"/><circle cx="62" cy="65" r="10"/><path d="M48 64 Q50 62 52 64"/></g>' +
      '<circle cx="28" cy="78" r="4" fill="#f4a29d" opacity=".8"/><circle cx="72" cy="78" r="4" fill="#f4a29d" opacity=".8"/>' +
      '<path d="M46 81 Q50 84 54 81" fill="none" stroke="#8a5a44" stroke-width="2" stroke-linecap="round"/>' +
      '<g transform="translate(60 84) rotate(-6)"><path d="M0 4 Q0 0 4 0 H34 Q38 0 38 4 V18 Q38 22 34 22 H12 L5 28 L7 22 H4 Q0 22 0 18Z" fill="#e77d79" stroke="#fff4d9" stroke-width="2.5"/>' +
      '<text x="19" y="15.5" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" font-family="Mitr, sans-serif">AI</text></g></svg>',
    // C. a paper speech bubble with stitched edge
    bubble: '<svg class="aitag-art" viewBox="0 0 110 96" aria-hidden="true">' +
      '<path d="M55 2 L50 14 H18 Q6 14 6 26 V64 Q6 76 18 76 H30 L24 92 L46 76 H92 Q104 76 104 64 V26 Q104 14 92 14 H60Z" fill="#88d9c5" transform="translate(4 4)"/>' +
      '<path d="M55 2 L50 14 H18 Q6 14 6 26 V64 Q6 76 18 76 H30 L24 92 L46 76 H92 Q104 76 104 64 V26 Q104 14 92 14 H60Z" fill="#fff4d9"/>' +
      '<path d="M18 20 H92 Q98 20 98 26 V64 Q98 70 92 70 H18 Q12 70 12 64 V26 Q12 20 18 20Z" fill="none" stroke="#e77d79" stroke-width="2" stroke-dasharray="5 4"/>' +
      '<text x="55" y="44" text-anchor="middle" font-size="17" fill="#264a3c" font-family="Mitr, sans-serif" font-weight="500">ถาม AI</text>' +
      '<text x="55" y="60" text-anchor="middle" font-size="10.5" fill="#6b5442" font-family="Anuphan, sans-serif">ของผมได้นะ</text></svg>',
    tag: '<span class="aitag-hole" aria-hidden="true"></span>' + ICON_CHAT + '<b>ถาม AI</b><small>ของผมได้นะ</small>'
  };
  var qs = /[?&]aitag=(doll|robot|me|bubble|tag)\b/.exec(location.search);
  var style = qs ? qs[1] : (STYLES[C.tagStyle] ? C.tagStyle : "robot");
  var aitag = document.createElement("div"); aitag.className = "aitag"; aitag.setAttribute("data-style", style);
  aitag.innerHTML = '<span class="aitag-pin" aria-hidden="true"></span><div class="aitag-swing"><span class="aitag-string" aria-hidden="true"></span>' +
    '<button type="button" class="aitag-tag" aria-haspopup="dialog" aria-expanded="false" aria-controls="chatp" aria-label="คุยกับ AI ของธนสินธ์">' +
    STYLES[style] + '</button>' + (style === "tag" ? "" : '<span class="aitag-say" aria-hidden="true">ถามผมได้นะ</span>') + '</div>';
  document.body.appendChild(aitag);   // fixed in the bottom-right corner, hanging from a little paper pin
  var swing = aitag.querySelector(".aitag-swing"), tag = aitag.querySelector(".aitag-tag");

  var panel = document.createElement("section"); panel.className = "chatp"; panel.id = "chatp";
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", C.name); panel.hidden = true;
  panel.innerHTML =
    '<span class="chatp-pin" aria-hidden="true"></span>' +
    '<header class="chatp-head"><span class="chatp-ava" aria-hidden="true"><img src="assets/chat/face.webp?v=1" alt="" width="40" height="40"></span>' +
    '<div><b></b><small class="chatp-status"></small></div>' +
    '<button type="button" class="chatp-x" aria-label="ปิดแชท">✕</button></header>' +
    '<div class="chatp-log" aria-live="polite"></div>' +
    '<div class="chatp-chips" aria-label="คำถามแนะนำ"></div>' +
    '<form class="chatp-form" autocomplete="off"><label class="sr" for="chatp-in">พิมพ์คำถาม</label>' +
    '<input id="chatp-in" type="text" maxlength="500" placeholder="พิมพ์คำถามถึงผม…" enterkeyhint="send">' +
    '<button type="submit" aria-label="ส่ง">' + ICON_SEND + '</button></form>' +
    '<p class="chatp-note"></p>';
  document.body.appendChild(panel);
  var log = panel.querySelector(".chatp-log"), chips = panel.querySelector(".chatp-chips"), form = panel.querySelector(".chatp-form"), input = panel.querySelector("input");
  panel.querySelector(".chatp-head b").textContent = C.name;
  panel.querySelector(".chatp-status").textContent = C.endpoint ? "AI · ตอบภายในไม่กี่วินาที" : "ตอบจากข้อมูลที่ผมเตรียมไว้";
  panel.querySelector(".chatp-note").textContent = C.note;

  // ------------------------------------------------------------------ messages
  var history = [];
  try { history = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) { history = []; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-30))); } catch (e) { } }
  function linkify(s) {
    var esc = s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
    return esc.replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>')
      .replace(/(github\.com\/[\w./-]+[\w/])/g, '<a href="https://$1" target="_blank" rel="noopener">$1</a>');
  }
  // {age} in a prepared answer = age today from CHAT.birth (so it never goes out of date)
  function fill(s) {
    return String(s).replace(/\{age\}/g, function () {
      var b = new Date((C.birth || "2004-03-24") + "T00:00:00"), n = new Date(), a = n.getFullYear() - b.getFullYear();
      if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
      return String(a);
    });
  }
  // src: "ai" = written by Gemini just now, "local" = a prepared answer from data/chat.js (shown as a small label under the bubble)
  var SRC_LABEL = { ai: "✦ ตอบโดย AI", local: "คำตอบที่ผมเตรียมไว้" };
  function bubble(role, text, src) {
    var d = document.createElement("div"); d.className = "cmsg " + (role === "ai" ? "ai" : "me");
    d.innerHTML = linkify(text);
    if (role === "ai" && SRC_LABEL[src]) { var s = document.createElement("small"); s.className = "cmsg-src " + src; s.textContent = SRC_LABEL[src]; d.appendChild(s); }
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function typing() { var d = document.createElement("div"); d.className = "cmsg ai typing"; d.innerHTML = "<i></i><i></i><i></i>"; d.setAttribute("aria-label", "กำลังพิมพ์"); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  function renderChips() {
    chips.textContent = "";
    var asked = {}; history.forEach(function (m) { if (m.chip) asked[m.chip] = 1; });
    C.qa.filter(function (e) { return e.chip && e.a && !asked[e.id]; }).slice(0, 5).forEach(function (e) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = e.chip;
      b.onclick = function () { ask(e.chip, e); }; chips.appendChild(b);
    });
    chips.hidden = !chips.childNodes.length;
  }
  function think() { var A = window.paperAvatars; if (A && A.playGesture) { A.playGesture("standing", "think"); A.playGesture("seated", "think"); } }

  var busy = false;
  function aiAnswer() {
    if (!C.endpoint) return Promise.resolve(null);
    var ctrl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, AI_TIMEOUT);
    var msgs = history.slice(-8).map(function (m) { return { role: m.role, text: m.text }; });
    return fetch(C.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs }), signal: ctrl && ctrl.signal })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (d) { return d && d.ok && d.answer ? d.answer : null; })
      .catch(function () { return null; })
      .then(function (a) { clearTimeout(timer); return a; });
  }
  function ask(text, entry) {
    text = String(text || "").trim(); if (!text || busy) return;
    busy = true; form.classList.add("wait");
    history.push({ role: "me", text: text, chip: entry ? entry.id : undefined }); bubble("me", text); save();
    chips.hidden = true;
    var dots = typing(); think();
    var start = Date.now();
    var p = entry ? Promise.resolve(null) : aiAnswer();          // suggested questions: built-in answer straight away
    p.then(function (ai) {
      var ans = ai || fill(entry ? entry.a : localAnswer(text).text);
      var wait = Math.max(0, (entry ? 650 : 400) - (Date.now() - start));   // a short "typing" beat so it feels like a reply
      setTimeout(function () {
        var src = ai ? "ai" : "local";
        dots.remove(); history.push({ role: "ai", text: ans, src: src }); bubble("ai", ans, src); save();
        busy = false; form.classList.remove("wait"); renderChips();
      }, wait);
    });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });

  // first open: greeting + previous messages of this visit
  var started = false;
  function start() {
    if (started) return; started = true;
    bubble("ai", C.hello);
    history.forEach(function (m) { bubble(m.role, m.text, m.src); });
    renderChips();
  }

  // ------------------------------------------------------------------ open / close
  function setOpen(o) {
    if (o === !panel.hidden) return;
    if (o) { start(); panel.hidden = false; requestAnimationFrame(function () { panel.classList.add("on"); }); setTimeout(function () { input.focus({ preventScroll: true }); }, 60); kick(o ? 9 : -9); }
    else { panel.classList.remove("on"); panel.hidden = true; tag.focus({ preventScroll: true }); kick(-7); }
    tag.setAttribute("aria-expanded", String(o)); aitag.classList.toggle("open", o);
  }
  tag.addEventListener("click", function () { setOpen(panel.hidden); });
  panel.querySelector(".chatp-x").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });

  // ------------------------------------------------------------------ swing (damped pendulum, driven by scrolling and the pointer)
  var ang = 0, vel = 0, raf = 0, last = 0, lastY = window.scrollY;
  // the string is long (nav → bottom of the screen), so the angle stays small: a few degrees already moves the tag a lot
  function kick(v) { vel += v * 0.22; if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } }
  function step(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    vel += (-11 * ang - 1.4 * vel) * dt;          // long pendulum: slower swing back to straight, with damping
    ang += vel * dt; ang = Math.max(-4.5, Math.min(4.5, ang));
    swing.style.transform = "rotate(" + ang.toFixed(2) + "deg)";
    if (Math.abs(ang) < 0.05 && Math.abs(vel) < 0.05) { ang = 0; vel = 0; swing.style.transform = ""; raf = 0; return; }
    raf = requestAnimationFrame(step);
  }
  addEventListener("scroll", function () { var y = window.scrollY, d = y - lastY; lastY = y; if (Math.abs(d) > 1) kick(Math.max(-14, Math.min(14, d * 0.18))); }, { passive: true });
  tag.addEventListener("pointerenter", function (e) { var r = tag.getBoundingClientRect(); kick(e.clientX < r.left + r.width / 2 ? -10 : 10); });
  setTimeout(function () { kick(16); }, 2200);                                   // a first little swing to get noticed
  function talk() { aitag.classList.add("talk"); setTimeout(function () { aitag.classList.remove("talk"); }, 3200); }
  setTimeout(talk, 2600);                                                        // "ถาม AI ของผมได้นะ" once after load
  setInterval(function () { if (panel.hidden && !document.hidden) { kick(7); if (Math.random() < .5) talk(); } }, 14000);
})();
