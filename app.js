/* Disha demo.
   The glass orb is the call button: the voice button script (botdisplay.com/button.js) puts its own
   button inside #voice-orb-container, and style.css stretches it invisibly over the orb. This file
   mirrors that button's state onto the orb and makes the orb react to Disha's voice. Typing goes
   through the chat widget (createassistants.com/chat-widget-v2.js). */
(function () {
  "use strict";

  var stage = document.getElementById("stage");
  var orb = document.getElementById("orb");
  var hit = document.getElementById("voice-orb-container");
  var statusEl = document.getElementById("status");
  var chatBtn = document.getElementById("openChat");

  var TEXT = {
    loading: "Getting Disha ready…",
    idle: "Tap the orb to talk",
    connecting: "Connecting…",
    ringing: "Calling Disha… allow the microphone if your phone asks",
    listening: "Listening. Tap the orb to end the call",
    speaking: "Disha is speaking",
    ended: "Call ended. Tap the orb to talk again",
    error: "The call didn't connect. Allow the microphone and try again, or chat instead",
    unavailable: "Voice isn't available right now. Chat with Disha instead",
    insecure: "Voice needs a secure (https) page. Chat with Disha instead",
    noChat: "The chat bubble is in the bottom-right corner"
  };

  function say(t) { if (statusEl.textContent !== t) statusEl.textContent = t; }
  function setState(s) { if (stage.dataset.state !== s) stage.dataset.state = s; }
  function state() { return stage.dataset.state; }

  /* ---------- Disha's voice level, read from the call's audio element ---------- */
  var ctx = null, analyser = null, source = null, stream = null, buf = null;
  var raf = 0, lvl = 0, loudSince = 0, quietSince = 0, speaking = false;

  function ensureAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) { try { ctx = new AC(); } catch (e) { return; } }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume().catch(function () {});
  }

  function attach(s) {
    if (!ctx) return;
    try { if (source) source.disconnect(); } catch (e) { /* already gone */ }
    try {
      source = ctx.createMediaStreamSource(s);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser); // analysed only; the call's <audio> element plays the sound
      buf = new Uint8Array(analyser.fftSize);
    } catch (e) { analyser = null; }
    stream = s;
  }

  function detach() {
    try { if (source) source.disconnect(); } catch (e) { /* already gone */ }
    source = analyser = stream = null;
    lvl = 0; speaking = false; loudSince = quietSince = 0;
    orb.style.setProperty("--lvl", "0");
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    var audio = document.getElementById("vb-remote-audio");
    if (audio && audio.srcObject && audio.srcObject !== stream) attach(audio.srcObject);
    // the button says "connected" as soon as it dials; only call it live once Disha's audio arrives
    if (stream && state() === "connecting") { setState("live"); say(TEXT.listening); }

    var target = 0;
    if (analyser) {
      analyser.getByteTimeDomainData(buf);
      var sum = 0;
      for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; sum += v * v; }
      target = Math.min(1, Math.sqrt(sum / buf.length) * 6);
    }
    lvl += (target - lvl) * (target > lvl ? 0.45 : 0.12);
    orb.style.setProperty("--lvl", lvl.toFixed(3));

    // speaking or listening, with a little hysteresis so the label doesn't flicker
    if (lvl > 0.08) {
      quietSince = 0;
      if (!loudSince) loudSince = now;
      if (!speaking && now - loudSince > 120) speaking = true;
    } else {
      loudSince = 0;
      if (!quietSince) quietSince = now;
      if (speaking && now - quietSince > 600) speaking = false;
    }
    if (state() === "live" || state() === "speaking") {
      setState(speaking ? "speaking" : "live");
      say(speaking ? TEXT.speaking : TEXT.listening);
    }
  }
  function startLoop() { if (!raf) raf = requestAnimationFrame(tick); }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; detach(); }

  /* ---------- mirror the voice button's state onto the orb ---------- */
  var inCall = false, endedTimer = 0;

  function sync() {
    var b = document.getElementById("vb-call-btn");
    if (!b) return;
    var c = b.classList;

    if (c.contains("vb-error")) {
      inCall = false; stopLoop(); setState("error"); say(TEXT.error);
      chatBtn.classList.add("nudge");
      return;
    }
    if (c.contains("vb-loading")) { setState("connecting"); say(TEXT.connecting); return; }
    if (c.contains("vb-active")) {
      if (!inCall) { inCall = true; setState("connecting"); say(TEXT.ringing); startLoop(); }
      return;
    }
    // back to idle
    stopLoop();
    if (inCall) {
      inCall = false; setState("idle"); say(TEXT.ended);
      clearTimeout(endedTimer);
      endedTimer = setTimeout(function () { if (state() === "idle") say(TEXT.idle); }, 6000);
    } else if (state() === "error") {
      setState("idle"); // keep the error message on screen until the next tap
    } else {
      setState("idle");
      if (statusEl.textContent === TEXT.loading) say(TEXT.idle);
    }
  }

  new MutationObserver(sync).observe(hit, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  window.addEventListener("pageshow", sync);

  // Runs before the button's own click handler: unlock audio inside the tap (iPhones need this)
  hit.addEventListener("click", function () {
    ensureAudio();
    chatBtn.classList.remove("nudge");
    if (!document.getElementById("vb-call-btn")) {
      setState("error");
      say(window.isSecureContext === false ? TEXT.insecure : TEXT.unavailable);
      chatBtn.classList.add("nudge");
    }
  }, true);

  // If the voice script never arrives (blocked network, offline), say so instead of spinning forever
  setTimeout(function () {
    if (!document.getElementById("vb-call-btn")) {
      setState("error"); say(TEXT.unavailable); chatBtn.classList.add("nudge");
    }
  }, 12000);

  /* ---------- open the chat widget ---------- */
  function findLauncher() {
    var w = window.__assistableWidget;
    var root = w && w.shadow;
    if (!root) return null;
    var buttons = root.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var label = (buttons[i].getAttribute("aria-label") || "").toLowerCase();
      if (/open (the )?chat|chat with|open messenger|open widget|launcher/.test(label)) return buttons[i];
    }
    return null;
  }

  chatBtn.addEventListener("click", function () {
    var launcher = findLauncher();
    if (launcher) { launcher.click(); return; }
    say(TEXT.noChat);
  });
})();
