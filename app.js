/* Disha demo: voice orb + chatbot. Knowledge lives in knowledge.js. Nothing is stored or sent anywhere. */
(function () {
  "use strict";
  var K = window.DISHA;
  var $ = function (id) { return document.getElementById(id); };
  var orb = $("orb"), statusEl = $("status"), log = $("log"), chips = $("chips");
  var form = $("ask"), input = $("q"), soundBtn = $("sound");

  var soundOn = true;
  var pending = null;            // booking flow state: null | "offer" | "slot"
  var recognition = null, listening = false;

  /* ---------- matching ---------- */
  function norm(s) {
    return (" " + String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() + " ");
  }
  var compiled = K.topics.map(function (t) {
    return {
      topic: t,
      keys: t.keywords.map(function (k) {
        var w = 1, m = k.match(/\^(\d+)$/);
        if (m) { w = +m[1]; k = k.slice(0, m.index); }
        var n = norm(k).trim();
        return { text: n, phrase: n.indexOf(" ") > -1, weight: w };
      })
    };
  });
  function bestTopic(q) {
    var text = norm(q), tokens = text.trim().split(" "), best = null, bestScore = 0;
    compiled.forEach(function (c) {
      var score = 0;
      c.keys.forEach(function (k) {
        var hit = k.phrase
          ? text.indexOf(" " + k.text + " ") > -1
          : tokens.some(function (t) { return t === k.text || (k.text.length >= 5 && t.indexOf(k.text) === 0); });
        if (hit) score += k.phrase ? Math.max(2, k.weight) : k.weight;
      });
      if (score > bestScore) { bestScore = score; best = c.topic; }
    });
    return best;
  }

  /* ---------- replying ---------- */
  function reply(q) {
    var text = norm(q);
    var flow = K.flows.visit;

    if (pending === "offer") {
      pending = null;
      if (/ (yes|yeah|yep|sure|ok|okay|pick|help|please|haan|ha) /.test(text)) {
        pending = "slot";
        return { text: flow.askSlot, chips: flow.slots.map(function (s) { return s.label; }) };
      }
      if (/ (no|not now|later|nah|nope) /.test(text)) return { text: flow.decline };
    }
    if (pending === "slot") {
      var slot = null;
      flow.slots.forEach(function (s) {
        if (!slot && s.match.some(function (m) { return text.indexOf(" " + m + " ") > -1; })) slot = s.label;
      });
      pending = null;
      if (slot) return { text: flow.confirm(slot), say: flow.confirmSay(slot), chips: ["How could a business use you?"] };
      if (/ (no|not now|later|cancel) /.test(text)) return { text: flow.decline };
    }

    var t = bestTopic(q);
    if (!t) return { text: K.fallback, say: K.fallbackSay, chips: K.starters.slice(0, 3) };
    var ans = typeof t.answer === "function" ? t.answer(new Date()) : t.answer;
    if (t.offer) pending = "offer";
    return { text: ans, say: t.say, chips: t.chips };
  }

  /* ---------- chat log ---------- */
  function linkify(s) {
    var safe = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safe
      .replace(/([a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,})/gi, '<a href="mailto:$1">$1</a>')
      .replace(/(\+91[\d ]{10,13}\d|\b14416\b)/g, function (m) { return '<a href="tel:' + m.replace(/\s/g, "") + '">' + m + "</a>"; })
      .replace(/\b((?:[a-z0-9-]+\.)*iith\.ac\.in(?:\/[a-z_\/]*)?)/gi, function (m, u, off, str) {
        if (str.charAt(off - 1) === "@" || str.charAt(off - 1) === ".") return m;
        return '<a href="https://' + m + '" target="_blank" rel="noopener">' + m + "</a>";
      });
  }
  function addMsg(who, text) {
    var row = document.createElement("div");
    row.className = "msg " + who;
    var b = document.createElement("div");
    b.className = "bubble";
    if (who === "ai") b.innerHTML = linkify(text); else b.textContent = text;
    row.appendChild(b);
    log.appendChild(row);
    document.body.classList.add("chatting");
    row.scrollIntoView({ behavior: "smooth", block: "end" });
  }
  function setChips(list) {
    chips.innerHTML = "";
    (list || []).forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = c;
      btn.addEventListener("click", function () { ask(c); });
      chips.appendChild(btn);
    });
  }

  /* ---------- voice out ---------- */
  var voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    var vs = speechSynthesis.getVoices();
    voice =
      vs.find(function (v) { return /en[-_]IN/i.test(v.lang) && /female|heera|veena|neerja|swara|google/i.test(v.name); }) ||
      vs.find(function (v) { return /en[-_]IN/i.test(v.lang); }) ||
      vs.find(function (v) { return /^en/i.test(v.lang) && /female|samantha|zira|google uk english female/i.test(v.name); }) ||
      vs.find(function (v) { return /^en/i.test(v.lang); }) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speak(text) {
    if (!soundOn || !("speechSynthesis" in window)) { setState("idle"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = "en-IN"; }
    u.rate = 1.02; u.pitch = 1.05;
    u.onstart = function () { setState("speaking"); };
    u.onend = u.onerror = function () { setState("idle"); };
    speechSynthesis.speak(u);
  }

  /* ---------- the orb ---------- */
  var labels = { idle: "Tap to talk", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking… tap to stop" };
  function setState(s) {
    orb.className = "orb " + s;
    $("mic").classList.toggle("live", s === "listening" || s === "speaking");
    statusEl.textContent = labels[s] || "";
    orb.setAttribute("aria-label", labels[s] || "Tap to talk");
  }

  function ask(q) {
    q = String(q || "").trim();
    if (!q) return;
    addMsg("you", q);
    setState("thinking");
    var r = reply(q);
    setTimeout(function () {             // a short beat, so it feels like a person answering
      addMsg("ai", r.text);
      setChips(r.chips && r.chips.length ? r.chips : []);
      speak(r.say || r.text);
    }, 450);
  }

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function listen() {
    if (!SR) {
      statusEl.textContent = "Voice isn't available in this browser. Type your question below.";
      input.focus();
      return;
    }
    if (!recognition) {
      recognition = new SR();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = function (e) {
        var res = e.results[e.results.length - 1];
        var said = res[0].transcript;
        if (res.isFinal) { listening = false; ask(said); }
        else statusEl.textContent = "“" + said + "”";
      };
      recognition.onerror = function (e) {
        listening = false;
        setState("idle");
        statusEl.textContent = e.error === "not-allowed"
          ? "Allow the microphone to talk, or type below."
          : "I didn't catch that. Tap and try again, or type below.";
      };
      recognition.onend = function () {
        if (listening) { listening = false; setState("idle"); }
      };
    }
    try {
      recognition.start();
      listening = true;
      setState("listening");
    } catch (err) { /* already started */ }
  }

  function toggleTalk() {
    if ("speechSynthesis" in window && speechSynthesis.speaking) { speechSynthesis.cancel(); setState("idle"); return; }
    if (listening && recognition) { recognition.stop(); listening = false; setState("idle"); return; }
    listen();
  }
  orb.addEventListener("click", toggleTalk);
  $("mic").addEventListener("click", toggleTalk);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value;
    input.value = "";
    ask(q);
  });

  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.setAttribute("aria-label", soundOn ? "Turn voice replies off" : "Turn voice replies on");
    soundBtn.classList.toggle("off", !soundOn);
    if (!soundOn && "speechSynthesis" in window) { speechSynthesis.cancel(); setState("idle"); }
  });

  /* ---------- start ---------- */
  addMsg("ai", K.greeting);
  document.body.classList.remove("chatting");   // keep the big orb until the visitor speaks
  setChips(K.starters);
  setState("idle");
})();
