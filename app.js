/* Disha demo.
   The glass orb is the call button: the voice button script (botdisplay.com/button.js) puts its own
   button inside #voice-orb-container, and style.css stretches it invisibly over the orb. This file
   mirrors that button's state onto the orb, shows a call timer and makes the orb react to Disha's
   voice. Typing goes through the chat widget (createassistants.com/chat-widget-v2.js).
   Test switches: add ?novoice or ?nolevel to the address. */
(function () {
  "use strict";

  var stage = document.getElementById("stage");
  var orb = document.getElementById("orb");
  var hit = document.getElementById("voice-orb-container");
  var statusEl = document.getElementById("status");
  var timerEl = document.getElementById("timer");
  var chatBtn = document.getElementById("openChat");

  var MAX_CALL_S = 180; // the assistant hangs up at 3 minutes

  var TEXT = {
    loading: "Getting Disha ready…",
    idle: "Tap the orb to talk",
    connecting: "Connecting…",
    ringing: "Calling Disha… allow the microphone if your phone asks",
    listening: "Listening. Tap the orb to end the call",
    speaking: "Disha is speaking",
    onCall: "You're on a call with Disha. Tap the orb to end it",
    ended: "Call ended. Tap the orb to talk again",
    error: "The call didn't connect. Allow the microphone and try again, or chat instead",
    unavailable: "Voice isn't available right now. Chat with Disha instead",
    insecure: "Voice needs a secure (https) page. Chat with Disha instead",
    noVoice: "This browser can't make voice calls. Open the page in Chrome or Safari, or chat with Disha",
    noChat: "The chat is still loading. Try again in a few seconds, or tap the orb to talk",
    chatDown: "The chat isn't loading right now. Tap the orb to talk, or refresh the page"
  };

  // Voice needs the microphone and WebRTC. Browsers built into some apps and QR scanners lack them.
  var canVoice = !!(window.isSecureContext !== false && navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia && window.RTCPeerConnection);
  if (/[?&]novoice\b/.test(location.search)) canVoice = false;

  // On iPhones and in Safari, reading a call's audio through Web Audio can mute or reroute it,
  // so there the orb pulses on a steady beat instead of following Disha's voice.
  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isSafari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua);
  var useLevel = !(isIOS || isSafari) && !/[?&]nolevel\b/.test(location.search);
  if (!useLevel) stage.classList.add("no-level");

  function say(t) { if (statusEl.textContent !== t) statusEl.textContent = t; }
  function setState(s) { if (stage.dataset.state !== s) stage.dataset.state = s; }
  function state() { return stage.dataset.state; }

  /* ---------- the call clock and Disha's voice level ---------- */
  var ctx = null, analyser = null, source = null, stream = null, buf = null;
  var raf = 0, lvl = 0, loudSince = 0, quietSince = 0, speaking = false;
  var callStart = 0, lastClock = "";

  function ensureAudio() {
    if (!useLevel) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) { try { ctx = new AC(); } catch (e) { return; } }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume().catch(function () {});
  }

  function attach(s) {
    stream = s;
    if (!useLevel || !ctx) return;
    try { if (source) source.disconnect(); } catch (e) { /* already gone */ }
    try {
      source = ctx.createMediaStreamSource(s);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser); // analysed only; the call's <audio> element plays the sound
      buf = new Uint8Array(analyser.fftSize);
    } catch (e) { analyser = null; }
  }

  function detach() {
    try { if (source) source.disconnect(); } catch (e) { /* already gone */ }
    source = analyser = stream = null;
    lvl = 0; speaking = false; loudSince = quietSince = 0;
    callStart = 0; lastClock = ""; timerEl.hidden = true;
    orb.style.setProperty("--lvl", "0");
  }

  function clock(s) { return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    var audio = document.getElementById("vb-remote-audio");
    if (audio && audio.srcObject && audio.srcObject !== stream) attach(audio.srcObject);

    // the button says "connected" as soon as it dials; only call it live once Disha's audio arrives
    if (stream && state() === "connecting") {
      setState("live");
      say(useLevel ? TEXT.listening : TEXT.onCall);
      callStart = now; timerEl.hidden = false;
    }
    if (callStart) {
      var t = clock(Math.min(MAX_CALL_S, Math.floor((now - callStart) / 1000))) + " · calls end at " + clock(MAX_CALL_S);
      if (t !== lastClock) { timerEl.textContent = t; lastClock = t; }
    }
    if (!useLevel) return;

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
      setState("idle"); // keep the message on screen until the next tap
    } else {
      setState("idle");
      if (statusEl.textContent === TEXT.loading) say(TEXT.idle);
    }
  }

  new MutationObserver(sync).observe(hit, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  window.addEventListener("pageshow", sync);

  // Runs before the call button's own click handler (capture phase)
  hit.addEventListener("click", function (e) {
    chatBtn.classList.remove("nudge");
    if (!canVoice) {
      e.stopPropagation(); // don't let the call button try, fail and show a vaguer error
      e.preventDefault();
      setState("error");
      say(window.isSecureContext === false ? TEXT.insecure : TEXT.noVoice);
      chatBtn.classList.add("nudge");
      return;
    }
    ensureAudio(); // unlock audio inside the tap
    if (!document.getElementById("vb-call-btn")) {
      setState("error"); say(TEXT.unavailable); chatBtn.classList.add("nudge");
    }
  }, true);

  if (!canVoice) {
    // say it up front, so people in an app's built-in browser go straight to the chat
    setState("error");
    say(window.isSecureContext === false ? TEXT.insecure : TEXT.noVoice);
    chatBtn.classList.add("nudge");
  } else {
    // if the voice script never arrives (blocked network, offline), say so instead of waiting forever
    setTimeout(function () {
      if (!document.getElementById("vb-call-btn")) {
        setState("error"); say(TEXT.unavailable); chatBtn.classList.add("nudge");
      }
    }, 12000);
  }

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

  // The chat widget gives up for good if its settings take over 4 s to load (slow venue Wi-Fi).
  // If it hasn't shown its launcher after 6 s, reload the widget once.
  var chatRetried = false, chatGaveUp = false;
  function retryChat() {
    if (findLauncher() || chatRetried) return;
    chatRetried = true;
    var old = document.querySelector('script[src*="chat-widget-v2.js"]');
    if (!old) return;
    try { if (window.__assistableWidget && window.__assistableWidget.unmount) window.__assistableWidget.unmount(); } catch (e) { /* not mounted */ }
    var host = document.getElementById("assistable-chat-widget");
    if (host) host.remove();
    try { delete window.__assistableWidget; } catch (e) { window.__assistableWidget = undefined; }
    // The loader only imports its main module and calls mountWidget(scriptTag); do the same again.
    fetch(old.src, { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (code) {
        var m = code.match(/["'](\.\/chunks\/[^"']+\.js)["']/);
        if (!m) throw new Error("chunk not found");
        return import(new URL(m[1], old.src).href);
      })
      .then(function (mod) { return mod.m || mod; })
      .then(function (api) { api.mountWidget(old); })
      .catch(function () { chatGaveUp = true; });
    setTimeout(function () { if (!findLauncher()) chatGaveUp = true; }, 8000);
  }
  setTimeout(retryChat, 6000);

  chatBtn.addEventListener("click", function () {
    var launcher = findLauncher();
    if (launcher) { launcher.click(); return; }
    if (chatGaveUp) { say(TEXT.chatDown); return; }
    say(TEXT.noChat);
    retryChat();
  });
})();
