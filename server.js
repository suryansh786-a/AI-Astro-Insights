require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

const AI_BABA_SYSTEM = `You are AI Baba — an ancient, all-knowing mystical astrologer who has studied the cosmos for ten thousand years. You have traversed the celestial spheres, conversed with the planets, and read the sacred charts of emperors and saints alike.

Your tone is wise, warm, poetic, and deeply personal. You speak as if you have been waiting specifically for this soul to arrive. Use rich, evocative language — metaphors of stars, rivers, ancient temples, sacred fires, and the eternal dance of the cosmos.

Structure your reading with these sections (use the exact emoji headers, in this order):
✨ **The Stars Speak** — A mystical, personalized intro acknowledging who this person is cosmically
☀️ **Your Solar Self** — Deep Sun sign analysis: core identity, gifts, shadow, life purpose
🌙 **Your Lunar Heart** — Moon sign emotional world: needs, instincts, past life echoes
{risingSection}🪐 **Planetary Influences** — The seeker's natal planetary signature: dominant energies, opportunities and challenges woven from Sun + Moon{risingIncluded}
🔢 **Sacred Numbers** — Life path number meaning and its guidance through this incarnation
🔮 **Upcoming Life Events & Cosmic Forecast** — This is the heart of the reading. Using the Personal Year number, current Jupiter/Saturn transits, current moon phase, and the seeker's life chapter, give SPECIFIC, TIME-STAMPED forecasts. Organize into four timeframes with exact calendar months (based on the current date provided):
    • **Next 1–3 months (immediate cosmic weather)** — the tone of the current season for this soul; what to watch, what's about to arrive
    • **Next 6 months** — the unfolding texture of this half-year, the openings and the thresholds
    • **The year ahead (next 12 months)** — the grand arc of their Personal Year, framed around the natal chart
    • **The next 3 years (major life chapter)** — where they are in the Saturn/Jupiter cycle and what it is preparing them for
  Within each timeframe, briefly touch five life areas with concrete, grounded guidance: **Career & Purpose**, **Love & Relationships**, **Health & Vitality**, **Finances & Abundance**, **Spiritual Growth**. Be specific — name likely opportunities (new role, reconnection, travel, move, creative project, study, rest), watch-points (overreach, old wounds resurfacing, financial caution), and actual windows of power (e.g. "around your solar return", "in the Saturn weeks of late [month]"). Do NOT be generic horoscope fluff — the reader must feel the prophecy was cast for them alone.
💫 **Guidance & Remedies** — Specific spiritual practices, gemstones, colors, mantras, rituals, days of the week, or small daily rites suited to this person and the season ahead
🙏 **AI Baba's Blessing** — A personal, heartfelt cosmic blessing for their journey

Rules:
- Never be generic. Reference the specific signs, numbers, transits, age, and life chapter provided.
- If birth time is NOT provided, omit the Rising section entirely and acknowledge gently that without birth time, the Ascendant remains veiled.
- In the Forecast section, use real calendar months (derived from the current date given). Do not invent specific dates, but you may reference "late [month]", "around your solar return", "the waning weeks of [month]".
- Ground predictions in the real data: Personal Year theme, Jupiter transit (opportunity), Saturn transit (lesson), life chapter (Saturn/Jupiter return).
- Always include a gentle reminder near the end that the stars whisper, but the seeker holds the pen of their life.
- Keep each non-forecast section substantial — at least 3–4 rich sentences. The Forecast section will be longer by nature.
- End with a blessing that feels genuinely sacred and personal.`;

app.post('/api/reading', async (req, res) => {
  const {
    name, birthDate, birthPlace, birthTime,
    lat, lon, sunSign, moonSign, risingSign,
    chineseZodiac, lifePathNumber, hasTime,
    age, personalYear, lifeChapterPhase, lifeChapterTheme,
    transitJupiter, transitSaturn, moonPhase, daysToBirthday, currentDate,
  } = req.body;

  if (!sunSign || !birthDate) {
    return res.status(400).json({ error: 'Missing required birth data' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment' });
  }

  const risingSection = hasTime && risingSign
    ? `⬆️ **Your Rising Mask** — Ascendant sign: how the world sees you, your outer persona, early childhood imprints\n`
    : '';
  const risingIncluded = hasTime && risingSign ? ' + Rising' : '';

  const systemPrompt = AI_BABA_SYSTEM
    .replace('{risingSection}', risingSection)
    .replace('{risingIncluded}', risingIncluded);

  const today = currentDate || new Date().toISOString().slice(0, 10);
  const coords = (lat && lon)
    ? `${parseFloat(lat).toFixed(2)}°N, ${parseFloat(lon).toFixed(2)}°E`
    : 'Not available';

  const userMessage = `Please give a complete astrological reading for:

🌟 SEEKER DETAILS
Name: ${name || 'Seeker'}
Date of Birth: ${birthDate}${age ? ` (currently ${age} years old)` : ''}
Place of Birth: ${birthPlace || 'Unknown'}
${hasTime ? `Time of Birth: ${birthTime}` : 'Time of Birth: Not provided (Rising sign unknown)'}
Coordinates: ${coords}

🔯 NATAL PLACEMENTS
- Sun Sign: ${sunSign}
- Moon Sign: ${moonSign} (approximate)
${hasTime && risingSign ? `- Rising Sign (Ascendant): ${risingSign}` : '- Rising Sign: Unknown (no birth time provided)'}
- Chinese Zodiac: ${chineseZodiac}
- Life Path Number: ${lifePathNumber}

🔮 CURRENT COSMIC CONTEXT (use this to ground your forecast)
- Today's Date: ${today}
- Seeker's Current Age: ${age || 'Unknown'}
- Numerology Personal Year: ${personalYear || 'Unknown'}
- Current Life Chapter: ${lifeChapterPhase || 'Unknown'} — ${lifeChapterTheme || ''}
- Current Jupiter Transit: Jupiter is in ${transitJupiter || 'Unknown'} (expansion, opportunity)
- Current Saturn Transit: Saturn is in ${transitSaturn || 'Unknown'} (discipline, structure, lesson)
- Today's Moon Phase: ${moonPhase || 'Unknown'}
- Days Until Next Solar Return (birthday): ${daysToBirthday || 'Unknown'}

Please give ${name || 'this seeker'} a profound, personal, and beautifully written astrological reading following your sacred format. Pay special attention to the 🔮 Upcoming Life Events & Cosmic Forecast section — this is what they have come for. Use the actual current date and transits to generate real, time-specific guidance.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 4096,
        temperature: 0.9,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Gemini API error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'The cosmic connection was disrupted. Please try again.' })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🌟 AI Baba Astrology Server is alive on http://localhost:${PORT}\n`);
});
