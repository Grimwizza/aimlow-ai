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

    // TOOL 4: DEEP DIVE (Pro Charts Mode)
    if (type === 'deep-dive') {
      const { brand } = payload;
      
      let systemPrompt = `You are a ruthless senior brand strategist. Provide a comprehensive strategic audit in Markdown.
            
            IMPORTANT:
            1. Separate "Free" from "Pro" content with: ---PRO_CONTENT_START---
            2. Include a SINGLE JSON block wrapped in triple backticks named 'json' containing two datasets: 'market_share' and 'annual_sales' (estimated revenue for last 5 years).
            
            Example JSON Structure:
            \`\`\`json
            { 
              "market_share": [ {"name": "Brand", "value": 30}, {"name": "Comp1", "value": 20}, {"name": "Comp2", "value": 15}, {"name": "Others", "value": 35} ],
              "annual_sales": [ {"year": "2020", "revenue": 5.2}, {"year": "2021", "revenue": 6.1}, {"year": "2022", "revenue": 6.8}, {"year": "2023", "revenue": 7.5}, {"year": "2024", "revenue": 8.2} ]
            }
            \`\`\`
            
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
            Brief text summary of financial trajectory.

            ### 4P Marketing Mix
            - **Product**: Core & Augmentations.
            - **Price**: Strategy.
            - **Place**: Channels.
            - **Promotion**: Tactics.

            ### Retail Mix
            Top 5 retailers (Online & Offline).
            
            ### SWOT Analysis
            - **Strengths**
            - **Weaknesses**
            - **Opportunities**
            - **Threats**
            
            ### Competitive Landscape
            List Top 5 Competitors (Incumbents + Challengers).
            Format: [Name](analyze:Name): One sentence differentiator.
            
            ### Strategic Recommendations
            3 actionable next steps.

            Tone: Professional, direct, critical. No fluff.`;

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