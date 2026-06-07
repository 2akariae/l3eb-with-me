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
  "category": { "en": "Travel",   "ar": "\u0633\u0641\u0631"   }
}
Rules:
- word: a common noun (place, object, concept). Exactly 1 word.
- category: a SINGLE SHORT WORD or at most 2 words — the broad topic only.
  Examples of GOOD categories: "Food", "Sports", "Nature", "Technology", "Health".
  NEVER write a sentence or phrase as the category. It is a vague hint, not a description.
- Both fields must have English ("en") and Arabic ("ar") values.
- Be creative and avoid repetition.`;

  const res = await fetch(
    \`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\${apiKey}\`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.1, maxOutputTokens: 120 },
      }),
    }
  );
  if (!res.ok) throw new Error(\`Gemini \${res.status}\`);
  const data    = await res.json();
  const raw     = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed  = JSON.parse(cleaned);
  if (!parsed?.word?.en || !parsed?.category?.en) throw new Error('Bad Gemini response shape');
  return parsed;
}

export async function generateSpyWord() {
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try { return await fetchGeminiWord(apiKey); }
    catch (e) { console.warn('[useGeminiWords] Gemini fallback:', e.message); }
  }
  return getLocalWord();
}
