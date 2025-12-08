import React from 'react';
import { SEO } from '../seo-tools/SEOTags';
import { NewsFeed } from '../components/features/news-feed/NewsFeed';

export const FeedPage = () => (
    <div className="min-h-screen bg-white">
        <SEO title="The Lowdown" description="Live AI news aggregator from top tech sources." />
        <NewsFeed />
    </div>
);
