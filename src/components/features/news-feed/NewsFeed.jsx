import React, { useState, useEffect } from 'react';
import { Newspaper, ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { NewsCard } from './NewsCard';
import { FilterBar } from './FilterBar';
import { Card } from '../../ui/Card';

// --- Source Logo Mapping ---
const SOURCE_LOGOS = {
    'TechCrunch': 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=128',
    'VentureBeat': 'https://www.google.com/s2/favicons?domain=venturebeat.com&sz=128',
    'The Verge': 'https://www.google.com/s2/favicons?domain=theverge.com&sz=128',
    'Wired': 'https://www.google.com/s2/favicons?domain=wired.com&sz=128',
    'Ars Technica': 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=128',
    'r/Artificial': 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png',
    'MIT Tech Review': 'https://www.google.com/s2/favicons?domain=technologyreview.com&sz=128',
    'Engadget': 'https://www.google.com/s2/favicons?domain=engadget.com&sz=128',
    'ScienceDaily': 'https://www.google.com/s2/favicons?domain=sciencedaily.com&sz=128',
    'AI News': 'https://www.google.com/s2/favicons?domain=artificialintelligence-news.com&sz=128'
};

const NewsSkeleton = () => (
    <div className="h-full border-2 border-black bg-white flex flex-col brutal-shadow animate-pulse">
        <div className="h-48 w-full bg-gray-200 border-b-2 border-black" />
        <div className="p-5 flex flex-col flex-1 space-y-4">
            <div className="h-6 bg-gray-200 w-3/4 rounded" />
            <div className="h-4 bg-gray-200 w-full rounded" />
            <div className="h-4 bg-gray-200 w-1/2 rounded" />
        </div>
    </div>
);

export const NewsFeed = ({ limit, showAllLink = false }) => {
    const [articles, setArticles] = useState([]);
    const [visibleCount, setVisibleCount] = useState(limit || 12); // Increased initial count for denser grid
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSource, setActiveSource] = useState('All Sources');
    const [readArticles, setReadArticles] = useState(new Set());

    useEffect(() => {
        const savedRead = localStorage.getItem('aimlow_read');
        if (savedRead) { setReadArticles(new Set(JSON.parse(savedRead))); }

        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                if (data.articles && data.articles.length > 0) {
                    setArticles(data.articles);
                }
            } catch (error) {
                console.warn("News feed unavailable:", error);
            } finally {
                setTimeout(() => setLoading(false), 500);
            }
        };
        fetchNews();
    }, []);

    const markAsRead = (link) => {
        const newRead = new Set(readArticles);
        newRead.add(link);
        setReadArticles(newRead);
        localStorage.setItem('aimlow_read', JSON.stringify([...newRead]));
    };

    const getFilteredArticles = () => {
        return articles.filter(article => {
            const searchContent = (article.title + " " + article.summary).toLowerCase();
            const matchesSearch = searchContent.includes(searchQuery.toLowerCase());
            const matchesSource = activeSource === 'All Sources' || article.source === activeSource;

            let matchesCategory = true;
            if (activeCategory !== 'All') {
                const content = (article.title + " " + article.summary).toLowerCase();
                const cat = activeCategory.toLowerCase();
                if (cat === 'llms') matchesCategory = content.includes('gpt') || content.includes('openai') || content.includes('claude') || content.includes('gemini') || content.includes('llama');
                else if (cat === 'creative ai') matchesCategory = content.includes('midjourney') || content.includes('dall-e') || content.includes('image') || content.includes('video') || content.includes('art');
                else if (cat === 'robotics') matchesCategory = content.includes('robot') || content.includes('figure') || content.includes('tesla') || content.includes('humanoid');
                else if (cat === 'hardware') matchesCategory = content.includes('nvidia') || content.includes('gpu') || content.includes('chip') || content.includes('amd');
                else if (cat === 'regulation') matchesCategory = content.includes('law') || content.includes('act') || content.includes('ban') || content.includes('policy') || content.includes('safe');
                else if (cat === 'business') matchesCategory = content.includes('stock') || content.includes('invest') || content.includes('fund') || content.includes('market');
            }
            return matchesSearch && matchesCategory && matchesSource;
        });
    };

    let filteredList = getFilteredArticles();

    if (limit) {
        filteredList.sort((a, b) => {
            const aHasImage = a.image && !a.image.includes('aimlow.ai/logo.jpg');
            const bHasImage = b.image && !b.image.includes('aimlow.ai/logo.jpg');
            if (aHasImage && !bHasImage) return -1;
            if (!aHasImage && bHasImage) return 1;
            return 0;
        });
    }

    const currentLimit = limit ? limit : visibleCount;
    const visibleArticles = filteredList.slice(0, currentLimit);
    const hasMore = !limit && visibleCount < filteredList.length;
    const showControls = !limit;

    return (
        <section className="bg-white border-t-4 border-black py-16 px-4">
            <div className="max-w-[1400px] mx-auto"> {/* Wider container for grid */}

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-4 border-black pb-4 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Newspaper size={32} />
                            <h2 className="text-4xl font-black uppercase">The Lowdown</h2>
                        </div>
                        <p className="font-mono text-sm text-gray-500 font-bold">The latest AI news from trusted sources, all in one place.</p>
                    </div>

                    {showAllLink && (
                        <Link to="/feed" className="hidden md:flex items-center gap-2 font-mono font-bold hover:text-blue-600">
                            View Full Feed <ArrowRight size={18} />
                        </Link>
                    )}
                </div>

                {showControls && (
                    <FilterBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        activeCategory={activeCategory}
                        setActiveCategory={(cat) => { setActiveCategory(cat); setVisibleCount(12); }}
                        activeSource={activeSource}
                        setActiveSource={(src) => { setActiveSource(src); setVisibleCount(12); }}
                        sources={Object.keys(SOURCE_LOGOS)}
                    />
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <NewsSkeleton key={i} />)}
                    </div>
                ) : visibleArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                        {visibleArticles.map((article, idx) => (
                            <NewsCard
                                key={`${article.link}-${idx}`}
                                article={article}
                                isRead={readArticles.has(article.link)}
                                onRead={markAsRead}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="py-20 text-center border-dashed bg-gray-50" noShadow>
                        <p className="font-mono text-gray-400 font-bold">No intel found matching these filters.</p>
                        <Button
                            variant="ghost"
                            className="mt-4 underline"
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveSource('All Sources'); }}
                        >
                            Clear Filters
                        </Button>
                    </Card>
                )}

                <div className="mt-12 text-center">
                    {showAllLink ? (
                        <Link to="/feed">
                            <Button size="lg" icon="arrow-right">VIEW FULL INTEL FEED</Button>
                        </Link>
                    ) : hasMore ? (
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => setVisibleCount(prev => prev + 12)}
                            icon="chevron-down"
                        >
                            LOAD MORE INTEL
                        </Button>
                    ) : visibleArticles.length > 0 ? (
                        <p className="font-mono text-gray-400 font-bold">End of feed.</p>
                    ) : null}
                </div>
            </div>
        </section>
    );
};
