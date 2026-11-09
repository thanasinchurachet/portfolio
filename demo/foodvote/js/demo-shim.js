/* ============================================================================================
   DEMO SHIM — makes the original Food Vote System run entirely in the browser, with NO real backend.
   • window.firebase : a tiny in-memory/localStorage imitation of the Firebase Realtime Database (compat API subset the app uses)
   • window.liff     : a fake LINE login (one demo user)
   • fetch to n8n    : answered locally (the real webhooks are not called)
   • seed data       : invented people and menus, regenerated for "today" so the demo always looks alive
   Nothing here talks to Firebase, LINE or n8n. The "reset" button in the banner restores the seed data.
   ============================================================================================ */
(function () {
  "use strict";
  var LS_KEY = "fv_demo_db_v1";
  // two demo identities: the vote page inside the admin phone loads with ?as=admin, the member phone with ?as=member (default)
  var USERS = { admin: { userId: "UdemoA00000000000000000000000001", displayName: "แอดมิน" }, member: { userId: "UdemoM00000000000000000000000001", displayName: "สมาชิก" } };
  var AS = /[?&]as=(admin|member)/.exec(location.search), DEMO_USER = USERS[AS ? AS[1] : "member"];

  // ---------------------------------------------------------------- avatars (inline SVG, no external images)
  function avatar(name, hue) {
    var ch = (name || "?").trim().charAt(0);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="hsl(' + hue + ',62%,58%)"/><text x="48" y="62" font-size="44" font-family="sans-serif" fill="#fff" text-anchor="middle">' + ch + "</text></svg>";
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }
  DEMO_USER.pictureUrl = avatar(DEMO_USER === USERS.admin ? "แ" : "ส", DEMO_USER === USERS.admin ? 25 : 150);
  USERS.admin.pictureUrl = avatar("แ", 25); USERS.member.pictureUrl = avatar("ส", 150);

  // ---------------------------------------------------------------- date helpers (Bangkok)
  function bkkDate(offsetDays) {
    return new Date(Date.now() + 7 * 3600000 + (offsetDays || 0) * 86400000).toISOString().slice(0, 10);   // UTC+7, independent of the visitor's own timezone
  }

  // ---------------------------------------------------------------- seed data (all invented)
  var MENU = [["กะเพราหมูสับไข่ดาว", 50], ["ก๋วยเตี๋ยวหมูน้ำตก", 45], ["ข้าวผัดกุ้ง", 55], ["มักกะโรนีผัดซอส", 40], ["ข้าวมันไก่", 45],
              ["ผัดซีอิ๊วหมู", 45], ["ข้าวหมูทอดกระเทียม", 50], ["ส้มตำไก่ย่าง", 60], ["ต้มยำกุ้งน้ำใส", 70]];
  var PEOPLE = ["สมชาย", "น้องฟ้า", "พี่เอก", "มะลิ", "บีม", "แพรว", "นนท์", "ใบเตย", "ต้นกล้า", "ฝน"];
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  function seed() {
    var db = { menus: {}, votes: {}, additional_votes: {}, admins: {}, groups: {}, users: {}, notification: {}, errors: {} };
    var items = {}; MENU.forEach(function (m, i) { items[String(i + 1)] = { id: String(i + 1), name: m[0], price: m[1] }; });
    for (var k = 0; k < 10; k++) {
      var date = bkkDate(-k), r = rnd(1000 + k * 37), votes = {}, extra = {};
      db.menus[date] = { date: date, status: k === 0 ? "active" : "inactive", timestamp: Date.now() - k * 86400000, items: JSON.parse(JSON.stringify(items)) };
      PEOPLE.forEach(function (name, pi) {
        if (r() < 0.25 && !(k === 0 && pi < 5)) return;
        var uid = "Udemo" + ("00000000000000000000000000" + (pi + 2)).slice(-27), mid = 1 + Math.floor(r() * MENU.length);
        var pic = avatar(name, (pi * 47) % 360);
        votes[uid] = { menuId: String(mid), quantity: 1, cost: MENU[mid - 1][1], userName: name, userPictureUrl: pic };
        if (r() < 0.22) { var m2 = 1 + Math.floor(r() * MENU.length); extra[uid] = {}; extra[uid][String(m2)] = { quantity: 1, cost: MENU[m2 - 1][1], userName: name, userPictureUrl: pic }; }
      });
      db.votes[date] = votes; if (Object.keys(extra).length) db.additional_votes[date] = extra;
    }
    db.admins[USERS.admin.userId] = { name: USERS.admin.displayName, userid: USERS.admin.userId, registerAt: new Date().toISOString(), lastUpdated: new Date().toISOString() };
    db.groups["Cdemo00000000000000000000000001"] = { groupId: "Cdemo00000000000000000000000001", status: "active", timestamp: new Date().toISOString(), userId: USERS.admin.userId };
    return db;
  }

  // ---------------------------------------------------------------- the database
  var root = null, listeners = [];
  function load() {
    try { var raw = localStorage.getItem(LS_KEY); if (raw) { root = JSON.parse(raw); } } catch (e) { root = null; }
    if (!root || !root.menus || !root.menus[bkkDate(0)]) { root = seed(); persist(); }
  }
  // Several windows (the LINE simulator + the vote page inside its phone) share one "database" in localStorage:
  // write immediately, and re-read before every access so one window never overwrites another's changes.
  var lastRaw = null;
  function persist() { try { lastRaw = JSON.stringify(root); localStorage.setItem(LS_KEY, lastRaw); } catch (e) { } }
  function sync() { try { var raw = localStorage.getItem(LS_KEY); if (raw && raw !== lastRaw) { root = JSON.parse(raw); lastRaw = raw; } } catch (e) { } }
  window.addEventListener("storage", function (e) { if (e.key === LS_KEY && e.newValue) { sync(); notify(""); } });
  function parts(path) { return String(path || "").split("/").filter(Boolean); }
  function getAt(path) { sync(); var n = root; for (var p of parts(path)) { if (n == null || typeof n !== "object") return null; n = n[p]; } return n == null ? null : n; }
  function resolveSV(v) {
    if (v && typeof v === "object") {
      if (v[".sv"] === "timestamp") return Date.now();
      for (var k in v) v[k] = resolveSV(v[k]);
    }
    return v;
  }
  function prune(o) {                                                         // Firebase never stores null / empty objects
    if (o && typeof o === "object") { Object.keys(o).forEach(function (k) { o[k] = prune(o[k]); if (o[k] == null) delete o[k]; }); if (!Object.keys(o).length) return null; }
    return o;
  }
  function setAt(path, value) {
    sync();
    var ps = parts(path); value = value === undefined ? null : prune(resolveSV(JSON.parse(JSON.stringify(value === undefined ? null : value))));
    if (!ps.length) { root = value || {}; return; }
    var n = root;
    for (var i = 0; i < ps.length - 1; i++) { if (n[ps[i]] == null || typeof n[ps[i]] !== "object") n[ps[i]] = {}; n = n[ps[i]]; }
    if (value == null) delete n[ps[ps.length - 1]]; else n[ps[ps.length - 1]] = value;
    // clean up emptied parents
    for (var j = ps.length - 1; j > 0; j--) { var parent = getAt(ps.slice(0, j).join("/")); if (parent && !Object.keys(parent).length) setAt(ps.slice(0, j).join("/"), null); else break; }
  }
  function toArrayIfNeeded(v) {                                               // Firebase hands back an array when the keys look like 0..n
    if (!v || typeof v !== "object" || Array.isArray(v)) return v;
    var keys = Object.keys(v), max = -1;
    for (var k of keys) { if (!/^(0|[1-9]\d*)$/.test(k)) return v; max = Math.max(max, +k); }
    if (max < 2 * keys.length) { var a = []; a.length = max + 1; for (var i = 0; i <= max; i++) if (v[i] != null) a[i] = v[i]; return a; }   // sparse, like the real SDK (holes are skipped by Object.keys / forEach)
    return v;
  }
  function exportVal(v) {
    v = toArrayIfNeeded(v);
    if (Array.isArray(v)) return v.map(exportVal);
    if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { o[k] = exportVal(v[k]); }); return o; }
    return v;
  }
  function notify(changedPath) {
    var cp = parts(changedPath).join("/");
    listeners.slice().forEach(function (l) {
      var lp = parts(l.path).join("/");
      if (cp === lp || cp.indexOf(lp + "/") === 0 || lp.indexOf(cp + "/") === 0 || !cp || !lp) setTimeout(function () { l.cb(new Snapshot(l.path, getAt(l.path), l.query)); }, 0);
    });
  }

  // ---------------------------------------------------------------- snapshot / ref / query
  function Snapshot(path, value, query) {
    var v = value;
    if (query && v && typeof v === "object") {
      v = Object.keys(v).filter(function (k) { return !(query.startAt != null) || k >= query.startAt; }).reduce(function (o, k) { o[k] = v[k]; return o; }, {});
      if (!Object.keys(v).length) v = null;
    }
    this._v = v; this.key = parts(path).slice(-1)[0] || null; this._p = path;
  }
  Snapshot.prototype.val = function () { return this._v == null ? null : exportVal(JSON.parse(JSON.stringify(this._v))); };
  Snapshot.prototype.exists = function () { return this._v != null; };
  Snapshot.prototype.hasChildren = function () { return !!this._v && typeof this._v === "object" && Object.keys(this._v).length > 0; };
  Snapshot.prototype.numChildren = function () { return this._v && typeof this._v === "object" ? Object.keys(this._v).length : 0; };
  Snapshot.prototype.child = function (p) { return new Snapshot(this._p + "/" + p, getAt(this._p + "/" + p)); };
  Snapshot.prototype.forEach = function (cb) {
    if (!this._v || typeof this._v !== "object") return false;
    var self = this, keys = Object.keys(this._v).sort(function (a, b) { return (/^\d+$/.test(a) && /^\d+$/.test(b)) ? a - b : (a < b ? -1 : a > b ? 1 : 0); });
    for (var i = 0; i < keys.length; i++) { if (cb(new Snapshot(self._p + "/" + keys[i], self._v[keys[i]])) === true) return true; }
    return false;
  };

  function Ref(path, query) { this.path = parts(path).join("/"); this._q = query || null; this.key = parts(path).slice(-1)[0] || null; }
  Ref.prototype.child = function (p) { return new Ref(this.path + "/" + p); };
  Ref.prototype.orderByKey = function () { return new Ref(this.path, { startAt: null }); };
  Ref.prototype.startAt = function (v) { return new Ref(this.path, { startAt: v }); };
  Ref.prototype.once = function (ev, cb, errCb) {
    var self = this, snap = new Snapshot(this.path, getAt(this.path), this._q);
    var p = new Promise(function (res) { setTimeout(function () { res(snap); }, 0); });
    if (typeof cb === "function") p.then(cb);
    return p;
  };
  Ref.prototype.on = function (ev, cb) {
    var l = { path: this.path, cb: cb, query: this._q, ev: ev }; listeners.push(l);
    if (ev === "value") setTimeout(function () { cb(new Snapshot(l.path, getAt(l.path), l.query)); }, 0);
    return cb;
  };
  Ref.prototype.off = function (ev, cb) { var p = this.path; listeners = listeners.filter(function (l) { return !(l.path === p && (!cb || l.cb === cb)); }); };
  Ref.prototype.set = function (v) { setAt(this.path, v); persist(); notify(this.path); return Promise.resolve(); };
  Ref.prototype.update = function (obj) {
    var base = this.path;
    Object.keys(obj || {}).forEach(function (k) { setAt(base + "/" + k, obj[k]); });
    persist(); notify(base); return Promise.resolve();
  };
  Ref.prototype.remove = function () { setAt(this.path, null); persist(); notify(this.path); return Promise.resolve(); };
  Ref.prototype.push = function (v) {
    var key = "-demo" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), r = new Ref(this.path + "/" + key);
    var p = v === undefined ? Promise.resolve(r) : r.set(v).then(function () { return r; });
    r.then = p.then.bind(p); r.catch = p.catch.bind(p); return r;
  };
  Ref.prototype.transaction = function (fn) { var cur = getAt(this.path), nv = fn(cur); if (nv !== undefined) this.set(nv); return Promise.resolve({ committed: nv !== undefined, snapshot: new Snapshot(this.path, getAt(this.path)) }); };

  var db = { ref: function (p) { return new Ref(p || ""); } };
  var firebase = {
    initializeApp: function () { return {}; }, apps: [{}],
    database: Object.assign(function () { return db; }, { ServerValue: { TIMESTAMP: { ".sv": "timestamp" } } }),
    storage: function () {
      return { ref: function (path) {
        return { put: function (file) {                                                    // slips: kept as a local data URL, nothing is uploaded
          var task = { on: function (ev, prog, err, done) { setTimeout(function () { if (done) done(); }, 400); return task; },
                       then: function (res) { return new Promise(function (r) { var fr = new FileReader(); fr.onload = function () { r({ ref: { getDownloadURL: function () { return Promise.resolve(fr.result); } } }); }; fr.readAsDataURL(file); }).then(res); },
                       snapshot: { ref: { getDownloadURL: function () { return new Promise(function (r) { var fr = new FileReader(); fr.onload = function () { r(fr.result); }; fr.readAsDataURL(file); }); } } } };
          return task;
        } };
      } };
    }
  };
  load(); window.firebase = firebase;
  // helpers for the LINE simulator page (line.html)
  window.__fvDemo = { avatar: avatar, bkkDate: bkkDate, USER: DEMO_USER, USERS: USERS, PEOPLE: PEOPLE, MENU: MENU,
    reload: function () { sync(); },
    flush: function () { persist(); },
    reset: function () { try { localStorage.removeItem(LS_KEY); } catch (e) { } } };

  // ---------------------------------------------------------------- fake LIFF
  var liffBase = {
    init: function () { return Promise.resolve(); }, ready: Promise.resolve(), isLoggedIn: function () { return true; }, isInClient: function () { return false; },
    getProfile: function () { return Promise.resolve({ userId: DEMO_USER.userId, displayName: DEMO_USER.displayName, pictureUrl: DEMO_USER.pictureUrl, statusMessage: "" }); },
    getContext: function () { return { type: "group", groupId: "Cdemo00000000000000000000000001", userId: DEMO_USER.userId }; },
    login: function () { }, logout: function () { }, closeWindow: function () { }, getOS: function () { return "web"; }, getLanguage: function () { return "th"; },
    sendMessages: function () { return Promise.resolve(); }, openWindow: function (o) { if (o && o.url) window.open(o.url, o.external ? "_blank" : "_self"); }, state: "", id: "demo"
  };
  window.liff = new Proxy(liffBase, { get: function (t, k) { return k in t ? t[k] : function () { return Promise.resolve(); }; } });

  // ---------------------------------------------------------------- n8n / webhooks answered locally
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (url, opts) {
    var u = typeof url === "string" ? url : (url && url.url) || "";
    if (/n8n|webhook/i.test(u)) return Promise.resolve(new Response(JSON.stringify({ success: true, demo: true, message: "demo — no webhook called" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    return realFetch ? realFetch(url, opts) : Promise.reject(new Error("fetch unavailable"));
  };

  // ---------------------------------------------------------------- banner
  document.addEventListener("DOMContentLoaded", function () {
    if (/[?&]embed=1/.test(location.search) || window.__fvNoBanner) return;   // story.html shows its own notice
    var b = document.createElement("div");
    b.style.cssText = "position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;display:flex;gap:10px;align-items:center;max-width:calc(100% - 20px);padding:7px 14px;border-radius:999px;background:#fef3c7;color:#92400e;border:1.5px dashed #f59e0b;font:600 12.5px/1.3 Prompt,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.2)";
    b.innerHTML = '<span>เดโมจำลอง · ข้อมูลทั้งหมดเป็นตัวอย่าง ไม่ได้เชื่อมระบบจริง</span>';
    var btn = document.createElement("button"); btn.type = "button"; btn.textContent = "รีเซ็ต";
    btn.style.cssText = "border:0;border-radius:999px;padding:3px 12px;background:#f59e0b;color:#fff;font:inherit;cursor:pointer";
    btn.onclick = function () { try { Object.keys(localStorage).filter(function (k) { return k.indexOf('fv_') === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { } location.reload(); };
    b.appendChild(btn); document.body.appendChild(b);
  });
})();
