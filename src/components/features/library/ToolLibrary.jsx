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
        <Card className={`h-full flex flex-col transition-all duration-300 ${featured ? 'border-primary/50 bg-secondary/10 shadow-md' : 'hover:shadow-md hover:border-primary/30'}`}>
            <div className="flex items-start justify-between mb-4 p-5 pb-0">
                <div className="flex items-center gap-4 w-full">
                    <img
                        src={tool.image}
                        alt={tool.title}
                        className="w-12 h-12 rounded-lg object-cover border border-border bg-background"
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=AI' }}
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight mb-1">{tool.title}</h3>
                        <div className="flex flex-wrap gap-2">
                            {featured && (
                                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-primary/20 w-fit">
                                    <Star size={8} className="fill-current" /> Essential
                                </span>
                            )}
                            {tool.isTrending && (
                                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit border border-blue-500/20">
                                    <Zap size={8} /> Trending
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-5 pb-5 pt-2 flex flex-col flex-1">
                <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
                    {tool.description}
                </p>
                <a href={tool.link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                    <Button className="w-full gap-2 group" variant={featured ? 'default' : 'outline'} size="sm">
                        Try Tool <ExternalLink size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                </a>
            </div>
        </Card>
    );

    const CategoryButton = ({ id, name, icon: Icon, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
        <section className="py-16 px-6 max-w-[1400px] mx-auto min-h-screen">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight flex items-center justify-center gap-3">
                    <Sparkles className="text-primary" /> Trending AI Tools
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                    The most powerful AI tools, organized by use case.
                    Essentials are curator picks. Trending tools update automatically.
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
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
                    </div>
                </div>
            ) : activeCategory === 'all' ? (
                /* ALL VIEW - Side by side with aggregated trending */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* LEFT: Essential Picks */}
                    <div className="lg:pr-8 lg:border-r border-border">
                        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
                            <Star className="text-primary fill-primary" />
                            <h2 className="text-xl font-bold tracking-tight">Essential Picks</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {displayData.essentials.map((tool, idx) => (
                                <ToolCard key={idx} tool={tool} featured={true} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Top Trending */}
                    <div className="mt-8 lg:mt-0">
                        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
                            <Zap className="text-blue-500" />
                            <h2 className="text-xl font-bold tracking-tight">Trending Now</h2>
                            <span className="ml-auto text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                via Product Hunt
                            </span>
                        </div>
                        {displayData.trending.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {displayData.trending.map((tool, idx) => (
                                    <ToolCard key={idx} tool={tool} featured={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                                <Zap className="mx-auto text-muted-foreground mb-2" size={32} />
                                <p className="font-mono text-muted-foreground text-sm">Loading trending...</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* CATEGORY VIEW - Side by side */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* LEFT: Essentials */}
                    <div className="lg:pr-8 lg:border-r border-border">
                        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
                            <Star className="text-primary fill-primary" />
                            <h2 className="text-xl font-bold tracking-tight">Essential {library[activeCategory]?.name} Tools</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {displayData.essentials.map((tool, idx) => (
                                <ToolCard key={idx} tool={tool} featured={true} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Trending */}
                    <div className="mt-8 lg:mt-0">
                        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
                            <Zap className="text-blue-500" />
                            <h2 className="text-xl font-bold tracking-tight">Trending</h2>
                            <span className="ml-auto text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                via Product Hunt
                            </span>
                        </div>
                        {displayData.trending.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {displayData.trending.map((tool, idx) => (
                                    <ToolCard key={idx} tool={tool} featured={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                                <Zap className="mx-auto text-muted-foreground mb-2" size={32} />
                                <p className="font-mono text-muted-foreground text-sm">
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
