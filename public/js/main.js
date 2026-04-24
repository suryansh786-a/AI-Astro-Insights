/* main.js — Form handling, location autocomplete, navigation */
import {
  getSunSign, getMoonSign, getRisingSign,
  getChineseZodiac, getLifePathNumber, getPlanetaryContext,
  getAge, getPersonalYear, getLifeChapter,
  getCurrentTransits, getMoonPhase, getDaysUntilBirthday
} from './astrology.js';
import { initStarfield, initFloatingSymbols, particleBurst } from './animations.js';

// ── Starfield + floating symbols ──────────────────────────────
const starCanvas = document.getElementById('starfield');
if (starCanvas) initStarfield(starCanvas);

const floatContainer = document.querySelector('.floating-symbols');
if (floatContainer) initFloatingSymbols(floatContainer);

// ── Time toggle ───────────────────────────────────────────────
const noTimeCheckbox = document.getElementById('no-time');
const timeWrap = document.getElementById('time-input-wrap');
if (noTimeCheckbox && timeWrap) {
  noTimeCheckbox.addEventListener('change', () => {
    timeWrap.classList.toggle('hidden', noTimeCheckbox.checked);
    const timeInput = document.getElementById('birth-time');
    if (noTimeCheckbox.checked && timeInput) timeInput.value = '';
  });
}

// ── Location Autocomplete ─────────────────────────────────────
let autocompleteTimeout = null;
let selectedLocation = null;

const locationInput = document.getElementById('birth-place');
const dropdown = document.getElementById('autocomplete-dropdown');
const latInput = document.getElementById('lat');
const lonInput = document.getElementById('lon');

if (locationInput) {
  locationInput.addEventListener('input', () => {
    clearTimeout(autocompleteTimeout);
    const q = locationInput.value.trim();
    if (q.length < 3) { closeDropdown(); return; }
    autocompleteTimeout = setTimeout(() => fetchLocations(q), 300);
  });

  locationInput.addEventListener('keydown', (e) => {
    if (!dropdown || dropdown.classList.contains('hidden')) return;
    const items = dropdown.querySelectorAll('.autocomplete-item');
    const active = dropdown.querySelector('.autocomplete-item.active');
    const idx = active ? [...items].indexOf(active) : -1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[(idx + 1) % items.length];
      if (active) active.classList.remove('active');
      next.classList.add('active');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[(idx - 1 + items.length) % items.length];
      if (active) active.classList.remove('active');
      prev.classList.add('active');
    } else if (e.key === 'Enter') {
      if (active) { e.preventDefault(); active.click(); }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!locationInput.contains(e.target) && !dropdown?.contains(e.target)) closeDropdown();
  });
}

async function fetchLocations(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    renderDropdown(data);
  } catch {
    closeDropdown();
  }
}

function renderDropdown(results) {
  if (!dropdown) return;
  if (!results.length) { closeDropdown(); return; }
  dropdown.innerHTML = '';
  dropdown.classList.remove('hidden');

  results.forEach(r => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    const parts = r.display_name.split(',');
    const main = parts.slice(0, 2).join(',').trim();
    const sub = parts.slice(2, 4).join(',').trim();
    item.innerHTML = `<strong>${main}</strong>${sub ? `<small>${sub}</small>` : ''}`;
    item.addEventListener('click', () => {
      locationInput.value = r.display_name.split(',').slice(0,3).join(',').trim();
      selectedLocation = { displayName: r.display_name, lat: r.lat, lon: r.lon };
      if (latInput) latInput.value = r.lat;
      if (lonInput) lonInput.value = r.lon;
      closeDropdown();
    });
    dropdown.appendChild(item);
  });
}

function closeDropdown() {
  if (dropdown) {
    dropdown.innerHTML = '';
    dropdown.classList.add('hidden');
  }
}

// ── Form Submission ───────────────────────────────────────────
const form = document.getElementById('astro-form');
const submitBtn = document.getElementById('submit-btn');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim() || 'Seeker';
    const birthDate = document.getElementById('birth-date').value;
    const birthPlace = document.getElementById('birth-place').value.trim();
    const birthTime = document.getElementById('birth-time')?.value || '';
    const hasTime = !noTimeCheckbox?.checked && birthTime !== '';
    const lat = latInput?.value || '';
    const lon = lonInput?.value || '';

    if (!birthDate) {
      showFormError('Please enter your date of birth, dear seeker.');
      return;
    }
    if (!birthPlace) {
      showFormError('Please enter your place of birth.');
      return;
    }

    // Calculate astrological data
    const sunSign = getSunSign(birthDate);
    const moonSign = getMoonSign(birthDate);
    const risingSign = hasTime ? getRisingSign(birthDate, birthTime, lat || '0', lon || '0') : null;
    const chineseZodiac = getChineseZodiac(new Date(birthDate).getFullYear());
    const lifePathNumber = getLifePathNumber(birthDate);

    // Forecasting data (computed relative to today)
    const now = new Date();
    const age = getAge(birthDate, now);
    const personalYear = getPersonalYear(birthDate, now);
    const lifeChapter = getLifeChapter(birthDate, now);
    const transits = getCurrentTransits(now);
    const moonPhase = getMoonPhase(now);
    const daysToBirthday = getDaysUntilBirthday(birthDate, now);

    // Particle burst on button
    particleBurst(submitBtn);

    // Encode data into URL params and navigate
    const params = new URLSearchParams({
      name,
      birthDate,
      birthPlace,
      birthTime: hasTime ? birthTime : '',
      hasTime: hasTime ? '1' : '0',
      lat, lon,
      sunSign: sunSign.name,
      moonSign: moonSign.name,
      risingSign: risingSign ? risingSign.name : '',
      chineseZodiac,
      lifePathNumber,
      age: String(age),
      personalYear: String(personalYear),
      lifeChapterPhase: lifeChapter.phase,
      lifeChapterTheme: lifeChapter.theme,
      transitJupiter: transits.jupiterSign,
      transitSaturn: transits.saturnSign,
      moonPhase,
      daysToBirthday: String(daysToBirthday),
      currentDate: now.toISOString().slice(0, 10),
    });

    // Page transition
    const overlay = document.getElementById('page-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => { window.location.href = '/result.html?' + params.toString(); }, 350);
    } else {
      window.location.href = '/result.html?' + params.toString();
    }
  });
}

function showFormError(msg) {
  let errEl = document.getElementById('form-error');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'form-error';
    errEl.style.cssText = 'color:#e879f9;font-size:0.85rem;text-align:center;margin-top:0.5rem;font-style:italic;';
    form.appendChild(errEl);
  }
  errEl.textContent = msg;
  setTimeout(() => { if (errEl) errEl.textContent = ''; }, 3500);
}
