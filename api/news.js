import Parser from 'rss-parser';

export default async function handler(req, res) {
  console.log("Debug: Starting News Fetch...");
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    timeout: 3000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['media:thumbnail', 'mediaThumbnail'],
        ['content:encoded', 'contentEncoded'],
        ['description', 'description']
      ]
    }
  });

  const SOURCES = [
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml' }, 
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml' },
    { name: 'Engadget', url: 'https://www.engadget.com/tag/artificial-intelligence/rss.xml' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/topic/artificial-intelligence/' }
  ];
  
  try {
    console.log("Debug: Fetching feeds...");
    const feedPromises = SOURCES.map(async (source) => {
      try {
        const feedPromise = parser.parseURL(source.url);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Manual Timeout')), 3500)
        );
        
        const feed = await Promise.race([feedPromise, timeoutPromise]);
        return feed.items.map(item => ({ ...item, sourceName: source.name }));
      } catch (e) {
        console.error(`Debug: Failed to fetch ${source.name}:`, e.message);
        return []; 
      }
    });

    const results = await Promise.all(feedPromises);
    const allArticles = results.flat();

    // --- DIVERSITY ALGORITHM ---
    const diverseArticles = results.map(sourceArticles => {
        return sourceArticles.slice(0, 3);
    }).flat();

    if (diverseArticles.length === 0) {
       return res.status(200).json({ articles: [] });
    }

    diverseArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const processedArticles = diverseArticles.slice(0, 9).map(item => {
      let imageUrl = null;

      // 1. Check media:content
      if (item.mediaContent) {
        const mediaItem = Array.isArray(item.mediaContent) 
            ? item.mediaContent.find(m => m.$ && m.$.url) || item.mediaContent[0]
            : item.mediaContent;

        if (mediaItem) {
            if (mediaItem.$ && mediaItem.$.url) imageUrl = mediaItem.$.url;
            else if (mediaItem.url) imageUrl = mediaItem.url;
        }
      }

      // 2. Check media:thumbnail (ScienceDaily often uses this)
      if (!imageUrl && item.mediaThumbnail) {
        const thumbItem = Array.isArray(item.mediaThumbnail)
            ? item.mediaThumbnail[0]
            : item.mediaThumbnail;
            
        if (thumbItem) {
            if (thumbItem.$ && thumbItem.$.url) imageUrl = thumbItem.$.url;
            else if (thumbItem.url) imageUrl = thumbItem.url;
        }
      }
      
      // 3. Check Enclosure
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      // 4. RegEx Fallback
      if (!imageUrl) {
          const content = (item.contentEncoded || "") + (item.description || "");
          const match = content.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
          if (match) {
            imageUrl = match[1];
          }
      }

      // 5. Fallback & Protocol Fix
      if (!imageUrl) {
        imageUrl = 'https://aimlow.ai/logo.jpg'; 
      } else {
        // Force HTTPS to prevent mixed content blocking
        imageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
      }
      
      const rawDesc = item.contentSnippet || item.description || "";
      const summary = rawDesc.replace(/<[^>]*>?/gm, '') 
                             .replace(/\n/g, ' ') 
                             .replace(/Continue reading.*$/, '')
                             .replace(/Read more.*$/, '')
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
    console.error("Debug: Critical Aggregator Error:", error);
    return res.status(200).json({ articles: [] });
  }
}