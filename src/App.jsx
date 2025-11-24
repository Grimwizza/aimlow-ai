import React, { useState, useEffect, useRef } from 'react';
import { client, urlFor } from './client';
import { PortableText } from '@portabletext/react';
import { SEO } from './seo-tools/SEOTags';
import { 
    Menu, X, Twitter, Github, Mail, 
    FlaskConical, ArrowLeft, ArrowRight, 
    Loader2, Sparkles, Copy, Check, Upload, Image as ImageIcon, Zap 
} from 'lucide-react';

// --- Icon Mapping ---
const iconMap = {
    menu: Menu, x: X, twitter: Twitter, github: Github, mail: Mail,
    'flask-conical': FlaskConical, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
    loader: Loader2, sparkles: Sparkles, copy: Copy, check: Check, 
    upload: Upload, image: ImageIcon, zap: Zap
};

const Icon = ({ name, size = 24, color = "currentColor", className }) => {
    const LucideIcon = iconMap[name.toLowerCase()] || FlaskConical;
    return <LucideIcon size={size} color={color} className={className} />;
};

const LAB_ITEMS = [
    {
        id: 1,
        slug: "headline-generator",
        title: "Headline Generator",
        desc: "Input a boring topic, get a clickbait title. Powered by GPT-4o Mini.",
        status: "Live",
        color: "bg-blue-300"
    },
    {
        id: 2,
        slug: "alt-text",
        title: "Image Alt-Text Fixer",
        desc: "Upload an image to generate perfect SEO descriptions automatically.",
        status: "Live",
        color: "bg-red-300"
    },
    {
        id: 3,
        slug: "jargon-destroyer",
        title: "The Jargon Destroyer",
        desc: "Paste corporate speak, get plain English. Aim low, speak clearly.",
        status: "New",
        color: "bg-gray-300"
    }
];

// --- Custom Components for Rich Text ---
const ptComponents = {
    types: {
        image: ({ value }) => {
            if (!value?.asset?._ref) { return null }
            return (
                <img
                    src={urlFor(value).width(800).fit('max').url()}
                    alt={value.alt || ' '}
                    className="my-8 w-full border-2 border-black brutal-shadow"
                />
            )
        }
    },
    block: {
        h1: ({children}) => <h1 className="text-4xl font-black uppercase mt-12 mb-6">{children}</h1>,
        h2: ({children}) => <h2 className="text-3xl font-bold uppercase mt-10 mb-4 border-b-2 border-black pb-2 inline-block">{children}</h2>,
        h3: ({children}) => <h3 className="text-2xl font-bold mt-8 mb-3">{children}</h3>,
        normal: ({children}) => <p className="mb-6 leading-relaxed text-lg">{children}</p>,
        blockquote: ({children}) => <blockquote className="border-l-4 border-black pl-4 italic my-8 bg-yellow-100 p-6 font-serif text-xl">{children}</blockquote>,
    },
    list: {
        bullet: ({children}) => <ul className="list-disc ml-6 mb-6 space-y-2 text-lg">{children}</ul>,
        number: ({children}) => <ol className="list-decimal ml-6 mb-6 space-y-2 text-lg">{children}</ol>,
    }
}

// --- LabCard Component ---
const LabCard = ({ item, onLaunch }) => (
    <div className={`brutal-card p-6 ${item.color} brutal-shadow flex flex-col`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-black uppercase">{item.title}</h3>
            <span className="bg-black text-white text-xs px-2 py-1 font-mono">{item.status}</span>
        </div>
        <p className="font-bold mb-6 border-t-2 border-black pt-4 flex-1">{item.desc}</p>
        <button 
            onClick={() => onLaunch(item)}
            className="w-full bg-black text-white border-2 border-black py-2 font-bold hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
        >
            <Icon name="flask-conical" size={18} /> LAUNCH TOOL
        </button>
    </div>
);

// --- Author Bio Component (NEW) ---
const AuthorBio = ({ author }) => {
    if (!author) return null;
    
    // Safe image handling for author avatar
    const avatarUrl = author.image 
        ? urlFor(author.image).width(200).height(200).url() 
        : "https://via.placeholder.com/100";

    return (
        <div className="mt-16 border-t-4 border-black pt-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white border-2 border-black p-6 brutal-shadow">
                <img 
                    src={avatarUrl} 
                    alt={author.name} 
                    className="w-20 h-20 rounded-full border-2 border-black object-cover"
                />
                <div className="text-center sm:text-left">
                    <p className="font-mono text-xs font-bold text-gray-500 uppercase mb-1">Written By</p>
                    <h3 className="text-2xl font-black uppercase mb-2">{author.name}</h3>
                    {/* Render Author Bio if it exists */}
                    {author.bio && (
                        <div className="prose prose-sm font-serif">
                            <PortableText value={author.bio} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Tool 1: Headline Generator ---
const HeadlineGenerator = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [results, setResults] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault(); 
        if (!topic) return;
        setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'headline', payload: { topic } })
            });
            const data = await response.json();
            if (data.result) setResults(data.result);
        } catch (err) {
            console.error(err);
            alert("Failed to generate.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Headline Generator" description="Turn boring topics into viral clickbait." />
            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
            <div className="brutal-card p-8 bg-blue-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Headline Generator</h1>
                <p className="font-mono font-bold mb-6">Turn boring topics into clickbait gold.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4 flex gap-2 flex-col sm:flex-row">
                    <input value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1 font-bold text-lg p-2 focus:outline-none" placeholder="e.g. Walking dogs..." />
                    <button type="submit" disabled={isGenerating} className="bg-black text-white px-6 py-3 font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                        {isGenerating ? <Icon name="loader" className="animate-spin" /> : <Icon name="sparkles" />} GENERATE
                    </button>
                </form>
            </div>
            <div className="space-y-4">
                {results.map((title, idx) => (
                    <div key={idx} className="bg-white border-2 border-black p-4 flex justify-between items-center hover:translate-x-1 transition-transform">
                        <span className="font-bold text-lg">{title}</span>
                        <button onClick={() => {navigator.clipboard.writeText(title); setCopiedIndex(idx)}} className="hover:text-blue-600">
                            {copiedIndex === idx ? <Icon name="check" color="green" /> : <Icon name="copy" />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Tool 2: Alt-Text Fixer ---
const AltTextFixer = ({ onBack }) => {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setImage(reader.result); setResult(''); };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!image) return;
        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'alt-text', payload: { image } })
            });
            const data = await response.json();
            if (data.result) setResult(data.result);
        } catch (err) {
            console.error(err);
            alert("Analysis failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Alt-Text Fixer" description="Generate SEO-friendly image descriptions." />
            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
            <div className="brutal-card p-8 bg-red-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Alt-Text Fixer</h1>
                <p className="font-mono font-bold mb-6">Upload an image. Get perfect SEO descriptions.</p>
                <div className="bg-white border-2 border-black p-8 text-center border-dashed border-4 border-gray-200 hover:border-black transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    {image ? <img src={image} className="max-h-64 mx-auto border-2 border-black" alt="Preview" /> : <div className="flex flex-col items-center text-gray-400"><Icon name="upload" size={48} /><p className="font-bold mt-2">Click to Upload Image</p></div>}
                </div>
                {image && <button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4 bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors flex justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : "ANALYZE IMAGE"}</button>}
            </div>
            {result && (
                <div className="bg-white border-2 border-black p-6 brutal-shadow">
                    <h3 className="font-black uppercase text-sm text-gray-500 mb-2">Generated Alt-Text:</h3>
                    <p className="font-mono text-xl font-bold">{result}</p>
                    <button onClick={() => navigator.clipboard.writeText(result)} className="mt-4 text-sm font-bold hover:text-blue-600 flex items-center gap-2"><Icon name="copy" size={16} /> Copy to Clipboard</button>
                </div>
            )}
        </div>
    );
};

// --- Tool 3: Jargon Destroyer ---
const JargonDestroyer = ({ onBack }) => {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault(); // Stop reload
        if (!text) return;
        setIsGenerating(true);
        
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'jargon-destroyer', payload: { text } })
            });
            const data = await response.json();
            if (data.result) setResult(data.result);
        } catch (err) {
            console.error(err);
            alert("Destruction failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Jargon Destroyer" description="Translate corporate speak into plain English." />
            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
            <div className="brutal-card p-8 bg-gray-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Jargon Destroyer</h1>
                <p className="font-mono font-bold mb-6">Paste corporate fluff. Get the truth.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4">
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-32 font-bold text-lg p-2 focus:outline-none resize-none"
                        placeholder="e.g. We need to leverage our synergies to facilitate a paradigm shift..."
                    ></textarea>
                    <button type="submit" disabled={isGenerating} className="w-full mt-4 bg-black text-white py-3 font-bold hover:bg-red-600 transition-colors flex justify-center gap-2">
                        {isGenerating ? <Icon name="loader" className="animate-spin" /> : <><Icon name="zap" /> DESTROY JARGON</>}
                    </button>
                </form>
            </div>
            {result && (
                <div className="bg-white border-2 border-black p-6 brutal-shadow">
                    <h3 className="font-black uppercase text-sm text-gray-500 mb-2">Plain English Translation:</h3>
                    <p className="font-mono text-xl font-bold">{result}</p>
                    <button onClick={() => navigator.clipboard.writeText(result)} className="mt-4 text-sm font-bold hover:text-blue-600 flex items-center gap-2"><Icon name="copy" size={16} /> Copy to Clipboard</button>
                </div>
            )}
        </div>
    );
};

// --- Main App ---
const Header = ({ setView, currentView }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <header className="border-b-4 border-black bg-white sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => {setView('home'); setIsMenuOpen(false);}}>
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl border-2 border-transparent group-hover:border-black group-hover:bg-white group-hover:text-black transition-colors">AL</div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase">AimLow<span className="text-blue-600">.ai</span></h1>
                </div>
                <nav className="hidden md:flex gap-6 font-mono font-bold text-sm">
                    <button onClick={() => setView('blog')} className={`hover:underline decoration-2 underline-offset-4 ${currentView === 'blog' ? 'text-blue-600' : ''}`}>THE LOG</button>
                    <button onClick={() => setView('lab')} className={`hover:underline decoration-2 underline-offset-4 ${currentView.includes('lab') || currentView.includes('tool') ? 'text-blue-600' : ''}`}>THE LAB</button>
                </nav>
                <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <Icon name="x" /> : <Icon name="menu" />}</button>
            </div>
            {isMenuOpen && (
                <div className="md:hidden border-t-4 border-black bg-white absolute w-full left-0 shadow-xl">
                    <nav className="flex flex-col p-4 font-mono font-bold text-lg gap-4">
                        <button onClick={() => {setView('blog'); setIsMenuOpen(false);}} className="text-left py-2 hover:text-blue-600 border-b-2 border-gray-100">THE LOG</button>
                        <button onClick={() => {setView('lab'); setIsMenuOpen(false);}} className="text-left py-2 hover:text-blue-600">THE LAB</button>
                    </nav>
                </div>
            )}
        </header>
    );
};

const Hero = ({ setView }) => (
    <section className="bg-[#FEC43D] border-b-4 border-black py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white border-2 border-black px-4 py-1 font-mono text-sm mb-6 brutal-shadow">EST. 2025 // HUMAN-AI HYBRID</div>
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 uppercase">Do More <br/> With Less.</h2>
            <p className="text-xl font-mono max-w-2xl mx-auto mb-8 font-bold">We test the tools so you don't have to. Low effort, high impact AI workflows.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => setView('blog')} className="bg-black text-white border-2 border-black px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors brutal-shadow">READ THE LOG</button>
                <button onClick={() => setView('lab')} className="bg-white text-black border-2 border-black px-8 py-3 font-bold hover:bg-gray-100 transition-colors brutal-shadow">ENTER THE LAB</button>
            </div>
        </div>
    </section>
);

const BlogCard = ({ post, onClick }) => {
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(800).url() : 'https://via.placeholder.com/800x400?text=No+Image';
    return (
        <article onClick={() => onClick(post)} className="brutal-card bg-white flex flex-col h-full brutal-shadow cursor-pointer hover:-translate-y-1 transition-transform">
            <div className="h-48 overflow-hidden border-b-3 border-black relative group">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity z-10"></div>
                <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-yellow-300 border-2 border-black px-3 py-1 font-mono text-xs font-bold z-20">LOG</div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="font-mono text-xs text-gray-500 mb-2">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}</div>
                <h3 className="text-2xl font-black leading-tight mb-4 uppercase">{post.title}</h3>
                <p className="font-serif text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                <div className="flex items-center gap-2 font-bold text-sm mt-auto group">Read Post <Icon name="arrow-right" size={16} /></div>
            </div>
        </article>
    );
};

function App() {
    const [view, setView] = useState('home');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // UPDATED: Now fetching author details
                const query = `*[_type == "post"] | order(publishedAt desc) {
                    _id, 
                    title, 
                    publishedAt, 
                    mainImage, 
                    "excerpt": pt::text(body)[0...150] + "...", 
                    body,
                    author->{name, image, bio}
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

    const handlePostClick = (post) => { setSelectedPost(post); setView('post'); window.scrollTo(0,0); };
    
    const handleLaunchTool = (tool) => {
        if (tool.slug === 'headline-generator') setView('tool-headline');
        if (tool.slug === 'alt-text') setView('tool-alt-text');
        if (tool.slug === 'jargon-destroyer') setView('tool-jargon');
        window.scrollTo(0,0);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]"><div className="animate-spin"><Icon name="loader" size={48} /></div></div>;

    return (
        <div className="min-h-screen flex flex-col">
            <Header setView={setView} currentView={view} />
            <main className="flex-1">
                {view === 'home' && (
                    <>
                        <SEO title="Home" />
                        <Hero setView={setView} />
                        <section className="max-w-6xl mx-auto px-4 py-16">
                            <div className="flex justify-between items-end mb-12 border-b-2 border-black pb-4"><h2 className="text-4xl font-black uppercase">Recent Logs</h2><button onClick={() => setView('blog')} className="font-mono font-bold underline decoration-2">View All</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{posts.slice(0, 3).map(post => <BlogCard key={post._id} post={post} onClick={handlePostClick} />)}</div>
                        </section>
                        <section className="bg-black text-white py-16 px-4 border-y-4 border-black">
                            <div className="max-w-6xl mx-auto">
                                <h2 className="text-4xl font-black uppercase mb-12 text-center text-[#FEC43D]">Lab Experiments</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{LAB_ITEMS.map(item => <LabCard key={item.id} item={item} onLaunch={handleLaunchTool} />)}</div>
                            </div>
                        </section>
                    </>
                )}
                {view === 'blog' && (
                    <div className="max-w-6xl mx-auto px-4 py-12">
                        <SEO title="The Log" description="Thoughts, experiments, and philosophy on AI efficiency." />
                        <h2 className="text-6xl font-black uppercase mb-12 text-center">The Log</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{posts.map(post => <BlogCard key={post._id} post={post} onClick={handlePostClick} />)}</div>
                    </div>
                )}
                {view === 'lab' && (
                    <div className="max-w-6xl mx-auto px-4 py-12">
                        <SEO title="The Lab" description="Free AI tools to help you do more with less." />
                        <h2 className="text-6xl font-black uppercase mb-12 text-center">The Lab</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{LAB_ITEMS.map(item => <LabCard key={item.id} item={item} onLaunch={handleLaunchTool} />)}</div>
                    </div>
                )}
                {view === 'tool-headline' && <HeadlineGenerator onBack={() => setView('lab')} />}
                {view === 'tool-alt-text' && <AltTextFixer onBack={() => setView('lab')} />}
                {view === 'tool-jargon' && <JargonDestroyer onBack={() => setView('lab')} />}
                {view === 'post' && selectedPost && (
                    <article className="max-w-3xl mx-auto px-4 py-12">
                        <SEO title={selectedPost.title} description={selectedPost.excerpt} image={selectedPost.mainImage ? urlFor(selectedPost.mainImage).width(1200).url() : null} />
                        <button onClick={() => setView('blog')} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Log</button>
                        <div className="w-full aspect-video bg-gray-200 border-2 border-black mb-8 overflow-hidden rounded-none">
                            {selectedPost.mainImage && <img src={urlFor(selectedPost.mainImage).width(1200).url()} className="w-full h-full object-cover" alt={selectedPost.title} />}
                        </div>
                        <div className="flex items-center gap-4 mb-6 font-mono text-sm"><span className="px-3 py-1 border-2 border-black font-bold bg-yellow-300">Log</span><span className="text-gray-500">{selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : 'Draft'}</span></div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-8">{selectedPost.title}</h1>
                        <div className="prose prose-lg font-serif border-l-4 border-[#FEC43D] pl-6 text-lg">
                            <PortableText value={selectedPost.body} components={ptComponents} />
                        </div>
                        {/* UPDATED: Added Author Bio here */}
                        <AuthorBio author={selectedPost.author} />
                    </article>
                )}
            </main>
            <footer className="bg-white border-t-4 border-black py-12 mt-12">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left"><h3 className="text-2xl font-black uppercase">AimLow<span className="text-blue-600">.ai</span></h3><p className="font-mono text-sm text-gray-500 mt-2">© 2025 Aim Low, Inc.</p></div>
                    <div className="flex gap-4"><a href="#" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name="twitter" size={20} /></a><a href="#" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name="github" size={20} /></a><a href="#" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name="mail" size={20} /></a></div>
                    <a href="https://aimlow.sanity.studio" target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold text-gray-400 hover:text-black">ADMIN LOGIN</a>
                </div>
            </footer>
        </div>
    );
}

export default App;