import React from 'react';
import { ExternalLink, Bookmark, BookmarkCheck, Share2, Clock } from 'lucide-react';
import { Card } from '../../ui/Card';

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

export const NewsCard = ({
    article,
    isRead,
    onRead,
    isBookmarked = false,
    onBookmark,
    onShare,
    readingTime = 2,
    isSelected = false
}) => {
    const sourceFallback = SOURCE_LOGOS[article.source] || '/logo.jpg';
    const displayImage = (!article.image || article.image.includes('ui-avatars')) ? sourceFallback : article.image;
    const isLogo = displayImage === sourceFallback;

    const handleBookmarkClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onBookmark?.(article.link);
    };

    const handleShareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onShare?.(article);
    };

    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onRead(article.link)}
            className={`group block h-full select-none outline-none ${isRead ? 'opacity-60 grayscale' : 'opacity-100'}`}
        >
            <div className={`h-full border border-border bg-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative group-focus:ring-2 group-focus:ring-ring group-focus:ring-offset-2 ${isSelected ? 'ring-2 ring-ring ring-offset-2' : ''}`}>

                {/* Source badge */}
                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur shadow-sm rounded-md px-2 py-1 text-xs font-semibold z-20 text-foreground border border-border">
                    {article.source}
                </div>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleBookmarkClick}
                        className={`p-2 rounded-full shadow-sm border border-border backdrop-blur transition-colors ${isBookmarked ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/80 hover:bg-accent text-foreground'}`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark for later'}
                    >
                        {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    </button>
                    <button
                        onClick={handleShareClick}
                        className="p-2 rounded-full shadow-sm border border-border bg-background/80 backdrop-blur hover:bg-accent text-foreground transition-colors"
                        title="Share article"
                    >
                        <Share2 size={14} />
                    </button>
                </div>

                <div className="h-48 w-full overflow-hidden border-b border-border relative bg-muted flex items-center justify-center">
                    <img
                        src={displayImage}
                        alt=""
                        className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${isLogo ? 'object-contain p-10 opacity-80 mix-blend-multiply dark:mix-blend-normal' : 'object-cover'}`}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = sourceFallback;
                            e.target.className = "w-full h-full object-contain p-8 bg-muted opacity-50";
                        }}
                    />
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold leading-tight mb-3 line-clamp-3 group-hover:text-primary transition-colors tracking-tight">
                        {article.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto text-xs text-muted-foreground pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3">
                            <span className="font-medium">{timeAgo(article.pubDate)} ago</span>
                            <span className="flex items-center gap-1 opacity-70">
                                <Clock size={12} />
                                {readingTime} min
                            </span>
                        </div>
                        <span className="flex items-center gap-1 font-semibold text-foreground group-hover:text-primary transition-colors">
                            Read <ExternalLink size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
};
