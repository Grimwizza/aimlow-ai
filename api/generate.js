import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
  // 1. Security Check
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
      // Split by newline to get array
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

    // TOOL 4: DEEP DIVE (Stable Text-Only Version)
    if (type === 'deep-dive') {
      const { brand } = payload;
      
      let systemPrompt = `You are a ruthless senior brand strategist. Provide a comprehensive strategic audit in Markdown.
            
            IMPORTANT: You must separate the "Free Preview" content from the "Pro Analysis" content using exactly this string: ---PRO_CONTENT_START---
            
            Required Structure:
            
            ### Quick Links
            Provide the Official Website URL and Investor Relations URL (if public) as a bulleted list.

            ### Executive Summary
            3 punchy bullet points summarizing the brand's current position.

            ### Target Persona
            Who buys this? (Demographics, Psychographics, and 'The Job to be Done').

            ---PRO_CONTENT_START---

            ### 4P Marketing Mix
            - **Product**: Core offering vs. augmentations.
            - **Price**: Strategy (Premium, Skimming, Economy).
            - **Place**: Distribution channels.
            - **Promotion**: Key messaging channels.
            
            ### SWOT Analysis
            - **Strengths**: Internal advantages.
            - **Weaknesses**: Internal gaps.
            - **Opportunities**: External growth areas.
            - **Threats**: External risks.
            
            ### Competitive Landscape
            List 3 Primary Competitors with a one-sentence differentiator for each.
            
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
    console.error("Backend Logic Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'AI generation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}