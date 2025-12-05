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
        ['media:group', 'mediaGroup'],
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
    { name: 'r/Artificial', url: 'https://www.reddit.com/r/artificial/top/.rss?t=day' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/topic/artificial-intelligence/' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml' },
    { name: 'Engadget', url: 'https://www.engadget.com/tag/artificial-intelligence/rss.xml' },
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/' }
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
    
    // 1. DIVERSITY: Take top 5 from each source
    let allArticles = results.map(sourceArticles => {
        return sourceArticles.slice(0, 5);
    }).flat();

    if (allArticles.length === 0) {
       return res.status(200).json({ articles: [] });
    }

    // 2. QUALITY SORT (The Fix)
    // Move Reddit articles to the bottom so they are processed LAST during deduplication.
    // If a Reddit article duplicates a Wired article, Wired (at the top) gets kept.
    allArticles.sort((a, b) => {
        const isRedditA = a.sourceName === 'r/Artificial';
        const isRedditB = b.sourceName === 'r/Artificial';
        if (isRedditA && !isRedditB) return 1;  // A is Reddit, move it down
        if (!isRedditA && isRedditB) return -1; // B is Reddit, move it down
        return 0;
    });

    // 3. DEDUPLICATION
    const seenUrls = new Set();
    const seenTitles = new Set();
    const uniqueArticles = [];

    for (const item of allArticles) {
        const cleanUrl = item.link ? item.link.split('?')[0] : '';
        const cleanTitle = item.title ? item.title.trim().toLowerCase() : '';

        // Since non-Reddit is now at the top of the list, they get added first.
        if (cleanUrl && !seenUrls.has(cleanUrl) && !seenTitles.has(cleanTitle)) {
            seenUrls.add(cleanUrl);
            seenTitles.add(cleanTitle);
            uniqueArticles.push(item);
        }
    }

    // 4. FINAL SORT: Time
    uniqueArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const processedArticles = uniqueArticles.slice(0, 60).map(item => {
      let imageUrl = null;

      const getUrl = (media) => {
        if (!media) return null;
        if (typeof media === 'string') return media;
        if (media.$ && media.$.url) return media.$.url;
        if (media.url) return media.url;
        return null;
      };

      if (item.mediaGroup) {
          if (item.mediaGroup['media:content']) {
             const mgContent = item.mediaGroup['media:content'];
             const mediaItem = Array.isArray(mgContent) ? mgContent[0] : mgContent;
             imageUrl = getUrl(mediaItem);
          }
      }

      if (!imageUrl && item.mediaContent) {
         const mediaItem = Array.isArray(item.mediaContent) 
            ? (item.mediaContent.find(m => m.$ && m.$.url) || item.mediaContent[0])
            : item.mediaContent;
         imageUrl = getUrl(mediaItem);
      }

      if (!imageUrl && item.mediaThumbnail) {
         const thumbItem = Array.isArray(item.mediaThumbnail)
            ? item.mediaThumbnail[0]
            : item.mediaThumbnail;
         imageUrl = getUrl(thumbItem);
      }
      
      if (!imageUrl && item.enclosure) {
          imageUrl = item.enclosure.url;
      }

      if (!imageUrl) {
          const content = (item.contentEncoded || "") + (item.description || "");
          const match = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
          if (match) {
            imageUrl = match[1];
          }
      }

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