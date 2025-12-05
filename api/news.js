import Parser from 'rss-parser';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  // Custom parser settings to grab media images
  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['enclosure', 'enclosure']
      ]
    }
  });
  
  try {
    const feed = await parser.parseURL('https://techcrunch.com/category/artificial-intelligence/feed/');

    const articles = feed.items.slice(0, 6).map(item => {
      // STRATEGY 1: Check standard RSS "enclosure" (Best quality)
      let imageUrl = item.enclosure?.url;

      // STRATEGY 2: Check "media:content" (Common in news feeds)
      if (!imageUrl && item.mediaContent) {
        // Sometimes it's an object, sometimes an array. Handle both.
        if (Array.isArray(item.mediaContent)) {
            imageUrl = item.mediaContent[0]?.$.url;
        } else {
            imageUrl = item.mediaContent.$.url;
        }
      }

      // STRATEGY 3: Regex fallback (The "Scrape" method)
      if (!imageUrl) {
          const imgMatch = item['content:encoded']?.match(/src="([^"]+)"/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
      }

      // SAFETY: If all else fails, or if the URL is relative/broken, use local fallback
      if (!imageUrl || !imageUrl.startsWith('http')) {
        imageUrl = '/og-image.jpg'; // Use local path relative to domain
      }
      
      const cleanDesc = item.contentSnippet || item.description || "";
      // Clean up "read more" links and ellipsis
      const summary = cleanDesc.replace(/\[.*?\]/g, '').substring(0, 140) + "...";

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