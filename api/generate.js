import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { type, payload } = await req.json();

    // TOOL 1: HEADLINE GENERATOR
    if (type === 'headline') {
      const { topic } = payload;
      const completion = await openai.chat.completions.create({
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
      const completion = await openai.chat.completions.create({
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Translate corporate jargon to plain, direct English. Remove fluff." },
          { role: "user", content: `Translate: "${text}"` },
        ],
      });
      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 4: DEEP DIVE (Intelligent Data Fallback)
    if (type === 'deep-dive') {
      const { brand, context, country = "Global" } = payload;
      
      let systemPrompt = `You are a ruthless senior brand strategist. Provide a comprehensive strategic audit in Markdown for the market: ${country}.
            
            IMPORTANT DATA RULES:
            1. **Financials**: Look for confirmed annual revenue for "${brand}". 
               - If the company is PRIVATE or data is unavailable, provide the **Estimated Market Size** for their specific niche instead (e.g., "Smart Lighting Market").
               - If niche data is unavailable, zoom out to the broader industry (e.g. "Consumer Lighting").
               - You MUST update the "sales_chart_title" in the JSON to reflect what data you are showing.
            2. **JSON**: Include a single JSON block wrapped in triple backticks.
            3. **Split**: Use "---PRO_CONTENT_START---" to separate free/pro content.
            
            JSON Structure:
            { 
              "ticker": "NKE", // Stock ticker or null
              "sales_chart_title": "Estimated Annual Revenue (Philips Hue)", // OR "Global Smart Lighting Market Size"
              "market_share": [ {"name": "Brand/Leader", "value": 30}, {"name": "Competitor 1", "value": 20}, ... ],
              "annual_sales": [ {"year": "2020", "revenue": 5.2}, {"year": "2021", "revenue": 6.1}, ... ]
            }
            
            Required Structure:
            
            ### Quick Links
            Official Website and Investor Relations (list).

            ### Executive Summary
            3 punchy bullet points.

            ### Target Persona
            Demographics, Psychographics, Job to be Done.

            ---PRO_CONTENT_START---

            ### Financial Performance
            (The JSON block goes here).
            Brief text summary of the financial trajectory.

            ### 4P Marketing Mix
            - **Product**: Core & Augmentations.
            - **Price**: Strategy.
            - **Place**: Channels.
            - **Promotion**: Messaging.

            ### Retail Mix
            List top 5 retailers carrying the brand (e.g. Amazon, Best Buy, D2C).
            
            ### SWOT Analysis
            - **Strengths**
            - **Weaknesses**
            - **Opportunities**
            - **Threats**
            
            ### Competitive Landscape
            List Top 5 Competitors (Incumbents + High Growth Challengers).
            Format: [Name](analyze:Name): One sentence differentiator.
            
            ### Strategic Recommendations
            3 actionable next steps.

            Tone: Professional, direct, critical. No fluff.`;

      if (context) {
          systemPrompt += `\n\n### Head-to-Head Strategy: ${context} vs ${brand}\n   - Provide top 3 recommendations for **${context}** to compete directly with **${brand}**.\n   - Explain WHY each recommendation makes sense based on ${brand}'s weaknesses found above.`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze Brand: "${brand}"` },
        ],
      });
      
      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid tool type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'AI generation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}