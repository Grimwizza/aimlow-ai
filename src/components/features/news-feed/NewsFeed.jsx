import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Newspaper, ArrowRight, ChevronUp, Bookmark, BookmarkCheck, Share2, Clock } from 'lucide-react';
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
    'MIT Tech Review': 'https://www.google.com/s2/favicons?domain=technologyreview.com&sz=128',
    'Reuters Tech': 'https://www.google.com/s2/favicons?domain=reuters.com&sz=128',
    'IEEE Spectrum': 'https://www.google.com/s2/favicons?domain=spectrum.ieee.org&sz=128',
    'Engadget': 'https://www.google.com/s2/favicons?domain=engadget.com&sz=128',
    'ScienceDaily': 'https://www.google.com/s2/favicons?domain=sciencedaily.com&sz=128'
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSource, setActiveSource] = useState('All Sources');
    const [readArticles, setReadArticles] = useState(new Set());

    // New UX features
    const [bookmarkedArticles, setBookmarkedArticles] = useState(new Set());
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1); // For keyboard nav

    const fetchNews = async (pageNum = 1, append = false) => {
        try {
            if (append) setLoadingMore(true);
            const res = await fetch(`/api/news?page=${pageNum}&limit=24`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (data.articles) {
                if (append) {
                    setArticles(prev => [...prev, ...data.articles]);
                } else {
                    setArticles(data.articles);
                }
                setHasMore(data.hasMore);
                setTotal(data.total);
                setPage(pageNum);
            }
        } catch (error) {
            console.warn("News feed unavailable:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const savedRead = localStorage.getItem('aimlow_read');
        if (savedRead) { setReadArticles(new Set(JSON.parse(savedRead))); }

        const savedBookmarks = localStorage.getItem('aimlow_bookmarks');
        if (savedBookmarks) { setBookmarkedArticles(new Set(JSON.parse(savedBookmarks))); }

        fetchNews(1);
    }, []);

    // Back to top visibility on scroll
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Keyboard navigation (j/k to navigate, Enter to open)
    useEffect(() => {
        if (limit) return; // Only on full feed page

        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return; // Don't capture when typing

            const filtered = getFilteredArticles();
            if (e.key === 'j' || e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === 'k' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                const article = filtered[selectedIndex];
                if (article) window.open(article.link, '_blank');
            } else if (e.key === 'b' && selectedIndex >= 0) {
                const article = filtered[selectedIndex];
                if (article) toggleBookmark(article.link);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [limit, selectedIndex]);

    const loadMore = useCallback(() => {
        if (hasMore && !loadingMore) {
            fetchNews(page + 1, true);
        }
    }, [hasMore, loadingMore, page]);

    // Infinite scroll using IntersectionObserver
    const observerRef = useRef();
    const loadMoreTriggerRef = useCallback(node => {
        if (loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
                loadMore();
            }
        }, { threshold: 0.1, rootMargin: '100px' });

        if (node) observerRef.current.observe(node);
    }, [loadingMore, hasMore, loadMore]);

    const markAsRead = (link) => {
        const newRead = new Set(readArticles);
        newRead.add(link);
        setReadArticles(newRead);
        localStorage.setItem('aimlow_read', JSON.stringify([...newRead]));
    };

    const toggleBookmark = (link) => {
        const newBookmarks = new Set(bookmarkedArticles);
        if (newBookmarks.has(link)) {
            newBookmarks.delete(link);
        } else {
            newBookmarks.add(link);
        }
        setBookmarkedArticles(newBookmarks);
        localStorage.setItem('aimlow_bookmarks', JSON.stringify([...newBookmarks]));
    };

    const shareArticle = async (article) => {
        const shareData = { title: article.title, url: article.link };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (e) { }
        } else {
            navigator.clipboard.writeText(article.link);
            alert('Link copied to clipboard!');
        }
    };

    const getReadingTime = (text) => {
        const wordsPerMinute = 200;
        const words = (text || '').split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return Math.max(1, minutes);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const checkCategoryMatch = (article, category) => {
        const content = (article.title + " " + article.summary).toLowerCase();
        const cat = category.toLowerCase();

        if (cat === 'models') {
            return content.includes('gpt') || content.includes('claude') || content.includes('gemini') ||
                content.includes('llama') || content.includes('mistral') || content.includes('anthropic') ||
                content.includes('chatbot') || content.includes('language model') || content.includes('llm') ||
                content.includes('openai') || content.includes('chatgpt');
        }
        else if (cat === 'image & video') {
            return content.includes('midjourney') || content.includes('dall-e') || content.includes('sora') ||
                content.includes('runway') || content.includes('pika') || content.includes('stable diffusion') ||
                content.includes('image generat') || content.includes('video generat') || content.includes('text-to-image') ||
                content.includes('text-to-video') || content.includes('generative art');
        }
        else if (cat === 'agents') {
            return content.includes('agent') || content.includes('autonomous') || content.includes('agentic') ||
                content.includes('autopilot') || content.includes('multi-agent') || content.includes('reasoning');
        }
        else if (cat === 'research') {
            return content.includes('research') || content.includes('paper') || content.includes('study') ||
                content.includes('breakthrough') || content.includes('benchmark') || content.includes('scientists') ||
                content.includes('discovered') || content.includes('arxiv');
        }
        else if (cat === 'companies') {
            return content.includes('startup') || content.includes('raises') || content.includes('acquisition') ||
                content.includes('valuation') || content.includes('funding') || content.includes('ipo') ||
                content.includes('billion') || content.includes('million') || content.includes('series');
        }
        else if (cat === 'policy') {
            return content.includes('regulation') || content.includes('congress') || content.includes('eu ') ||
                content.includes('legislation') || content.includes('lawsuit') || content.includes('copyright') ||
                content.includes('government') || content.includes('ban') || content.includes('safety') ||
                content.includes('ethics') || content.includes('law');
        }
        else if (cat === 'hardware') {
            return content.includes('nvidia') || content.includes('gpu') || content.includes('chip') ||
                content.includes('tpu') || content.includes('processor') || content.includes('inference') ||
                content.includes('training') || content.includes('datacenter') || content.includes('amd') ||
                content.includes('apple') || content.includes('hardware');
        }
        return false;
    };

    const getFilteredArticles = () => {
        return articles.filter(article => {
            const searchContent = (article.title + " " + article.summary).toLowerCase();
            const matchesSearch = searchContent.includes(searchQuery.toLowerCase());
            const matchesSource = activeSource === 'All Sources' || article.source === activeSource;

            let matchesCategory = true;
            if (activeCategory !== 'All') {
                matchesCategory = checkCategoryMatch(article, activeCategory);
            }
            return matchesSearch && matchesCategory && matchesSource;
        });
    };

    // Calculate counts for filters
    const categoryCounts = {};
    if (!limit) { // Only calculate on full feed page
        const baseArticles = articles.filter(article => {
            const searchContent = (article.title + " " + article.summary).toLowerCase();
            const matchesSearch = searchContent.includes(searchQuery.toLowerCase());
            const matchesSource = activeSource === 'All Sources' || article.source === activeSource;
            return matchesSearch && matchesSource;
        });

        ["All", "Models", "Image & Video", "Agents", "Research", "Companies", "Policy", "Hardware"].forEach(cat => {
            if (cat === 'All') {
                categoryCounts[cat] = baseArticles.length;
            } else {
                categoryCounts[cat] = baseArticles.filter(a => checkCategoryMatch(a, cat)).length;
            }
        });
    }

    let filteredList = getFilteredArticles();

    if (limit) {
        filteredList.sort((a, b) => {
            const aHasImage = a.image && !a.image.includes('ui-avatars');
            const bHasImage = b.image && !b.image.includes('ui-avatars');
            if (aHasImage && !bHasImage) return -1;
            if (!aHasImage && bHasImage) return 1;
            return 0;
        });
    }

    const visibleArticles = limit ? filteredList.slice(0, limit) : filteredList;
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
                        setActiveCategory={setActiveCategory}
                        activeSource={activeSource}
                        setActiveSource={setActiveSource}
                        sources={Object.keys(SOURCE_LOGOS)}
                        categoryCounts={categoryCounts}
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
                                isBookmarked={bookmarkedArticles.has(article.link)}
                                onBookmark={toggleBookmark}
                                onShare={shareArticle}
                                readingTime={getReadingTime(article.summary)}
                                isSelected={idx === selectedIndex}
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
                    ) : (
                        <>
                            {/* Infinite scroll trigger */}
                            {hasMore && !limit && (
                                <div ref={loadMoreTriggerRef} className="py-8">
                                    {loadingMore && (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-mono font-bold">Loading more...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!hasMore && visibleArticles.length > 0 && (
                                <p className="font-mono text-gray-400 font-bold">You've reached the end. {total} articles total.</p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all z-50 animate-bounce"
                    aria-label="Back to top"
                >
                    <ChevronUp size={24} />
                </button>
            )}
        </section>
    );
};
