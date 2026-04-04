// 🔥 LOAD ENV FIRST (VERY IMPORTANT)
require('dotenv').config({ path: __dirname + '/.env' });
console.log("BACKEND KEY:", process.env.GEMINI_API_KEY);
const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Initialize Gemini
let genAI = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("✅ Gemini initialized");
} else {
  console.log("❌ Gemini NOT initialized (API key missing)");
}

// 📊 STOCK API
app.get('/api/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await yahooFinance.quote(symbol);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch stock data',
      details: error.message
    });
  }
});

// 🤖 AI CHAT API
app.post('/api/ai/chat', async (req, res) => {
  const { message, history, context } = req.body;
  console.log("📩 NEW CHAT REQUEST:", message);

  try {
    // ❌ If no API key → fallback
    if (!genAI) {
      console.log("⚠️ Using simulation mode");

      return res.json({
        reply: `Simulation mode: Could not access AI for "${message}"`,
        thought: "API key missing"
      });
    }

    // ✅ Use explicit model path (fixes most 404 errors)
    const model = genAI.getGenerativeModel({ 
      model: "models/gemini-1.5-flash" 
    });

    // Use direct generateContent for maximum reliability
    const prompt = `You are StockWise AI, a professional quant assistant. 
    
    Context: ${JSON.stringify(context || {})}
    User Message: ${message}
    
    MANDATORY: Respond ONLY in valid JSON with "thought" and "reply" fields.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch {
      res.json({
        thought: "Fallback parsing",
        reply: text
      });
    }

  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      error: "AI failed",
      details: error.message
    });
  }
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});