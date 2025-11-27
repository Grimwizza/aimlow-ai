export default async function handler(req, res) {
  // 1. Only allow POST requests (security)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Get the email from the request body
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 3. Get the Google Form details from environment variables
    // (You set these in your Vercel Dashboard)
    const FORM_ID = process.env.GOOGLE_FORM_ID;
    const ENTRY_ID = process.env.GOOGLE_ENTRY_ID;
    
    if (!FORM_ID || !ENTRY_ID) {
        throw new Error("Google Form configuration missing in Vercel settings");
    }

    const GOOGLE_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

    // 4. Format data exactly how Google Forms expects it
    const formData = new URLSearchParams();
    formData.append(`entry.${ENTRY_ID}`, email);

    // 5. Send the data to Google
    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    // Google Forms returns an HTML page on success, not JSON.
    // If the status is 200 (OK), we assume it worked.
    if (!response.ok) {
      throw new Error('Google Form rejected the entry');
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Newsletter Error:", error);
    return res.status(500).json({ error: error.message || 'Subscription failed' });
  }
}