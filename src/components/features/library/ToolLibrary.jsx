import React, { useState, useEffect } from 'react';
import { Star, Zap, ExternalLink, PenTool, Code, Image, Video, Music, Search, Sparkles } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

const CATEGORY_ICONS = {
    writing: PenTool,
    coding: Code,
    images: Image,
    video: Video,
    music: Music,
    research: Search
};

export const ToolLibrary = () => {
    const [library, setLibrary] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const res = await fetch('/api/tools');
                const data = await res.json();
                if (data?.categories) setLibrary(data.categories);
            } catch (error) {
                console.error("Failed to fetch library:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    const ToolCard = ({ tool, featured }) => (
        <Card className={`h-full flex flex-col transition-all hover:scale-[1.02] ${featured ? 'border-yellow-400 border-2 bg-gradient-to-br from-yellow-50 to-amber-50' : 'hover:shadow-lg'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={tool.image}
                        alt={tool.title}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=AI' }}
                    />
                    <div>
                        <h3 className="font-bold text-base leading-tight">{tool.title}</h3>
                        {featured && (
                            <span className="text-xs font-mono bg-yellow-400 text-black px-2 py-0.5 rounded-full uppercase mt-1 inline-flex items-center gap-1">
                                <Star size={10} className="fill-current" /> Essential
                            </span>
                        )}
                        {tool.isTrending && (
                            <span className="text-xs font-mono bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase mt-1 inline-flex items-center gap-1">
                                <Zap size={10} /> Trending
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">
                {tool.description}
            </p>
            <a href={tool.link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                <Button className="w-full" variant={featured ? 'primary' : 'secondary'} size="sm">
                    TRY IT <ExternalLink size={14} className="ml-2" />
                </Button>
            </a>
        </Card>
    );

    const CategoryButton = ({ id, name, icon: Icon, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm transition-all ${isActive
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
            {Icon && <Icon size={16} />}
            {name}
        </button>
    );

    // Get all tools for display based on active category
    const getDisplayTools = () => {
        if (activeCategory === 'all') {
            // Show 2 essentials from each category + aggregated trending
            const allEssentials = [];
            const allTrending = [];
            Object.values(library).forEach(cat => {
                allEssentials.push(...(cat.essentials || []).slice(0, 2));
                allTrending.push(...(cat.trending || []).slice(0, 2));
            });
            return { essentials: allEssentials, trending: allTrending.slice(0, 8) };
        }

        const cat = library[activeCategory];
        return cat ? { essentials: cat.essentials || [], trending: cat.trending || [] } : { essentials: [], trending: [] };
    };

    const displayData = getDisplayTools();
    const categoryList = Object.entries(library).map(([key, val]) => ({
        id: key,
        name: val.name,
        icon: CATEGORY_ICONS[key]
    }));

    return (
        <section className="py-12 px-4 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 uppercase flex items-center justify-center gap-3">
                    <Sparkles className="text-yellow-500" /> The Arsenal
                </h1>
                <p className="font-mono text-gray-500 max-w-xl mx-auto">
                    The most powerful AI tools, organized by use case.
                    Essentials are curator picks. Trending updates automatically.
                </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <CategoryButton
                    id="all"
                    name="All"
                    icon={Sparkles}
                    isActive={activeCategory === 'all'}
                    onClick={() => setActiveCategory('all')}
                />
                {categoryList.map(cat => (
                    <CategoryButton
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        icon={cat.icon}
                        isActive={activeCategory === cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                    />
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
                    </div>
                </div>
            ) : activeCategory === 'all' ? (
                /* ALL VIEW - Side by side with aggregated trending */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* LEFT: Essential Picks */}
                    <div className="lg:pr-8 lg:border-r-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-2">
                            <Star className="text-yellow-500 fill-yellow-500" />
                            <h2 className="text-xl font-black uppercase">Essential Picks</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayData.essentials.map((tool, idx) => (
                                <ToolCard key={idx} tool={tool} featured={true} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Top Trending */}
                    <div className="lg:pl-8 mt-12 lg:mt-0">
                        <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-2">
                            <Zap className="text-blue-500" />
                            <h2 className="text-xl font-black uppercase">Hot Right Now</h2>
                            <span className="ml-auto text-xs font-mono text-gray-400">
                                via Product Hunt
                            </span>
                        </div>
                        {displayData.trending.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayData.trending.map((tool, idx) => (
                                    <ToolCard key={idx} tool={tool} featured={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                                <Zap className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="font-mono text-gray-400 text-sm">Loading trending...</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* CATEGORY VIEW - Side by side */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* LEFT: Essentials */}
                    <div className="lg:pr-8 lg:border-r-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-2">
                            <Star className="text-yellow-500 fill-yellow-500" />
                            <h2 className="text-xl font-black uppercase">Essential {library[activeCategory]?.name} Tools</h2>
                        </div>
                        <div className="space-y-4">
                            {displayData.essentials.map((tool, idx) => (
                                <ToolCard key={idx} tool={tool} featured={true} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Trending */}
                    <div className="lg:pl-8 mt-12 lg:mt-0">
                        <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-2">
                            <Zap className="text-blue-500" />
                            <h2 className="text-xl font-black uppercase">Trending</h2>
                            <span className="ml-auto text-xs font-mono text-gray-400">
                                via Product Hunt
                            </span>
                        </div>
                        {displayData.trending.length > 0 ? (
                            <div className="space-y-4">
                                {displayData.trending.map((tool, idx) => (
                                    <ToolCard key={idx} tool={tool} featured={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                                <Zap className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="font-mono text-gray-400 text-sm">
                                    No trending tools right now.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
