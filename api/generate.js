import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY || '';
  console.log('API Key being used:', key.substring(0, 7) + '...');
  return new OpenAI({
    apiKey: key,
  });
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { type, payload } = await req.json();

    // TOOL 1: HEADLINE GENERATOR
    if (type === 'headline') {
      const { topic } = payload;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.85,
        messages: [
          { role: "system", content: "You are a viral marketing expert. Return exactly 3 distinct clickbait/viral headlines. Use these angles: 1. Negative/Warning. 2. How-To/Benefit. 3. Bizarre/Curiosity. Separate with new lines. No numbers." },
          { role: "user", content: `Topic: ${topic}` },
        ],
      });
      const headlines = completion.choices[0].message.content.split('\n').filter(line => line.trim() !== '');
      return new Response(JSON.stringify({ result: headlines }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 2: ALT-TEXT FIXER
    if (type === 'alt-text') {
      const { image } = payload;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          { role: "user", content: [{ type: "text", text: "Write a concise, descriptive SEO alt-text for this image." }, { type: "image_url", image_url: { url: image } }] },
        ],
      });
      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 3: JARGON DESTROYER
    if (type === 'jargon-destroyer') {
      const { text } = payload;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Translate corporate jargon to plain, direct English. Remove fluff." },
          { role: "user", content: `Translate: "${text}"` },
        ],
      });
      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 4: DEEP DIVE (Structured JSON Logic)
    if (type === 'deep-dive') {
      const { brand, context, country = "Global" } = payload;

      const currentDate = new Date().toDateString();
      const systemPrompt = `You are a Senior Brand Strategist. Your goal is to provide a comprehensive, fact-based audit of the brand "${brand}" for the market: ${country}.
      Current Date for context: ${currentDate}.

      CRITICAL DATA INTEGRITY RULES:
      1. **LATEST DATA REQUIRED**: Use proven real-world data where possible. HOWEVER, if your training data lags behind the current date (${currentDate}), you MUST provide **High Confidence Estimates** or **Prospective Data** for 2024 and 2025 to ensure the report is current. Do NOT return old data (e.g. stopping at 2023). Label estimated revenues as such in the notes if needed.
      2. **PARENT COMPANY**: If the brand is a subsidiary (e.g., Old Spice -> P&G), you MAY use Parent Company financial data but MUST explicitly label it as such in the 'financial_note' field.
      3. **SOURCES**: You MUST list the sources used for financial and market data in the 'sources' array.

      RESPONSE FORMAT:
      Return a SINGLE valid JSON object. Do not include markdown formatting like \`\`\`json.
      
      JSON Schema:
      {
        "brand_name": "String",
        "ticker": "String (e.g. 'NYSE: NKE') or 'Private'",
        "parent_company": "String (or null)",
        "logo_url": "String (optional)",
        "executive_summary": ["Key Point 1", "Key Point 2", "Key Point 3"],
        "target_persona": {
          "demographics": "String",
          "psychographics": "String",
          "job_to_be_done": "String"
        },
        "marketing_4ps": {
          "product": "String (Core products & value prop)",
          "price": "String (Pricing strategy e.g. Premium, Value)",
          "place": "String (Distribution channels)",
          "promotion": "String (Marketing mix & key campaigns)"
        },
        "swot": {
          "strengths": ["Point 1", "Point 2", ...],
          "weaknesses": ["Point 1", "Point 2", ...],
          "opportunities": ["Point 1", "Point 2", ...],
          "threats": ["Point 1", "Point 2", ...]
        },
        "financials": {
          "financial_note": "String (e.g. 'Figures reflect Parent Company X')",
          "currency": "String (e.g. USD, EUR)",
          "market_cap": "String (e.g. $140B) or 'N/A'",
          "pe_ratio": "String or 'N/A'",
          "revenue_latest": "String (e.g. $12.4B Q3 2025)",
          "quarterly_revenue_data": [
            {"period": "Q1 2025", "revenue": 12.8, "unit": "B", "growth_yoy": 1.1},
            {"period": "Q4 2024", "revenue": 13.2, "unit": "B", "growth_yoy": -2.3}
            // Include last 4-6 quarters. You MUST include 2024/2025 data (Est/Projected is acceptable if actuals missing).
          ]
        },
        "competitors": [
           {"name": "Competitor 1", "differentiator": "Analysis..."},
           {"name": "Competitor 2", "differentiator": "Analysis..."}
        ],
        "recommendations": ["Strategy 1", "Strategy 2", "Strategy 3"],
        "sources": ["Source 1 (e.g. SEC Filings)", "Source 2 (e.g. Investor Relations)"]
      }`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze Brand: "${brand}". ${context ? `Context: Compare against ${context}.` : ''}` }
      ];

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" }, // Enforce JSON mode
        temperature: 0.7,
      });

      return new Response(JSON.stringify({ result: JSON.parse(completion.choices[0].message.content) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid tool type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("GENERATE API ERROR DETAILED:", error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    }
    return new Response(JSON.stringify({ error: error.message || 'AI generation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}