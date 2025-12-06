import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { client, urlFor } from './client';
import { PortableText } from '@portabletext/react';
import { SEO } from './seo-tools/SEOTags';
import { Newsletter } from './components/Newsletter';
import { NewsFeed } from './components/NewsFeed';
import ReactMarkdown from 'react-markdown'; 
import { 
    Menu, X, Github, Mail, 
    FlaskConical, ArrowLeft, ArrowRight, 
    Loader2, Sparkles, Copy, Check, Upload, Image as ImageIcon, Zap, Share2, Facebook, Linkedin, Briefcase, Coffee, Lock, Unlock, Download, Printer, X as CloseIcon
} from 'lucide-react';

// --- Custom X Logo Component ---
const XLogo = ({ size = 24, color = "currentColor", className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

// --- Icon Mapping ---
const iconMap = {
    menu: Menu, x: X, twitter: XLogo, github: Github, mail: Mail,
    'flask-conical': FlaskConical, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
    loader: Loader2, sparkles: Sparkles, copy: Copy, check: Check, 
    upload: Upload, image: ImageIcon, zap: Zap, share: Share2, facebook: Facebook, linkedin: Linkedin,
    briefcase: Briefcase, coffee: Coffee, lock: Lock, unlock: Unlock, download: Download, printer: Printer, close: CloseIcon
};

const Icon = ({ name, size = 24, color = "currentColor", className }) => {
    const LucideIcon = iconMap[name.toLowerCase()] || FlaskConical;
    return <LucideIcon size={size} color={color} className={className} />;
};

// --- Logo Component ---
const Logo = () => {
    const [error, setError] = useState(false);
    if (error) return <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl border-2 border-transparent group-hover:border-black group-hover:bg-white group-hover:text-black transition-colors">AL</div>;
    // FIXED: Pointing to .png explicitly
    return <img src="/logo.png" alt="AimLow Logo" className="h-10 w-auto object-contain" onError={() => setError(true)} />;
};

// --- LAB CONFIG ---
const LAB_ITEMS = [
    { 
        id: 1, 
        slug: "headline-generator", 
        title: "Headline Generator", 
        desc: "Input a boring topic, get a clickbait title. Powered by GPT-4o Mini.", 
        status: "Live", 
        color: "bg-blue-300",
        mode: "work"
    },
    { 
        id: 3, 
        slug: "jargon-destroyer", 
        title: "The Jargon Destroyer", 
        desc: "Paste corporate speak, get plain English. Aim low, speak clearly.", 
        status: "Free", 
        color: "bg-gray-300",
        mode: "work"
    },
    { 
        id: 4, 
        slug: "deep-dive", 
        title: "The Deep Dive", 
        desc: "Instant 4P & SWOT Analysis. Consultant-grade reports.", 
        status: "Beta",  
        color: "bg-yellow-300",
        mode: "work"
    },
    { 
        id: 2, 
        slug: "alt-text", 
        title: "Image Alt-Text Fixer", 
        desc: "Upload an image to generate perfect SEO descriptions automatically.", 
        status: "Live", 
        color: "bg-red-300",
        mode: "life" 
    }
];

const ptComponents = {
    types: { image: ({ value }) => value?.asset?._ref ? <img src={urlFor(value).width(800).fit('max').url()} alt={value.alt || ' '} className="my-8 w-full border-2 border-black brutal-shadow" /> : null },
    block: {
        h1: ({children}) => <h1 className="text-4xl font-black uppercase mt-12 mb-6">{children}</h1>,
        h2: ({children}) => <h2 className="text-3xl font-bold uppercase mt-10 mb-4 border-b-2 border-black pb-2 inline-block">{children}</h2>,
        h3: ({children}) => <h3 className="text-2xl font-bold mt-8 mb-3">{children}</h3>,
        normal: ({children}) => <p className="mb-6 leading-relaxed text-lg">{children}</p>,
        blockquote: ({children}) => <blockquote className="border-l-4 border-black pl-4 italic my-8 bg-yellow-100 p-6 font-serif text-xl">{children}</blockquote>,
    },
    list: { bullet: ({children}) => <ul className="list-disc ml-6 mb-6 space-y-2 text-lg">{children}</ul>, number: ({children}) => <ol className="list-decimal ml-6 mb-6 space-y-2 text-lg">{children}</ol> }
}

const ShareBar = ({ title }) => {
    const location = useLocation();
    const currentUrl = `https://aimlow.ai${location.pathname}`;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title || "Check this out");
    return (
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <p className="font-mono text-xs font-bold text-gray-500 uppercase mb-4">Share this Log</p>
            <div className="flex gap-4">
                <a href={`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold hover:bg-blue-400 hover:text-black transition-colors"><Icon name="twitter" size={18} /> <span className="text-sm">Post</span></a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold hover:bg-blue-700 hover:text-white transition-colors"><Icon name="linkedin" size={18} /> <span className="text-sm">Share</span></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold hover:bg-blue-600 hover:text-white transition-colors"><Icon name="facebook" size={18} /> <span className="text-sm">Share</span></a>
            </div>
        </div>
    );
};

const LabCard = ({ item }) => (
    <div className={`brutal-card p-6 ${item.color} brutal-shadow flex flex-col`}>
        <div className="flex justify-between items-start mb-4"><h3 className="text-2xl font-black uppercase">{item.title}</h3><span className="bg-black text-white text-xs px-2 py-1 font-mono">{item.status}</span></div>
        <p className="font-bold mb-6 border-t-2 border-black pt-4 flex-1">{item.desc}</p>
        <Link to={`/lab/${item.slug}`} className="w-full bg-black text-white border-2 border-black py-2 font-bold hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"><Icon name="flask-conical" size={18} /> LAUNCH TOOL</Link>
    </div>
);

const AuthorBio = ({ author }) => {
    if (!author) return null;
    const avatarUrl = author.image ? urlFor(author.image).width(200).height(200).url() : "https://via.placeholder.com/100";
    return (
        <div className="mt-16 border-t-4 border-black pt-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white border-2 border-black p-6 brutal-shadow">
                <img src={avatarUrl} alt={author.name} className="w-20 h-20 rounded-full border-2 border-black object-cover"/>
                <div className="text-center sm:text-left">
                    <p className="font-mono text-xs font-bold text-gray-500 uppercase mb-1">Written By</p>
                    <h3 className="text-2xl font-black uppercase mb-2">{author.name}</h3>
                    {author.bio && <div className="prose prose-sm font-serif"><PortableText value={author.bio} /></div>}
                </div>
            </div>
        </div>
    );
};

// --- TOOL 4: THE DEEP DIVE (Stable Version) ---
const DeepDive = ({ onBack }) => {
    const [inputBrand, setInputBrand] = useState('');
    const [reports, setReports] = useState([]); 
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [email, setEmail] = useState('');
    const [signupStatus, setSignupStatus] = useState('idle');

    useEffect(() => {
        const access = localStorage.getItem('aimlow_beta_access');
        if (access === 'granted') setHasAccess(true);
    }, []);

    const runAnalysis = async (brandName) => {
        if (!brandName) return;
        setIsGenerating(true);
        try {
            const payload = { brand: brandName };
            const response = await fetch('/api/generate', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ type: 'deep-dive', payload }) 
            });
            const data = await response.json(); 
            
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            
            if (data.result) {
                setReports(prev => [...prev, { id: Date.now(), brand: brandName, content: data.result }]);
            }
        } catch (err) { 
            console.error(err); 
            alert(`Error: ${err.message}`);
        } finally { setIsGenerating(false); }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        runAnalysis(inputBrand);
        setInputBrand('');
    };

    const handleBetaSignup = async (e) => {
        e.preventDefault();
        setSignupStatus('loading');
        try {
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            localStorage.setItem('aimlow_beta_access', 'granted');
            setHasAccess(true);
            setSignupStatus('success');
        } catch (error) {
            setSignupStatus('error');
            setTimeout(() => setSignupStatus('idle'), 3000);
        }
    };

    const removeReport = (id) => {
        setReports(reports.filter(r => r.id !== id));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12"> 
            <SEO title="The Deep Dive" description="Professional brand analyst. 4P & SWOT Reports." />
            <div className="print:hidden">
                <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
                
                <div className="brutal-card p-8 bg-yellow-300 brutal-shadow mb-12">
                    <div className="flex justify-between items-start">
                        <h1 className="text-4xl font-black uppercase mb-2">The Deep Dive</h1>
                        <span className="bg-black text-white px-3 py-1 font-mono font-bold text-xs">BETA ANALYST</span>
                    </div>
                    <p className="font-mono font-bold mb-6">Instant strategic audits. Enter a brand to start.</p>
                    <form onSubmit={handleFormSubmit} className="bg-white border-2 border-black p-4 flex gap-2 flex-col sm:flex-row">
                        <input 
                            value={inputBrand} 
                            onChange={(e) => setInputBrand(e.target.value)} 
                            className="flex-1 font-bold text-lg p-2 focus:outline-none" 
                            placeholder="e.g. Nike, Liquid Death..." 
                            name="brand" 
                        />
                        <button type="submit" disabled={isGenerating} className="bg-black text-white px-6 py-3 font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                            {isGenerating ? <Icon name="loader" className="animate-spin" /> : "ANALYZE BRAND"}
                        </button>
                    </form>
                </div>
            </div>

            <div className={`grid gap-8 ${reports.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {reports.map((report) => {
                    const splitMarker = "---PRO_CONTENT_START---";
                    const [freeContent, proContent] = report.content.split(splitMarker);
                    const finalProContent = proContent || "";

                    const markdownComponents = {
                        h3: ({node, ...props}) => <h3 className="text-2xl font-black uppercase mt-8 mb-4 border-b-2 border-gray-200 pb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="grid grid-cols-1 gap-2 list-none pl-0" {...props} />,
                        li: ({node, ...props}) => <li className="bg-gray-50 p-3 border-l-4 border-black text-sm" {...props} />,
                        a: ({node, href, children, ...props}) => <a href={href} className="text-[#2563EB] font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
                    };

                    return (
                        <div key={report.id} className="relative bg-white border-2 border-black p-8 brutal-shadow print:shadow-none print:border-0 min-w-0">
                            <button onClick={() => removeReport(report.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 print:hidden"><Icon name="close" size={24} /></button>
                            <div className="border-b-4 border-black pb-4 mb-8 pr-8 flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black uppercase">{report.brand}</h2>
                                    <p className="font-mono text-gray-500 text-sm">Strategic Audit • {new Date().toLocaleDateString()}</p>
                                </div>
                                <img src="/logo.jpg" alt="AimLow" className="h-12 w-auto object-contain opacity-80" />
                            </div>

                            <div className="prose prose-lg font-serif max-w-none mb-8">
                                <ReactMarkdown components={markdownComponents}>
                                    {freeContent}
                                </ReactMarkdown>
                            </div>

                            <div className={`relative ${!hasAccess ? 'h-[300px] overflow-hidden' : ''}`}>
                                <div className={!hasAccess ? 'filter blur-sm select-none opacity-40' : ''}>
                                    <ReactMarkdown components={markdownComponents} children={finalProContent} />
                                </div>

                                {!hasAccess && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 p-6 text-center print:hidden">
                                        <Icon name="lock" size={48} className="mb-4 text-black" />
                                        <h3 className="text-2xl font-black uppercase mb-2">Unlock Full Analysis</h3>
                                        <p className="font-mono text-sm font-bold text-gray-600 mb-4">
                                            Join the Beta to see 4P Strategy, Financials, and Charts.
                                        </p>
                                        <form onSubmit={handleBetaSignup} className="w-full flex flex-col gap-2">
                                            <input type="email" required placeholder="Enter email..." value={email} onChange={e => setEmail(e.target.value)} className="w-full border-2 border-black p-2 font-bold" />
                                            <button type="submit" disabled={signupStatus === 'loading'} className="w-full bg-black text-white py-2 font-black uppercase hover:bg-blue-600 transition-colors flex justify-center items-center gap-2">
                                                {signupStatus === 'loading' ? <Icon name="loader" className="animate-spin" /> : <><Icon name="unlock" /> UNLOCK</>}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ... (HeadlineGenerator, AltTextFixer, JargonDestroyer, Header, Hero, HomePage, BlogPage, LabPage, FeedPage, BlogPost, BlogCard, App)
// Standard components remain unchanged.

const HeadlineGenerator = () => {
    const [topic, setTopic] = useState('');
    const [results, setResults] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const handleGenerate = async (e) => {
        e.preventDefault(); if (!topic) return; setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        try {
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'headline', payload: { topic } }) });
            const data = await response.json(); 
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResults(data.result);
        } catch (err) { console.error(err); alert(`Error: ${err.message || "Failed to generate."}`); } finally { setIsGenerating(false); }
    };
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Headline Generator" description="Turn boring topics into viral clickbait." />
            <Link to="/lab" className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</Link>
            <div className="brutal-card p-8 bg-blue-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Headline Generator</h1>
                <p className="font-mono font-bold mb-6">Turn boring topics into clickbait gold.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4 flex gap-2 flex-col sm:flex-row">
                    <input value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1 font-bold text-lg p-2 focus:outline-none" placeholder="e.g. Walking dogs..." name="topic" id="headline-topic" />
                    <button type="submit" disabled={isGenerating} className="bg-black text-white px-6 py-3 font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : <Icon name="sparkles" />} GENERATE</button>
                </form>
            </div>
            <div className="space-y-4">{results.map((title, idx) => (<div key={idx} className="bg-white border-2 border-black p-4 flex justify-between items-center hover:translate-x-1 transition-transform"><span className="font-bold text-lg">{title}</span><button onClick={() => {navigator.clipboard.writeText(title); setCopiedIndex(idx)}} className="hover:text-blue-600">{copiedIndex === idx ? <Icon name="check" color="green" /> : <Icon name="copy" />}</button></div>))}</div>
        </div>
    );
};

const AltTextFixer = () => {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setImage(reader.result); setResult(''); }; reader.readAsDataURL(file); } };
    const handleGenerate = async () => {
        if (!image) return; setIsGenerating(true);
        try {
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alt-text', payload: { image } }) });
            const data = await response.json(); 
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResult(data.result);
        } catch (err) { console.error(err); alert(`Error: ${err.message}`); } finally { setIsGenerating(false); }
    };
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Alt-Text Fixer" description="Generate SEO-friendly image descriptions." />
            <Link to="/lab" className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</Link>
            <div className="brutal-card p-8 bg-red-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Alt-Text Fixer</h1>
                <p className="font-mono font-bold mb-6">Upload an image. Get perfect SEO descriptions.</p>
                <div className="bg-white border-2 border-black p-8 text-center border-dashed border-4 border-gray-200 hover:border-black transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" name="image-upload" id="alt-text-upload" />
                    {image ? <img src={image} className="max-h-64 mx-auto border-2 border-black" alt="Preview" /> : <div className="flex flex-col items-center text-gray-400"><Icon name="upload" size={48} /><p className="font-bold mt-2">Click to Upload Image</p></div>}
                </div>
                {image && <button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4 bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors flex justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : "ANALYZE IMAGE"}</button>}
            </div>
            {result && (<div className="bg-white border-2 border-black p-6 brutal-shadow"><h3 className="font-black uppercase text-sm text-gray-500 mb-2">Generated Alt-Text:</h3><p className="font-mono text-xl font-bold">{result}</p><button onClick={() => navigator.clipboard.writeText(result)} className="mt-4 text-sm font-bold hover:text-blue-600 flex items-center gap-2"><Icon name="copy" size={16} /> Copy to Clipboard</button></div>)}
        </div>
    );
};

const JargonDestroyer = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const handleGenerate = async (e) => {
        e.preventDefault(); if (!text) return; setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        try {
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'jargon-destroyer', payload: { text } }) });
            const data = await response.json(); 
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResult(data.result);
        } catch (err) { console.error(err); alert(`Error: ${err.message}`); } finally { setIsGenerating(false); }
    };
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Jargon Destroyer" description="Translate corporate speak into plain English." />
            <Link to="/lab" className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</Link>
            <div className="brutal-card p-8 bg-gray-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Jargon Destroyer</h1>
                <p className="font-mono font-bold mb-6">Paste corporate fluff. Get the truth.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-32 font-bold text-lg p-2 focus:outline-none resize-none" placeholder="e.g. We need to leverage our synergies to facilitate a paradigm shift..." name="jargon-text" id="jargon-input"></textarea>
                    <button type="submit" disabled={isGenerating} className="w-full mt-4 bg-black text-white py-3 font-bold hover:bg-red-600 transition-colors flex justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : <><Icon name="zap" /> DESTROY JARGON</>}</button>
                </form>
            </div>
            {result && (<div className="bg-white border-2 border-black p-6 brutal-shadow"><h3 className="font-black uppercase text-sm text-gray-500 mb-2">Plain English Translation:</h3><p className="font-mono text-xl font-bold">{result}</p><button onClick={() => navigator.clipboard.writeText(result)} className="mt-4 text-sm font-bold hover:text-blue-600 flex items-center gap-2"><Icon name="copy" size={16} /> Copy to Clipboard</button></div>)}
        </div>
    );
};

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <header className="border-b-4 border-black bg-white sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 cursor-pointer group"><Logo /><h1 className="text-2xl font-black tracking-tighter uppercase">AimLow<span className="text-blue-600">.ai</span></h1></Link>
                <nav className="hidden md:flex gap-6 font-mono font-bold text-sm">
                    <Link to="/blog" className="hover:underline decoration-2 underline-offset-4">THE LOG</Link>
                    <Link to="/lab" className="hover:underline decoration-2 underline-offset-4">THE LAB</Link>
                    <Link to="/feed" className="hover:underline decoration-2 underline-offset-4">THE LOWDOWN</Link>
                </nav>
                <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <Icon name="x" /> : <Icon name="menu" />}</button>
            </div>
            {isMenuOpen && (<div className="md:hidden border-t-4 border-black bg-white absolute w-full left-0 shadow-xl"><nav className="flex flex-col p-4 font-mono font-bold text-lg gap-4"><Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-blue-600 border-b-2 border-gray-100">THE LOG</Link><Link to="/lab" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-blue-600">THE LAB</Link><Link to="/feed" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-blue-600">THE LOWDOWN</Link></nav></div>)}
        </header>
    );
};

const Hero = () => (
    <section className="bg-[#FEC43D] border-b-4 border-black py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white border-2 border-black px-4 py-1 font-mono text-sm mb-6 brutal-shadow">EST. 2025 // HUMAN-AI HYBRID</div>
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 uppercase">Do More <br/> With Less.</h2>
            <p className="text-xl font-mono max-w-2xl mx-auto mb-8 font-bold">The latest AI news, content and tools curated to help you maximize your output with minimal effort.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4"><Link to="/blog" className="bg-black text-white border-2 border-black px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors brutal-shadow">READ THE LOG</Link><Link to="/lab" className="bg-white text-black border-2 border-black px-8 py-3 font-bold hover:bg-gray-100 transition-colors brutal-shadow">ENTER THE LAB</Link></div>
        </div>
    </section>
);

// -- Page Components --
const HomePage = ({ posts }) => (
    <>
        <SEO title="Home" />
        <Hero />
        <NewsFeed limit={3} showAllLink={true} />
        <section className="bg-black text-white py-16 px-4 border-y-4 border-black"><div className="max-w-6xl mx-auto"><h2 className="text-4xl font-black uppercase mb-12 text-center text-[#FEC43D]">Lab Experiments</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{LAB_ITEMS.filter(i => i.mode === 'work').slice(0,3).map(item => <LabCard key={item.id} item={item} />)}</div></div></section>
        <section className="max-w-6xl mx-auto px-4 py-16"><div className="flex justify-between items-end mb-12 border-b-2 border-black pb-4"><h2 className="text-4xl font-black uppercase">Recent Logs</h2><Link to="/blog" className="font-mono font-bold underline decoration-2">View All</Link></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{posts.slice(0, 3).map(post => <BlogCard key={post._id} post={post} />)}</div></section>
    </>
);

const FeedPage = () => (
    <div className="min-h-screen bg-white">
        <SEO title="The Lowdown" description="Live AI news aggregator from top tech sources." />
        <NewsFeed />
    </div>
);

const BlogPage = ({ posts }) => (
    <div className="max-w-6xl mx-auto px-4 py-12"><SEO title="The Log" description="Thoughts, experiments, and philosophy on AI efficiency." /><h2 className="text-6xl font-black uppercase mb-12 text-center">The Log</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{posts.map(post => <BlogCard key={post._id} post={post} />)}</div></div>
);

const LabPage = () => (
    <div className="max-w-6xl mx-auto px-4 py-12"><SEO title="The Lab" description="Free AI tools to help you do more with less." /><h2 className="text-6xl font-black uppercase mb-12 text-center">The Lab</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{LAB_ITEMS.map(item => <LabCard key={item.id} item={item} />)}</div></div>
);

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchPost = async () => {
            const query = `*[_type == "post" && slug.current == $slug][0] { title, publishedAt, _createdAt, mainImage, "excerpt": pt::text(body)[0...150] + "...", body, author->{name, image, bio} }`;
            const data = await client.fetch(query, { slug });
            setPost(data); setLoading(false);
        };
        fetchPost();
    }, [slug]);

    if (loading) return <div className="py-20 text-center"><Icon name="loader" className="animate-spin mx-auto" /></div>;
    if (!post) return <div className="py-20 text-center font-bold">Post not found.</div>;

    const dateString = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : (post._createdAt ? new Date(post._createdAt).toLocaleDateString() : 'Draft');
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).url() : null;

    return (
        <article className="max-w-3xl mx-auto px-4 py-12">
            <SEO title={post.title} description={post.excerpt} image={imageUrl} />
            <Link to="/blog" className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Log</Link>
            {imageUrl && <div className="w-full aspect-video bg-gray-200 border-2 border-black mb-8 overflow-hidden rounded-none"><img src={imageUrl} className="w-full h-full object-cover" alt={post.title} /></div>}
            <div className="flex items-center gap-4 mb-6 font-mono text-sm"><span className="px-3 py-1 border-2 border-black font-bold bg-yellow-300">Log</span><span className="text-gray-500">{dateString}</span></div>
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-8">{post.title}</h1>
            <div className="prose prose-lg font-serif border-l-4 border-[#FEC43D] pl-6 text-lg"><PortableText value={post.body} components={ptComponents} /></div>
            <ShareBar title={post.title} />
            <AuthorBio author={post.author} />
        </article>
    );
};

const BlogCard = ({ post }) => {
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(800).url() : 'https://via.placeholder.com/800x400?text=No+Image';
    const dateString = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : (post._createdAt ? new Date(post._createdAt).toLocaleDateString() : 'Draft');
    const slug = post.slug?.current || '#';
    return (
        <Link to={`/post/${slug}`} className="brutal-card bg-white flex flex-col h-full brutal-shadow cursor-pointer hover:-translate-y-1 transition-transform">
            <div className="h-48 overflow-hidden border-b-3 border-black relative group"><div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity z-10"></div><img src={imageUrl} alt={post.title} className="w-full h-full object-cover" /><div className="absolute top-4 right-4 bg-yellow-300 border-2 border-black px-3 py-1 font-mono text-xs font-bold z-20">LOG</div></div>
            <div className="p-6 flex-1 flex flex-col"><div className="font-mono text-xs text-gray-500 mb-2">{dateString}</div><h3 className="text-2xl font-black leading-tight mb-4 uppercase">{post.title}</h3><p className="font-serif text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p><div className="flex items-center gap-2 font-bold text-sm mt-auto group">Read Post <Icon name="arrow-right" size={16} /></div></div>
        </Link>
    );
};

function App() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchPosts = async () => {
            try { const query = `*[_type == "post"] | order(publishedAt desc) {_id, title, slug, publishedAt, _createdAt, mainImage, "excerpt": pt::text(body)[0...150] + "...", body}`; const data = await client.fetch(query); setPosts(data); setLoading(false); } catch (error) { console.error("Sanity fetch failed:", error); setLoading(false); }
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
                    <Route path="/lab/headline-generator" element={<HeadlineGenerator onBack={() => window.history.back()} />} />
                    <Route path="/lab/alt-text" element={<AltTextFixer onBack={() => window.history.back()} />} />
                    <Route path="/lab/jargon-destroyer" element={<JargonDestroyer onBack={() => window.history.back()} />} />
                    <Route path="/lab/deep-dive" element={<DeepDive onBack={() => window.history.back()} />} />
                    <Route path="/post/:slug" element={<BlogPost />} />
                </Routes>
            </main>
            <Newsletter />
            <footer className="bg-white border-t-4 border-black py-12 mt-12">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left"><h3 className="text-2xl font-black uppercase">AimLow<span className="text-blue-600">.ai</span></h3><p className="font-mono text-sm text-gray-500 mt-2">© 2025 Aim Low, Inc.</p></div>
                    <div className="flex gap-4">
                        <a href="https://x.com/aimlow.ai" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name="twitter" size={20} /></a>
                        <a href="https://facebook.com/aimlow.ai" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name="facebook" size={20} /></a>
                        <a href="mailto:do_more@aimlow.ai" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name="mail" size={20} /></a>
                    </div>
                    <a href="https://aimlow.sanity.studio" target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold text-gray-400 hover:text-black">ADMIN LOGIN</a>
                </div>
            </footer>
        </div>
    );
}

export default App;