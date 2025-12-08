import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Lock } from 'lucide-react';
import { Icon } from '../../ui/Icon';
import { MarketShareChart, SalesChart } from './Charts';
import { getMarkdownComponents } from './utils';

const StatCard = ({ label, value, icon, link }) => (
    <div className="bg-gray-50 border-2 border-black p-4 flex flex-col justify-between group hover:bg-yellow-50 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-bold text-gray-500 uppercase">{label}</span>
            {icon && <Icon name={icon} size={16} className="text-gray-400 group-hover:text-black" />}
        </div>
        <div className="font-black text-xl md:text-2xl break-all">
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-2 text-blue-600 flex items-center gap-1">
                    {value} <ExternalLink size={14} />
                </a>
            ) : value}
        </div>
    </div>
);

export const ReportView = ({ report, hasAccess, runAnalysis, removeReport, handleBetaSignup, email, setEmail, signupStatus }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Split logic again just to be safe if passed raw
    const splitMarker = "---PRO_CONTENT_START---";
    const parts = report.content.split(splitMarker);
    const freeContent = parts[0] || "";
    const proContent = parts[1] || "";
    const analysisDate = new Date(report.id).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    const markdownComponents = getMarkdownComponents(runAnalysis, report.brand);

    return (
        <div className="relative bg-white border-4 border-black p-0 brutal-shadow-lg print:shadow-none print:border-0 min-w-0 flex flex-col h-full">

            {/* --- HEADER SECTION --- */}
            <div className="bg-black text-white p-6 md:p-8 flex justify-between items-start print:bg-white print:text-black print:border-b-4 print:border-black">
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-[#FEC43D] text-black px-2 py-0.5 font-mono text-xs font-bold">REPORT #{report.id.toString().slice(-4)}</span>
                        <span className="text-gray-400 font-mono text-xs uppercase">{analysisDate}</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2">{report.brand}</h2>
                    <p className="font-serif italic text-lg opacity-80 max-w-2xl">Strategic 4P analysis and market deep dive.</p>
                </div>
                <div className="flex flex-col items-end gap-2 print:hidden">
                    <button onClick={() => removeReport(report.id)} className="text-gray-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><Icon name="x" size={24} /></button>
                    <img src="/logo.png" alt="AL" className="h-12 w-12 object-contain bg-white rounded-full border-2 border-white" />
                </div>
            </div>

            {/* --- BENTO GRID STATS --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b-4 border-black">
                <StatCard label="Ticker / Symbol" value={report.ticker || "PVT"} icon="trending-up" link={report.ticker ? `https://www.google.com/finance/quote/${report.ticker}:NASDAQ` : null} />
                <StatCard label="Market" value={report.country || "Global"} icon="globe" />
                <StatCard label="Risk Level" value="Analyst Est." icon="activity" />
                <StatCard label="Est. Revenue" value={report.salesData ? "Data Avail." : "N/A"} icon="dollar-sign" />
            </div>

            {/* --- TABS --- */}
            <div className="flex border-b-4 border-black bg-gray-100 print:hidden sticky top-0 z-20">
                {['overview', 'financials', 'strategy'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-4 font-black uppercase text-sm tracking-wider flex-1 md:flex-none border-r-2 border-gray-300 transition-colors ${activeTab === tab ? 'bg-white text-blue-600 border-t-4 border-t-blue-600 -mt-1' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="p-8 md:p-12 print:p-0">

                {/* OVERVIEW TAB */}
                <div className={activeTab === 'overview' ? 'block' : 'hidden print:block'}>
                    <div className="max-w-none prose prose-lg prose-headings:font-black prose-p:font-serif prose-a:text-blue-600">
                        <ReactMarkdown components={markdownComponents}>
                            {freeContent}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* FINANCIALS TAB (GATED) */}
                <div className={activeTab === 'financials' ? 'block' : 'hidden print:block'}>
                    {!hasAccess && activeTab === 'financials' ? (
                        <LockedState email={email} setEmail={setEmail} handleBetaSignup={handleBetaSignup} signupStatus={signupStatus} />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            {report.shareData && <MarketShareChart data={report.shareData} />}
                            {report.salesData && <SalesChart data={report.salesData} title={report.salesTitle} />}
                            {!report.shareData && !report.salesData && (
                                <div className="col-span-2 p-12 bg-gray-50 border-2 border-dashed border-gray-300 text-center font-mono text-gray-500">
                                    Financial data not available for this entity.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* STRATEGY TAB (GATED CONTENT) */}
                <div className={activeTab === 'strategy' ? 'block' : 'hidden print:block'}>
                    <div className={`relative ${!hasAccess ? 'h-[400px] overflow-hidden' : ''}`}>
                        <div className={!hasAccess ? 'filter blur-sm select-none opacity-40' : ''}>
                            <h3 className="text-3xl font-black uppercase mb-8">Professional Analysis</h3>
                            <ReactMarkdown components={markdownComponents}>
                                {proContent}
                            </ReactMarkdown>
                        </div>
                        {!hasAccess && <div className="absolute inset-0 pt-20"><LockedState email={email} setEmail={setEmail} handleBetaSignup={handleBetaSignup} signupStatus={signupStatus} /></div>}
                    </div>
                </div>

            </div>

            {/* PRINT FOOTER */}
            <div className="hidden print:flex justify-between items-center border-t-2 border-black mt-8 pt-4">
                <span className="font-mono text-xs text-gray-400">Generated by AimLow.ai • Professional Brand Analyst</span>
                <span className="font-black text-xl">AL.</span>
            </div>
        </div>
    );
};

const LockedState = ({ email, setEmail, handleBetaSignup, signupStatus }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
        <div className="bg-black text-white p-4 rounded-full mb-4"><Lock size={32} /></div>
        <h3 className="text-3xl font-black uppercase mb-2">Pro Access Required</h3>
        <p className="font-serif text-lg mb-6 max-w-xs mx-auto">
            Unlock financial data, 4P strategy, and export capabilities.
        </p>
        <form onSubmit={handleBetaSignup} className="w-full flex flex-col gap-3">
            <input
                type="email"
                required
                placeholder="Enter work email..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-black p-3 font-bold text-lg focus:outline-none focus:bg-yellow-50"
            />
            <button
                type="submit"
                disabled={signupStatus === 'loading'}
                className="w-full bg-[#FEC43D] text-black border-2 border-black py-3 font-black uppercase hover:bg-white hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex justify-center items-center gap-2"
            >
                {signupStatus === 'loading' ? "Unlocking..." : "UNLOK REPORT"}
            </button>
        </form>
    </div>
);
