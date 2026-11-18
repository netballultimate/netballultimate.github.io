(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav: solid on scroll, mobile menu ---------- */
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menuBtn");
  const links = document.getElementById("links");
  const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  menuBtn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", e => {
    if (e.target.closest("a")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }
  });

  /* ---------- reveal on scroll + count-up badges ---------- */
  const countUp = el => {
    const end = +el.dataset.count, t0 = performance.now(), dur = 900;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-count]").forEach(countUp);
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 80 + "ms";
    io.observe(el);
  });

  /* ---------- hero: animated court, red team works the ball up court ---------- */
  const cv = document.getElementById("court");
  const ctx = cv.getContext("2d");
  const W = 1000, H = 500;           // logical size
  let scale = 1;
  const fit = () => {
    const r = cv.getBoundingClientRect();
    scale = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * scale;
    cv.height = r.height * scale;
  };
  addEventListener("resize", fit);
  fit();

  // court is drawn in metres (30.5 x 15.25) and projected into a tilted trapezoid
  const project = (x, y) => {           // x: -15.25..15.25, y: -7.6..7.6
    const v = (y + 7.625) / 15.25;      // 0 far .. 1 near
    const half = 300 + v * 190;         // far edge narrower than near edge
    const sy = 70 + v * 380;
    return [W / 2 + (x / 15.25) * half, sy, 0.75 + v * 0.45];
  };

  // red attack right; spots for a centre pass going GS-wards
  const red = [
    { r: "C", path: [[0, 0], [3, -2.5], [6, 1.5]] },
    { r: "WA", path: [[-1, 4], [4.5, 3], [8.5, -3]] },
    { r: "GA", path: [[4, -3], [8, 1], [11.5, 2]] },
    { r: "GS", path: [[9, 1.5], [12.5, -1], [13.5, 0.5]] },
    { r: "WD", path: [[-4, -4], [-1, -4], [2, -3]] },
    { r: "GD", path: [[-8, 2], [-6, 2], [-4, 1]] },
    { r: "GK", path: [[-12, -0.5], [-11, 0], [-10, -0.5]] },
  ];
  const green = red.map(p => ({ mark: p, off: [0.9, 0.7] }));
  const passes = [0, 1, 2, 3];          // C -> WA -> GA -> GS, then shot
  let t = 0, last = performance.now();

  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const posAt = (p, phase) => {
    const n = p.path.length - 1, f = Math.min(phase, n), i = Math.min(Math.floor(f), n - 1), k = ease(f - i);
    return [lerp(p.path[i][0], p.path[i + 1][0], k), lerp(p.path[i][1], p.path[i + 1][1], k)];
  };

  const line = (pts, close) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => { const [sx, sy] = project(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    if (close) ctx.closePath();
  };
  const arc = (cx, from, to) => {
    const pts = [];
    for (let a = from; a <= to + 1e-6; a += Math.PI / 30) pts.push([cx + Math.cos(a) * 4.9, Math.sin(a) * 4.9]);
    return pts;
  };

  const drawCourt = () => {
    line([[-15.25, -7.625], [15.25, -7.625], [15.25, 7.625], [-15.25, 7.625]], true);
    const g = ctx.createLinearGradient(0, 70, 0, 450);
    g.addColorStop(0, "rgba(20,87,200,.55)");
    g.addColorStop(1, "rgba(6,22,51,.9)");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 4; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.25)";
    for (const x of [-5.08, 5.08]) { line([[x, -7.625], [x, 7.625]]); ctx.stroke(); }
    line(arc(-15.25, -Math.PI / 2, Math.PI / 2)); ctx.stroke();
    line(arc(15.25, Math.PI / 2, Math.PI * 1.5)); ctx.stroke();
    const [cx, cy, s] = project(0, 0);
    ctx.beginPath(); ctx.ellipse(cx, cy, 14 * s, 7 * s, 0, 0, Math.PI * 2); ctx.stroke();
    // posts
    for (const x of [-15.25, 15.25]) {
      const [px, py, ps] = project(x, 0);
      ctx.strokeStyle = "#ff8a3d"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 70 * ps); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(px + (x > 0 ? -10 : 10) * ps, py - 70 * ps, 11 * ps, 4 * ps, 0, 0, Math.PI * 2); ctx.stroke();
    }
  };

  const drawPlayer = (x, y, col, label) => {
    const [sx, sy, s] = project(x, y);
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(sx, sy, 16 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(sx, sy, 13 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 5 * s, sy - 34 * s, 10 * s, 30 * s);
    ctx.beginPath(); ctx.arc(sx, sy - 40 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
    if (label) {
      ctx.font = `${Math.round(11 * s)}px ND, Arial`;
      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      ctx.fillText(label, sx, sy - 52 * s);
    }
    return [sx, sy - 30 * s, s];
  };

  // timeline: 0..2 players move, passes every 1.1s along the chain, shot at end
  const CYCLE = 7.5;
  const frame = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduceMotion) t = (t + dt) % CYCLE;
    ctx.setTransform(scale * cv.width / (W * scale), 0, 0, scale * cv.height / (H * scale), 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawCourt();

    const phase = Math.min(2, t / 2.2);
    const pos = red.map(p => posAt(p, phase));
    const people = [];
    red.forEach((p, i) => people.push({ x: pos[i][0], y: pos[i][1], c: "#ff4a4a", l: p.r, i }));
    green.forEach((g, i) => {
      const [mx, my] = pos[i];
      const sway = Math.sin(t * 2 + i) * 0.4;
      people.push({ x: mx + g.off[0] + sway * 0.3, y: my + g.off[1] * (i % 2 ? -1 : 1) + sway, c: "#2fd06a" });
    });
    people.sort((a, b) => a.y - b.y);
    const heads = {};
    for (const p of people) {
      const h = drawPlayer(p.x, p.y, p.c, p.l);
      if (p.i !== undefined) heads[p.i] = h;
    }

    // ball
    const passT = 1.2, start = 0.6;
    let k = (t - start) / passT, bx, by, lift = 0;
    if (k < 0) { [bx, by] = heads[0]; }
    else if (k < passes.length - 1) {
      const i = Math.floor(k), f = k - i;
      const a = heads[passes[i]], b = heads[passes[i + 1]];
      if (f < 0.75) { const q = ease(f / 0.75); bx = lerp(a[0], b[0], q); by = lerp(a[1], b[1], q); lift = Math.sin(q * Math.PI) * 40; }
      else { [bx, by] = b; }
    } else {
      // shot from GS to ring
      const f = Math.min(1, (k - (passes.length - 1)) / 1.2);
      const a = heads[3];
      const [rx, ry, rs] = project(15.25, 0);
      const tx = rx - 10 * rs, ty = ry - 70 * rs;
      const q = ease(f);
      bx = lerp(a[0], tx, q); by = lerp(a[1], ty, q); lift = Math.sin(q * Math.PI) * 80;
      if (f >= 1) { bx = tx; by = ty + Math.min(1, (k - passes.length) * 2) * 60; lift = 0; }
    }
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(bx, by + 30 + lift * 0.1, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffc534";
    ctx.beginPath(); ctx.arc(bx, by - lift - 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#7a4a00"; ctx.lineWidth = 1.5; ctx.stroke();

    requestAnimationFrame(frame);
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(frame));
  else requestAnimationFrame(frame);

  /* ---------- positions: zone explorer ---------- */
  const POS = [
    { id: "GS", name: "Goal Shooter", zones: ["zR", "cR"], text: "Lives in the attacking third and the goal circle. Takes most of the shots." },
    { id: "GA", name: "Goal Attack", zones: ["zM", "zR", "cR"], text: "Centre and attacking thirds, goal circle included. Feeds the shooter and can score." },
    { id: "WA", name: "Wing Attack", zones: ["zM", "zR"], text: "Centre and attacking thirds, but never the goal circle. Sets up the feed into the circle." },
    { id: "C", name: "Centre", zones: ["zL", "zM", "zR"], text: "Everywhere except both goal circles. Takes the centre pass and links defence to attack." },
    { id: "WD", name: "Wing Defence", zones: ["zL", "zM"], text: "Centre and defending thirds, no goal circle. Shadows the opposing wing attack." },
    { id: "GD", name: "Goal Defence", zones: ["zL", "zM", "cL"], text: "Centre and defending thirds, goal circle included. Marks the goal attack." },
    { id: "GK", name: "Goal Keeper", zones: ["zL", "cL"], text: "Defending third and the goal circle. Last line in front of the post." },
  ];
  const tabs = document.getElementById("posTabs");
  const info = document.getElementById("posInfo");
  const ALL = ["zL", "zM", "zR", "cL", "cR"];
  const select = p => {
    tabs.querySelectorAll(".pos-tab").forEach(b => b.setAttribute("aria-selected", b.dataset.id === p.id));
    ALL.forEach(z => document.getElementById(z).classList.toggle("on", p.zones.includes(z)));
    info.innerHTML = `<h3>${p.id} &middot; ${p.name}</h3><p>${p.text}</p>`;
  };
  POS.forEach(p => {
    const b = document.createElement("button");
    b.className = "pos-tab"; b.textContent = p.id; b.dataset.id = p.id;
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => { select(p); autoplay = false; });
    tabs.appendChild(b);
  });
  let cur = 0, autoplay = !reduceMotion;
  select(POS[0]);
  setInterval(() => { if (autoplay) { cur = (cur + 1) % POS.length; select(POS[cur]); } }, 2600);

  /* ---------- gallery lightbox ---------- */
  const lb = document.getElementById("lightbox"), lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap");
  const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
  document.querySelectorAll(".shot").forEach(s => s.addEventListener("click", () => {
    const img = s.querySelector("img");
    lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = s.dataset.cap;
    lb.hidden = false; document.body.style.overflow = "hidden";
  }));
  lb.addEventListener("click", e => { if (e.target === lb || e.target.id === "lbClose") close(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) close(); });

  /* ---------- store buttons: not live yet ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  document.querySelectorAll("[data-soon]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    toast.textContent = "Coming soon - " + a.querySelector("span").lastChild.textContent.trim();
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }));
})();
