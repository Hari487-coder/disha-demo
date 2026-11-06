/* The CVP Challenge: three quick levels around the Rescue round, with a prize for winners.
   Anyone can play: the game teaches the Value Proposition Canvas as you go.
   1 Catch the pains: unhappy customers drift, dart and hide. Tap them, leave the happy ones.
     Each catch shows its fix, which is the canvas idea: every pain gets a pain reliever.
   2 Rescue the visitors: the arcade round in game.js, with a goal to beat.
   3 Build the pitch: finish the value proposition statement.
   Win all three to get a prize code to show at the stand. */
(function () {
  'use strict';

  // ---------- rules (tune here) ----------
  var HUNT_TIME = 25;     // seconds for level 1
  var HUNT_GOAL = 8;      // pains to catch
  var HUNT_LIVES = 3;     // wrong taps (happy customers) allowed before the level ends
  var GOAL_PCT = 40;      // share of visitors to book in level 2 (a normal website books 7; one sure tap a second gets about 40)
  var PITCH_MISTAKES = 1; // wrong taps allowed in level 3
  var RESULT_IDLE = 60;   // seconds before the result screen goes back to the start

  // Pains a website visitor feels, each with the fix (the pain reliever).
  var PAINS = [
    { t: 'Waited 42 hours for a reply', fix: 'Disha replies in seconds' },
    { t: 'Left without asking anything', fix: 'Disha says hello first' },
    { t: 'Long “Contact us” form', fix: 'Book right inside the chat' },
    { t: 'Website silent at 2 AM', fix: 'Open 24x7' },
    { t: 'Couldn’t find the visit page', fix: 'Disha guides you to it' },
    { t: 'Nobody answered the phone', fix: 'Every question answered' },
    { t: 'Got lost in the menus', fix: 'Just ask, by voice or chat' },
    { t: 'Didn’t know whom to ask', fix: 'Disha points to the right office' }
  ];
  // Gains: what happy customers already got. Leave them alone.
  var GAINS = ['Booked a campus visit', 'Got an answer fast', 'Felt welcome', 'Found the hostel info', 'Became a client'];

  var PITCH = [
    'For ',
    { opts: ['colleges, clinics and local shops', 'people who never use websites', 'website designers'], a: 0 },
    ' whose websites get visitors but few enquiries, our ',
    { opts: ['longer contact form', 'AI voice orb and chatbot', 'bigger logo'], a: 1 },
    ' is a 24x7 front desk that ',
    { opts: ['greets every visitor and books them', 'shows more adverts', 'sends a weekly newsletter'], a: 0 },
    '. Unlike ',
    { opts: ['a free laptop', 'a discount coupon', 'a “Contact us” form'], a: 2 },
    ', it starts the conversation.'
  ];

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function restart(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  var SCREENS = ['cv-brief', 'cv-hunt', 'cv-pitch', 'cv-result'];
  function show(id) {
    SCREENS.forEach(function (s) { var n = $(s); n.classList.toggle('on', s === id); n.setAttribute('aria-hidden', s === id ? 'false' : 'true'); });
    $('cv-score').classList.toggle('on', id === 'cv-hunt' || id === 'cv-pitch' || id === 'cv-brief');
  }

  // ---------- sound (tiny synth, no files) ----------
  var ac = null;
  function audio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    return ac;
  }
  function muted() { var m = $('mute'); return m && m.classList.contains('off'); }
  function beep(freq, delay, dur, type, vol) {
    var a = audio(); if (!a || muted()) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  function sRight(step) { var b = 660 * Math.pow(2, Math.min(step, 8) / 12); beep(b, 0, 0.14, 'triangle', 0.09); beep(b * 1.5, 0.07, 0.2, 'sine', 0.07); }
  function sWrong() { beep(220, 0, 0.22, 'sawtooth', 0.04); beep(160, 0.08, 0.25, 'sawtooth', 0.035); }
  function sTick() { beep(900, 0, 0.04, 'square', 0.02); }
  function sLevel() { [0, 4, 7].forEach(function (s, i) { beep(523 * Math.pow(2, s / 12), i * 0.08, 0.3, 'triangle', 0.07); }); }
  function sWin() { [0, 4, 7, 12, 16, 19, 24].forEach(function (s, i) { beep(523 * Math.pow(2, s / 12), i * 0.07, 0.5, 'triangle', 0.08); }); }

  // ---------- confetti ----------
  var fx = $('cv-confetti'), fctx = fx.getContext('2d'), bits = [], fxOn = false;
  function confetti(n, x, y) {
    var d = window.devicePixelRatio || 1;
    fx.width = innerWidth * d; fx.height = innerHeight * d;
    var cols = ['#FF5A1F', '#FFC21A', '#FF9E70', '#C4B5FD', '#4ADE80', '#FFFFFF'];
    var cx = x == null ? null : x * d, cy = y == null ? fx.height * 0.35 : y * d;
    for (var i = 0; i < n; i++) {
      bits.push({ x: cx == null ? fx.width * rand(0.2, 0.8) : cx, y: cy, vx: rand(-13, 13) * d, vy: rand(-16, -6) * d,
        r: rand(0, 6), vr: rand(-0.2, 0.2), s: rand(5, 12) * d, c: pick(cols), life: 1, d: d });
    }
    if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
  }
  function fxLoop() {
    fctx.clearRect(0, 0, fx.width, fx.height);
    bits = bits.filter(function (b) { return b.life > 0 && b.y < fx.height + 40; });
    bits.forEach(function (b) {
      b.vy += 0.55 * b.d; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life -= 0.007;
      fctx.save(); fctx.translate(b.x, b.y); fctx.rotate(b.r); fctx.globalAlpha = Math.max(0, b.life);
      fctx.fillStyle = b.c; fctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); fctx.restore();
    });
    if (bits.length) requestAnimationFrame(fxLoop); else { fxOn = false; fctx.clearRect(0, 0, fx.width, fx.height); }
  }

  // ---------- run state ----------
  var active = false, points = 0, hunt = null, rescue = null, pitch = null, idleT = 0, idleTimer = 0;
  function floatText(txt, x, y, cls) {
    var f = document.createElement('div'); f.className = 'cv-float ' + (cls || ''); f.textContent = txt;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 900);
  }
  function addPoints(n, from) {
    points += n; $('cv-points').textContent = points.toLocaleString('en-IN'); restart($('cv-score'), 'bump');
    if (from) { var r = from.getBoundingClientRect(); floatText('+' + n, r.left + r.width / 2, r.top); }
  }

  function begin() {
    if (active) return;
    active = true; points = 0; rescue = null;
    audio();
    $('cv-points').textContent = '0';
    $('attract').classList.remove('on');
    brief(1, 'Catch the pains',
      'Unhappy customers are hiding on this website. Catch them!',
      'Tap the sad faces 😟 before they slip away. Leave the happy ones 🙂 alone. Catch ' + HUNT_GOAL + ' in ' + HUNT_TIME + ' seconds. You have ' + HUNT_LIVES + ' lives.', startHunt);
  }

  function brief(n, title, line, how, next) {
    $('cv-b-level').textContent = 'Level ' + n + ' of 3';
    $('cv-b-title').textContent = title;
    $('cv-b-line').textContent = line;
    $('cv-b-how').textContent = how;
    [1, 2, 3].forEach(function (i) { $('cv-pip' + i).className = i < n ? 'done' : i === n ? 'now' : ''; });
    show('cv-brief'); sLevel();
    var go = $('cv-b-go');
    go.onclick = function () { go.onclick = null; next(); };
    try { go.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  // ---------- level 1: Catch the pains ----------
  var arena = $('cv-arena');

  function startHunt() {
    arena.innerHTML = '';
    hunt = { t: 0, caught: 0, lives: HUNT_LIVES, combo: 0, bubbles: [], fixes: [], last: 0, done: false, lastSec: -1, spawnT: 0, painBag: [] };
    huntHud();
    show('cv-hunt');
    for (var i = 0; i < 3; i++) spawnBubble(true);
    spawnBubble(false);
    hunt.last = performance.now();
    requestAnimationFrame(huntLoop);
  }

  function huntHud() {
    $('cv-h-caught').textContent = hunt.caught + ' / ' + HUNT_GOAL;
    $('cv-h-time').textContent = Math.max(0, Math.ceil(HUNT_TIME - hunt.t));
    var h = ''; for (var i = 0; i < HUNT_LIVES; i++) h += '<i class="' + (i < hunt.lives ? 'on' : '') + '">♥</i>';
    $('cv-h-lives').innerHTML = h;
  }

  function nextPain() {
    if (!hunt.painBag.length) hunt.painBag = shuffle(PAINS);
    return hunt.painBag.pop();
  }

  function spawnBubble(isPain) {
    var W = arena.clientWidth, H = arena.clientHeight;
    var b = { pain: isPain, data: isPain ? nextPain() : pick(GAINS), hideT: rand(1.5, 3.5), hidden: 0, turnT: rand(0.6, 1.6), age: 0 };
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'cv-bub ' + (isPain ? 'pain' : 'gain');
    el.innerHTML = '<span class="face">' + (isPain ? '😟' : '🙂') + '</span><span class="txt"></span>';
    el.querySelector('.txt').textContent = isPain ? b.data.t : b.data;
    arena.appendChild(el);
    b.el = el; b.w = el.offsetWidth; b.h = el.offsetHeight;
    // pop out of hiding somewhere inside the arena
    b.x = rand(0, Math.max(1, W - b.w)); b.y = rand(0, Math.max(1, H - b.h));
    el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px)';
    el.classList.add('appear');
    aim(b, W, H);
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); tapBubble(b, e); });
    hunt.bubbles.push(b);
    return b;
  }

  function speed() { return (95 + 150 * (hunt.t / HUNT_TIME)) * Math.min(1.4, Math.max(0.7, arena.clientWidth / 700)); }

  function aim(b, W, H) {
    var tx = rand(0, Math.max(1, W - b.w)), ty = rand(0, Math.max(1, H - b.h));
    var dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1, s = speed() * (b.pain ? 1 : 0.7);
    b.vx = dx / d * s; b.vy = dy / d * s;
  }

  function tapBubble(b, e) {
    if (hunt.done || b.gone) return;
    var r = b.el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    b.gone = true;
    if (b.pain) {
      hunt.caught++; hunt.combo++;
      var pts = 100 + (hunt.combo - 1) * 25 + (b.hidden > 0 ? 50 : 0);
      addPoints(pts, b.el); sRight(hunt.combo);
      b.el.classList.add('caught');
      b.el.querySelector('.face').textContent = '😊';
      b.el.querySelector('.txt').textContent = b.data.fix;
      if (hunt.fixes.indexOf(b.data) < 0) hunt.fixes.push(b.data);
      fixToast(b.data);
      confetti(14, x, y);
      if (hunt.combo >= 3) floatText(hunt.combo + 'x combo!', x, y - 40, 'combo');
      setTimeout(function () { b.el.remove(); }, 750);
      if (hunt.caught >= HUNT_GOAL) { huntHud(); endHunt(); return; }
    } else {
      hunt.lives--; hunt.combo = 0; sWrong();
      b.el.classList.add('oops');
      floatText('That’s a happy customer!', x, y, 'bad');
      restart($('cv-hunt-top'), 'shake');
      setTimeout(function () { b.el.remove(); }, 600);
      if (hunt.lives <= 0) { huntHud(); endHunt(); return; }
    }
    huntHud();
  }

  function fixToast(p) {
    var t = $('cv-h-toast');
    t.innerHTML = '<b>Pain:</b> ' + p.t + ' <span>→</span> <b>Fix:</b> ' + p.fix;
    restart(t, 'show');
  }

  function huntLoop(now) {
    if (!hunt || hunt.done) return;
    var dt = Math.min(0.05, (now - hunt.last) / 1000); hunt.last = now;
    hunt.t += dt;
    var W = arena.clientWidth, H = arena.clientHeight;
    var sec = Math.ceil(HUNT_TIME - hunt.t);
    if (sec !== hunt.lastSec) { hunt.lastSec = sec; huntHud(); if (sec <= 5 && sec > 0) sTick(); $('cv-h-time').parentNode.classList.toggle('hurry', sec <= 5); }
    if (hunt.t >= HUNT_TIME) { endHunt(); return; }

    hunt.bubbles = hunt.bubbles.filter(function (b) { return !b.gone || b.el.isConnected; });
    var live = hunt.bubbles.filter(function (b) { return !b.gone; });
    var pains = live.filter(function (b) { return b.pain; }).length;
    // fewer bubbles on small screens; a few more as the clock runs down
    var total = Math.max(4, Math.min(8, Math.round(W * H / 52000))) + (hunt.t > 12 ? 1 : 0);
    var wantPains = Math.ceil(total * 0.55), wantGains = total - wantPains;
    if (pains < wantPains) spawnBubble(true);
    if (live.length - pains < wantGains) spawnBubble(false);

    live.forEach(function (b) {
      b.age += dt;
      // dart: change direction now and then
      b.turnT -= dt; if (b.turnT <= 0) { aim(b, W, H); b.turnT = rand(0.7, 1.8); }
      // hide: pains duck out of sight for a moment
      if (b.pain) {
        if (b.hidden > 0) { b.hidden -= dt; if (b.hidden <= 0) b.el.classList.remove('hiding'); }
        else { b.hideT -= dt; if (b.hideT <= 0) { b.hidden = rand(0.7, 1.2); b.hideT = rand(2, 4); b.el.classList.add('hiding'); } }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      // stay inside once fully in
      {
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); }
        if (b.x > W - b.w) { b.x = W - b.w; b.vx = -Math.abs(b.vx); }
        if (b.y > H - b.h) { b.y = H - b.h; b.vy = -Math.abs(b.vy); }
      }
      b.el.style.transform = 'translate(' + b.x.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px)';
    });
    requestAnimationFrame(huntLoop);
  }

  function endHunt() {
    if (hunt.done) return;
    hunt.done = true;
    hunt.bubbles.forEach(function (b) { if (!b.gone) { b.gone = true; b.el.classList.add('leave'); } });
    var won = hunt.caught >= HUNT_GOAL;
    if (won) confetti(60);
    var learned = hunt.fixes.slice(0, 3).map(function (p) { return p.t + ' → ' + p.fix; }).join('; ');
    setTimeout(function () {
      brief(2, 'Rescue the visitors',
        (won ? 'You caught all ' + HUNT_GOAL + ' pains! ' : 'You caught ' + hunt.caught + ' of ' + HUNT_GOAL + ' pains. ') +
          'Every pain has a fix. That’s the Value Proposition Canvas.',
        (learned ? 'You learned: ' + learned + '. ' : '') +
          'Now be the fix. Tap a visitor or drag the orb to say hello before they leave. A normal website keeps 7 in 100. Book ' + GOAL_PCT + '%.',
        function () {
          var how = document.querySelector('#countdown .how');
          if (how) how.innerHTML = 'Tap a visitor or drag the orb.<br><span>Goal: book ' + GOAL_PCT + '% of visitors.</span>';
          show(null);
          window.__rescueCtl.start();
        });
    }, 1300);
  }

  // ---------- level 2 ends (called by game.js) ----------
  function roundOver(r) {
    rescue = r;
    addPoints(r.booked * 60, null);
    var beat = r.pct >= GOAL_PCT;
    setTimeout(function () {
      if (beat) confetti(50);
      brief(3, 'Build the pitch',
        (beat ? 'You booked ' + r.pct + '%! Goal smashed. ' : 'You booked ' + r.pct + '% (goal ' + GOAL_PCT + '%). ') + 'Last level!',
        'Turn it into a one-line pitch. Tap the words that fit each gap. ' +
        (PITCH_MISTAKES ? 'One wrong tap is allowed.' : 'No wrong taps allowed.'), startPitch);
    }, 300);
  }

  // ---------- level 3: Build the pitch ----------
  function gaps() { return PITCH.filter(function (p) { return typeof p !== 'string'; }); }

  function startPitch() {
    pitch = { gap: 0, mistakes: 0 };
    var s = $('cv-p-sentence'); s.innerHTML = '';
    var g = 0;
    PITCH.forEach(function (part) {
      var span = document.createElement('span');
      if (typeof part === 'string') { span.textContent = part; }
      else { span.className = 'cv-gap' + (g === 0 ? ' now' : ''); span.id = 'cv-gap' + g; span.textContent = '?'; g++; }
      s.appendChild(span);
    });
    $('cv-p-msg').textContent = ''; $('cv-p-msg').className = 'cv-why';
    show('cv-pitch'); showChips();
  }

  function showChips() {
    var gp = gaps()[pitch.gap], box = $('cv-p-chips'); box.innerHTML = '';
    shuffle([0, 1, 2]).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cv-chip'; b.textContent = gp.opts[k];
      b.onclick = function () { choose(k, b); };
      box.appendChild(b); restart(b, 'deal');
    });
  }

  function choose(k, b) {
    var gp = gaps()[pitch.gap], slot = $('cv-gap' + pitch.gap), msg = $('cv-p-msg');
    if (k === gp.a) {
      slot.textContent = gp.opts[k]; slot.className = 'cv-gap filled'; restart(slot, 'pop');
      addPoints(150, b); sRight(pitch.gap + 1);
      pitch.gap++;
      if (pitch.gap >= gaps().length) {
        $('cv-p-chips').innerHTML = '';
        msg.textContent = 'That’s a value proposition: who it’s for, their pain, your product, the gain, and why it beats the old way.';
        msg.className = 'cv-why good';
        confetti(50);
        setTimeout(finish, 3200);
      } else {
        $('cv-gap' + pitch.gap).classList.add('now');
        msg.textContent = ''; showChips();
      }
    } else {
      pitch.mistakes++; b.disabled = true; b.classList.add('wrong'); sWrong(); restart(slot, 'shake');
      msg.textContent = pitch.mistakes > PITCH_MISTAKES ? 'More than one slip, but finish the sentence anyway.' : 'Not that one. Which fits a website that loses visitors?';
      msg.className = 'cv-why bad';
    }
  }

  // ---------- result ----------
  function code() {
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 4; i++) s += abc[(Math.random() * abc.length) | 0];
    return 'CVP-' + s;
  }

  function finish() {
    var h = hunt.caught >= HUNT_GOAL, r = rescue && rescue.pct >= GOAL_PCT, p = pitch.mistakes <= PITCH_MISTAKES;
    var won = h && r && p;
    $('cv-r-points').textContent = points.toLocaleString('en-IN');
    var rows = [
      [h, 'Catch the pains', hunt.caught + ' of ' + HUNT_GOAL + ' caught'],
      [r, 'Rescue the visitors', (rescue ? rescue.pct : 0) + '% booked (goal ' + GOAL_PCT + '%)'],
      [p, 'Build the pitch', pitch.mistakes + (pitch.mistakes === 1 ? ' slip' : ' slips') + ' (allowed ' + PITCH_MISTAKES + ')']
    ];
    var list = $('cv-r-levels'); list.innerHTML = '';
    rows.forEach(function (row, i) {
      var li = document.createElement('li'); li.className = row[0] ? 'pass' : 'fail';
      li.style.animationDelay = (0.25 + i * 0.25) + 's';
      li.innerHTML = '<b>' + (row[0] ? '✓' : '✕') + '</b><span>' + row[1] + '</span><small>' + row[2] + '</small>';
      list.appendChild(li);
    });
    $('cv-result').classList.toggle('won', won);
    if (won) {
      var d = new Date();
      $('cv-r-kicker').textContent = 'You won!';
      $('cv-r-title').textContent = 'You’re a value proposition pro.';
      $('cv-r-code').textContent = code();
      $('cv-r-time').textContent = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      $('cv-r-prize').hidden = false;
      $('cv-r-learn').textContent = 'You just did the Value Proposition Canvas: you found the customer’s pains, matched each with a fix, and pitched it.';
      setTimeout(function () { sWin(); confetti(160); }, 300);
      setTimeout(function () { confetti(90); }, 1400);
    } else {
      $('cv-r-kicker').textContent = 'So close!';
      $('cv-r-title').textContent = 'Win all three levels to get the prize.';
      $('cv-r-prize').hidden = true;
      $('cv-r-learn').textContent = !h ? 'Tip: sad faces are pains. Catch them when they come out of hiding, and never tap a happy face.'
        : !r ? 'Tip: say hello early. Visitors you greet first are the ones that get booked.'
        : 'Tip: the pitch says who it’s for, their pain, your product and why it beats the old way.';
    }
    show('cv-result');
    idleT = 0; clearInterval(idleTimer);
    idleTimer = setInterval(function () { if (++idleT >= RESULT_IDLE) home(); }, 1000);
  }

  function home() {
    clearInterval(idleTimer); active = false;
    show(null);
    window.__rescueCtl.toAttract();
  }

  $('cv-r-again').onclick = function () { clearInterval(idleTimer); active = false; begin(); };
  $('cv-r-home').onclick = home;
  window.addEventListener('pointerdown', function () { idleT = 0; }, true);

  window.CVP = { begin: begin, roundOver: roundOver };
})();
