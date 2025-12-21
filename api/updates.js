import Parser from 'rss-parser';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    // User-Agent is critical for some of these (especially Google/Medium)
    const parser = new Parser({
        timeout: 8000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
        }
    });

    const SOURCES = [
        {
            id: 'openai',
            name: 'OpenAI',
            url: 'https://openai.com/news/rss.xml',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_research.xml',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg'
        },
        {
            id: 'deepmind',
            name: 'Google AI',
            // Primary: DeepMind blog, Secondary: Gemini blog (merged, deduplicated)
            url: 'https://deepmind.google/blog/rss.xml',
            secondaryUrl: 'https://blog.google/products/gemini/rss/',
            logo: 'https://www.google.com/s2/favicons?domain=deepmind.google&sz=128'
        },
        {
            id: 'meta',
            name: 'Meta AI',
            url: 'https://engineering.fb.com/category/ml-applications/feed/',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'
        },
        {
            id: 'xai',
            name: 'xAI (Grok)',
            url: 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_xainews.xml',
            logo: 'https://www.google.com/s2/favicons?domain=x.ai&sz=128'
        }
    ];

    // Helper to clean Anthropic's malformed titles
    // Format: "CategoryDateActual TitleThis is the description text..."
    // Example: "InterpretabilityMar 27, 2025Tracing the thoughts of a large language modelCircuit tracing lets us watch Claude think..."
    const cleanAnthropicItem = (item) => {
        let rawTitle = item.title || '';
        let pubDate = item.pubDate;

        // Try to extract embedded date
        const dateMatch = rawTitle.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{1,2},?\s*\d{4}/i);
        if (dateMatch && !pubDate) {
            try {
                pubDate = new Date(dateMatch[0]).toISOString();
            } catch (e) { }
        }

        // Remove category prefix and date to get "TitleDescription"
        let cleanedText = rawTitle
            .replace(/^(Interpretability|Alignment|Policy|Societal Impacts|Economic Research)/i, '')
            .replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{1,2},?\s*\d{4}/gi, '')
            .trim();

        // The format is usually "Actual TitleThis is description" where description starts with uppercase after title
        // Try to split on common patterns like "modelsThis" "languageCircuit" etc (lowercase followed by uppercase)
        const splitMatch = cleanedText.match(/^(.+?)([a-z])([A-Z].+)$/);

        let title = cleanedText;
        let content = '';

        if (splitMatch) {
            title = splitMatch[1] + splitMatch[2]; // Include the lowercase letter with title
            content = splitMatch[3]; // The rest is description
        }

        // If no split found or content is too short, generate placeholder
        if (!content || content.length < 20) {
            content = `Research from Anthropic: ${title}`;
        }

        return { title, content, pubDate };
    };

    try {
        const feedPromises = SOURCES.map(async (source) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout after 6s')), 6000)
            );

            const fetchPromise = (async () => {
                // Fetch primary feed
                const feed = await parser.parseURL(source.url);
                let allItems = feed.items.filter(item => item.pubDate);

                // If source has secondary feed (e.g., DeepMind + Gemini), merge them
                if (source.secondaryUrl) {
                    try {
                        const secondaryFeed = await parser.parseURL(source.secondaryUrl);
                        const secondaryItems = secondaryFeed.items.filter(item => item.pubDate);

                        // Deduplicate: only add secondary items if title doesn't exist in primary
                        const primaryTitles = new Set(allItems.map(i => i.title?.toLowerCase().trim()));
                        secondaryItems.forEach(item => {
                            const normalizedTitle = item.title?.toLowerCase().trim();
                            if (!primaryTitles.has(normalizedTitle)) {
                                allItems.push(item);
                            }
                        });
                    } catch (e) {
                        // Secondary feed failed, continue with primary only
                        console.warn(`Secondary feed failed for ${source.name}:`, e.message);
                    }
                }

                // Sort merged items by date
                allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

                return allItems.slice(0, 15).map(item => {
                    // Apply special cleaning for Anthropic
                    if (source.id === 'anthropic') {
                        const cleaned = cleanAnthropicItem(item);
                        return {
                            title: cleaned.title || item.title,
                            link: item.link,
                            pubDate: cleaned.pubDate || item.pubDate,
                            content: cleaned.content.substring(0, 200),
                            source: source.name,
                            sourceId: source.id,
                            logo: source.logo,
                            image: null
                        };
                    }

                    return {
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        content: (item.contentSnippet || item.description || "").substring(0, 200),
                        source: source.name,
                        sourceId: source.id,
                        logo: source.logo,
                        image: item.enclosure?.url || null
                    };
                });
            })();

            try {
                return await Promise.race([fetchPromise, timeoutPromise]);
            } catch (e) {
                console.error(`[FEED ERROR] ${source.name}:`, e.message);
                return [];
            }
        });

        const results = await Promise.all(feedPromises);

        // DIVERSITY ALGORITHM: Ensure each source gets minimum representation
        // Take top 5 from each source first, then fill rest by date
        const MIN_PER_SOURCE = 5;
        const TOTAL_LIMIT = 60;

        const diverseUpdates = [];
        const remainingBySource = {};

        // First pass: take MIN_PER_SOURCE from each
        results.forEach((items, idx) => {
            const sourceId = SOURCES[idx].id;
            diverseUpdates.push(...items.slice(0, MIN_PER_SOURCE));
            remainingBySource[sourceId] = items.slice(MIN_PER_SOURCE);
        });

        // Second pass: merge remaining and sort by date
        const remaining = Object.values(remainingBySource).flat();
        remaining.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        // Fill up to TOTAL_LIMIT
        const spotsLeft = TOTAL_LIMIT - diverseUpdates.length;
        diverseUpdates.push(...remaining.slice(0, spotsLeft));

        // Final sort by date
        diverseUpdates.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        return res.status(200).json({ updates: diverseUpdates });

    } catch (error) {
        console.error('[UPDATES API CRITICAL ERROR]:', error);
        return res.status(500).json({ error: 'Failed to fetch updates' });
    }
}
