import React from 'react';
import { Icon } from '../ui/Icon';

export const Footer = () => (
    <footer className="bg-white border-t-4 border-black py-12 mt-12 block w-full">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
                <h3 className="text-2xl font-black uppercase">AimLow<span className="text-blue-600">.ai</span></h3>
                <p className="font-mono text-sm text-gray-500 mt-2">© 2025 Aim Low, Inc.</p>
            </div>
            <div className="flex gap-4">
                <a href="https://x.com/aimlow.ai" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <Icon name="twitter" size={20} />
                </a>
                <a href="https://facebook.com/aimlow.ai" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <Icon name="facebook" size={20} />
                </a>
                <a href="mailto:do_more@aimlow.ai" className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <Icon name="mail" size={20} />
                </a>
            </div>
            <a href="https://aimlow.sanity.studio" target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-bold text-gray-400 hover:text-black">ADMIN LOGIN</a>
        </div>
    </footer>
);
