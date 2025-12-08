import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../seo-tools/SEOTags';
import { Hero } from '../components/layout/Hero';
import { NewsFeed } from '../components/features/news-feed/NewsFeed';
import { LabCard, BlogCard } from '../components/BlogParts';
import { LAB_ITEMS } from '../data';

export const HomePage = ({ posts }) => (
    <>
        <SEO title="Home" />
        <Hero />
        <NewsFeed limit={4} showAllLink={true} />
        <section className="bg-black text-white py-16 px-4 border-y-4 border-black">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-black uppercase mb-12 text-center text-[#FEC43D]">Lab Experiments</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {LAB_ITEMS.filter(i => i.mode === 'work').slice(0, 3).map(item => <LabCard key={item.id} item={item} />)}
                </div>
            </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex justify-between items-end mb-12 border-b-2 border-black pb-4">
                <h2 className="text-4xl font-black uppercase">Recent Logs</h2>
                <Link to="/blog" className="font-mono font-bold underline decoration-2">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {posts.slice(0, 3).map(post => <BlogCard key={post._id} post={post} />)}
            </div>
        </section>
    </>
);
