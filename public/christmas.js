/* e-charaxis — Χριστουγεννιάτικο εφέ: λαμπάκια, χιονονιφάδες-κρύσταλλοι, Jingle Bells με κουδουνάκια (με το κουμπί 🔔).
   Ανεξάρτητο αρχείο, χωρίς εξαρτήσεις. Μπαίνει με ένα <Script src="/christmas.js">. */
(function () {
  if (typeof window === "undefined" || window.__xmasFx) return;
  window.__xmasFx = true;

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Στυλ ---------- */
  var css = `
  .xm-lights{position:absolute;left:0;top:100%;width:100%;height:80px;pointer-events:none;z-index:60;overflow:visible}
  .xm-lights.xm-fixed{position:fixed;top:0}
  .xm-lights svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  .xm-bulb{position:absolute;width:12px;height:21px;margin-left:-6px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
    transform-origin:50% calc(-1 * var(--drop) - 4px);background:var(--c);
    box-shadow:0 0 6px 2px var(--c),0 0 18px 6px var(--g),0 0 36px 12px var(--g2);
    animation:xm-tw var(--d) ease-in-out var(--dl) infinite alternate, xm-sw 3.4s ease-in-out var(--dl) infinite alternate}
  .xm-bulb::before{content:"";position:absolute;left:5px;width:2px;top:calc(-1 * var(--drop) - 5px);height:var(--drop);background:#1d2a1d}
  .xm-bulb i{position:absolute;top:-5px;left:2.5px;width:7px;height:6px;border-radius:2px;background:#2b3a2b}
  .xm-bulb::after{content:"";position:absolute;top:3px;left:3px;width:3px;height:7px;border-radius:50%;background:rgba(255,255,255,.75)}
  @keyframes xm-tw{0%{opacity:1;filter:brightness(1.3) saturate(1.25)}55%{opacity:1}100%{opacity:.4;filter:brightness(.7);box-shadow:0 0 3px 1px var(--c)}}
  @keyframes xm-sw{from{transform:rotate(var(--r))}to{transform:rotate(calc(var(--r) * -1))}}
  .xm-snow{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147482999}
  .xm-btn{position:fixed;left:14px;bottom:14px;z-index:2147483001;width:42px;height:42px;border-radius:50%;
    border:1px solid rgba(255,255,255,.35);background:rgba(160,20,30,.88);color:#fff;font-size:20px;line-height:40px;
    text-align:center;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);backdrop-filter:blur(4px);padding:0;
    transition:transform .2s}
  .xm-btn:hover{transform:scale(1.08)}
  .xm-btn.playing{background:rgba(24,112,52,.92)}
  .xm-btn.idle{animation:xm-pulse 2.4s ease-in-out infinite}
  @keyframes xm-pulse{0%,100%{box-shadow:0 4px 14px rgba(0,0,0,.25),0 0 0 0 rgba(160,20,30,.35)}50%{box-shadow:0 4px 14px rgba(0,0,0,.25),0 0 0 9px rgba(160,20,30,0)}}
  @media (prefers-reduced-motion: reduce){.xm-bulb,.xm-btn.idle{animation:none}}
  `;
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- Λαμπάκια: κρέμονται κάτω από το μενού (όχι πάνω στο μπάνερ) ---------- */
  var COLORS = [
    ["#ff2a3d", "rgba(255,42,61,.55)", "rgba(255,42,61,.22)"],
    ["#ffc21a", "rgba(255,194,26,.55)", "rgba(255,194,26,.22)"],
    ["#19e36b", "rgba(25,227,107,.55)", "rgba(25,227,107,.22)"],
    ["#2f8bff", "rgba(47,139,255,.55)", "rgba(47,139,255,.22)"],
    ["#ff4fd8", "rgba(255,79,216,.55)", "rgba(255,79,216,.22)"],
    ["#ff8a1f", "rgba(255,138,31,.55)", "rgba(255,138,31,.22)"]
  ];
  var lights = document.createElement("div");
  lights.className = "xm-lights";
  lights.setAttribute("aria-hidden", "true");
  // Το Next.js αλλάζει σελίδες χωρίς πλήρη φόρτωση: ξανακρεμάμε τη γιρλάντα στο εκάστοτε <header>.
  function attachLights() {
    var header = document.querySelector("header");
    if (header) {
      if (lights.parentNode === header) return;
      if (getComputedStyle(header).position === "static") header.style.position = "relative";
      lights.classList.remove("xm-fixed");
      header.appendChild(lights);
    } else if (lights.parentNode !== document.body) {
      lights.classList.add("xm-fixed");
      document.body.appendChild(lights);
    }
  }
  attachLights();

  function buildLights() {
    var w = document.documentElement.clientWidth;
    var spacing = w < 600 ? 24 : 30;           // πυκνά λαμπάκια
    var swag = w < 600 ? 160 : 260;            // πλάτος κάθε «καμπύλης»
    var sag = w < 600 ? 22 : 30, top = 0;      // πόσο κρεμάει το καλώδιο
    var segs = Math.max(2, Math.round(w / swag));
    var segW = w / segs;
    var y = function (x) {
      var t = (x % segW) / segW;
      return top + sag * 4 * t * (1 - t);
    };
    var d = "";
    for (var s = 0; s < segs; s++) {
      var x0 = s * segW, x1 = x0 + segW;
      d += (s ? "" : "M" + x0 + " " + top) + " Q" + (x0 + segW / 2) + " " + (top + sag * 2) + " " + x1 + " " + top;
    }
    var html = '<svg viewBox="0 0 ' + w + ' 80" preserveAspectRatio="none"><path d="' + d +
      '" fill="none" stroke="#1d2a1d" stroke-width="2.4" stroke-linecap="round"/></svg>';
    var n = Math.floor(w / spacing);
    for (var i = 0; i <= n; i++) {
      var x = (i + 0.5) * (w / (n + 1));
      var c = COLORS[i % COLORS.length];
      var drop = (3 + Math.random() * 9).toFixed(0);       // κάθε λαμπάκι κρέμεται σε δικό του καλωδιάκι
      html += '<span class="xm-bulb" style="left:' + x.toFixed(1) + "px;top:" + (y(x) + +drop + 5).toFixed(1) +
        "px;--drop:" + drop + "px;--c:" + c[0] + ";--g:" + c[1] + ";--g2:" + c[2] +
        ";--d:" + (0.9 + Math.random() * 1.6).toFixed(2) + "s;--dl:" + (-Math.random() * 3).toFixed(2) +
        "s;--r:" + (5 + Math.random() * 7).toFixed(1) + 'deg"><i></i></span>';
    }
    lights.innerHTML = html;
  }
  buildLights();
  var rT;
  window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(buildLights, 150); });

  /* ---------- Χιόνι: μεγάλες νιφάδες-κρύσταλλοι ---------- */
  function makeFlakeSprite(variant) {
    var S = 96, c = document.createElement("canvas");
    c.width = c.height = S;
    var g = c.getContext("2d");
    g.translate(S / 2, S / 2);
    g.lineCap = "round";
    function arm() {
      var L = S * 0.42;
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(0, -L);
      var branches = variant === 0 ? [[0.45, 0.22], [0.72, 0.15]]
                   : variant === 1 ? [[0.35, 0.18], [0.55, 0.22], [0.78, 0.12]]
                   : [[0.6, 0.28]];
      branches.forEach(function (b) {
        var yb = -L * b[0], len = L * b[1];
        g.moveTo(0, yb); g.lineTo(-len, yb - len);
        g.moveTo(0, yb); g.lineTo(len, yb - len);
      });
      g.stroke();
      if (variant === 2) {                       // ρομβάκι στην άκρη
        g.beginPath();
        g.moveTo(0, -L - 4); g.lineTo(5, -L + 3); g.lineTo(0, -L + 9); g.lineTo(-5, -L + 3); g.closePath();
        g.fill();
      }
    }
    function drawAll(color, width) {
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = width;
      for (var k = 0; k < 6; k++) { g.save(); g.rotate(k * Math.PI / 3); arm(); g.restore(); }
      g.beginPath(); g.arc(0, 0, S * 0.07, 0, Math.PI * 2); g.fill();
    }
    drawAll("rgba(95,125,170,.55)", 7.5);        // απαλό περίγραμμα για να φαίνεται σε κρεμ φόντο
    drawAll("#ffffff", 4.2);
    return c;
  }
  var sprites = [makeFlakeSprite(0), makeFlakeSprite(1), makeFlakeSprite(2)];

  var cv = document.createElement("canvas");
  cv.className = "xm-snow";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  var ctx = cv.getContext("2d");
  var flakes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function sizeCanvas() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.round(Math.min(55, Math.max(22, (W * H) / 26000)) * (reduceMotion ? 0.4 : 1));
    while (flakes.length < target) flakes.push(newFlake(true));
    flakes.length = target;
  }
  function newFlake(anywhere) {
    var size = 14 + Math.pow(Math.random(), 1.6) * 30;   // 14–44px, λίγες πολύ μεγάλες
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -size,
      s: size,
      img: sprites[(Math.random() * sprites.length) | 0],
      vy: 0.45 + size * 0.022 + Math.random() * 0.35,
      sway: Math.random() * Math.PI * 2,
      swaySpd: 0.006 + Math.random() * 0.012,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.02,
      a: 0.75 + Math.random() * 0.25
    };
  }
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  var wind = 0, last = performance.now();
  function frame(now) {
    var dt = Math.min(3, (now - last) / 16.67); last = now;
    wind += (Math.sin(now / 4000) * 0.4 - wind) * 0.01;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.sway += f.swaySpd * dt;
      f.y += f.vy * dt * (reduceMotion ? 0.5 : 1);
      f.x += (Math.sin(f.sway) * 0.6 + wind) * dt;
      f.rot += f.vr * dt;
      if (f.y > H + f.s) { flakes[i] = newFlake(false); continue; }
      if (f.x > W + f.s) f.x = -f.s; else if (f.x < -f.s) f.x = W + f.s;
      ctx.save();
      ctx.globalAlpha = f.a;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.drawImage(f.img, -f.s / 2, -f.s / 2, f.s, f.s);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Jingle Bells με απαλά κουδουνάκια (Web Audio, χωρίς αρχείο ήχου) ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, master = null, lp = null;
  var playing = false, loopT = null;
  var VOLUME = 0.14;          // απαλή ένταση
  var PAUSE_S = 9;            // παύση ανάμεσα στις επαναλήψεις του τραγουδιού
  var Q = 0.34;               // διάρκεια τετάρτου (δευτερόλεπτα)

  // Η μελωδία του «Jingle Bells» (κοινό κτήμα), σε ντο μείζονα: [νότα, διάρκεια σε τέταρτα]
  var NOTE = { C: 523.25, D: 587.33, E: 659.26, F: 698.46, G: 783.99 };
  var SONG = [
    ["E",1],["E",1],["E",2],  ["E",1],["E",1],["E",2],  ["E",1],["G",1],["C",1.5],["D",0.5],["E",4],
    ["F",1],["F",1],["F",1.5],["F",0.5],  ["F",1],["E",1],["E",1],["E",0.5],["E",0.5],
    ["G",1],["G",1],["F",1],["D",1],  ["C",4]
  ];

  function buildGraph() {
    master = actx.createGain();
    master.gain.value = VOLUME;
    master.connect(lp);
  }
  function bell(t, pitch, gain) {
    var partials = [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]];
    partials.forEach(function (p) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine";
      o.frequency.value = pitch * p[0];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * p[1], t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9 / p[0] + 0.25);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 1.3);
    });
  }
  // Προγραμματίζει όλο το τραγούδι και επιστρέφει τη διάρκειά του σε δευτερόλεπτα.
  function playSong() {
    var t = actx.currentTime + 0.08, beats = 0;
    SONG.forEach(function (n) {
      bell(t + beats * Q, NOTE[n[0]], n[1] >= 4 ? 0.85 : 0.7);
      beats += n[1];
    });
    return beats * Q;
  }
  function loop() {
    if (!playing) return;
    var dur = 0;
    if (!document.hidden && !isAdmin()) dur = playSong();
    loopT = setTimeout(loop, (dur + PAUSE_S) * 1000);
  }
  function startMusic() {
    if (!AC) return;
    if (!actx) {
      actx = new AC();
      lp = actx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 7000;
      lp.connect(actx.destination);
      buildGraph();
    }
    if (actx.state === "suspended") actx.resume();
    playing = true;
    paintBtn();
    loop();
  }
  function stopMusic() {
    playing = false;
    clearTimeout(loopT);
    // Κόβουμε αμέσως ό,τι έχει ήδη προγραμματιστεί: αποσυνδέουμε το παλιό master.
    if (master) { try { master.disconnect(); } catch (e) {} buildGraph(); }
    paintBtn();
  }

  /* ---------- Κουμπί: πάτα την καμπάνα για να παίξει το τραγούδι ---------- */
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "xm-btn";
  function paintBtn() {
    btn.textContent = playing ? "🎶" : "🔔";
    btn.classList.toggle("playing", playing);
    btn.classList.toggle("idle", !playing);
    btn.setAttribute("aria-label", playing ? "Σίγαση μουσικής" : "Παίξε Jingle Bells");
    btn.title = btn.getAttribute("aria-label");
  }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (playing) stopMusic(); else startMusic();
  });
  paintBtn();
  document.body.appendChild(btn);

  /* ---------- Όχι στη διαχείριση (/admin) + επανασύνδεση σε αλλαγή σελίδας ---------- */
  function isAdmin() { return /^\/admin(\/|$)/.test(location.pathname); }
  function sync() {
    var hide = isAdmin();
    lights.style.display = cv.style.display = btn.style.display = hide ? "none" : "";
    if (hide && playing) stopMusic();
    if (!hide) attachLights();
  }
  sync();
  setInterval(sync, 700);
})();
