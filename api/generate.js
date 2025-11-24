import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, payload } = req.body;

  try {
    // --- TOOL 1: HEADLINE GENERATOR ---
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
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return res.status(200).json({ result: JSON.parse(content) });
    }

    // --- TOOL 2: ALT-TEXT FIXER (VISION) ---
    if (type === 'alt-text') {
      const { image } = payload; // Expecting base64 image string
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Write a concise, descriptive alt-text for this image optimized for SEO and accessibility. Limit to 1 sentence." },
              {
                type: "image_url",
                image_url: {
                  url: image, // Must be data:image/jpeg;base64,...
                },
              },
            ],
          },
        ],
      });

      const altText = completion.choices[0].message.content;
      return res.status(200).json({ result: altText });
    }

    return res.status(400).json({ error: 'Invalid tool type' });

  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
}