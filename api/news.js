import Parser from 'rss-parser';

export default async function handler(req, res) {
  console.log("Debug: Starting News Fetch...");
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    timeout: 3000, // 3s timeout per feed
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['media:thumbnail', 'mediaThumbnail'],
        ['media:group', 'mediaGroup'], // NEW: Unlock CNBC nested images
        ['content:encoded', 'contentEncoded'],
        ['description', 'description']
      ]
    }
  });

  const SOURCES = [
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml' }, 
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    { name: 'CNBC AI', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/topic/artificial-intelligence/' }
  ];
  
  try {
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
    
    // --- DIVERSITY ALGORITHM ---
    const diverseArticles = results.map(sourceArticles => {
        return sourceArticles.slice(0, 3);
    }).flat();

    if (diverseArticles.length === 0) {
       return res.status(200).json({ articles: [] });
    }

    // Sort by Date (Newest First)
    diverseArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const processedArticles = diverseArticles.slice(0, 9).map(item => {
      let imageUrl = null;

      // --- HELPER: Extract URL from media object ---
      const getUrl = (media) => {
        if (!media) return null;
        if (typeof media === 'string') return media;
        if (media.$ && media.$.url) return media.$.url;
        if (media.url) return media.url;
        return null;
      };

      // 1. Check media:group (CNBC Special)
      if (item.mediaGroup) {
          // CNBC often nests media:content inside media:group
          // rss-parser might put it in 'media:content' property of mediaGroup
          if (item.mediaGroup['media:content']) {
             const mgContent = item.mediaGroup['media:content'];
             const mediaItem = Array.isArray(mgContent) ? mgContent[0] : mgContent;
             imageUrl = getUrl(mediaItem);
          }
      }

      // 2. Check media:content (Standard)
      if (!imageUrl && item.mediaContent) {
         const mediaItem = Array.isArray(item.mediaContent) 
            ? (item.mediaContent.find(m => m.$ && m.$.url) || item.mediaContent[0])
            : item.mediaContent;
         imageUrl = getUrl(mediaItem);
      }

      // 3. Check media:thumbnail
      if (!imageUrl && item.mediaThumbnail) {
         const thumbItem = Array.isArray(item.mediaThumbnail)
            ? item.mediaThumbnail[0]
            : item.mediaThumbnail;
         imageUrl = getUrl(thumbItem);
      }
      
      // 4. Check Enclosure
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      // 5. RegEx Fallback (Relaxed for CNBC query params)
      if (!imageUrl) {
          const content = (item.contentEncoded || "") + (item.description || "");
          // Look for <img src="..."> regardless of extension, as long as it's http(s)
          const match = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
          if (match) {
            imageUrl = match[1];
          }
      }

      // 6. Final Fallback & Cleanup
      if (!imageUrl || typeof imageUrl !== 'string') {
        imageUrl = 'https://aimlow.ai/logo.jpg'; 
      } else {
        imageUrl = imageUrl.trim().replace(/^http:\/\//i, 'https://');
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