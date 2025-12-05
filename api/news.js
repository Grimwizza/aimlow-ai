import React, { useState, useEffect } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';

export const NewsFeed = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (loading) return (
        <div className="p-8 text-center border-t-4 border-black bg-gray-50">
            <p className="font-mono font-bold text-gray-400 animate-pulse">Aggregating Intel...</p>
        </div>
    );

    if (articles.length === 0) return null;

    return (
        <section className="bg-white border-t-4 border-black py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8 border-b-2 border-black pb-4">
                    <Newspaper size={32} />
                    <h2 className="text-4xl font-black uppercase">Global Intel Feed</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article, idx) => (
                        <a 
                            key={idx} 
                            href={article.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group block h-full"
                        >
                            <article className="h-full border-3 border-black bg-white flex flex-col hover:-translate-y-1 transition-transform brutal-shadow relative">
                                {/* Source Badge */}
                                <div className="absolute top-0 left-0 bg-[#FEC43D] border-b-2 border-r-2 border-black px-3 py-1 font-mono text-xs font-bold z-20 uppercase">
                                    {article.source}
                                </div>

                                <div className="h-48 w-full overflow-hidden border-b-3 border-black relative bg-gray-100">
                                    <img 
                                        src={article.image} 
                                        alt={article.title} 
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = '/logo.jpg'; 
                                            e.target.className = "w-full h-full object-contain p-4 bg-gray-100";
                                        }} 
                                    />
                                </div>
                                
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-black leading-tight mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="font-serif text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                                        {article.summary}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto font-mono text-xs text-gray-400">
                                        <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1 font-bold text-black uppercase group-hover:text-blue-600">
                                            Read <ExternalLink size={14} />
                                        </span>
                                    </div>
                                </div>
                            </article>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};