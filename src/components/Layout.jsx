import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Menu, X, Github, Mail, 
    FlaskConical, ArrowLeft, ArrowRight, 
    Loader2, Sparkles, Copy, Check, Upload, Image as ImageIcon, Zap, Share2, Facebook, Linkedin, Briefcase, Coffee, Lock, Unlock, Download, Printer, X as CloseIcon
} from 'lucide-react';

// --- Custom X Logo Component ---
export const XLogo = ({ size = 24, color = "currentColor", className }) => (
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

export const Icon = ({ name, size = 24, color = "currentColor", className }) => {
    const LucideIcon = iconMap[name.toLowerCase()] || FlaskConical;
    return <LucideIcon size={size} color={color} className={className} />;
};

// --- Logo Component ---
export const Logo = () => {
    const [error, setError] = useState(false);
    if (error) return <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl border-2 border-transparent group-hover:border-black group-hover:bg-white group-hover:text-black transition-colors">AL</div>;
    return <img src="/logo.png" alt="AimLow Logo" className="h-10 w-auto object-contain" onError={() => setError(true)} />;
};

export const Header = () => {
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

export const Footer = () => (
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
);

export const Hero = () => (
    <section className="bg-[#FEC43D] border-b-4 border-black py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white border-2 border-black px-4 py-1 font-mono text-sm mb-6 brutal-shadow">EST. 2025 // HUMAN-AI HYBRID</div>
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 uppercase">Do More <br/> With Less.</h2>
            <p className="text-xl font-mono max-w-2xl mx-auto mb-8 font-bold">The latest AI news, content and tools curated to help you maximize your output with minimal effort.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4"><Link to="/blog" className="bg-black text-white border-2 border-black px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors brutal-shadow">READ THE LOG</Link><Link to="/lab" className="bg-white text-black border-2 border-black px-8 py-3 font-bold hover:bg-gray-100 transition-colors brutal-shadow">ENTER THE LAB</Link></div>
        </div>
    </section>
);