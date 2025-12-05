import Parser from 'rss-parser';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const parser = new Parser({
    timeout: 4000,
    headers: {
      // TRICK: Pretend to be a standard RSS reader, not a bot/browser
      'User-Agent': 'Feedly/1.0 (+http://www.feedly.com)',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'], 
        ['media:thumbnail', 'mediaThumbnail'],
        ['media:group', 'mediaGroup'],
        ['content:encoded', 'contentEncoded'],
        ['content', 'content'], // Common for The Verge
        ['description', 'description']
      ]
    }
  });

  // Moved big players back to DIRECT to try and get images
  const SOURCES = [
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml' },
    { name: 'Engadget', url: 'https://www.engadget.com/tag/artificial-intelligence/rss.xml' },
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/' },
    // Keeping Reddit as it requires special handling
    { name: 'r/Artificial', url: 'https://www.reddit.com/r/artificial/top/.rss?t=day' },
    // Keeping ScienceDaily on Proxy? No, let's try direct one last time with the HTML scraper
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml' }
  ];
  
  try {
    const feedPromises = SOURCES.map(async (source) => {
      try {
        const feedPromise = parser.parseURL(source.url);
        // 4.5s timeout - give them a fighting chance
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Manual Timeout')), 4500)
        );
        
        const feed = await Promise.race([feedPromise, timeoutPromise]);
        return feed.items.map(item => ({ ...item, sourceName: source.name }));
      } catch (e) {
        // If direct fail, we could fallback to Google here, but for now let's just log it
        console.error(`Debug: Failed to fetch ${source.name}:`, e.message);
        return []; 
      }
    });

    const results = await Promise.all(feedPromises);
    
    // --- DIVERSITY ALGORITHM ---
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

    if (uniqueArticles.length === 0) {
       return res.status(200).json({ articles: [] });
    }

    uniqueArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const processedArticles = uniqueArticles.slice(0, 60).map(item => {
      let imageUrl = null;

      // --- HELPER: Extract URL ---
      const getUrl = (media) => {
        if (!media) return null;
        if (typeof media === 'string') return media;
        if (media.$ && media.$.url) return media.$.url;
        if (media.url) return media.url;
        return null;
      };

      // 1. Standard Media Checks
      if (item.mediaContent) imageUrl = getUrl(Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent);
      if (!imageUrl && item.mediaThumbnail) imageUrl = getUrl(Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0] : item.mediaThumbnail);
      if (!imageUrl && item.enclosure) imageUrl = item.enclosure.url;

      // 2. HTML MINING (Crucial for Verge/TechCrunch)
      // They hide images in the HTML body <figure> or <img> tags
      if (!imageUrl) {
          // Combine all possible content fields
          const fullHtml = (item.content || "") + (item.contentEncoded || "") + (item.description || "");
          
          // Regex to find the first jpg/png/webp inside an src attribute
          // We ignore tracking pixels (usually 1x1) by looking for standard extensions
          const match = fullHtml.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
          
          if (match) {
            imageUrl = match[1];
          }
      }

      // 3. Final Fallback to Logo (Only if absolutely nothing found)
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