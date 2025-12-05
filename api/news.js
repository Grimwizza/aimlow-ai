import Parser from 'rss-parser';

export default async function handler(req, res) {
  // 1. Set Cache Headers
  // This tells Vercel/Browsers: "Keep this data fresh for 1 hour (3600s)."
  // This prevents you from spamming the RSS source and getting blocked.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser();
  
  try {
    // 2. Fetch the Feed (TechCrunch AI Section)
    // You can swap this URL for any valid RSS feed later.
    const feed = await parser.parseURL('https://techcrunch.com/category/artificial-intelligence/feed/');

    // 3. Clean & Format the Data
    const articles = feed.items.slice(0, 6).map(item => {
      // Extract image: RSS feeds hide images in weird places (content:encoded or enclosures)
      // We use a regex to find the first image in the content if standard fields are missing.
      let imageUrl = 'https://aimlow.ai/og-image.jpg'; // Fallback
      
      // Try to find image in content
      const imgMatch = item['content:encoded']?.match(/src="([^"]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
      
      // Clean up description (remove HTML tags)
      const cleanDesc = item.contentSnippet || item.description || "";
      const summary = cleanDesc.length > 150 ? cleanDesc.substring(0, 150) + "..." : cleanDesc;

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        summary: summary,
        image: imageUrl
      };
    });

    return res.status(200).json({ articles });

  } catch (error) {
    console.error("RSS Error:", error);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
}