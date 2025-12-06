import React, { useState, useEffect } from 'react';
import { ExternalLink, Newspaper, ArrowRight, ChevronDown, Search, X, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const NewsFeed = ({ limit, showAllLink = false }) => {
    const [articles, setArticles] = useState([]);
    const [visibleCount, setVisibleCount] = useState(limit || 9);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSource, setActiveSource] = useState('All Sources');
    const [readArticles, setReadArticles] = useState(new Set());

    const CATEGORIES = ["All", "LLMs", "Creative AI", "Robotics", "Hardware", "Regulation", "Business"];

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
                if (activeCategory === 'LLMs') matchesCategory = content.includes('gpt') || content.includes('openai') || content.includes('claude') || content.includes('gemini') || content.includes('llama') || content.includes('grok') || content.includes('chatbot') || content.includes('model');
                else if (activeCategory === 'Creative AI') matchesCategory = content.includes('midjourney') || content.includes('dall-e') || content.includes('stable diffusion') || content.includes('sora') || content.includes('runway') || content.includes('video') || content.includes('image') || content.includes('art ');
                else if (activeCategory === 'Robotics') matchesCategory = content.includes('robot') || content.includes('humanoid') || content.includes('boston dynamics') || content.includes('tesla bot') || content.includes('optimus') || content.includes('figure');
                else if (activeCategory === 'Hardware') matchesCategory = content.includes('nvidia') || content.includes('gpu') || content.includes('chips') || content.includes('hardware') || content.includes('amd') || content.includes('intel') || content.includes('compute');
                else if (activeCategory === 'Regulation') matchesCategory = content.includes('law') || content.includes('bill') || content.includes('congress') || content.includes('eu ') || content.includes('safety') || content.includes('ethics') || content.includes('deepfake') || content.includes('copyright');
                else if (activeCategory === 'Business') matchesCategory = content.includes('stock') || content.includes('invest') || content.includes('funding') || content.includes('startup') || content.includes('billion') || content.includes('acquisition') || content.includes('market') || content.includes('microsoft') || content.includes('apple');
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

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval >= 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval >= 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    const NewsSkeleton = () => (
        <div className="h-full border-3 border-black bg-white flex flex-col brutal-shadow">
            <div className="h-48 w-full bg-gray-200 animate-pulse border-b-3 border-black" />
            <div className="p-5 flex flex-col flex-1 space-y-4">
                <div className="h-6 bg-gray-200 animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 animate-pulse w-full" />
                <div className="h-4 bg-gray-200 animate-pulse w-1/2" />
                <div className="mt-auto flex justify-between">
                    <div className="h-3 bg-gray-200 animate-pulse w-16" />
                    <div className="h-3 bg-gray-200 animate-pulse w-16" />
                </div>
            </div>
        </div>
    );

    return (
        <section className="bg-white border-t-4 border-black py-16 px-4">
            <div className="max-w-6xl mx-auto">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-2 border-black pb-4 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Newspaper size={32} />
                            <h2 className="text-4xl font-black uppercase">The Lowdown</h2>
                        </div>
                        {/* UPDATED SLOGAN (Sentence case) */}
                        <p className="font-mono text-sm text-gray-500 font-bold">The latest AI news from trusted sources, all in one place.</p>
                    </div>
                    
                    {showAllLink && (
                        <Link to="/feed" className="hidden md:flex items-center gap-2 font-mono font-bold hover:text-blue-600">
                            View Full Feed <ArrowRight size={18} />
                        </Link>
                    )}
                </div>

                {showControls && (
                    <div className="mb-12 space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search intel..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-colors"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-black">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="relative min-w-[200px]">
                                <select value={activeSource} onChange={(e) => { setActiveSource(e.target.value); setVisibleCount(9); }} className="w-full h-full appearance-none border-2 border-black bg-white pl-4 pr-10 py-3 font-bold text-lg focus:outline-none focus:bg-yellow-50 cursor-pointer">
                                    <option value="All Sources">All Sources</option>
                                    {Object.keys(SOURCE_LOGOS).map(source => <option key={source} value={source}>{source}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><Filter size={20} /></div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => { setActiveCategory(cat); setVisibleCount(9); }} className={`px-4 py-1 border-2 border-black font-mono font-bold text-sm uppercase transition-all ${activeCategory === cat ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-gray-100'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                )}
                
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => <NewsSkeleton key={i} />)}
                    </div>
                ) : visibleArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {visibleArticles.map((article, idx) => {
                            const sourceFallback = SOURCE_LOGOS[article.source] || '/logo.jpg';
                            const displayImage = (!article.image || article.image.includes('aimlow.ai/logo.jpg')) ? sourceFallback : article.image;
                            const isRead = readArticles.has(article.link);
                            const isLogo = displayImage === sourceFallback;

                            return (
                                <a key={idx} href={article.link} target="_blank" rel="noopener noreferrer" onClick={() => markAsRead(article.link)} className={`group block h-full transition-opacity duration-300 ${isRead ? 'opacity-60 grayscale' : 'opacity-100'}`}>
                                    <article className="h-full border-3 border-black bg-white flex flex-col hover:-translate-y-1 transition-transform brutal-shadow relative">
                                        <div className="absolute top-0 left-0 bg-[#FEC43D] border-b-2 border-r-2 border-black px-3 py-1 font-mono text-xs font-bold z-20 uppercase">{article.source}</div>
                                        <div className="h-48 w-full overflow-hidden border-b-3 border-black relative bg-gray-100 flex items-center justify-center">
                                            <img src={displayImage} alt="" className={`w-full h-full ${isLogo ? 'object-contain p-10' : 'object-cover'}`} onError={(e) => { e.target.onerror = null; e.target.src = sourceFallback; e.target.className = "w-full h-full object-contain p-8 bg-gray-100"; }} />
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-xl font-black leading-tight mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{article.title}</h3>
                                            <p className="font-serif text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{article.summary}</p>
                                            <div className="flex items-center justify-between mt-auto font-mono text-xs text-gray-400"><span>{timeAgo(article.pubDate)}</span><span className="flex items-center gap-1 font-bold text-black uppercase group-hover:text-blue-600">Read <ExternalLink size={14} /></span></div>
                                        </div>
                                    </article>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-gray-300 bg-gray-50">
                        <p className="font-mono text-gray-400 font-bold">No intel found matching these filters.</p>
                        <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveSource('All Sources'); }} className="mt-4 text-blue-600 underline font-bold">Clear Filters</button>
                    </div>
                )}

                <div className="mt-12 text-center">
                    {showAllLink ? (
                        <Link to="/feed" className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 font-bold text-lg hover:bg-blue-600 transition-colors brutal-shadow">VIEW FULL INTEL FEED <ArrowRight size={20} /></Link>
                    ) : hasMore ? (
                        <button onClick={() => setVisibleCount(prev => prev + 9)} className="inline-flex items-center gap-2 bg-white text-black border-2 border-black px-8 py-3 font-bold text-lg hover:bg-gray-100 transition-colors brutal-shadow">LOAD MORE INTEL <ChevronDown size={20} /></button>
                    ) : visibleArticles.length > 0 ? (
                        <p className="font-mono text-gray-400 font-bold">End of feed.</p>
                    ) : null}
                </div>
            </div>
        </section>
    );
};