import Parser from 'rss-parser';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  
  const parser = new Parser();
  
  try {
    // Fetch TechCrunch AI Feed
    const feed = await parser.parseURL('https://techcrunch.com/category/artificial-intelligence/feed/');

    const articles = feed.items.slice(0, 6).map(item => {
      let imageUrl = 'https://aimlow.ai/og-image.jpg'; // Fallback image
      
      // Regex to find image in content
      const imgMatch = item['content:encoded']?.match(/src="([^"]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
      
      const cleanDesc = item.contentSnippet || item.description || "";
      const summary = cleanDesc.length > 150 ? cleanDesc.substring(0, 150) + "..." : cleanDesc;

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