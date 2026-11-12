import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const m = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL,
  generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
});
const t0 = Date.now();
try {
  const r = await m.generateContent('Return a JSON object with keys keywords (array of strings) and reply (a short string).');
  console.log('JSON-mode OK in', Date.now() - t0, 'ms:', r.response.text());
} catch (e) {
  console.log('JSON-mode ERR after', Date.now() - t0, 'ms:', e.message?.slice(0, 300));
}
