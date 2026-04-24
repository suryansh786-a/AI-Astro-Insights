/* animations.js — Canvas starfield, zodiac wheel, particles, typewriter */

/* ── Starfield ─────────────────────────────────────────────── */
export function initStarfield(canvas) {
  const ctx = canvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 2200);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        opacity: Math.random(),
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: Math.random() > 0.9
          ? `hsl(${280 + Math.random()*40}, 70%, 80%)`
          : Math.random() > 0.8
            ? `hsl(45, 80%, 85%)`
            : '#ffffff',
      });
    }
  }

  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * canvas.width * 0.6,
      y: Math.random() * canvas.height * 0.4,
      len: 80 + Math.random() * 120,
      speed: 6 + Math.random() * 8,
      opacity: 1,
      angle: (25 + Math.random() * 20) * Math.PI / 180,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    for (const s of stars) {
      s.opacity += s.twinkleSpeed * s.twinkleDir;
      if (s.opacity >= 1 || s.opacity <= 0.05) s.twinkleDir *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));
      ctx.fill();
    }

    // Shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      const grad = ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x - Math.cos(ss.angle) * ss.len,
        ss.y - Math.sin(ss.angle) * ss.len,
      );
      grad.addColorStop(0, `rgba(255,255,255,${ss.opacity})`);
      grad.addColorStop(0.4, `rgba(240,192,96,${ss.opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = ss.opacity;
      ctx.stroke();

      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= 0.022;
      if (ss.opacity <= 0) shootingStars.splice(i, 1);
    }

    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();

  // Shoot a star every 7-12 seconds
  const shootInterval = setInterval(() => {
    if (document.visibilityState !== 'hidden') spawnShootingStar();
  }, 7000 + Math.random() * 5000);

  // First one after 2s
  setTimeout(spawnShootingStar, 2000);

  return () => {
    cancelAnimationFrame(animId);
    clearInterval(shootInterval);
    window.removeEventListener('resize', resize);
  };
}

/* ── Zodiac Wheel (loading page) ───────────────────────────── */
export function initZodiacWheel(canvas, highlightSign) {
  const ctx = canvas.getContext('2d');
  const SIZE = 200;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const cx = SIZE / 2, cy = SIZE / 2;
  const SIGNS_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  const SIGN_NAMES = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
  ];
  const highlightIdx = SIGN_NAMES.indexOf(highlightSign);

  let rotation = 0;
  let animId;
  let pulse = 0;

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    pulse += 0.03;

    // Outer ring
    const ringGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    ringGrad.addColorStop(0, 'rgba(240,192,96,0.6)');
    ringGrad.addColorStop(0.5, 'rgba(124,58,237,0.4)');
    ringGrad.addColorStop(1, 'rgba(240,192,96,0.6)');
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(240,192,96,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw 12 sign segments
    for (let i = 0; i < 12; i++) {
      const angle = rotation + (i * Math.PI * 2) / 12;
      const x = cx + Math.cos(angle) * 80;
      const y = cy + Math.sin(angle) * 80;
      const isHighlight = i === highlightIdx;

      // Tick lines
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(68, 0);
      ctx.lineTo(isHighlight ? 95 : 90, 0);
      ctx.strokeStyle = isHighlight ? 'rgba(240,192,96,0.9)' : 'rgba(240,192,96,0.25)';
      ctx.lineWidth = isHighlight ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      // Symbol text
      ctx.save();
      ctx.font = isHighlight ? 'bold 13px serif' : '11px serif';
      ctx.fillStyle = isHighlight
        ? `rgba(240,192,96,${0.7 + Math.sin(pulse) * 0.3})`
        : 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isHighlight) {
        ctx.shadowColor = 'rgba(240,192,96,0.8)';
        ctx.shadowBlur = 10;
      }
      ctx.fillText(SIGNS_SYMBOLS[i], x, y);
      ctx.restore();
    }

    // Center pulsing circle
    const innerPulse = 0.3 + Math.sin(pulse) * 0.1;
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
    centerGrad.addColorStop(0, `rgba(124,58,237,${innerPulse})`);
    centerGrad.addColorStop(0.5, `rgba(80,20,180,${innerPulse * 0.6})`);
    centerGrad.addColorStop(1, 'rgba(4,1,15,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();

    // Center eye symbol
    ctx.save();
    ctx.font = 'bold 26px serif';
    ctx.fillStyle = `rgba(240,192,96,${0.6 + Math.sin(pulse) * 0.4})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(240,192,96,0.8)';
    ctx.shadowBlur = 15 + Math.sin(pulse) * 5;
    ctx.fillText('🔮', cx, cy);
    ctx.restore();

    // Outer glow dots
    for (let i = 0; i < 4; i++) {
      const a = rotation * 2 + (i * Math.PI / 2);
      const r = 92 + Math.sin(pulse + i) * 3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,192,96,${0.4 + Math.sin(pulse + i) * 0.3})`;
      ctx.fill();
    }

    rotation += 0.008;
    animId = requestAnimationFrame(draw);
  }

  draw();
  return () => cancelAnimationFrame(animId);
}

/* ── Particle Burst ────────────────────────────────────────── */
export function particleBurst(originEl) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#f0c060', '#f8e4a0', '#7c3aed', '#9d5ff5', '#e879f9', '#ffffff'];

  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 24) * 2 * Math.PI + Math.random() * 0.3;
    const dist = 50 + Math.random() * 100;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 20;
    p.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      background: ${colors[i % colors.length]};
      --dx: ${dx}px; --dy: ${dy}px;
      width: ${3 + Math.random() * 5}px;
      height: ${3 + Math.random() * 5}px;
      animation-duration: ${0.5 + Math.random() * 0.5}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

/* ── Typewriter stream renderer ────────────────────────────── */
export async function typewriterStream(el, response) {
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  el.appendChild(cursor);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        cursor.remove();
        return;
      }
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          cursor.remove();
          el.textContent = parsed.error;
          return;
        }
        if (parsed.text) {
          cursor.before(document.createTextNode(parsed.text));
          el.scrollTop = el.scrollHeight;
        }
      } catch { /* skip malformed lines */ }
    }
  }

  cursor.remove();
}

/* ── Floating background symbols ───────────────────────────── */
export function initFloatingSymbols(container) {
  const symbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','✦','✧','⋆','☽','☾','⊕'];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.className = 'float-symbol';
    span.textContent = symbols[i % symbols.length];
    span.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      font-size: ${1 + Math.random() * 2}rem;
      animation-duration: ${5 + Math.random() * 8}s;
      animation-delay: ${Math.random() * 5}s;
      animation-direction: ${Math.random() > 0.5 ? 'normal' : 'reverse'};
      opacity: ${0.03 + Math.random() * 0.06};
    `;
    container.appendChild(span);
  }
}
