
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
            <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-1 bg-gray-200 transform -translate-x-1/2 -z-10"></div>

            <div className={`flex flex-col md:flex-row items-center justify-between w-full mb-12 ${isLast ? '' : ''}`}>

                {/* Date Side (Left on Desktop) */}
                <div className="w-full md:w-5/12 text-left md:text-right mb-4 md:mb-0 md:pr-8">
                    <div className="inline-block bg-black text-white px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider">
                        {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center md:justify-end gap-2 mt-2">
                        {item.logo && (
                            <img src={item.logo} alt={item.source} className="w-6 h-6 rounded-full border border-gray-200 bg-white object-contain" />
                        )}
                        <span className="font-bold text-gray-500 text-sm uppercase">{item.source}</span>
                    </div>
                </div>

                {/* Center Dot */}
                <div className="absolute left-0 md:left-[50%] top-0 md:top-6 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-md transform -translate-x-[5px] md:-translate-x-1/2 z-10"></div>

                {/* Content Side (Right on Desktop) */}
                <div className="w-full md:w-5/12 md:pl-8">
                    <Card className="hover:scale-[1.02] transition-transform duration-300">
                        <h3 className="text-xl font-bold mb-2 leading-tight">{item.title}</h3>
                        <div className="text-sm text-gray-600 line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: item.content.replace(/<[^>]*>/g, '') }}></div>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="w-full text-xs">
                                READ OFFICIAL LOG <ExternalLink size={12} className="ml-2" />
                            </Button>
                        </a>
                    </Card>
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-12 px-4 max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                    <Activity size={32} className="text-blue-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4">Model Update Log</h1>
                <p className="font-mono text-gray-500 max-w-2xl mx-auto mb-8">
                    Automatic tracking of official changelogs from the major labs.
                </p>

                {/* FILTER BAR */}
                <div className="flex flex-wrap justify-center gap-4 animate-in fade-in duration-700">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 ${filter === f.id
                                ? 'border-black bg-black text-white scale-105 shadow-lg'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                                }`}
                        >
                            {f.logo && <img src={f.logo} alt={f.label} className="w-5 h-5 object-contain bg-white rounded-full" />}
                            <span className="font-bold text-sm uppercase">{f.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-8 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-gray-100 rounded-xl border border-gray-200"></div>
                    ))}
                </div>
            ) : (
                <div className="relative min-h-[400px]">
                    {filteredUpdates.length > 0 ? (
                        filteredUpdates.map((item, idx) => (
                            <UpdateItem key={idx} item={item} isLast={idx === filteredUpdates.length - 1} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200 animate-in fade-in">
                            <p className="font-mono text-gray-400">No updates found for this filter.</p>
                            <Button variant="ghost" className="mt-4" onClick={() => setFilter('all')}>Clear Filter</Button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
