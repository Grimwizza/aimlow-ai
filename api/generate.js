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

    // TOOL 1: HEADLINE GENERATOR
    if (type === 'headline') {
      const { topic } = payload;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a viral marketing expert. Return exactly 3 clickbait/viral headlines in a JSON array. Example: ['Title 1', 'Title 2', 'Title 3']. Keep them short and punchy."
          },
          { role: "user", content: `Topic: ${topic}` },
        ],
      });

      let content = completion.choices[0].message.content;
      // Clean up potential markdown formatting
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return new Response(JSON.stringify({ result: JSON.parse(content) }), {
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