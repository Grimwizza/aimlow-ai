import Parser from 'rss-parser';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate'); // 30 min cache

  const parser = new Parser({
    timeout: 6000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['media:group', 'mediaGroup'],
        ['content:encoded', 'contentEncoded'],
        ['content', 'content'],
        ['description', 'description']
      ]
    }
  });

  // TIER 1: Premium reputable AI news sources only
  const SOURCES = [
    // Major Tech Publications
    { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/artificial-intelligence/index.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    { name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: 'Engadget', url: 'https://www.engadget.com/tag/artificial-intelligence/rss.xml' },

    // Enterprise / Business Focus
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
    { name: 'Reuters Tech', url: 'https://www.reutersagency.com/feed/?best-topics=tech' },

    // Research & Science
    { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss' },
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml' }
  ];

  try {
    const feedPromises = SOURCES.map(async (source) => {
      try {
        const feedPromise = parser.parseURL(source.url);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5500)
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

    // --- PAGINATION PARAMS ---
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 24;

    // --- DIVERSITY ALGORITHM (increased to 40 per source for deeper history) ---
    const diverseArticles = results.map(sourceArticles => {
      return sourceArticles.slice(0, 40);
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
      return res.status(200).json({ articles: [], total: 0, page, hasMore: false });
    }

    uniqueArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Apply pagination
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedArticles = uniqueArticles.slice(startIdx, endIdx);
    const hasMore = endIdx < uniqueArticles.length;

    const processedArticles = paginatedArticles.map(item => {
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

      // 3. Final Fallback - use source-based colored placeholder
      if (!imageUrl || typeof imageUrl !== 'string') {
        const colors = { 'TechCrunch': '00d084', 'The Verge': '7B5FF9', 'Wired': '000000', 'Ars Technica': 'ff4400', 'VentureBeat': '3b82f6', 'Engadget': 'f59e0b', 'MIT Tech Review': 'dc2626', 'Reuters Tech': 'ff8000', 'IEEE Spectrum': '22c55e', 'ScienceDaily': '0ea5e9' };
        const color = colors[item.sourceName] || '6366f1';
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.sourceName || 'AI')}&background=${color}&color=fff&size=400&bold=true`;
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

    return res.status(200).json({
      articles: processedArticles,
      total: uniqueArticles.length,
      page,
      hasMore
    });

  } catch (error) {
    console.error("Debug: Critical Aggregator Error:", error);
    return res.status(200).json({ articles: [], total: 0, page: 1, hasMore: false });
  }
}