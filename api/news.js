import Parser from 'rss-parser';

export default async function handler(req, res) {
  console.log("Debug: Starting News Fetch...");
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    timeout: 5000, 
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  // --- 1. DIRECT SOURCES (Feeds that allow bots & have good images) ---
  const DIRECT_SOURCES = [
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    // Reddit needs special handling usually, but works with this parser often
    { name: 'r/Artificial', url: 'https://www.reddit.com/r/artificial/top/.rss?t=day' }
  ];

  // --- 2. PROXY SOURCES (Feeds that block bots - Routed via Google News) ---
  const PROXY_SOURCES = [
    { name: 'The Verge', url: 'https://news.google.com/rss/search?q=site:theverge.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'MIT Tech Review', url: 'https://news.google.com/rss/search?q=site:technologyreview.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'Engadget', url: 'https://news.google.com/rss/search?q=site:engadget.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'ScienceDaily', url: 'https://news.google.com/rss/search?q=site:sciencedaily.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'TechCrunch', url: 'https://news.google.com/rss/search?q=site:techcrunch.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'AI News', url: 'https://news.google.com/rss/search?q=site:artificialintelligence-news.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' }
  ];
  
  try {
    const fetchFeed = async (source) => {
        try {
            const feed = await parser.parseURL(source.url);
            return feed.items.map(item => ({ ...item, sourceName: source.name }));
        } catch (e) {
            console.error(`Debug: Failed to fetch ${source.name}`, e.message);
            return [];
        }
    };

    const directPromises = DIRECT_SOURCES.map(s => fetchFeed(s));
    const proxyPromises = PROXY_SOURCES.map(s => fetchFeed(s));

    const results = await Promise.all([...directPromises, ...proxyPromises]);
    
    const diverseArticles = results.map(sourceArticles => {
        return sourceArticles.slice(0, 5);
    }).flat();

    // Deduplication
    const seenTitles = new Set();
    const uniqueArticles = [];
    for (const item of diverseArticles) {
        const cleanTitle = item.title ? item.title.trim().toLowerCase() : '';
        if (cleanTitle && !seenTitles.has(cleanTitle)) {
            seenTitles.add(cleanTitle);
            uniqueArticles.push(item);
        }
    }

    uniqueArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const processedArticles = uniqueArticles.slice(0, 60).map(item => {
      let imageUrl = null;

      // Image Extraction (Only works for Direct feeds usually)
      const getUrl = (media) => {
        if (!media) return null;
        if (typeof media === 'string') return media;
        if (media.$ && media.$.url) return media.$.url;
        if (media.url) return media.url;
        return null;
      };

      if (item.content || item['content:encoded']) {
          const content = (item.content || item['content:encoded'] || "");
          const match = content.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
          if (match) imageUrl = match[1];
      }
      
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      // Fallback
      if (!imageUrl) {
        imageUrl = 'https://aimlow.ai/logo.jpg'; 
      } else {
        imageUrl = imageUrl.trim().replace(/^http:\/\//i, 'https://');
      }
      
      // Clean Google News Titles
      let cleanTitle = item.title;
      if (item.sourceName && cleanTitle.includes(' - ')) {
          const parts = cleanTitle.split(' - ');
          // If the last part matches the source name approx, remove it
          if (parts.length > 1) {
              parts.pop();
              cleanTitle = parts.join(' - ');
          }
      }

      const rawDesc = item.contentSnippet || item.description || "";
      const summary = rawDesc.replace(/<[^>]*>?/gm, '') 
                             .replace(/\n/g, ' ') 
                             .replace(/Continue reading.*$/, '')
                             .substring(0, 120) + "...";

      return {
        title: cleanTitle,
        link: item.link,
        pubDate: item.pubDate,
        summary: summary,
        image: imageUrl,
        source: item.sourceName
      };
    });

    return res.status(200).json({ articles: processedArticles });

  } catch (error) {
    console.error("Debug: Critical Aggregator Error:", error);
    return res.status(200).json({ articles: [] });
  }
}