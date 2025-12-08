import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../seo-tools/SEOTags';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LAB_ITEMS } from '../data';

const LabToolCard = ({ item }) => (
    <Card className={`flex flex-col h-full transition-transform hover:-translate-y-1 ${item.color}`}>
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-black uppercase text-black">{item.title}</h3>
            <span className="bg-black text-white text-xs px-2 py-1 font-mono font-bold uppercase">{item.status}</span>
        </div>
        <p className="font-mono font-bold text-sm mb-6 flex-1 text-gray-800">{item.desc}</p>
        <Link to={`/lab/${item.slug}`} className="w-full">
            <Button variant="primary" className="w-full" icon="flask-conical">
                LAUNCH TOOL
            </Button>
        </Link>
    </Card>
);

const FeatureCard = () => (
    <div className="w-full bg-black text-white p-8 md:p-12 mb-16 relative overflow-hidden group border-2 border-black brutal-shadow">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
                <div className="inline-block bg-[#FEC43D] text-black px-3 py-1 font-mono text-xs font-bold mb-4 uppercase">Flagship Tool</div>
                <h2 className="text-4xl md:text-6xl font-black uppercase mb-4 leading-none">The Deep Dive</h2>
                <p className="font-mono text-lg md:text-xl text-gray-400 mb-8 max-w-xl">
                    Generate consultant-grade brand reports, 4P analysis, and SWOT charts in seconds.
                </p>
                <Link to="/lab/deep-dive">
                    <Button variant="secondary" size="lg" icon="sparkles" className="border-white text-black hover:bg-[#FEC43D] hover:border-black">
                        START ANALYSIS
                    </Button>
                </Link>
            </div>
            {/* Visual Abstract Graphic */}
            <div className="w-64 h-64 relative hidden md:block">
                <div className="absolute inset-0 border-4 border-[#FEC43D] rotate-12"></div>
                <div className="absolute inset-0 border-4 border-white -rotate-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="briefcase" size={64} className="text-[#FEC43D]" />
                </div>
            </div>
        </div>

        {/* Background Texture */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FEC43D] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    </div>
);

export const LabPage = () => {
    const [activeTab, setActiveTab] = useState('work');

    const workTools = LAB_ITEMS.filter(item => item.mode === 'work' && item.slug !== 'deep-dive');
    const lifeTools = LAB_ITEMS.filter(item => item.mode === 'life');

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <SEO title="The Lab" description="Professional AI tools to help you do more with less." />

            <div className="text-center mb-16">
                <h1 className="text-6xl md:text-8xl font-black uppercase mb-4 tracking-tighter">The Lab</h1>
                <p className="font-mono font-bold text-xl text-gray-500">Experimental Tools for the Modern Hybrid.</p>
            </div>

            <FeatureCard />

            {/* Filter Tabs */}
            <div className="flex justify-center mb-12">
                <div className="inline-flex bg-white border-2 border-black p-1 brutal-shadow gap-1">
                    <button
                        onClick={() => setActiveTab('work')}
                        className={`px-6 py-2 font-bold font-mono text-lg flex items-center gap-2 transition-colors ${activeTab === 'work' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <Icon name="briefcase" size={18} /> WORK
                    </button>
                    <button
                        onClick={() => setActiveTab('life')}
                        className={`px-6 py-2 font-bold font-mono text-lg flex items-center gap-2 transition-colors ${activeTab === 'life' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <Icon name="coffee" size={18} /> LIFE
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeTab === 'work' ? (
                    workTools.map(item => <LabToolCard key={item.id} item={item} />)
                ) : (
                    lifeTools.map(item => <LabToolCard key={item.id} item={item} />)
                )}
            </div>

            {/* Empty State for Life if needed */}
            {activeTab === 'life' && lifeTools.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-gray-300">
                    <p className="font-mono font-bold text-gray-400">More life tools coming soon.</p>
                </div>
            )}
        </div>
    );
};
