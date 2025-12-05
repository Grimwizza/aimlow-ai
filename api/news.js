import Parser from 'rss-parser';

export default async function handler(req, res) {
  // 1. Cache for 1 hour to reduce load
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    // 2. STRICT TIMEOUT: Give up on any single feed after 4 seconds
    timeout: 4000, 
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['content:encoded', 'contentEncoded'],
        ['description', 'description']
      ]
    }
  });

  const SOURCES = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/ai/index.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' }
  ];
  
  try {
    // 3. Fetch all feeds in parallel, ignoring failures
    const feedPromises = SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.map(item => ({ ...item, sourceName: source.name }));
      } catch (e) {
        console.error(`Failed to fetch ${source.name}:`, e.message);
        return []; // If one fails/times out, return empty array so others still load
      }
    });

    const results = await Promise.all(feedPromises);
    const allArticles = results.flat();

    // 4. If ALL feeds fail, return empty list (don't crash 500)
    if (allArticles.length === 0) {
       return res.status(200).json({ articles: [] });
    }

    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const processedArticles = allArticles.slice(0, 9).map(item => {
      let imageUrl = null;

      if (item.mediaContent) {
        if (Array.isArray(item.mediaContent)) {
           const media = item.mediaContent.find(m => m.$ && m.$.url) || item.mediaContent[0];
           if (media && media.$) imageUrl = media.$.url;
        } else if (item.mediaContent.$ && item.mediaContent.$.url) {
           imageUrl = item.mediaContent.$.url;
        }
      }
      
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      const htmlContent = item.contentEncoded || item.description || "";
      if (!imageUrl && htmlContent) {
        const match = htmlContent.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
        if (match) {
          imageUrl = match[1];
        }
      }

      if (!imageUrl) {
        imageUrl = 'https://aimlow.ai/logo.jpg'; 
      }
      
      const rawDesc = item.contentSnippet || item.description || "";
      const summary = rawDesc.replace(/<[^>]*>?/gm, '') 
                             .replace(/\n/g, ' ') 
                             .replace(/Continue reading.*$/, '')
                             .substring(0, 120) + "...";

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        summary: summary,
        image: imageUrl,
        source: item.sourceName
      };
    });

    return res.status(200).json({ articles: processedArticles });

  } catch (error) {
    console.error("Aggregator Error:", error.message);
    // Return empty list on total failure, preventing the 500 crash
    return res.status(200).json({ articles: [] }); 
  }
}