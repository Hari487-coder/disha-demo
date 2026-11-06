/* Rescue the visitors
   A 30 second arcade round for the marketing showcase stand.
   Plain script, no modules, so it runs from file:// on the projector laptop. */
(function () {
  'use strict';

  // ---------- settings ----------
  var ROUND = 30;          // seconds per round
  var CD_STEP = 0.62;      // countdown beat (3, 2, 1, go)
  var END_IDLE = 20;       // seconds without input on the end screen before attract mode
  var LB_KEY = 'rescue-visitors-top10-v1';
  var MUTE_KEY = 'rescue-visitors-muted';
  var FONT = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var BG = '#0C0B10', ORANGE = '#FF5A1F', ORANGE_INK = '#FF9E70', YELLOW = '#FFC21A';
  var C_ORANGE = [255, 90, 31];
  var PEOPLE = [[238, 235, 244], [220, 216, 229], [205, 200, 216], [228, 224, 236]];
  var GREETS = ['Hi! Looking for something?', 'Hello! Can I help?', 'Hi there! Need a hand?'];
  var ANSWERS = ['Sure, here you go!', 'Answered. Want a visit?', 'Easy one. Booking you in!'];
  var QUESTIONS = ['Hostel?', 'Fees?', 'Library hours?', 'Open now?', 'Price?', 'Book a visit?'];
  var TAU = Math.PI * 2;

  // ---------- small helpers ----------
  function $(id) { return document.getElementById(id); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rgb(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function mix(c1, c2, k) { return [Math.round(lerp(c1[0], c2[0], k)), Math.round(lerp(c1[1], c2[1], k)), Math.round(lerp(c1[2], c2[2], k))]; }
  function easeOutBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  // Rounded rectangle path. r is a number or [tl, tr, br, bl].
  function rr(g, x, y, w, h, r) {
    var tl, tr, br, bl, m = Math.max(0, Math.min(w, h) / 2);
    g.beginPath();
    if (!(w > 0 && h > 0)) return;
    if (typeof r === 'number') { tl = tr = br = bl = r; } else { tl = r[0]; tr = r[1]; br = r[2]; bl = r[3]; }
    tl = clamp(tl, 0, m); tr = clamp(tr, 0, m); br = clamp(br, 0, m); bl = clamp(bl, 0, m);
    g.moveTo(x + tl, y);
    g.lineTo(x + w - tr, y); g.arcTo(x + w, y, x + w, y + tr, tr);
    g.lineTo(x + w, y + h - br); g.arcTo(x + w, y + h, x + w - br, y + h, br);
    g.lineTo(x + bl, y + h); g.arcTo(x, y + h, x, y + h - bl, bl);
    g.lineTo(x, y + tl); g.arcTo(x, y, x + tl, y, tl);
    g.closePath();
  }

  // ---------- storage (always guarded) ----------
  function load(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function store(key, val) { try { window.localStorage.setItem(key, val); } catch (e) { /* private mode or blocked */ } }

  // ---------- DOM ----------
  var canvas = $('stage');
  var ctx = canvas.getContext('2d');
  var el = {
    hud: $('hud'), timer: $('timer'), timerBox: $('timer-box'),
    greeted: $('greeted'), booked: $('booked'), lost: $('lost'),
    statGreeted: $('stat-greeted'), statBooked: $('stat-booked'), statLost: $('stat-lost'),
    attract: $('attract'), countdown: $('countdown'), count: $('count'), end: $('end'), mute: $('mute'),
    rn: $('r-n'), rm: $('r-m'), rp: $('r-p'), dotsYou: $('dots-you'), dotsNorm: $('dots-norm'),
    form: $('initials-form'), initials: $('initials'), saved: $('saved'), again: $('again'),
    boardA: $('board-attract'), boardE: $('board-end')
  };

  // ---------- leaderboard ----------
  var memBoard = [];
  function validEntry(r) { return r && typeof r.i === 'string' && isFinite(r.n) && isFinite(r.m) && r.m > 0; }
  function cmp(a, b) { return (b.n / b.m) - (a.n / a.m) || b.n - a.n || a.t - b.t; }
  function getBoard() {
    var list = null, raw = load(LB_KEY);
    if (raw) { try { list = JSON.parse(raw); } catch (e) { list = null; } }
    if (!Array.isArray(list)) list = memBoard.slice();
    return list.filter(validEntry).sort(cmp).slice(0, 10);
  }
  function saveBoard(list) { memBoard = list.slice(0, 10); store(LB_KEY, JSON.stringify(memBoard)); }
  function qualifies(n, m) {
    if (n <= 0 || m <= 0) return false;
    var b = getBoard();
    if (b.length < 10) return true;
    return cmp({ n: n, m: m, t: Date.now() }, b[b.length - 1]) < 0;
  }
  function renderBoard(ol, highlightT) {
    var b = getBoard(), i, li;
    ol.innerHTML = '';
    if (!b.length) {
      li = document.createElement('li'); li.className = 'empty';
      li.textContent = 'No scores yet. Be the first.';
      ol.appendChild(li); return;
    }
    for (i = 0; i < b.length; i++) {
      var r = b[i];
      li = document.createElement('li');
      if (highlightT && r.t === highlightT) li.className = 'me';
      li.innerHTML = '<span class="rk"></span><span class="nm"></span><span class="sc"></span><span class="pc"></span>';
      li.children[0].textContent = i + 1;
      li.children[1].textContent = r.i;
      li.children[2].textContent = r.n + ' of ' + r.m;
      li.children[3].textContent = Math.round(100 * r.n / r.m) + '%';
      ol.appendChild(li);
    }
  }
  function cleanInitials(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3); }

  // ---------- sound (tiny Web Audio synth, no files) ----------
  var AC = window.AudioContext || window.webkitAudioContext, actx = null, master = null;
  var muted = load(MUTE_KEY) === '1';
  function audioInit() {
    if (!AC) return;
    try {
      if (!actx) {
        actx = new AC();
        master = actx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(actx.destination);
      }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }
  function tone(freq, delay, dur, type, vol, slideTo) {
    if (!actx || muted) return;
    try {
      var t = actx.currentTime + (delay || 0);
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.03);
    } catch (e) { /* ignore */ }
  }
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
  var combo = 0, lastDing = 0;
  function sPop() { tone(rand(500, 560), 0, 0.12, 'sine', 0.16, 310); tone(1100, 0, 0.05, 'triangle', 0.03); }
  function sDing() {
    var t = now() / 1000;
    combo = (t - lastDing < 1.3) ? Math.min(combo + 1, PENTA.length - 1) : 0;
    lastDing = t;
    var f = 660 * Math.pow(2, PENTA[combo] / 12);
    tone(f, 0, 0.6, 'sine', 0.11); tone(f * 2, 0, 0.32, 'sine', 0.03); tone(f * 1.5, 0.045, 0.45, 'sine', 0.028);
  }
  function sTick() { tone(740, 0, 0.07, 'triangle', 0.05); }
  function sGo() { tone(880, 0, 0.22, 'triangle', 0.07); tone(1320, 0.06, 0.25, 'sine', 0.05); }
  function sEnd() { [0, 4, 7, 12].forEach(function (s, i) { tone(523.25 * Math.pow(2, s / 12), i * 0.09, 0.7, 'sine', 0.08); }); }
  function setMuted(m) {
    muted = m;
    store(MUTE_KEY, m ? '1' : '0');
    if (master) master.gain.value = m ? 0 : 0.9;
    el.mute.classList.toggle('off', m);
    var label = m ? 'Turn sound on' : 'Mute sound';
    el.mute.setAttribute('aria-label', label); el.mute.title = label;
  }

  // ---------- game state ----------
  var mode = 'attract';                 // attract | countdown | play | over | end
  var visitors = [], sparks = [], rings = [], floaters = [], flyers = [], taps = [];
  var stats = { greeted: 0, booked: 0, lost: 0, spawned: 0 };
  var shownBooked = 0;
  var orb = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, tv: null, drag: false, nx: 0.5, ny: 0.55, trail: [] };
  var bubble = null;
  var clock = 0, playStart = 0, left = ROUND, spawnIdx = 0, cdT = 0, cdStep = -1, overT = 0, endIdle = 0, lastSec = -1;
  var demoSpawnT = 0, aiT = 0, lastC = 0.5;
  var ptr = null, lastPointerType = 'mouse', pendingEntry = null, needLayout = false;

  // Fixed spawn schedule so every round has the same number of visitors (fair leaderboard).
  var SCHEDULE = (function () {
    var s = [], t = 0.35, k = 0;
    while (t < ROUND - 1.6) {
      var d = t / ROUND;
      s.push(t);
      if (d > 0.38 && k % 3 === 2) s.push(t + 0.14);
      t += lerp(0.8, 0.27, Math.pow(d, 0.9));
      k++;
    }
    return s;
  })();

  // ---------- layout ----------
  var W = 0, H = 0, DPR = 1, L = null, bgCanvas = null, orbSprite = null, glowSprite = null;
  var orbImg = new Image();
  orbImg.onload = function () { if (L) buildOrbSprite(); };
  orbImg.src = 'orb.png';

  function orbR() { return L.U * 4.0; }

  function layout() {
    if (L) { orb.nx = (orb.x - L.cx) / L.cw; orb.ny = (orb.y - L.cy) / L.ch; }
    W = Math.max(200, window.innerWidth || 0); H = Math.max(200, window.innerHeight || 0);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    var portrait = H > W * 1.02;
    var hudH = Math.min(el.hud.offsetHeight || 80, H * 0.3);
    var m = Math.round(clamp(Math.min(W, H) * 0.026, 10, 44));
    var fx = m, fy = hudH, fw = Math.max(120, W - 2 * m), fh = Math.max(120, H - hudH - m);
    if (fw > fh * 2.3) { var nw = fh * 2.3; fx += (fw - nw) / 2; fw = nw; }
    var bar = Math.round(clamp(Math.min(fw, fh) * 0.062, 36, 60));
    var pad = Math.round(clamp(Math.min(fw, fh) * 0.03, 10, 34));
    var cx = fx + pad, cy = fy + bar + pad, cw = fw - pad * 2, ch = fh - bar - pad * 2;
    L = {
      portrait: portrait, fx: fx, fy: fy, fw: fw, fh: fh, bar: bar, pad: pad,
      cx: cx, cy: cy, cw: cw, ch: ch,
      U: Math.max(4.6, Math.sqrt(cw * ch) / 100),
      rad: Math.round(clamp(Math.min(fw, fh) * 0.03, 12, 26))
    };
    orb.x = cx + clamp(orb.nx, 0, 1) * cw; orb.y = cy + clamp(orb.ny, 0, 1) * ch;
    orb.tx = orb.x; orb.ty = orb.y; orb.vx = orb.vy = 0; orb.trail.length = 0;
    for (var i = 0; i < visitors.length; i++) { visitors[i].qw = 0; place(visitors[i]); }
    if (bubble) bubble.w = 0;
    buildGlow(); buildOrbSprite(); buildBg(); placeMute();
    if (mode === 'attract') computeDemoZone();
  }

  function placeMute() {
    if (!L) return;
    var s = Math.round(clamp(L.bar * 0.8, 34, 48));
    el.mute.style.width = s + 'px'; el.mute.style.height = s + 'px';
    el.mute.style.right = 'auto';
    if (mode === 'attract' || mode === 'end') {
      // Corner of the screen while the start and result screens are up.
      var gap = Math.round(clamp(Math.min(W, H) * 0.028, 10, 30));
      el.mute.style.left = Math.round(W - s - gap) + 'px';
      el.mute.style.top = gap + 'px';
    } else {
      // In the browser bar of "Your website" while playing.
      el.mute.style.left = Math.round(L.fx + L.fw - s - Math.max(6, (L.bar - s) / 2) - 2) + 'px';
      el.mute.style.top = Math.round(L.fy + (L.bar - s) / 2) + 'px';
    }
  }

  function buildGlow() {
    if (glowSprite) return;
    glowSprite = document.createElement('canvas');
    glowSprite.width = glowSprite.height = 256;
    var g = glowSprite.getContext('2d');
    var gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,120,60,0.95)');
    gr.addColorStop(0.22, 'rgba(255,90,31,0.5)');
    gr.addColorStop(0.55, 'rgba(255,60,110,0.13)');
    gr.addColorStop(1, 'rgba(255,60,110,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }

  // Pre-scale the orb artwork once per size, stepping down for a clean result.
  function buildOrbSprite() {
    orbSprite = null;
    if (!orbImg.complete || !orbImg.naturalWidth || !L) return;
    try {
      var size = Math.max(8, Math.ceil(orbR() * 2.36 * DPR * 1.08));
      var src = orbImg, sw = orbImg.naturalWidth;
      while (sw / 2 > size) {
        var tmp = document.createElement('canvas');
        tmp.width = tmp.height = Math.ceil(sw / 2);
        var tc = tmp.getContext('2d'); tc.imageSmoothingQuality = 'high';
        tc.drawImage(src, 0, 0, tmp.width, tmp.height);
        src = tmp; sw = tmp.width;
      }
      var c = document.createElement('canvas');
      c.width = c.height = size;
      var o = c.getContext('2d'); o.imageSmoothingQuality = 'high';
      o.drawImage(src, 0, 0, size, size);
      orbSprite = c;
    } catch (e) { orbSprite = null; }
  }

  // ---------- the website (pre-rendered once per size) ----------
  var B1 = '#17161E', B2 = '#1D1C26', B3 = '#272530', TXT = '#6F6A7B';
  function pill(g, x, y, w, h, col) { rr(g, x, y, w, h, h / 2); g.fillStyle = col; g.fill(); }
  function button(g, x, y, w, h, label, outline) {
    rr(g, x, y, w, h, h / 2);
    if (outline) { g.strokeStyle = B3; g.lineWidth = 1.5; g.stroke(); } else { g.fillStyle = B2; g.fill(); g.strokeStyle = B3; g.lineWidth = 1; g.stroke(); }
    g.fillStyle = TXT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 ' + Math.max(9, Math.round(h * 0.36)) + 'px ' + FONT;
    g.fillText(label, x + w / 2, y + h / 2 + 1);
  }
  function picture(g, x, y, w, h) {
    rr(g, x, y, w, h, Math.min(w, h) * 0.06); g.fillStyle = B1; g.fill();
    g.save(); rr(g, x, y, w, h, Math.min(w, h) * 0.06); g.clip();
    g.beginPath();
    g.moveTo(x, y + h); g.lineTo(x, y + h * 0.82); g.lineTo(x + w * 0.3, y + h * 0.46); g.lineTo(x + w * 0.52, y + h * 0.7);
    g.lineTo(x + w * 0.68, y + h * 0.55); g.lineTo(x + w, y + h * 0.86); g.lineTo(x + w, y + h); g.closePath();
    g.fillStyle = B2; g.fill();
    g.beginPath(); g.arc(x + w * 0.74, y + h * 0.27, Math.min(w, h) * 0.09, 0, TAU); g.fillStyle = B3; g.fill();
    g.restore();
  }
  function longForm(g, x, y, w, h, cols, rows) {
    rr(g, x, y, w, h, Math.min(w, h) * 0.06); g.fillStyle = B1; g.fill();
    var p = Math.min(w, h) * 0.08, cw = (w - p * (cols + 1)) / cols, rh = (h - p * 2.2) / (rows + 1);
    pill(g, x + p, y + p * 0.9, w * 0.3, rh * 0.22, B3);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var fx = x + p + c * (cw + p), fy = y + p * 0.9 + rh * (r + 0.62);
        pill(g, fx, fy, cw * 0.36, rh * 0.13, B2);
        rr(g, fx, fy + rh * 0.24, cw, rh * 0.44, rh * 0.12); g.strokeStyle = B3; g.lineWidth = 1; g.stroke();
      }
    }
    button(g, x + p, y + h - p * 0.8 - rh * 0.5, Math.min(w * 0.3, cw), rh * 0.5, 'Submit', false);
  }
  function card(g, x, y, w, h) {
    rr(g, x, y, w, h, Math.min(w, h) * 0.07); g.fillStyle = B1; g.fill();
    var p = Math.min(w, h) * 0.12;
    g.beginPath(); g.arc(x + p + h * 0.1, y + p + h * 0.1, h * 0.1, 0, TAU); g.fillStyle = B2; g.fill();
    pill(g, x + p, y + p + h * 0.32, w * 0.6, h * 0.07, B2);
    pill(g, x + p, y + p + h * 0.47, w * 0.72, h * 0.05, B1 === B2 ? B3 : '#1A1922');
    pill(g, x + p, y + p + h * 0.58, w * 0.5, h * 0.05, '#1A1922');
  }

  function drawSite(g) {
    var x = L.cx, y = L.cy, w = L.cw, h = L.ch, i;
    if (!L.portrait) {
      var nh = h * 0.055;
      rr(g, x, y, nh, nh, nh * 0.3); g.fillStyle = B3; g.fill();
      pill(g, x + nh * 1.35, y + nh * 0.3, w * 0.09, nh * 0.4, B2);
      for (i = 0; i < 4; i++) pill(g, x + w * (0.44 + i * 0.075), y + nh * 0.32, w * 0.05, nh * 0.36, B2);
      button(g, x + w * 0.76, y, w * 0.11, nh, 'Contact us', true);
      var y0 = y + h * 0.16;
      pill(g, x, y0, w * 0.4, h * 0.066, B2);
      pill(g, x, y0 + h * 0.092, w * 0.29, h * 0.066, B2);
      var ws = [0.36, 0.33, 0.22];
      for (i = 0; i < 3; i++) pill(g, x, y0 + h * (0.215 + i * 0.044), w * ws[i], h * 0.022, B1);
      button(g, x, y0 + h * 0.37, w * 0.13, h * 0.085, 'Contact us', false);
      picture(g, x + w * 0.5, y0, w * 0.34, h * 0.44);
      var fy0 = y + h * 0.69, fh0 = h * 0.31;
      longForm(g, x, fy0, w * 0.41, fh0, 2, 3);
      for (i = 0; i < 2; i++) card(g, x + w * (0.45 + i * 0.2), fy0, w * 0.18, fh0);
    } else {
      var n2 = Math.min(w * 0.1, h * 0.045);
      rr(g, x, y, n2, n2, n2 * 0.3); g.fillStyle = B3; g.fill();
      pill(g, x + n2 * 1.35, y + n2 * 0.3, w * 0.28, n2 * 0.4, B2);
      for (i = 0; i < 3; i++) pill(g, x + w - n2 * 0.9, y + n2 * (0.22 + i * 0.24), n2 * 0.9, n2 * 0.1, B2);
      var p0 = y + h * 0.085;
      pill(g, x, p0, w * 0.86, h * 0.036, B2);
      pill(g, x, p0 + h * 0.05, w * 0.6, h * 0.036, B2);
      var ws2 = [0.94, 0.84, 0.52];
      for (i = 0; i < 3; i++) pill(g, x, p0 + h * (0.115 + i * 0.026), w * ws2[i], h * 0.013, B1);
      button(g, x, p0 + h * 0.21, w * 0.44, h * 0.05, 'Contact us', false);
      picture(g, x, p0 + h * 0.3, w, h * 0.2);
      longForm(g, x, p0 + h * 0.535, w, h * 0.28, 1, 4);
    }
  }

  function exitLabel(g, x, y, fs, dir) {
    var text = 'Exit';
    g.font = '700 ' + fs + 'px ' + FONT;
    var tw = g.measureText(text).width, aw = fs * 0.8, pw = tw + aw + fs * 1.5, ph = fs * 1.8;
    var px = dir === 'right' ? x - pw - fs * 0.5 : x - pw / 2, py = y - ph / 2;
    g.setLineDash([]);
    rr(g, px, py, pw, ph, ph / 2); g.fillStyle = 'rgba(12,11,16,0.88)'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#B9B4C4'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(text, px + fs * 0.65, py + ph / 2 + 1);
    var ax = px + fs * 0.65 + tw + fs * 0.32, ay = py + ph / 2 + 0.5;
    g.strokeStyle = '#B9B4C4'; g.lineWidth = Math.max(1.6, fs * 0.12); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    if (dir === 'right') {
      g.moveTo(ax, ay); g.lineTo(ax + aw, ay);
      g.moveTo(ax + aw * 0.6, ay - aw * 0.38); g.lineTo(ax + aw, ay); g.lineTo(ax + aw * 0.6, ay + aw * 0.38);
    } else {
      g.moveTo(ax + aw / 2, ay - aw * 0.45); g.lineTo(ax + aw / 2, ay + aw * 0.45);
      g.moveTo(ax + aw * 0.12, ay + aw * 0.07); g.lineTo(ax + aw / 2, ay + aw * 0.45); g.lineTo(ax + aw * 0.88, ay + aw * 0.07);
    }
    g.stroke();
  }

  function drawExit(g) {
    var fs = Math.round(clamp(L.U * 1.45, 12, 22)), gr;
    g.save();
    g.setLineDash([Math.max(4, L.U * 0.6), Math.max(5, L.U * 0.8)]);
    g.lineWidth = Math.max(1.5, L.U * 0.16); g.strokeStyle = 'rgba(255,255,255,0.22)';
    if (!L.portrait) {
      var x1 = L.cx + L.cw, x0 = x1 - L.cw * 0.12;
      gr = g.createLinearGradient(x0, 0, L.fx + L.fw, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.065)');
      g.fillStyle = gr; g.fillRect(x0, L.fy + L.bar, L.fx + L.fw - x0, L.fh - L.bar);
      g.beginPath(); g.moveTo(x1, L.fy + L.bar + 8); g.lineTo(x1, L.fy + L.fh - 8); g.stroke();
      exitLabel(g, x1, L.fy + L.bar + L.pad + fs * 0.9, fs, 'right');
    } else {
      var y1 = L.cy + L.ch, y0 = y1 - L.ch * 0.1;
      gr = g.createLinearGradient(0, y0, 0, L.fy + L.fh);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.065)');
      g.fillStyle = gr; g.fillRect(L.fx, y0, L.fw, L.fy + L.fh - y0);
      g.beginPath(); g.moveTo(L.fx + 8, y1); g.lineTo(L.fx + L.fw - 8, y1); g.stroke();
      exitLabel(g, L.cx + L.cw - fs * 3.2, y1 - fs * 1.4, fs, 'down');
    }
    g.restore();
  }

  function buildBg() {
    if (!L) return;
    var c = bgCanvas || document.createElement('canvas');
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    var g = c.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var mx = L.fx + L.fw / 2, my = L.fy + L.fh * 0.55, rad = Math.max(W, H) * 0.75;
    var gr = g.createRadialGradient(mx, my, 0, mx, my, rad);
    gr.addColorStop(0, 'rgba(98,44,120,0.22)'); gr.addColorStop(0.45, 'rgba(70,28,80,0.08)'); gr.addColorStop(1, 'rgba(12,11,16,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // frame with soft shadow
    g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
    rr(g, L.fx, L.fy, L.fw, L.fh, L.rad); g.fillStyle = '#121118'; g.fill(); g.restore();
    g.save(); rr(g, L.fx, L.fy, L.fw, L.fh, L.rad); g.clip();
    var cg = g.createLinearGradient(0, L.fy, 0, L.fy + L.fh);
    cg.addColorStop(0, '#15141C'); cg.addColorStop(1, '#100F15');
    g.fillStyle = cg; g.fillRect(L.fx, L.fy, L.fw, L.fh);
    // browser chrome
    g.fillStyle = '#1A1920'; g.fillRect(L.fx, L.fy, L.fw, L.bar);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(L.fx, L.fy + L.bar - 1, L.fw, 1);
    var dr = L.bar * 0.1;
    for (var i = 0; i < 3; i++) { g.beginPath(); g.arc(L.fx + L.bar * 0.55 + i * dr * 3.3, L.fy + L.bar / 2, dr, 0, TAU); g.fillStyle = '#3A3743'; g.fill(); }
    var pw = Math.min(L.fw * 0.44, 460), ph = L.bar * 0.6, px = L.fx + (L.fw - pw) / 2, py = L.fy + (L.bar - ph) / 2;
    rr(g, px, py, pw, ph, ph / 2); g.fillStyle = '#0F0E14'; g.fill();
    g.font = '600 ' + Math.round(ph * 0.48) + 'px ' + FONT; g.fillStyle = '#A29DAE'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Your website', px + pw / 2, py + ph / 2 + 1);
    drawSite(g);
    drawExit(g);
    g.restore();
    rr(g, L.fx + 0.5, L.fy + 0.5, L.fw - 1, L.fh - 1, L.rad); g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1; g.stroke();
    bgCanvas = c;
  }

  // ---------- visitors ----------
  // p runs 0..1 from entry to exit; c is the across position 0..1.
  function place(v) {
    var U = L.U;
    if (L.portrait) {
      var mx = U * 2.6;
      v.x = L.cx + mx + v.c * (L.cw - 2 * mx);
      v.y = L.cy + v.p * L.ch;
    } else {
      v.x = L.cx + v.p * L.cw;
      v.y = L.cy + U * 3.8 + v.c * (L.ch - U * 6.4);
    }
  }

  function spawn(d, demo) {
    var cross = demo ? rand(6.2, 7.6) : lerp(7.0, 2.8, Math.pow(d, 0.8)) * rand(0.88, 1.12);
    var c0 = rand(0.04, 0.96), tries = 0;
    while (Math.abs(c0 - lastC) < 0.16 && tries++ < 5) c0 = rand(0.04, 0.96);
    lastC = c0;
    var v = {
      p: -0.005, c0: c0, c: c0, amp: rand(0.008, 0.03), wf: rand(1.2, 2.4), phase: rand(0, TAU),
      speed: 1 / cross, t: 0, st: 0, state: 'walk', col: pick(PEOPLE),
      q: Math.random() < 0.3 ? pick(QUESTIONS) : null, qw: 0, qfs: 0, bookDelay: 1, x: 0, y: 0
    };
    place(v);
    visitors.push(v);
    if (!demo) stats.spawned++;
  }

  function greet(v) {
    v.state = 'lead'; v.st = 0; v.bookDelay = v.q ? 0.42 : 1.0;
    if (orb.tv === v) orb.tv = null;
    if (!bubble || bubble.t > 0.35) bubble = { text: v.q ? pick(ANSWERS) : pick(GREETS), t: 0, dur: 1.2, w: 0 };
    else bubble.dur = Math.max(bubble.dur, bubble.t + 0.8);
    burst(v.x, v.y, ORANGE, 9, 0.45);
    ring(v.x, v.y - 0.1 * L.U, ORANGE_INK, 1.5 * L.U, 4.4 * L.U, 0.35, 0.25 * L.U);
    if (mode === 'play') { stats.greeted++; setHud(); bump(el.statGreeted); sPop(); }
  }

  function book(v, counted) {
    v.state = 'booked'; v.st = 0;
    ring(v.x, v.y - 0.1 * L.U, YELLOW, 2.2 * L.U, 6.8 * L.U, 0.5, 0.32 * L.U);
    burst(v.x, v.y, YELLOW, 8, 0.6);
    if (counted) { stats.booked++; if (mode === 'play') sDing(); }
  }

  function lose(v) {
    var fx = L.portrait ? v.x : L.cx + L.cw - 2.5 * L.U;
    var fy = L.portrait ? L.cy + L.ch - 3.5 * L.U : v.y - 1.2 * L.U;
    floaters.push({ x: fx, y: fy, text: 'Lost', t: 0, dur: 0.95, col: [190, 185, 202] });
    if (mode === 'play') { stats.lost++; setHud(); bump(el.statLost); }
  }

  function flyToCounter(v) {
    var r = el.booked.getBoundingClientRect();
    if (mode === 'play' && r.width > 0) {
      flyers.push({ x0: v.x, y0: v.y, x1: r.left + r.width / 2, y1: r.top + r.height / 2, t: 0, dur: 0.6 });
    } else {
      floaters.push({ x: v.x, y: v.y - 2.6 * L.U, text: 'Booked', t: 0, dur: 1.0, col: [255, 158, 112] });
    }
  }

  function updVisitors(dt) {
    for (var i = visitors.length - 1; i >= 0; i--) {
      var v = visitors[i];
      v.t += dt; v.st += dt;
      if (v.state === 'walk' || v.state === 'leave') {
        v.p += v.speed * dt * (v.state === 'leave' ? 3.2 : 1);
        v.c = clamp(v.c0 + Math.sin(v.t * v.wf + v.phase) * v.amp, 0, 1);
        place(v);
        if (v.p >= 1) {
          visitors.splice(i, 1);
          if (orb.tv === v) orb.tv = null;
          if (v.state === 'walk') lose(v);
        }
      } else if (v.state === 'lead') {
        place(v);
        if (v.st >= v.bookDelay) book(v, mode === 'play');
      } else if (v.state === 'booked') {
        place(v);
        if (v.st >= 0.5) { visitors.splice(i, 1); flyToCounter(v); }
      }
    }
  }

  function checkGreets() {
    var reach = orbR() + 1.6 * L.U, r2 = reach * reach;
    for (var i = 0; i < visitors.length; i++) {
      var v = visitors[i];
      if (v.state !== 'walk' || v.t < 0.12) continue;
      var dx = v.x - orb.x, dy = (v.y - 0.3 * L.U) - orb.y;
      if (dx * dx + dy * dy < r2) greet(v);
    }
  }

  function pickVisitor(x, y) {
    var best = null, bd = Math.max(44, L.U * 7.5);
    for (var i = 0; i < visitors.length; i++) {
      var v = visitors[i];
      if (v.state !== 'walk') continue;
      var dx = v.x - x, dy = (v.y - 0.3 * L.U) - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }

  // ---------- orb ----------
  function updOrb(dt) {
    if (orb.tv) {
      if (orb.tv.state !== 'walk') orb.tv = null;
      else { orb.tx = orb.tv.x; orb.ty = orb.tv.y - 0.3 * L.U; }
    }
    var dx = orb.tx - orb.x, dy = orb.ty - orb.y, d = Math.sqrt(dx * dx + dy * dy);
    var vmax = L.U * (orb.drag ? 190 : (mode === 'attract' ? 60 : 88));
    var want = Math.min(vmax, d * (orb.drag ? 18 : 9));
    var ux = d > 0.0001 ? dx / d : 0, uy = d > 0.0001 ? dy / d : 0;
    var k = 1 - Math.exp(-dt * (orb.drag ? 30 : 14));
    orb.vx += (ux * want - orb.vx) * k; orb.vy += (uy * want - orb.vy) * k;
    orb.x += orb.vx * dt; orb.y += orb.vy * dt;
    var R = orbR();
    orb.x = clamp(orb.x, L.cx + R * 0.6, L.cx + L.cw - R * 0.6);
    orb.y = clamp(orb.y, L.cy + R * 0.6, L.cy + L.ch - R * 0.6);
    if (mode === 'attract' && demoZone) orb.x = clamp(orb.x, demoZone.l, demoZone.r);
    var last = orb.trail[orb.trail.length - 1];
    if (!last || Math.abs(last.x - orb.x) + Math.abs(last.y - orb.y) > 3) {
      orb.trail.push({ x: orb.x, y: orb.y });
      if (orb.trail.length > 10) orb.trail.shift();
    } else if (orb.trail.length) orb.trail.shift();
  }

  function setTarget(x, y) { orb.tx = x; orb.ty = y; }

  // Attract mode: the orb plays itself in the open window between the title and the leaderboard.
  var demoZone = null;
  function computeDemoZone() {
    demoZone = null;
    if (!L || L.portrait) return;
    try {
      var main = el.attract.querySelector('.attract-main'), card = el.attract.querySelector('.board-card');
      var right = 0, kids = main.children;
      for (var i = 0; i < kids.length; i++) {
        var rg = document.createRange(); rg.selectNodeContents(kids[i]);
        right = Math.max(right, rg.getBoundingClientRect().right);
      }
      var l = right + orbR() * 1.6, r = card.getBoundingClientRect().left - orbR() * 1.6;
      if (r - l > orbR() * 5) demoZone = { l: l, r: r };
    } catch (e) { demoZone = null; }
  }

  function demoAI(dt) {
    demoSpawnT -= dt;
    if (demoSpawnT <= 0) { spawn(0, true); demoSpawnT = rand(0.45, 0.8); }
    aiT -= dt;
    if (aiT > 0) return;
    aiT = 0.3;
    var best = null, bs = -1e9, axis = L.portrait ? L.ch : L.cw, R = orbR();
    for (var i = 0; i < visitors.length; i++) {
      var v = visitors[i];
      if (v.state !== 'walk' || v.t < 0.3 || v.p > 0.92) continue;
      if (demoZone && (v.x < demoZone.l - R * 0.5 || v.x > demoZone.r + R * 0.5)) continue;
      var d = Math.sqrt((v.x - orb.x) * (v.x - orb.x) + (v.y - orb.y) * (v.y - orb.y));
      var s = v.p - d / axis * 0.9;
      if (s > bs) { bs = s; best = v; }
    }
    if (best && best !== orb.tv) { orb.tv = best; tapRing(best.x, best.y - 0.3 * L.U); }
    if (!best && !orb.tv) setTarget(demoZone ? (demoZone.l + demoZone.r) / 2 : L.cx + L.cw * 0.5, L.cy + L.ch * 0.55);
  }

  // ---------- effects ----------
  function burst(x, y, col, n, spd) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), v = rand(0.4, 1) * spd * L.U * 30;
      sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, dur: rand(0.35, 0.6), col: col, r: rand(0.25, 0.5) * L.U });
    }
  }
  function ring(x, y, col, r0, r1, dur, w) { rings.push({ x: x, y: y, col: col, r0: r0, r1: r1, t: 0, dur: dur, w: w }); }
  function tapRing(x, y) { taps.push({ x: x, y: y, t: 0, dur: 0.4 }); }

  function updFx(dt) {
    var i, p;
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i]; p.t += dt;
      if (p.t >= p.dur) { sparks.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9;
    }
    for (i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t >= rings[i].dur) rings.splice(i, 1); }
    for (i = taps.length - 1; i >= 0; i--) { taps[i].t += dt; if (taps[i].t >= taps[i].dur) taps.splice(i, 1); }
    for (i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t >= floaters[i].dur) floaters.splice(i, 1); }
    for (i = flyers.length - 1; i >= 0; i--) {
      p = flyers[i]; p.t += dt;
      if (p.t >= p.dur) {
        flyers.splice(i, 1);
        if (mode === 'play') { shownBooked = Math.min(stats.booked, shownBooked + 1); setHud(); bump(el.statBooked); }
      }
    }
    if (bubble) { bubble.t += dt; if (bubble.t >= bubble.dur) bubble = null; }
  }

  // ---------- HUD ----------
  function setHud() {
    el.greeted.textContent = stats.greeted;
    el.booked.textContent = shownBooked;
    el.lost.textContent = stats.lost;
  }
  function bump(node) { node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump'); }

  // ---------- drawing ----------
  function person(x, y, s, fill, a) {
    ctx.globalAlpha = a; ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y - 1.3 * s, 1.0 * s, 0, TAU); ctx.fill();
    rr(ctx, x - 1.6 * s, y - 0.02 * s, 3.2 * s, 2.15 * s, [1.35 * s, 1.35 * s, 0.4 * s, 0.4 * s]); ctx.fill();
  }

  function drawQuestion(v, a) {
    var fs = Math.round(clamp(L.U * 1.6, 11, 24));
    ctx.font = '700 ' + fs + 'px ' + FONT;
    if (!v.qw || v.qfs !== fs) { v.qw = ctx.measureText(v.q).width; v.qfs = fs; }
    var s = L.U, pw = v.qw + fs * 1.1, ph = fs * 1.65;
    var px = clamp(v.x - pw / 2, L.fx + 4, L.fx + L.fw - pw - 4), py = v.y - 2.55 * s - ph - fs * 0.4;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    rr(ctx, px, py, pw, ph, ph / 2); ctx.fill();
    var tx = clamp(v.x, px + ph * 0.5, px + pw - ph * 0.5);
    ctx.beginPath(); ctx.moveTo(tx - fs * 0.32, py + ph - 1); ctx.lineTo(tx, py + ph + fs * 0.38); ctx.lineTo(tx + fs * 0.32, py + ph - 1); ctx.fill();
    ctx.fillStyle = '#15131B'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.q, px + pw / 2, py + ph / 2 + 1);
  }

  function drawVisitor(v) {
    var s = L.U, x = v.x, y = v.y, a = Math.min(1, v.t / 0.25), col, glow = 0;
    if (v.state === 'walk' || v.state === 'leave') a *= clamp((1 - v.p) / 0.06, 0, 1);
    if (a <= 0.01) return;
    if (v.state === 'lead') { var k = Math.min(1, v.st / 0.2); col = mix(v.col, C_ORANGE, k); glow = k; }
    else if (v.state === 'booked') { col = C_ORANGE; glow = 1; }
    else col = v.col;
    if (glow > 0 && glowSprite) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 * glow * a;
      var G = s * 6.5;
      ctx.drawImage(glowSprite, x - G, y - G, G * 2, G * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (v.state === 'walk' || v.state === 'leave') {
      ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(225,220,235,0.22)'; ctx.lineWidth = Math.max(1.5, 0.22 * s); ctx.lineCap = 'round';
      ctx.beginPath();
      if (!L.portrait) {
        ctx.moveTo(x - 2.4 * s, y - 0.9 * s); ctx.lineTo(x - 4.0 * s, y - 0.9 * s);
        ctx.moveTo(x - 2.6 * s, y + 0.7 * s); ctx.lineTo(x - 3.6 * s, y + 0.7 * s);
      } else {
        ctx.moveTo(x - 2.3 * s, y - 1.0 * s); ctx.lineTo(x - 2.3 * s, y - 2.4 * s);
        ctx.moveTo(x + 2.3 * s, y - 0.6 * s); ctx.lineTo(x + 2.3 * s, y - 1.6 * s);
      }
      ctx.stroke();
    }
    person(x, y, s, rgb(col), a);
    if (v.state === 'lead') {
      var k2 = clamp(v.st / v.bookDelay, 0, 1);
      ctx.globalAlpha = a; ctx.lineWidth = Math.max(2, 0.32 * s); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,158,112,0.22)';
      ctx.beginPath(); ctx.arc(x, y - 0.1 * s, 3.25 * s, 0, TAU); ctx.stroke();
      ctx.strokeStyle = ORANGE_INK;
      ctx.beginPath(); ctx.arc(x, y - 0.1 * s, 3.25 * s, -Math.PI / 2, -Math.PI / 2 + TAU * k2); ctx.stroke();
    } else if (v.state === 'booked') {
      var k3 = easeOutBack(clamp(v.st / 0.28, 0, 1)), br = Math.max(0.01, 1.2 * s * k3), bx = x + 1.75 * s, by = y - 2.15 * s;
      ctx.globalAlpha = a;
      ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1C1505'; ctx.lineWidth = Math.max(1.6, 0.3 * s * k3); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 0.48 * br, by + 0.02 * br); ctx.lineTo(bx - 0.12 * br, by + 0.36 * br); ctx.lineTo(bx + 0.5 * br, by - 0.34 * br); ctx.stroke();
    }
    if (v.q && v.state === 'walk') drawQuestion(v, a);
    ctx.globalAlpha = 1;
  }

  function drawOrb() {
    var R = orbR(), pulse = 1 + 0.025 * Math.sin(clock * 2.4), i;
    if (glowSprite) {
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < orb.trail.length; i++) {
        var p = orb.trail[i], k = (i + 1) / orb.trail.length, G = R * (0.8 + 0.7 * k);
        ctx.globalAlpha = 0.09 * k;
        ctx.drawImage(glowSprite, p.x - G, p.y - G, G * 2, G * 2);
      }
      ctx.globalAlpha = 0.8;
      var G2 = R * 3.2 * pulse;
      ctx.drawImage(glowSprite, orb.x - G2, orb.y - G2, G2 * 2, G2 * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    var S = R * 2.36 * pulse;
    if (orbSprite) ctx.drawImage(orbSprite, orb.x - S / 2, orb.y - S / 2, S, S);
    else {
      var gr = ctx.createRadialGradient(orb.x - R * 0.3, orb.y - R * 0.3, R * 0.1, orb.x, orb.y, R);
      gr.addColorStop(0, '#FFB27A'); gr.addColorStop(0.5, '#C2306E'); gr.addColorStop(1, '#3A1250');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(orb.x, orb.y, R, 0, TAU); ctx.fill();
    }
  }

  function drawBubble() {
    if (!bubble) return;
    var a = Math.min(1, bubble.t / 0.12) * clamp((bubble.dur - bubble.t) / 0.2, 0, 1);
    if (a <= 0) return;
    var fs = Math.round(clamp(L.U * 1.9, 13, 28)), ks = Math.round(fs * 0.6);
    ctx.font = '700 ' + fs + 'px ' + FONT;
    if (!bubble.w || bubble.fs !== fs) { bubble.w = ctx.measureText(bubble.text).width; bubble.fs = fs; }
    var R = orbR(), pw = bubble.w + fs * 1.4, ph = fs * 1.35 + ks * 1.5 + fs * 0.7;
    var bx = clamp(orb.x - pw * 0.28, L.fx + 8, L.fx + L.fw - pw - 8);
    var by = orb.y - R * 1.15 - ph - fs * 0.45, below = false;
    if (by < L.fy + L.bar + 4) { by = orb.y + R * 1.15 + fs * 0.45; below = true; }
    var sc = 0.86 + 0.14 * Math.min(1, bubble.t / 0.12);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(orb.x, orb.y); ctx.scale(sc, sc); ctx.translate(-orb.x, -orb.y);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    rr(ctx, bx, by, pw, ph, Math.min(ph * 0.32, fs)); ctx.fill();
    ctx.shadowColor = 'transparent';
    var tx = clamp(orb.x, bx + fs, bx + pw - fs);
    ctx.beginPath();
    if (!below) { ctx.moveTo(tx - fs * 0.45, by + ph - 1); ctx.lineTo(tx - fs * 0.1, by + ph + fs * 0.55); ctx.lineTo(tx + fs * 0.4, by + ph - 1); }
    else { ctx.moveTo(tx - fs * 0.45, by + 1); ctx.lineTo(tx - fs * 0.1, by - fs * 0.55); ctx.lineTo(tx + fs * 0.4, by + 1); }
    ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = '700 ' + ks + 'px ' + FONT; ctx.fillStyle = ORANGE;
    ctx.fillText('Your website, talking', bx + fs * 0.7, by + fs * 0.35 + ks);
    ctx.font = '700 ' + fs + 'px ' + FONT; ctx.fillStyle = '#15131B';
    ctx.fillText(bubble.text, bx + fs * 0.7, by + fs * 0.35 + ks * 1.5 + fs);
    ctx.restore();
  }

  function drawFx() {
    var i, p, k;
    for (i = 0; i < rings.length; i++) {
      p = rings[i]; k = p.t / p.dur;
      ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = p.col; ctx.lineWidth = Math.max(1.5, p.w * (1 - k * 0.6));
      ctx.beginPath(); ctx.arc(p.x, p.y, lerp(p.r0, p.r1, 1 - Math.pow(1 - k, 3)), 0, TAU); ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i]; k = p.t / p.dur;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r * (1 - k * 0.5)), 0, TAU); ctx.fill();
    }
    for (i = 0; i < taps.length; i++) {
      p = taps[i]; k = p.t / p.dur;
      ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(1.5, 0.22 * L.U);
      ctx.beginPath(); ctx.arc(p.x, p.y, lerp(0.8, 3.4, 1 - Math.pow(1 - k, 2)) * L.U, 0, TAU); ctx.stroke();
    }
    var fs = Math.round(clamp(L.U * 1.5, 12, 22));
    ctx.font = '700 ' + fs + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (i = 0; i < floaters.length; i++) {
      p = floaters[i]; k = p.t / p.dur;
      ctx.globalAlpha = Math.min(1, (1 - k) * 1.6); ctx.fillStyle = rgb(p.col);
      ctx.fillText(p.text, p.x, p.y - k * 2.2 * L.U);
    }
    for (i = 0; i < flyers.length; i++) {
      p = flyers[i];
      for (var j = 0; j < 5; j++) {
        var tt = clamp((p.t - j * 0.035) / p.dur, 0, 1), e = easeInOut(tt);
        var cxp = (p.x0 + p.x1) / 2, cyp = Math.min(p.y0, p.y1) - 8 * L.U;
        var x = (1 - e) * (1 - e) * p.x0 + 2 * (1 - e) * e * cxp + e * e * p.x1;
        var y = (1 - e) * (1 - e) * p.y0 + 2 * (1 - e) * e * cyp + e * e * p.y1;
        var r = Math.max(2, L.U * (1.15 - 0.45 * e) * (1 - j * 0.16));
        ctx.globalAlpha = j === 0 ? 1 : 0.45 - j * 0.07;
        ctx.fillStyle = j === 0 ? ORANGE : ORANGE_INK;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        if (j === 0 && glowSprite) {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6;
          ctx.drawImage(glowSprite, x - r * 4, y - r * 4, r * 8, r * 8);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawTimeBar() {
    var frac = mode === 'play' ? clamp(left / ROUND, 0, 1) : (mode === 'countdown' ? 1 : 0);
    if (frac <= 0) return;
    var y = L.fy + L.bar - 2, w = (L.fw - 2) * frac;
    ctx.globalAlpha = 1; ctx.fillStyle = ORANGE;
    ctx.fillRect(L.fx + 1, y - 1, w, 3);
    if (glowSprite) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8;
      ctx.drawImage(glowSprite, L.fx + 1 + w - 14, y - 14, 28, 28);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, W, H);
    else { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); }
    drawTimeBar();
    for (var i = 0; i < visitors.length; i++) drawVisitor(visitors[i]);
    drawOrb();
    drawFx();
    drawBubble();
  }

  // ---------- modes ----------
  function clearScene() {
    visitors.length = 0; sparks.length = 0; rings.length = 0; floaters.length = 0; flyers.length = 0; taps.length = 0;
    bubble = null; orb.tv = null; orb.drag = false; ptr = null;
  }
  function centerOrb() {
    orb.x = orb.tx = L.cx + L.cw * 0.5; orb.y = orb.ty = L.cy + L.ch * 0.55;
    orb.vx = orb.vy = 0; orb.trail.length = 0;
  }
  function show(name) {
    ['attract', 'countdown', 'end'].forEach(function (n) {
      el[n].classList.toggle('on', n === name);
      el[n].setAttribute('aria-hidden', n === name ? 'false' : 'true');
    });
    el.hud.classList.toggle('hidden', !(name === 'countdown' || name === null));
    placeMute();
  }

  function toAttract() {
    if (mode === 'end' && pendingEntry && cleanInitials(el.initials.value)) saveScore();
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) { /* ignore */ }
    mode = 'attract';
    clearScene();
    renderBoard(el.boardA, 0);
    show('attract');
    computeDemoZone(); centerOrb();
    if (demoZone) { orb.x = orb.tx = (demoZone.l + demoZone.r) / 2; }
    demoSpawnT = 0.1; aiT = 0;
  }

  function startCountdown() {
    audioInit();
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) { /* ignore */ }
    mode = 'countdown'; cdT = 0; cdStep = -1;
    clearScene(); centerOrb();
    stats = { greeted: 0, booked: 0, lost: 0, spawned: 0 }; shownBooked = 0; left = ROUND; lastSec = -1;
    pendingEntry = null;
    setHud();
    el.timer.textContent = ROUND; el.timerBox.classList.remove('hurry');
    el.count.classList.remove('go');
    show('countdown');
  }

  function startPlay() {
    mode = 'play'; playStart = now(); spawnIdx = 0; left = ROUND;
    show(null);
  }

  function endRound() {
    mode = 'over'; overT = 0; ptr = null; orb.drag = false; orb.tv = null; left = 0;
    for (var i = 0; i < visitors.length; i++) {
      var v = visitors[i];
      if (v.state === 'walk') { v.state = 'leave'; stats.lost++; }
      else if (v.state === 'lead') book(v, true);
    }
    shownBooked = stats.booked;
    setHud();
    el.timer.textContent = 0; el.timerBox.classList.remove('hurry');
    sEnd();
  }

  function setDots(box, n) {
    var d = box.children;
    for (var i = 0; i < d.length; i++) {
      d[i].style.transitionDelay = (i < n ? i * 9 : 0) + 'ms';
      d[i].className = i < n ? 'on' : '';
    }
  }

  function showEnd() {
    var n = stats.booked, m = stats.spawned, p = m ? Math.round(100 * n / m) : 0;
    if (window.CVP) {
      // the CVP Challenge (challenge.js) takes over from here
      mode = 'hold'; show('none');
      window.CVP.roundOver({ booked: n, total: m, pct: p });
      return;
    }
    mode = 'end'; endIdle = 0;
    el.rn.textContent = n; el.rm.textContent = m; el.rp.textContent = p;
    setDots(el.dotsYou, 0); setDots(el.dotsNorm, 0);
    setTimeout(function () { if (mode === 'end') { setDots(el.dotsYou, p); setDots(el.dotsNorm, 7); } }, 420);
    pendingEntry = qualifies(n, m) ? { n: n, m: m } : null;
    el.form.hidden = !pendingEntry;
    el.saved.hidden = true; el.saved.textContent = '';
    el.initials.value = '';
    renderBoard(el.boardE, 0);
    show('end');
    try { el.end.scrollTop = 0; } catch (e) { /* ignore */ }
    if (pendingEntry && lastPointerType === 'mouse') {
      setTimeout(function () { if (mode === 'end' && pendingEntry) { try { el.initials.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, 150);
    }
  }

  function saveScore() {
    if (!pendingEntry) return;
    var ini = cleanInitials(el.initials.value);
    if (!ini) { try { el.initials.focus(); } catch (e) { /* ignore */ } return; }
    var entry = { i: ini, n: pendingEntry.n, m: pendingEntry.m, t: Date.now() };
    var b = getBoard(); b.push(entry); b.sort(cmp); b = b.slice(0, 10);
    saveBoard(b);
    var rank = b.indexOf(entry) + 1;
    pendingEntry = null;
    el.form.hidden = true;
    el.saved.hidden = false;
    el.saved.textContent = rank > 0 ? 'Saved. ' + ini + ' is number ' + rank + ' on the board.' : 'Saved.';
    renderBoard(el.boardE, entry.t);
    renderBoard(el.boardA, 0);
    try { el.initials.blur(); } catch (e) { /* ignore */ }
  }

  // ---------- main loop ----------
  var lastT = now();
  function update(dt) {
    clock += dt;
    if (mode === 'attract') {
      demoAI(dt);
    } else if (mode === 'countdown') {
      cdT += dt;
      var step = Math.floor(cdT / CD_STEP);
      if (step !== cdStep) {
        cdStep = step;
        if (step < 3) {
          el.count.textContent = String(3 - step);
          el.count.classList.remove('pop'); void el.count.offsetWidth; el.count.classList.add('pop');
          sTick();
        } else {
          el.count.textContent = 'Go!'; el.count.classList.add('go');
          el.count.classList.remove('pop'); void el.count.offsetWidth; el.count.classList.add('pop');
          sGo();
          startPlay();
        }
      }
    } else if (mode === 'play') {
      var elapsed = (now() - playStart) / 1000;
      while (spawnIdx < SCHEDULE.length && SCHEDULE[spawnIdx] <= elapsed) { spawn(elapsed / ROUND, false); spawnIdx++; }
      left = Math.max(0, ROUND - elapsed);
      var sec = Math.ceil(left);
      if (sec !== lastSec) {
        lastSec = sec;
        el.timer.textContent = sec;
        el.timerBox.classList.toggle('hurry', sec <= 5 && sec > 0);
        if (sec <= 5 && sec > 0) sTick();
      }
      if (elapsed >= ROUND) endRound();
    } else if (mode === 'over') {
      overT += dt;
      if (overT >= 0.9) showEnd();
    } else if (mode === 'end') {
      endIdle += dt;
      if (endIdle >= END_IDLE) toAttract();
    }
    updOrb(dt);
    updVisitors(dt);
    if (mode === 'play' || mode === 'attract') checkGreets();
    updFx(dt);
  }

  function frame() {
    var t = now();
    var dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
    lastT = t;
    try {
      if (needLayout) { needLayout = false; layout(); }
      update(dt); draw();
    } catch (e) { if (window.console) console.error(e); }
    window.requestAnimationFrame(frame);
  }

  // ---------- input ----------
  function localPoint(e) { return { x: e.clientX, y: e.clientY }; }

  canvas.addEventListener('pointerdown', function (e) {
    lastPointerType = e.pointerType || 'mouse';
    audioInit();
    if (mode !== 'play' && mode !== 'countdown') return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or unsupported */ }
    var pt = localPoint(e);
    ptr = { id: e.pointerId, x0: pt.x, y0: pt.y, moved: false };
    var onOrb = Math.sqrt((pt.x - orb.x) * (pt.x - orb.x) + (pt.y - orb.y) * (pt.y - orb.y)) < orbR() * 1.25;
    if (onOrb) {
      orb.drag = true; orb.tv = null; setTarget(pt.x, pt.y);
    } else {
      var v = pickVisitor(pt.x, pt.y);
      if (v) orb.tv = v; else { orb.tv = null; setTarget(pt.x, pt.y); }
      tapRing(pt.x, pt.y);
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var pt = localPoint(e);
    if (!ptr.moved && Math.abs(pt.x - ptr.x0) + Math.abs(pt.y - ptr.y0) > 12) { ptr.moved = true; orb.drag = true; orb.tv = null; }
    if (orb.drag) setTarget(pt.x, pt.y);
  });
  function endPointer(e) { if (ptr && e.pointerId === ptr.id) { ptr = null; orb.drag = false; } }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  el.attract.addEventListener('pointerdown', function (e) {
    if (mode !== 'attract') return;
    lastPointerType = e.pointerType || 'mouse';
    e.preventDefault();
    if (window.CVP) window.CVP.begin(); else startCountdown();
  });

  el.mute.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  el.mute.addEventListener('click', function (e) {
    e.stopPropagation();
    audioInit();
    setMuted(!muted);
    if (!muted) sPop();
  });

  el.again.addEventListener('click', function () { startCountdown(); });
  el.form.addEventListener('submit', function (e) { e.preventDefault(); saveScore(); });
  el.initials.addEventListener('input', function () {
    var c = cleanInitials(el.initials.value);
    if (c !== el.initials.value) el.initials.value = c;
    endIdle = 0;
  });

  // Any input on the end screen keeps it open.
  window.addEventListener('pointerdown', function (e) { endIdle = 0; lastPointerType = e.pointerType || lastPointerType; audioInit(); }, true);

  window.addEventListener('keydown', function (e) {
    endIdle = 0;
    var k = e.key;
    if (mode === 'attract') {
      if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        e.preventDefault(); lastPointerType = 'mouse';
        if (window.CVP) window.CVP.begin(); else startCountdown();
      }
      return;
    }
    if (mode === 'end') {
      var ae = document.activeElement, typing = ae === el.initials;
      if (!typing && pendingEntry && k && k.length === 1 && /[a-z0-9]/i.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        el.initials.value = cleanInitials(el.initials.value + k);
        try { el.initials.focus(); } catch (err) { /* ignore */ }
        return;
      }
      if (!typing && (k === 'Enter' || k === ' ') && !(ae && (ae.tagName === 'BUTTON' || ae.tagName === 'A'))) {
        e.preventDefault(); startCountdown();
      }
    }
  });

  // No page scroll, pull to refresh or pinch zoom while playing.
  document.addEventListener('touchmove', function (e) { if (mode !== 'end') e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  window.addEventListener('resize', function () { needLayout = true; });
  window.addEventListener('orientationchange', function () { needLayout = true; });

  // Re-render canvas text once Inter arrives (the game never waits for it).
  function onFonts() {
    try {
      if (L) buildBg();
      if (bubble) bubble.w = 0;
      for (var i = 0; i < visitors.length; i++) visitors[i].qw = 0;
      if (mode === 'attract') computeDemoZone();
    } catch (e) { /* ignore */ }
  }
  try {
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(onFonts);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
    }
  } catch (e) { /* ignore */ }

  // ---------- boot ----------
  (function makeDots() {
    [el.dotsYou, el.dotsNorm].forEach(function (box) {
      for (var i = 0; i < 100; i++) box.appendChild(document.createElement('i'));
    });
  })();
  setMuted(muted);
  try { layout(); } catch (e) { needLayout = true; if (window.console) console.error(e); }
  toAttract();
  window.requestAnimationFrame(frame);

  // Controls for the CVP Challenge (challenge.js)
  window.__rescueCtl = { start: startCountdown, toAttract: toAttract, round: ROUND };

  // Read-only hooks for testing at the stand (no effect on play).
  window.__rescue = {
    state: function () {
      return { mode: mode, greeted: stats.greeted, booked: stats.booked, lost: stats.lost, spawned: stats.spawned,
        shownBooked: shownBooked, scheduled: SCHEDULE.length, left: Math.round(left * 100) / 100,
        onScreen: visitors.length, endIdle: Math.round(endIdle * 10) / 10 };
    },
    visitors: function () {
      return visitors.filter(function (v) { return v.state === 'walk'; })
        .map(function (v) { return { x: Math.round(v.x), y: Math.round(v.y), p: Math.round(v.p * 100) / 100, q: v.q }; });
    },
    orb: function () { return { x: Math.round(orb.x), y: Math.round(orb.y) }; },
    board: function () { return getBoard(); }
  };
})();
