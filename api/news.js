import Parser from 'rss-parser';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['content:encoded', 'contentEncoded'],
      ]
    }
  });
  
  try {
    const feed = await parser.parseURL('https://techcrunch.com/category/artificial-intelligence/feed/');

    const articles = feed.items.slice(0, 6).map(item => {
      let imageUrl = null;

      // STRATEGY 1: TechCrunch Standard "media:content"
      // They often nest it, or provide multiple sizes. We grab the first/largest.
      if (item.mediaContent) {
        if (Array.isArray(item.mediaContent)) {
           // Look for the one with 'url' property
           const media = item.mediaContent.find(m => m.$ && m.$.url);
           if (media) imageUrl = media.$.url;
        } else if (item.mediaContent.$ && item.mediaContent.$.url) {
           imageUrl = item.mediaContent.$.url;
        }
      }

      // STRATEGY 2: aggressive HTML scraping
      // If strategy 1 fails, look for the first <img src="..."> in the full content
      if (!imageUrl && item.contentEncoded) {
        // Find the first http/https string ending in jpg/png/webp inside quotes
        const match = item.contentEncoded.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
        if (match) {
          imageUrl = match[1];
        }
      }

      // Ensure we have a valid fallback if logic returned undefined
      if (!imageUrl) {
        imageUrl = 'https://aimlow.ai/logo.jpg'; 
      }
      
      // Clean up the description text
      const cleanDesc = item.contentSnippet || item.description || "";
      const summary = cleanDesc.replace(/<[^>]*>?/gm, '').substring(0, 140) + "...";

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
    return res.status(200).json({ articles: [] }); 
  }
}