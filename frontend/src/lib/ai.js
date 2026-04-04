// Direct REST API call — bypasses SDK version issues entirely
const API_KEY = "AIzaSyDAyFIVqvmkq9weR5BhqcyITbGH87JAi0M";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = "You are StockWise AI, a professional quant trading assistant for Indian stock markets (BSE, NSE). Be concise, insightful, and conversational like a senior quant mentor.";

export async function askAI(message) {
  const body = {
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + message }] }
    ]
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Gemini API error");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
}