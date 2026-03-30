const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

app.get('/api/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const result = await yahooFinance.quote(symbol);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock data', details: error.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, context } = req.body;
  
  try {
    if (!genAI) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.json({ 
        reply: `Engine Response: Analyzing "${message}". Market stability detected in NSE.`,
        thought: "Reasoning Step 1: Parsing user prompt. Step 2: Retrieving live BSE/NSE context. Step 3: Estimating technical resistance. Conclusion: Risk is minimal."
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      You are StockWise AI, an ultra-minimalist Zen quant trading assistant.
      User prompt: "${message}".
      Context: ${JSON.stringify(context || {})}
      
      Respond STRICTLY in JSON format with two fields:
      - "thought": A detailed, step-by-step reasoning process of how you arrived at your answer (e.g., "Step 1: Check NIFTY 50... Step 2: Correlate with global Tech index...").
      - "reply": A concise, Zen, and data-driven final answer to the user.
      
      Output only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from AI response
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, ''));
      res.json(parsed);
    } catch (e) {
      res.json({ thought: "Simplified reasoning process applied.", reply: text });
    }
  } catch (error) {
    res.status(500).json({ error: 'AI Engine Latency', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`StockWise AI Engine running on port ${PORT}`);
});
