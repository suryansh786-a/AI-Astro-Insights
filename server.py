"""AI Baba Astrology Server — Python/Flask backend (Gemini)"""
import os, json
from datetime import date
from flask import Flask, request, Response, send_from_directory, jsonify
from google import genai
from google.genai import types

app = Flask(__name__, static_folder='public', static_url_path='')

MODEL = 'gemini-2.5-flash'

AI_BABA_SYSTEM = """You are AI Baba — an ancient, all-knowing mystical astrologer who has studied the cosmos for ten thousand years. You have traversed the celestial spheres, conversed with the planets, and read the sacred charts of emperors and saints alike.

Your tone is wise, warm, poetic, and deeply personal. You speak as if you have been waiting specifically for this soul to arrive. Use rich, evocative language — metaphors of stars, rivers, ancient temples, sacred fires, and the eternal dance of the cosmos.

Structure your reading with these sections (use the exact emoji headers, in this order):
✨ **The Stars Speak** — A mystical, personalized intro acknowledging who this person is cosmically
☀️ **Your Solar Self** — Deep Sun sign analysis: core identity, gifts, shadow, life purpose
🌙 **Your Lunar Heart** — Moon sign emotional world: needs, instincts, past life echoes
{rising_section}🪐 **Planetary Influences** — The seeker's natal planetary signature: dominant energies, opportunities and challenges woven from Sun + Moon{rising_included}
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
- End with a blessing that feels genuinely sacred and personal."""


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/reading', methods=['POST'])
def reading():
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        return jsonify({'error': 'GEMINI_API_KEY not set in environment'}), 500

    body = request.get_json()
    if not body or not body.get('sunSign') or not body.get('birthDate'):
        return jsonify({'error': 'Missing required birth data'}), 400

    has_time = body.get('hasTime', False)
    rising = body.get('risingSign', '')
    rising_section = (
        "⬆️ **Your Rising Mask** — Ascendant sign: how the world sees you, your outer persona, early childhood imprints\n"
        if (has_time and rising) else ""
    )
    rising_included = ' + Rising' if (has_time and rising) else ''

    system_prompt = AI_BABA_SYSTEM.format(
        rising_section=rising_section,
        rising_included=rising_included,
    )

    birth_time_line = f"Time of Birth: {body['birthTime']}" if has_time else "Time of Birth: Not provided (Rising sign unknown)"
    lat = body.get('lat', '')
    lon = body.get('lon', '')
    coords = f"{float(lat):.2f}°N, {float(lon):.2f}°E" if lat and lon else "Not available"

    today = body.get('currentDate') or date.today().isoformat()
    age = body.get('age', '')
    personal_year = body.get('personalYear', '')
    life_chapter_phase = body.get('lifeChapterPhase', '')
    life_chapter_theme = body.get('lifeChapterTheme', '')
    transit_jupiter = body.get('transitJupiter', '')
    transit_saturn = body.get('transitSaturn', '')
    moon_phase = body.get('moonPhase', '')
    days_to_birthday = body.get('daysToBirthday', '')

    user_message = f"""Please give a complete astrological reading for:

🌟 SEEKER DETAILS
Name: {body.get('name', 'Seeker')}
Date of Birth: {body['birthDate']}{f' (currently {age} years old)' if age else ''}
Place of Birth: {body.get('birthPlace', 'Unknown')}
{birth_time_line}
Coordinates: {coords}

🔯 NATAL PLACEMENTS
- Sun Sign: {body['sunSign']}
- Moon Sign: {body.get('moonSign', 'Unknown')} (approximate)
{"- Rising Sign (Ascendant): " + rising if (has_time and rising) else "- Rising Sign: Unknown (no birth time provided)"}
- Chinese Zodiac: {body.get('chineseZodiac', 'Unknown')}
- Life Path Number: {body.get('lifePathNumber', '?')}

🔮 CURRENT COSMIC CONTEXT (use this to ground your forecast)
- Today's Date: {today}
- Seeker's Current Age: {age or 'Unknown'}
- Numerology Personal Year: {personal_year or 'Unknown'}
- Current Life Chapter: {life_chapter_phase or 'Unknown'} — {life_chapter_theme}
- Current Jupiter Transit: Jupiter is in {transit_jupiter or 'Unknown'} (expansion, opportunity)
- Current Saturn Transit: Saturn is in {transit_saturn or 'Unknown'} (discipline, structure, lesson)
- Today's Moon Phase: {moon_phase or 'Unknown'}
- Days Until Next Solar Return (birthday): {days_to_birthday or 'Unknown'}

Please give {body.get('name', 'this seeker')} a profound, personal, and beautifully written astrological reading following your sacred format. Pay special attention to the 🔮 Upcoming Life Events & Cosmic Forecast section — this is what they have come for. Use the actual current date and transits to generate real, time-specific guidance."""

    client = genai.Client(api_key=api_key)

    def generate():
        for chunk in client.models.generate_content_stream(
            model=MODEL,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=4096,
                temperature=0.9,
            ),
        ):
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(generate(), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"\n🌟 AI Baba Astrology Server alive on http://localhost:{port}\n")
    app.run(host='0.0.0.0', port=port, debug=False)
