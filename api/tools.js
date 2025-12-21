import Parser from 'rss-parser';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    const parser = new Parser({
        timeout: 5000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
        }
    });

    // CATEGORIES with Product Hunt feed URLs and curated essentials
    const CATEGORIES = {
        writing: {
            name: 'Writing',
            icon: 'pen-tool',
            feedUrl: 'https://www.producthunt.com/feed?category=writing-assistants',
            essentials: [
                { title: 'ChatGPT', description: 'The AI that started it all. Best for general writing, brainstorming, and editing.', link: 'https://chat.openai.com', image: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128' },
                { title: 'Claude', description: 'Anthropic\'s AI with massive context window. Great for long documents.', link: 'https://claude.ai', image: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=128' },
                { title: 'Jasper', description: 'Enterprise-grade AI copywriting for marketing teams.', link: 'https://jasper.ai', image: 'https://www.google.com/s2/favicons?domain=jasper.ai&sz=128' },
                { title: 'Copy.ai', description: 'AI-powered copywriting for ads, emails, and social posts.', link: 'https://copy.ai', image: 'https://www.google.com/s2/favicons?domain=copy.ai&sz=128' }
            ]
        },
        coding: {
            name: 'Coding',
            icon: 'code',
            feedUrl: 'https://www.producthunt.com/feed?category=developer-tools',
            essentials: [
                { title: 'GitHub Copilot', description: 'AI pair programmer from GitHub/OpenAI. Industry standard.', link: 'https://github.com/features/copilot', image: 'https://www.google.com/s2/favicons?domain=github.com&sz=128' },
                { title: 'Cursor', description: 'VS Code fork with AI built-in. The new developer favorite.', link: 'https://cursor.sh', image: 'https://www.google.com/s2/favicons?domain=cursor.sh&sz=128' },
                { title: 'Replit AI', description: 'Code, run, and deploy with AI assistance in browser.', link: 'https://replit.com', image: 'https://www.google.com/s2/favicons?domain=replit.com&sz=128' },
                { title: 'v0 by Vercel', description: 'Generate UI components with AI. React/Tailwind ready.', link: 'https://v0.dev', image: 'https://www.google.com/s2/favicons?domain=v0.dev&sz=128' }
            ]
        },
        images: {
            name: 'Images',
            icon: 'image',
            feedUrl: 'https://www.producthunt.com/feed?category=design-tools',
            essentials: [
                { title: 'Midjourney', description: 'The highest quality AI image generator. Discord-based.', link: 'https://midjourney.com', image: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=128' },
                { title: 'DALL-E 3', description: 'OpenAI\'s image generator. Best text rendering.', link: 'https://openai.com/dall-e-3', image: 'https://www.google.com/s2/favicons?domain=openai.com&sz=128' },
                { title: 'Ideogram', description: 'Excellent for logos and typography in AI images.', link: 'https://ideogram.ai', image: 'https://www.google.com/s2/favicons?domain=ideogram.ai&sz=128' },
                { title: 'Leonardo.ai', description: 'Fine-tuned models for game art and illustrations.', link: 'https://leonardo.ai', image: 'https://www.google.com/s2/favicons?domain=leonardo.ai&sz=128' }
            ]
        },
        video: {
            name: 'Video',
            icon: 'video',
            feedUrl: 'https://www.producthunt.com/feed?category=video',
            essentials: [
                { title: 'Runway', description: 'Text-to-video pioneer. Gen-3 Alpha is stunning.', link: 'https://runwayml.com', image: 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=128' },
                { title: 'Pika', description: 'Fast, creative video generation with great motion.', link: 'https://pika.art', image: 'https://www.google.com/s2/favicons?domain=pika.art&sz=128' },
                { title: 'Kling', description: 'Chinese AI video model with impressive realism.', link: 'https://klingai.com', image: 'https://www.google.com/s2/favicons?domain=klingai.com&sz=128' },
                { title: 'HeyGen', description: 'AI avatars and video translation. Great for marketing.', link: 'https://heygen.com', image: 'https://www.google.com/s2/favicons?domain=heygen.com&sz=128' }
            ]
        },
        music: {
            name: 'Music',
            icon: 'music',
            feedUrl: 'https://www.producthunt.com/feed?category=music',
            essentials: [
                { title: 'Suno', description: 'Create full songs from text. Radio-quality output.', link: 'https://suno.com', image: 'https://www.google.com/s2/favicons?domain=suno.com&sz=128' },
                { title: 'Udio', description: 'High-fidelity AI music with great vocals.', link: 'https://udio.com', image: 'https://www.google.com/s2/favicons?domain=udio.com&sz=128' },
                { title: 'AIVA', description: 'AI composer for soundtracks and orchestral music.', link: 'https://aiva.ai', image: 'https://www.google.com/s2/favicons?domain=aiva.ai&sz=128' },
                { title: 'Mubert', description: 'Royalty-free AI-generated background music.', link: 'https://mubert.com', image: 'https://www.google.com/s2/favicons?domain=mubert.com&sz=128' }
            ]
        },
        research: {
            name: 'Research',
            icon: 'search',
            feedUrl: 'https://www.producthunt.com/feed?category=artificial-intelligence',
            essentials: [
                { title: 'Perplexity', description: 'AI search engine that cites sources. Google killer.', link: 'https://perplexity.ai', image: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128' },
                { title: 'NotebookLM', description: 'Google\'s AI research assistant. Great for documents.', link: 'https://notebooklm.google.com', image: 'https://www.google.com/s2/favicons?domain=google.com&sz=128' },
                { title: 'Elicit', description: 'AI research assistant for academic papers.', link: 'https://elicit.com', image: 'https://www.google.com/s2/favicons?domain=elicit.com&sz=128' },
                { title: 'Consensus', description: 'AI-powered search for scientific research.', link: 'https://consensus.app', image: 'https://www.google.com/s2/favicons?domain=consensus.app&sz=128' }
            ]
        }
    };

    try {
        // Fetch trending for each category in parallel
        const categoryPromises = Object.entries(CATEGORIES).map(async ([key, cat]) => {
            let trending = [];

            try {
                const feed = await parser.parseURL(cat.feedUrl);
                trending = feed.items.slice(0, 6).map(item => {
                    const content = item.content || item.description || "";
                    const imgMatch = content.match(/src=["'](https?:\/\/[^"']+)["']/);

                    // Extract description from first <p> in raw content (before Discussion|Link part)
                    let description = "";
                    const pMatch = content.match(/<p>\s*([^<]+)\s*<\/p>/i);
                    if (pMatch && pMatch[1] && !pMatch[1].includes('Discussion')) {
                        description = pMatch[1].replace(/&amp;/g, '&').trim();
                    }

                    // Fallback: use contentSnippet but cut at Discussion
                    if (!description || description.length < 10) {
                        description = (item.contentSnippet || "")
                            .split('Discussion')[0]
                            .replace(/\s+/g, ' ')
                            .trim();
                    }

                    // Final fallback
                    if (!description || description.length < 10) {
                        description = `Discover ${item.title} - trending on Product Hunt.`;
                    }

                    // Try to extract actual product URL from content (the "Link" href)
                    const productUrlMatch = content.match(/href="(https?:\/\/www\.producthunt\.com\/r\/[^"]+)"/);

                    // Create a deterministic color based on title for placeholder
                    const colors = ['3b82f6', 'ef4444', '22c55e', 'f59e0b', '8b5cf6', 'ec4899', '06b6d4'];
                    const colorIdx = item.title.length % colors.length;
                    const placeholderImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title.substring(0, 2))}&background=${colors[colorIdx]}&color=fff&size=128&bold=true`;

                    return {
                        title: item.title,
                        description: description.substring(0, 140),
                        link: item.link,
                        image: placeholderImg,
                        isTrending: true
                    };
                });
            } catch (e) {
                console.warn(`Feed failed for ${cat.name}:`, e.message);
            }

            return {
                key,
                name: cat.name,
                icon: cat.icon,
                essentials: cat.essentials.map(t => ({ ...t, isEssential: true })),
                trending
            };
        });

        const categories = await Promise.all(categoryPromises);

        // Build response object
        const library = {};
        categories.forEach(cat => {
            library[cat.key] = {
                name: cat.name,
                icon: cat.icon,
                essentials: cat.essentials,
                trending: cat.trending
            };
        });

        return res.status(200).json({ categories: library });

    } catch (error) {
        console.error('Library API Error:', error);
        return res.status(500).json({ error: 'Failed to fetch library' });
    }
}
