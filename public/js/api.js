/* api.js — Backend API communication */

export async function fetchReading(payload) {
  const response = await fetch('/api/reading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response; // caller streams response.body
}
