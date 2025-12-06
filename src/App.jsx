import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Header, Footer, Hero } from './components/Layout';
import { Newsletter } from './components/Newsletter';
import { NewsFeed } from './components/NewsFeed';
import { BlogCard, BlogPost, LabCard } from './components/BlogParts';
import { HeadlineGenerator, AltTextFixer, JargonDestroyer } from './components/tools/BasicTools';
import { DeepDive } from './components/tools/DeepDive';
import { LAB_ITEMS } from './data';
import { client } from './client';
import { SEO } from './seo-tools/SEOTags';
import { Icon } from './components/Layout';

const HomePage = ({ posts }) => (
    <>
        <SEO title="Home" />
        <Hero />
        <NewsFeed limit={3} showAllLink={true} />
        <section className="bg-black text-white py-16 px-4 border-y-4 border-black">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-black uppercase mb-12 text-center text-[#FEC43D]">Lab Experiments</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {LAB_ITEMS.filter(i => i.mode === 'work').slice(0,3).map(item => <LabCard key={item.id} item={item} />)}
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

const FeedPage = () => (
    <div className="min-h-screen bg-white">
        <SEO title="The Lowdown" description="Live AI news aggregator from top tech sources." />
        <NewsFeed />
    </div>
);

const BlogPage = ({ posts }) => (
    <div className="max-w-6xl mx-auto px-4 py-12">
        <SEO title="The Log" description="Thoughts, experiments, and philosophy on AI efficiency." />
        <h2 className="text-6xl font-black uppercase mb-12 text-center">The Log</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map(post => <BlogCard key={post._id} post={post} />)}
        </div>
    </div>
);

const LabPage = () => {
    const [labMode, setLabMode] = useState('work'); 
    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <SEO title="The Lab" description="Free AI tools to help you do more with less." />
            <div className="text-center mb-12">
                <h2 className="text-6xl font-black uppercase mb-8">The Lab</h2>
                <div className="inline-flex border-2 border-black bg-white p-1 brutal-shadow">
                    <button 
                        onClick={() => setLabMode('work')}
                        className={`flex items-center gap-2 px-8 py-3 font-bold text-lg transition-all ${labMode === 'work' ? 'bg-black text-white' : 'bg-transparent text-gray-400 hover:text-black'}`}
                    >
                        <Icon name="briefcase" size={20} /> WORK MODE
                    </button>
                    <button 
                        onClick={() => setLabMode('life')}
                        className={`flex items-center gap-2 px-8 py-3 font-bold text-lg transition-all ${labMode === 'life' ? 'bg-black text-white' : 'bg-transparent text-gray-400 hover:text-black'}`}
                    >
                        <Icon name="coffee" size={20} /> LIFE MODE
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {LAB_ITEMS.filter(item => item.mode === labMode).map(item => <LabCard key={item.id} item={item} />)}
            </div>
        </div>
    );
};

function App() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { pathname } = useLocation();
    
    // Scroll restoration
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

    // Fetch Sanity Data
    useEffect(() => {
        const fetchPosts = async () => {
            try { 
                const query = `*[_type == "post"] | order(publishedAt desc) {_id, title, slug, publishedAt, _createdAt, mainImage, "excerpt": pt::text(body)[0...150] + "...", body}`; 
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]"><div className="animate-spin"><Icon name="loader" size={48} /></div></div>;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<HomePage posts={posts} />} />
                    <Route path="/blog" element={<BlogPage posts={posts} />} />
                    <Route path="/lab" element={<LabPage />} />
                    <Route path="/feed" element={<FeedPage />} />
                    {/* Tool Routes */}
                    <Route path="/lab/headline-generator" element={<HeadlineGenerator onBack={() => window.history.back()} />} />
                    <Route path="/lab/alt-text" element={<AltTextFixer onBack={() => window.history.back()} />} />
                    <Route path="/lab/jargon-destroyer" element={<JargonDestroyer onBack={() => window.history.back()} />} />
                    <Route path="/lab/deep-dive" element={<DeepDive onBack={() => window.history.back()} />} />
                    {/* Post Route */}
                    <Route path="/post/:slug" element={<BlogPost />} />
                </Routes>
            </main>
            <Newsletter />
            <Footer />
        </div>
    );
}

export default App;