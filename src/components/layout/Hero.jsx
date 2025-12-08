import React from 'react';
import { Link } from 'react-router-dom';

export const Hero = () => (
    <section className="bg-[#FEC43D] border-b-4 border-black py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white border-2 border-black px-4 py-1 font-mono text-sm mb-6 brutal-shadow">EST. 2025 // HUMAN-AI HYBRID</div>
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9] mb-6 uppercase">Do More <br /> With Less.</h2>
            <p className="text-xl font-mono max-w-2xl mx-auto mb-8 font-bold">The latest AI news, content and tools curated to help you maximize your output with minimal effort.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/blog" className="bg-black text-white border-2 border-black px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors brutal-shadow">READ THE LOG</Link>
                <Link to="/lab" className="bg-white text-black border-2 border-black px-8 py-3 font-bold hover:bg-gray-100 transition-colors brutal-shadow">ENTER THE LAB</Link>
            </div>
        </div>
    </section>
);
