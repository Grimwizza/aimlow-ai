import Parser from 'rss-parser';

export default async function handler(req, res) {
  console.log("Debug: Starting News Fetch...");
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    timeout: 5000, // Relaxed timeout
    headers: {
      // Generic Browser Agent (Safe)
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['media:thumbnail', 'mediaThumbnail'],
        ['media:group', 'mediaGroup'],
        ['content:encoded', 'contentEncoded'],
        ['description', 'description']
      ]
    }
  });

  // Special parser for Reddit to avoid 429/403 blocks
  const redditParser = new Parser({
      timeout: 3000,
      headers: { 'User-Agent': 'AimLowBot/1.0 (by /u/aimlow_admin)' }
  });

  const DIRECT_SOURCES = [
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/' }
  ];

  // Use Google News RSS to proxy blocked sites (100% uptime, text only)
  const PROXY_SOURCES = [
    { name: 'The Verge', url: 'https://news.google.com/rss/search?q=site:theverge.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'MIT Tech Review', url: 'https://news.google.com/rss/search?q=site:technologyreview.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'Engadget', url: 'https://news.google.com/rss/search?q=site:engadget.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' },
    { name: 'ScienceDaily', url: 'https://news.google.com/rss/search?q=site:sciencedaily.com+artificial+intelligence&hl=en-US&gl=US&ceid=US:en' }
  ];
  
  try {
    const fetchFeed = async (source, customParser = parser) => {
        try {
            const feed = await customParser.parseURL(source.url);
            return feed.items.map(item => ({ ...item, sourceName: source.name }));
        } catch (e) {
            console.error(`Debug: Failed to fetch ${source.name}`, e.message);
            return [];
        }
    };

    // 1. Fetch Direct Sources
    const directPromises = DIRECT_SOURCES.map(s => fetchFeed(s));
    
    // 2. Fetch Proxy Sources
    const proxyPromises = PROXY_SOURCES.map(s => fetchFeed(s));

    // 3. Fetch Reddit (Special Handling)
    const redditPromise = fetchFeed(
        { name: 'r/Artificial', url: 'https://www.reddit.com/r/artificial/top/.rss?t=day' }, 
        redditParser
    );

    const allPromises = [...directPromises, ...proxyPromises, redditPromise];
    const results = await Promise.all(allPromises);
    
    // --- DIVERSITY ALGORITHM ---
    const diverseArticles = results.map(sourceArticles => {
        return sourceArticles.slice(0, 5);
    }).flat();

    if (diverseArticles.length === 0) {
       return res.status(200).json({ articles: [] });
    }

    // --- DEDUPLICATION ---
    const seenTitles = new Set();
    const uniqueArticles = [];

    for (const item of diverseArticles) {
        const cleanTitle = item.title ? item.title.trim().toLowerCase() : '';
        // Simple title dedupe is safer across different feed types
        if (cleanTitle && !seenTitles.has(cleanTitle)) {
            seenTitles.add(cleanTitle);
            uniqueArticles.push(item);
        }
    }

    // Sort by Date
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

      if (item.mediaGroup && item.mediaGroup['media:content']) {
          const mg = item.mediaGroup['media:content'];
          imageUrl = getUrl(Array.isArray(mg) ? mg[0] : mg);
      }

      if (!imageUrl && item.mediaContent) {
         const mc = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
         imageUrl = getUrl(mc);
      }

      if (!imageUrl && item.mediaThumbnail) {
         const mt = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0] : item.mediaThumbnail;
         imageUrl = getUrl(mt);
      }
      
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      if (!imageUrl) {
          const content = (item.contentEncoded || "") + (item.description || "");
          const match = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
          if (match) imageUrl = match[1];
      }

      // Fallback Logic
      if (!imageUrl || typeof imageUrl !== 'string') {
        imageUrl = 'https://aimlow.ai/logo.jpg'; // Will be swapped for Source Logo by Frontend
      } else {
        imageUrl = imageUrl.trim().replace(/^http:\/\//i, 'https://');
      }
      
      // Clean Google News Titles (They often add " - Publication Name" at the end)
      let cleanTitle = item.title;
      if (item.sourceName && cleanTitle.includes(' - ')) {
          cleanTitle = cleanTitle.split(' - ')[0];
      }

      const rawDesc = item.contentSnippet || item.description || "";
      const summary = rawDesc.replace(/<[^>]*>?/gm, '') 
                             .replace(/\n/g, ' ') 
                             .replace(/Continue reading.*$/, '')
                             .replace(/Read more.*$/, '')
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