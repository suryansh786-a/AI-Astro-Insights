/* result.js — Reading page logic */
import { initStarfield, initZodiacWheel, typewriterStream } from './animations.js';
import { fetchReading } from './api.js';
import { getSignByName, SIGNS, getPersonalYearTheme } from './astrology.js';

// ── Starfield ─────────────────────────────────────────────────
const starCanvas = document.getElementById('starfield');
if (starCanvas) initStarfield(starCanvas);

// ── Parse URL params ──────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const data = {
  name:          params.get('name') || 'Seeker',
  birthDate:     params.get('birthDate') || '',
  birthPlace:    params.get('birthPlace') || '',
  birthTime:     params.get('birthTime') || '',
  hasTime:       params.get('hasTime') === '1',
  lat:           params.get('lat') || '',
  lon:           params.get('lon') || '',
  sunSign:       params.get('sunSign') || '',
  moonSign:      params.get('moonSign') || '',
  risingSign:    params.get('risingSign') || '',
  chineseZodiac: params.get('chineseZodiac') || '',
  lifePathNumber:params.get('lifePathNumber') || '',
  age:              params.get('age') || '',
  personalYear:     params.get('personalYear') || '',
  lifeChapterPhase: params.get('lifeChapterPhase') || '',
  lifeChapterTheme: params.get('lifeChapterTheme') || '',
  transitJupiter:   params.get('transitJupiter') || '',
  transitSaturn:    params.get('transitSaturn') || '',
  moonPhase:        params.get('moonPhase') || '',
  daysToBirthday:   params.get('daysToBirthday') || '',
  currentDate:      params.get('currentDate') || new Date().toISOString().slice(0, 10),
};

if (!data.birthDate || !data.sunSign) {
  window.location.href = '/';
}

// ── Populate birth summary ─────────────────────────────────────
const nameEl    = document.getElementById('summary-name');
const detailsEl = document.getElementById('summary-details');
const badgeEl   = document.getElementById('zodiac-badge');
const chipsEl   = document.getElementById('sign-chips');

const SIGN_EMOJIS = {
  Aries:'🐏', Taurus:'🐂', Gemini:'👯', Cancer:'🦀', Leo:'🦁', Virgo:'👩',
  Libra:'⚖️', Scorpio:'🦂', Sagittarius:'🏹', Capricorn:'🐐', Aquarius:'🏺', Pisces:'🐠'
};

if (nameEl) nameEl.textContent = data.name;
if (detailsEl) {
  const dateStr = data.birthDate
    ? new Date(data.birthDate + 'T12:00:00').toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : '';
  detailsEl.innerHTML = `
    📅 ${dateStr}<br>
    📍 ${data.birthPlace || 'Unknown place'}<br>
    ${data.hasTime ? `🕐 ${data.birthTime}` : '🕐 Time unknown'}
  `;
}
if (badgeEl) badgeEl.textContent = SIGN_EMOJIS[data.sunSign] || '✨';
if (chipsEl) {
  const chips = [
    { label: `☀️ ${data.sunSign}`, title: 'Sun Sign' },
    { label: `🌙 ${data.moonSign}`, title: 'Moon Sign' },
  ];
  if (data.hasTime && data.risingSign) {
    chips.push({ label: `⬆️ ${data.risingSign}`, title: 'Rising Sign' });
  }
  chips.push({ label: `🐉 ${data.chineseZodiac}`, title: 'Chinese Zodiac' });
  chips.push({ label: `🔢 ${data.lifePathNumber}`, title: 'Life Path' });
  if (data.personalYear) {
    const theme = getPersonalYearTheme(Number(data.personalYear));
    chips.push({ label: `📅 Personal Year ${data.personalYear}`, title: `Personal Year — ${theme}` });
  }
  if (data.transitJupiter) {
    chips.push({ label: `♃ Jupiter in ${data.transitJupiter}`, title: 'Current Jupiter transit — expansion & opportunity' });
  }
  if (data.transitSaturn) {
    chips.push({ label: `♄ Saturn in ${data.transitSaturn}`, title: 'Current Saturn transit — structure & lessons' });
  }
  if (data.moonPhase) {
    chips.push({ label: `🌙 ${data.moonPhase}`, title: 'Today\'s Moon phase' });
  }
  chipsEl.innerHTML = chips.map(c =>
    `<span class="sign-chip" title="${c.title}">${c.label}</span>`
  ).join('');
}

// ── Zodiac Wheel ──────────────────────────────────────────────
const wheelCanvas = document.getElementById('zodiac-wheel-canvas');
let stopWheel = null;
if (wheelCanvas) {
  stopWheel = initZodiacWheel(wheelCanvas, data.sunSign);
}

// ── Loading & result elements ─────────────────────────────────
const loadingEl  = document.getElementById('loading-state');
const readingEl  = document.getElementById('reading-card');
const readingContent = document.getElementById('reading-content');
const errorEl    = document.getElementById('error-state');

// ── Fetch Reading ─────────────────────────────────────────────
async function loadReading() {
  try {
    const response = await fetchReading({
      name:          data.name,
      birthDate:     data.birthDate,
      birthPlace:    data.birthPlace,
      birthTime:     data.birthTime,
      hasTime:       data.hasTime,
      lat:           data.lat,
      lon:           data.lon,
      sunSign:       data.sunSign,
      moonSign:      data.moonSign,
      risingSign:    data.risingSign,
      chineseZodiac: data.chineseZodiac,
      lifePathNumber:data.lifePathNumber,
      age:              data.age,
      personalYear:     data.personalYear,
      lifeChapterPhase: data.lifeChapterPhase,
      lifeChapterTheme: data.lifeChapterTheme,
      transitJupiter:   data.transitJupiter,
      transitSaturn:    data.transitSaturn,
      moonPhase:        data.moonPhase,
      daysToBirthday:   data.daysToBirthday,
      currentDate:      data.currentDate,
    });

    // Transition: hide loading, show reading
    if (loadingEl) loadingEl.classList.add('hidden');
    if (stopWheel) stopWheel();
    if (readingEl) readingEl.classList.remove('hidden');
    if (readingContent) {
      await typewriterStream(readingContent, response);
      // Apply markdown-like bold to **text**
      formatBold(readingContent);
    }
  } catch (err) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (stopWheel) stopWheel();
    if (errorEl) {
      errorEl.textContent = '🌑 ' + (err.message || 'The cosmic connection was lost. Please try again.');
      errorEl.classList.remove('hidden');
    }
  }
}

function formatBold(el) {
  // Replace **text** with <strong> tags in text nodes
  const html = el.innerHTML;
  el.innerHTML = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

loadReading();

// ── Back button ───────────────────────────────────────────────
const backBtn = document.getElementById('back-btn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    const overlay = document.getElementById('page-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => { window.location.href = '/'; }, 300);
    } else {
      window.location.href = '/';
    }
  });
}
