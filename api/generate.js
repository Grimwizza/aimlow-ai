import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // 1. Security Check: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    // 2. Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Aim Low Tip: This is the cheapest, fastest model
      messages: [
        {
          role: "system",
          content: "You are a viral marketing expert. User gives a topic, you give 3 clickbait/viral headlines in a JSON array format. Example: ['Title 1', 'Title 2', 'Title 3']. distinct, catchy, short."
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
    });

    // 3. Clean up the response (OpenAI sometimes adds markdown formatting)
    let content = completion.choices[0].message.content;
    // Remove markdown code blocks if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const headlines = JSON.parse(content);

    // 4. Send back to frontend
    return res.status(200).json({ headlines });

  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({ error: 'Failed to generate headlines' });
  }
}