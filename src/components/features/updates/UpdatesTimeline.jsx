
import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, Activity } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export const UpdatesTimeline = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const FILTERS = [
        { id: 'all', label: 'All Updates', logo: null },
        { id: 'openai', label: 'OpenAI', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
        { id: 'anthropic', label: 'Anthropic', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg' },
        { id: 'deepmind', label: 'Google AI', logo: 'https://www.google.com/s2/favicons?domain=deepmind.google&sz=128' },
        { id: 'xai', label: 'Grok', logo: 'https://www.google.com/s2/favicons?domain=x.ai&sz=128' },
        { id: 'meta', label: 'Meta AI', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' }
    ];

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const res = await fetch('/api/updates');
                const data = await res.json();
                if (data.updates) setUpdates(data.updates);
            } catch (error) {
                console.error("Failed to fetch updates:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUpdates();
    }, []);

    const filteredUpdates = filter === 'all'
        ? updates
        : updates.filter(item => item.sourceId === filter);

    const UpdateItem = ({ item, isLast }) => (
        <div className="relative pl-8 md:pl-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Desktop Timeline Line */}
            <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-0.5 bg-primary transform -translate-x-1/2"></div>

            <div className={`flex flex-col md:flex-row items-center justify-between w-full pb-12 ${isLast ? '' : ''}`}>

                {/* Date Side (Left on Desktop) */}
                <div className="w-full md:w-5/12 text-left md:text-right mb-4 md:mb-0 md:pr-12 flex flex-col items-start md:items-end">
                    <div className="flex flex-col items-start md:items-center gap-3">
                        <div className="inline-flex items-center justify-center bg-muted/50 text-muted-foreground px-3 py-1 rounded-full text-xs font-medium tracking-wide border border-border/50">
                            {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>

                        {item.image ? (
                            <div className="relative group overflow-hidden rounded-lg border border-border/50 shadow-sm mt-1 max-w-[200px]">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-2">
                                    <span className="text-white text-xs font-bold drop-shadow-md">{item.source}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-1 mt-1">
                                {item.logo && (
                                    <img src={item.logo} alt={item.source} className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-border bg-white object-contain p-1 shadow-sm" />
                                )}
                                <span className="font-bold text-lg md:text-xl text-foreground tracking-tight">{item.source}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Dot */}
                <div className="absolute left-0 md:left-[50%] top-0 md:top-6 w-3 h-3 bg-primary rounded-full ring-4 ring-background shadow-sm transform -translate-x-[5px] md:-translate-x-1/2 z-10"></div>

                {/* Content Side (Right on Desktop) */}
                <div className="w-full md:w-5/12 md:pl-12">
                    <Card className="hover:shadow-md transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-2 leading-tight tracking-tight">{item.title}</h3>
                            <div className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content.replace(/<[^>]*>/g, '') }}></div>
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="w-full text-xs h-9 font-medium gap-2 text-foreground dark:text-foreground hover:bg-primary/5 hover:text-primary dark:hover:text-primary border-border">
                                    Read Log <ExternalLink size={12} className="opacity-50" />
                                </Button>
                            </a>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-16 px-6 max-w-5xl mx-auto min-h-screen">
            <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                    <Activity size={32} className="text-primary" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 pb-4">
                    AI Changelog
                </h1>
                <p className="text-xl text-muted-foreground font-light max-w-lg mx-auto mb-12 leading-relaxed">
                    Change is coming quickly. Stay informed with these real-time updates from every major AI lab.
                </p>

                {/* FILTER BAR */}
                <div className="flex flex-wrap justify-center gap-3 animate-in fade-in duration-700">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${filter === f.id
                                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {f.logo && <img src={f.logo} alt={f.label} className="w-4 h-4 object-contain bg-white rounded-full" />}
                            <span className="uppercase tracking-wide text-xs">{f.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-8 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-muted rounded-xl border border-border/50"></div>
                    ))}
                </div>
            ) : (
                <div className="relative min-h-[400px]">
                    {filteredUpdates.length > 0 ? (
                        filteredUpdates.map((item, idx) => (
                            <UpdateItem key={idx} item={item} isLast={idx === filteredUpdates.length - 1} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-xl border-dashed border border-border animate-in fade-in">
                            <p className="text-muted-foreground font-medium">No updates found for this filter.</p>
                            <Button variant="link" className="mt-2" onClick={() => setFilter('all')}>Clear Filter</Button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
