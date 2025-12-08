import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

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
                <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                    <Logo />
                    <h1 className="text-2xl font-black tracking-tighter uppercase">AimLow<span className="text-blue-600">.ai</span></h1>
                </Link>
                <nav className="hidden md:flex gap-6 font-mono font-bold text-sm">
                    <Link to="/blog" className="hover:underline decoration-2 underline-offset-4">THE LOG</Link>
                    <Link to="/lab" className="hover:underline decoration-2 underline-offset-4">THE LAB</Link>
                    <Link to="/feed" className="hover:underline decoration-2 underline-offset-4">THE LOWDOWN</Link>
                </nav>
                <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <Icon name="x" /> : <Icon name="menu" />}
                </button>
            </div>
            {isMenuOpen && (
                <div className="md:hidden border-t-4 border-black bg-white absolute w-full left-0 shadow-xl">
                    <nav className="flex flex-col p-4 font-mono font-bold text-lg gap-4">
                        <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-blue-600 border-b-2 border-gray-100">THE LOG</Link>
                        <Link to="/lab" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-blue-600">THE LAB</Link>
                        <Link to="/feed" onClick={() => setIsMenuOpen(false)} className="text-left py-2 hover:text-blue-600">THE LOWDOWN</Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
