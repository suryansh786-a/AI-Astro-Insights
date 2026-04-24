/* astrology.js — Zodiac and planetary calculations */

const SIGNS = [
  { name: 'Aries',       symbol: '♈', emoji: '🐏', start: [3,21], end: [4,19],  element: 'Fire',  modality: 'Cardinal', ruler: 'Mars' },
  { name: 'Taurus',      symbol: '♉', emoji: '🐂', start: [4,20], end: [5,20],  element: 'Earth', modality: 'Fixed',    ruler: 'Venus' },
  { name: 'Gemini',      symbol: '♊', emoji: '👯', start: [5,21], end: [6,20],  element: 'Air',   modality: 'Mutable',  ruler: 'Mercury' },
  { name: 'Cancer',      symbol: '♋', emoji: '🦀', start: [6,21], end: [7,22],  element: 'Water', modality: 'Cardinal', ruler: 'Moon' },
  { name: 'Leo',         symbol: '♌', emoji: '🦁', start: [7,23], end: [8,22],  element: 'Fire',  modality: 'Fixed',    ruler: 'Sun' },
  { name: 'Virgo',       symbol: '♍', emoji: '👩', start: [8,23], end: [9,22],  element: 'Earth', modality: 'Mutable',  ruler: 'Mercury' },
  { name: 'Libra',       symbol: '♎', emoji: '⚖️', start: [9,23], end: [10,22], element: 'Air',   modality: 'Cardinal', ruler: 'Venus' },
  { name: 'Scorpio',     symbol: '♏', emoji: '🦂', start: [10,23],end: [11,21], element: 'Water', modality: 'Fixed',    ruler: 'Pluto' },
  { name: 'Sagittarius', symbol: '♐', emoji: '🏹', start: [11,22],end: [12,21], element: 'Fire',  modality: 'Mutable',  ruler: 'Jupiter' },
  { name: 'Capricorn',   symbol: '♑', emoji: '🐐', start: [12,22],end: [1,19],  element: 'Earth', modality: 'Cardinal', ruler: 'Saturn' },
  { name: 'Aquarius',    symbol: '♒', emoji: '🏺', start: [1,20], end: [2,18],  element: 'Air',   modality: 'Fixed',    ruler: 'Uranus' },
  { name: 'Pisces',      symbol: '♓', emoji: '🐠', start: [2,19], end: [3,20],  element: 'Water', modality: 'Mutable',  ruler: 'Neptune' },
];

const CHINESE_ZODIAC = [
  'Rat','Ox','Tiger','Rabbit','Dragon','Snake',
  'Horse','Goat','Monkey','Rooster','Dog','Pig'
];

export function getSunSign(dateStr) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  for (const sign of SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if (sm > em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed) ||
          (month > sm) || (month < em)) return sign;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed) ||
          (month > sm && month < em)) return sign;
    }
  }
  return SIGNS[11];
}

export function getMoonSign(dateStr) {
  // Reference: New Moon epoch Jan 6, 2000 00:00 UTC = 0° Capricorn
  // Moon moves ~13.176° per day, completing 360° in 27.32 days
  const refDate = new Date('2000-01-06T00:00:00Z');
  const d = new Date(dateStr);
  const daysDiff = (d - refDate) / (1000 * 60 * 60 * 24);
  const moonDegrees = ((daysDiff * 13.176) % 360 + 360) % 360;
  // Capricorn starts at 0° in our reference
  const signIndex = (Math.floor(moonDegrees / 30) + 9) % 12;
  return SIGNS[signIndex];
}

export function getRisingSign(dateStr, timeStr, lat, lon) {
  if (!timeStr || !lat || !lon) return null;

  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T' + timeStr + ':00');
  const ut = h + m / 60;

  // Julian Day Number
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const mo = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * mo + 2) / 5) + 365 * y +
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const jd = jdn + (ut - 12) / 24;

  // Greenwich Mean Sidereal Time
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) +
             0.000387933 * T * T;
  gmst = ((gmst % 360) + 360) % 360;

  // Local Sidereal Time
  const lst = ((gmst + parseFloat(lon)) % 360 + 360) % 360;

  // Ascendant calculation (simplified planar approximation)
  const latRad = parseFloat(lat) * Math.PI / 180;
  const lstRad = lst * Math.PI / 180;
  const eclipticObliquity = 23.4367 * Math.PI / 180;
  const ascendantRad = Math.atan2(
    Math.cos(lstRad),
    -(Math.sin(lstRad) * Math.cos(eclipticObliquity) + Math.tan(latRad) * Math.sin(eclipticObliquity))
  );
  let ascDeg = (ascendantRad * 180 / Math.PI + 360) % 360;

  const signIndex = Math.floor(ascDeg / 30) % 12;
  return SIGNS[signIndex];
}

export function getChineseZodiac(year) {
  return CHINESE_ZODIAC[(year - 1900) % 12];
}

export function getLifePathNumber(dateStr) {
  const digits = dateStr.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

export function getPlanetaryContext(dateStr) {
  const sun = getSunSign(dateStr);
  const moon = getMoonSign(dateStr);
  const elements = [sun.element, moon.element];
  const elementCount = {};
  elements.forEach(e => elementCount[e] = (elementCount[e] || 0) + 1);
  const dominant = Object.keys(elementCount).sort((a,b) => elementCount[b]-elementCount[a])[0];
  return `Dominant element: ${dominant}. Sun modality: ${sun.modality}. Moon modality: ${moon.modality}.`;
}

export function getSignEmoji(signName) {
  const sign = SIGNS.find(s => s.name === signName);
  return sign ? sign.emoji : '✨';
}

export function getSignByName(name) {
  return SIGNS.find(s => s.name === name) || null;
}

// ── Life forecasting calculations ─────────────────────────────

export function getAge(birthDateStr, currentDate = new Date()) {
  const birth = new Date(birthDateStr);
  let age = currentDate.getFullYear() - birth.getFullYear();
  const m = currentDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && currentDate.getDate() < birth.getDate())) age--;
  return age;
}

// Numerology Personal Year: birth month + birth day + current year, reduced
export function getPersonalYear(birthDateStr, currentDate = new Date()) {
  const birth = new Date(birthDateStr);
  const digits = String(birth.getMonth() + 1) + String(birth.getDate()) + String(currentDate.getFullYear());
  let sum = digits.split('').map(Number).reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

const PERSONAL_YEAR_THEMES = {
  1: 'New beginnings, seeds, bold initiative',
  2: 'Partnership, patience, quiet growth',
  3: 'Creative expression, joy, social expansion',
  4: 'Foundation-building, discipline, hard work',
  5: 'Change, freedom, unexpected travel and shifts',
  6: 'Home, love, responsibility, healing relationships',
  7: 'Introspection, study, spiritual deepening',
  8: 'Harvest, power, material mastery and recognition',
  9: 'Completion, release, wisdom from endings',
  11: 'Illumination, intuitive awakening, visionary calling',
  22: 'Master building, large-scale manifestation',
  33: 'Compassionate teaching, healing service',
};
export function getPersonalYearTheme(n) {
  return PERSONAL_YEAR_THEMES[n] || 'Unfolding mystery';
}

// Astrological life chapter based on Saturn (~29.5yr) and Jupiter (~12yr) cycles
export function getLifeChapter(birthDateStr, currentDate = new Date()) {
  const age = getAge(birthDateStr, currentDate);
  if (age < 12)  return { phase: 'First Jupiter Cycle',        theme: 'Foundation, wonder, early imprints' };
  if (age < 21)  return { phase: 'Youth & First Awakenings',   theme: 'Identity formation, questioning inherited paths' };
  if (age < 28)  return { phase: 'Jupiter Return · Coming of Age', theme: 'Expansion, risk-taking, the first true self-authored chapter' };
  if (age < 32)  return { phase: 'First Saturn Return',        theme: 'Maturity gate · commitments, restructuring, what you will truly build' };
  if (age < 36)  return { phase: 'Post-Saturn Consolidation',  theme: 'Harvesting lessons, standing in adult authority' };
  if (age < 42)  return { phase: 'Second Jupiter Return',      theme: 'Expansion of mastery, teaching what you know' };
  if (age < 50)  return { phase: 'Uranus Opposition · Midlife Pivot', theme: 'Deep authenticity, reinvention, second-act truth' };
  if (age < 58)  return { phase: 'Chiron Return',              theme: 'Healing old wounds, wisdom from scars' };
  if (age < 62)  return { phase: 'Second Saturn Return',       theme: 'Elder initiation, distilling legacy' };
  if (age < 72)  return { phase: 'Wisdom Harvest',             theme: 'Mentorship, integration, transmission' };
  return { phase: 'Elder Cycle · Return to Mystery', theme: 'Surrender, legacy, sacred presence' };
}

// Approximate outer planet transits — where Jupiter & Saturn sit *today*
// Jan 1 2000: Jupiter ~25° Aries; Saturn ~10° Taurus (reasonable approximations)
export function getCurrentTransits(currentDate = new Date()) {
  const refDate = new Date('2000-01-01T00:00:00Z');
  const years = (currentDate - refDate) / (1000 * 60 * 60 * 24 * 365.25);

  const jupiterLon = (25 + years * (360 / 11.862)) % 360;
  const saturnLon  = (40 + years * (360 / 29.457)) % 360;

  const jupiterIdx = Math.floor(((jupiterLon % 360) + 360) % 360 / 30);
  const saturnIdx  = Math.floor(((saturnLon  % 360) + 360) % 360 / 30);

  // Jupiter takes ~1yr per sign; Saturn ~2.5yr per sign
  return {
    jupiterSign: SIGNS[jupiterIdx].name,
    saturnSign:  SIGNS[saturnIdx].name,
    jupiterTheme: 'expansion, opportunity, where the year grows',
    saturnTheme: 'discipline, structure, where the lessons land',
  };
}

export function getMoonPhase(date = new Date()) {
  // Reference new moon: Jan 6, 2000 18:14 UTC. Synodic month 29.53059 days.
  const ref = new Date('2000-01-06T18:14:00Z');
  const synodic = 29.53058867;
  let days = ((date - ref) / (1000 * 60 * 60 * 24)) % synodic;
  if (days < 0) days += synodic;
  const phase = days / synodic;
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export function getDaysUntilBirthday(birthDateStr, currentDate = new Date()) {
  const b = new Date(birthDateStr);
  const todayYear = currentDate.getFullYear();
  let next = new Date(todayYear, b.getMonth(), b.getDate());
  if (next < currentDate) next = new Date(todayYear + 1, b.getMonth(), b.getDate());
  return Math.ceil((next - currentDate) / (1000 * 60 * 60 * 24));
}

export { SIGNS };
