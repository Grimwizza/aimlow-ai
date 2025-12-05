import Parser from 'rss-parser';

export default async function handler(req, res) {
  // 1. Cache aggressively (1 hour) to prevent hitting rate limits
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    // 2. Add Headers so TechCrunch doesn't block us
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['enclosure', 'enclosure']
      ]
    }
  });
  
  try {
    // Use a timeout promise to fail fast if the feed is slow (5 seconds)
    const feedPromise = parser.parseURL('https://techcrunch.com/category/artificial-intelligence/feed/');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));

    const feed = await Promise.race([feedPromise, timeoutPromise]);

    const articles = feed.items.slice(0, 6).map(item => {
      // --- Image Extraction Logic ---
      let imageUrl = null;

      // Priority 1: Media Content (Standard for TechCrunch)
      if (item.mediaContent) {
          // Sometimes it's an array, sometimes an object
          if (Array.isArray(item.mediaContent)) {
              imageUrl = item.mediaContent[0]?.$.url;
          } else if (item.mediaContent.$ && item.mediaContent.$.url) {
              imageUrl = item.mediaContent.$.url;
          }
      }

      // Priority 2: Enclosure
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      // Priority 3: Regex Scrape
      if (!imageUrl && item['content:encoded']) {
          const imgMatch = item['content:encoded'].match(/src="([^"]+)"/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
      }

      // Fallback
      if (!imageUrl) {
        imageUrl = 'https://aimlow.ai/logo.jpg'; // Use your logo as fallback
      }
      
      // Clean Text
      const cleanDesc = item.contentSnippet || item.description || "";
      const summary = cleanDesc.replace(/<[^>]*>?/gm, '').substring(0, 120) + "...";

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
    console.error("RSS Error:", error.message);
    // Return empty array instead of error so the frontend doesn't crash
    return res.status(200).json({ articles: [] }); 
  }
}