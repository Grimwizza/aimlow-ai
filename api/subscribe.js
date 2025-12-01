export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    console.error("Debug: Email missing in request body");
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const FORM_ID = process.env.GOOGLE_FORM_ID;
    const ENTRY_ID = process.env.GOOGLE_ENTRY_ID;

    // Log the config (partially hidden for security) to verify Vercel sees them
    console.log(`Debug: Attempting submission.`);
    console.log(`Debug: Form ID exists? ${!!FORM_ID}`);
    console.log(`Debug: Entry ID exists? ${!!ENTRY_ID}`);
    console.log(`Debug: Entry ID value: ${ENTRY_ID}`); // Check if this has "entry." inside it by mistake

    if (!FORM_ID || !ENTRY_ID) {
        throw new Error("Google Form configuration missing in Vercel settings");
    }

    const GOOGLE_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
    console.log(`Debug: Target URL: ${GOOGLE_URL}`);

    const formData = new URLSearchParams();
    formData.append(`entry.${ENTRY_ID}`, email);

    // Send to Google
    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    // Log Google's response status
    console.log(`Debug: Google Response Status: ${response.status}`);
    console.log(`Debug: Google Response Text: ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Google rejected: ${response.status} ${response.statusText}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Debug: Full Error Object:", error);
    return res.status(500).json({ error: error.message || 'Subscription failed' });
  }
}