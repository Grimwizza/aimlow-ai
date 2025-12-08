import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '../../ui/Card';

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

const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "m";
    return "now";
};

export const NewsCard = ({ article, isRead, onRead }) => {
    const sourceFallback = SOURCE_LOGOS[article.source] || '/logo.jpg';
    const displayImage = (!article.image || article.image.includes('aimlow.ai/logo.jpg')) ? sourceFallback : article.image;
    const isLogo = displayImage === sourceFallback;

    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onRead(article.link)}
            className={`group block h-full transition-opacity duration-300 ${isRead ? 'opacity-60 grayscale' : 'opacity-100'}`}
        >
            <div className="h-full border-2 border-black bg-white flex flex-col hover:-translate-y-1 transition-transform brutal-shadow relative">
                <div className="absolute top-0 left-0 bg-[#FEC43D] border-b-2 border-r-2 border-black px-3 py-1 font-mono text-xs font-bold z-20 uppercase">
                    {article.source}
                </div>

                <div className="h-48 w-full overflow-hidden border-b-2 border-black relative bg-gray-100 flex items-center justify-center">
                    <img
                        src={displayImage}
                        alt=""
                        className={`w-full h-full ${isLogo ? 'object-contain p-10' : 'object-cover'}`}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = sourceFallback;
                            e.target.className = "w-full h-full object-contain p-8 bg-gray-100";
                        }}
                    />
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-black leading-tight mb-3 line-clamp-3 group-hover:text-blue-600 transition-colors">
                        {article.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto font-mono text-xs text-gray-400 pt-4 border-t-2 border-gray-100">
                        <span className="font-bold text-gray-500">{timeAgo(article.pubDate)} ago</span>
                        <span className="flex items-center gap-1 font-bold text-black uppercase group-hover:text-blue-600">
                            Read <ExternalLink size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
};
