// useGeminiWords.js — v10-fixed-b2
// FIX: category prompt now requests a SINGLE SHORT WORD (1-2 words max)
// instead of a long descriptive sentence shown to the Spy as their hint.
import { WORD_PACKS } from '../../../constants/wordPack.js';

function getLocalWord() {
  const flat = WORD_PACKS.flatMap(pack => pack.words);
  return flat[Math.floor(Math.random() * flat.length)];
}

async function fetchGeminiWord(apiKey) {
  const prompt = `Generate ONE secret word for the party game "The Spy".
Return ONLY valid JSON — no markdown, no code blocks, no explanation:
{
  "word":     { "en": "Airport",  "ar": "\u0645\u0637\u0627\u0631"  },
  "hint":     { "en": "Travel",   "ar": "\u0633\u0641\u0631"   }
}
Rules:
- word: a common noun (place, object, concept). Exactly 1 word.
- hint: a SINGLE SHORT WORD or at most 2 words — a vague clue that relates to the word but doesn't give it away easily.
- Both fields must have English ("en") and Arabic ("ar") values.
- Be creative and avoid common words like "Hospital" or "Airport".`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.2, maxOutputTokens: 150 },
      }),
    }
  );
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${errData?.error?.message || 'Unknown Error'}`);
  }
  const data    = await res.json();
  const raw     = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed  = JSON.parse(cleaned);
  if (!parsed?.word?.en || !parsed?.hint?.en) throw new Error('Invalid Response Shape');
  return parsed;
}

export async function generateSpyWord() {
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
    try {
      return await fetchGeminiWord(apiKey);
    } catch (e) {
      console.warn(`[Gemini] Using local fallback: ${e.message}`);
    }
  }
  return getLocalWord();
}
