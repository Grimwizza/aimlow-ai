import OpenAI from 'openai';

// 1. Switch to Edge Runtime (Instant startup, no cold boots)
export const config = {
  runtime: 'edge',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
  // 2. Edge functions use standard Request/Response objects
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse the incoming JSON body
    const { type, payload } = await req.json();

    // TOOL 1: HEADLINE GENERATOR (OPTIMIZED & CREATIVE)
    if (type === 'headline') {
      const { topic } = payload;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.85, // Increase creativity/randomness (Default is usually lower)
        messages: [
          {
            role: "system",
            // UPDATED PROMPT: We now force 3 distinct psychological angles to ensure variety
            content: "You are a viral marketing expert. Return exactly 3 distinct clickbait/viral headlines. They must use different angles: 1. A 'Negative/Warning' angle. 2. A 'How-To/Benefit' angle. 3. A 'Bizarre/Curiosity' angle. Separate each headline with a new line. Do not use numbers, bullet points, or quotes. Just the raw text."
          },
          { role: "user", content: `Topic: ${topic}` },
        ],
      });

      const content = completion.choices[0].message.content;
      
      // Robust parsing: Split by new line and remove empty entries
      const headlines = content.split('\n').filter(line => line.trim() !== '');
      
      return new Response(JSON.stringify({ result: headlines }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TOOL 2: ALT-TEXT FIXER
    if (type === 'alt-text') {
      const { image } = payload; 
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Write a concise, descriptive alt-text for this image optimized for SEO and accessibility. Limit to 1 sentence." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      });

      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TOOL 3: JARGON DESTROYER
    if (type === 'jargon-destroyer') {
      const { text } = payload;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a ruthless editor. Translate the following corporate jargon, buzzwords, or complex academic speak into plain, simple, direct English. Remove the fluff. Keep the meaning. Output ONLY the translation."
          },
          { role: "user", content: `Translate this: "${text}"` },
        ],
      });

      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid tool type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("OpenAI Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'AI generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}