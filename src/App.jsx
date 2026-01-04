import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { client } from './client';
import { SEO } from './seo-tools/SEOTags';
import { Newsletter } from './components/Newsletter';
import { NewsFeed } from './components/features/news-feed/NewsFeed';

// 1. IMPORT LAYOUT
// 1. IMPORT LAYOUT
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/layout/Hero';
import { Icon } from './components/ui/Icon';

// 2. IMPORT BLOG PARTS
import { BlogCard, BlogPost, LabCard } from './components/BlogParts';

// 3. IMPORT TOOLS
// 3. IMPORT TOOLS
import { HeadlineGenerator } from './components/tools/HeadlineGenerator';
import { AltTextFixer } from './components/tools/AltTextFixer';
import { ContentSimplifier } from './components/tools/ContentSimplifier';
import { AIMarketingAnalyst } from './components/tools/AIMarketingAnalyst';
import { DataCenterMap } from './components/tools/DataCenterMap';

// 4. IMPORT DATA
import { LAB_ITEMS } from './data';

// --- PAGE COMPONENTS (Views) ---
import { HomePage } from './pages/HomePage';
import { BlogPage } from './pages/BlogPage';
import { FeedPage } from './pages/FeedPage';
import { AppsPage } from './pages/AppsPage';
import { UpdatesPage } from './pages/UpdatesPage';
import { ToolsPage } from './pages/ToolsPage';


// --- MAIN APP (Router) ---
function App() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { pathname } = useLocation();

    // Scroll to top on route change
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

    // Fetch Sanity Data
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const query = `*[_type == "post"] | order(publishedAt desc) {
                    _id, 
                    title, 
                    slug, 
                    publishedAt, 
                    _createdAt, 
                    mainImage, 
                    "excerpt": pt::text(body)[0...150] + "...", 
                    body
                }`;
                const data = await client.fetch(query);
                setPosts(data);
                setLoading(false);
            } catch (error) {
                console.error("Sanity fetch failed:", error);
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><div className="animate-spin"><Icon name="loader" size={48} /></div></div>;

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
            <Header />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<HomePage posts={posts} />} />
                    <Route path="/apps" element={<AppsPage />} />
                    <Route path="/feed" element={<FeedPage posts={posts} />} />
                    <Route path="/updates" element={<UpdatesPage />} />
                    <Route path="/tools" element={<ToolsPage />} />

                    {/* Tools */}
                    <Route path="/apps/headline-generator" element={<HeadlineGenerator onBack={() => window.history.back()} />} />
                    <Route path="/apps/alt-text" element={<AltTextFixer onBack={() => window.history.back()} />} />
                    <Route path="/apps/content-simplifier" element={<ContentSimplifier onBack={() => window.history.back()} />} />
                    <Route path="/apps/ai-marketing-analyst" element={<AIMarketingAnalyst onBack={() => window.history.back()} />} />
                    <Route path="/apps/ai-hyperscale-map" element={<DataCenterMap onBack={() => window.history.back()} />} />


                    {/* Dynamic Post Route */}
                    <Route path="/post/:slug" element={<BlogPost />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}

export default App; // Updated layout v4