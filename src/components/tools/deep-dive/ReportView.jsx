import React, { useState } from 'react';
import { ExternalLink, Lock, Printer, TrendingUp, DollarSign, Globe, Shield, Target, Users, Zap, AlertTriangle, Layers, BarChart3, PieChart } from 'lucide-react';
import { Icon } from '../../ui/Icon';
import { SalesChart } from './Charts';
import { TradingViewWidget } from './TradingViewWidget';

const StatCard = ({ label, value, icon, link, className = "" }) => (
    <div className={`bg-gray-50 border-2 border-black p-4 flex flex-col justify-between group hover:bg-yellow-50 transition-colors ${className}`}>
        <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-bold text-gray-500 uppercase">{label}</span>
            {icon}
        </div>
        <div className="font-black text-xl md:text-2xl break-words">
            {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-2 text-blue-600 flex items-center gap-1">
                    {value} <ExternalLink size={14} />
                </a>
            ) : value}
        </div>
    </div>
);

const SectionHeader = ({ title, icon }) => (
    <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
        {icon} {title}
    </h3>
);

const BulletList = ({ items }) => (
    <ul className="space-y-3">
        {items?.map((item, i) => (
            <li key={i} className="flex gap-3 items-start p-3 bg-gray-50 border-l-4 border-black hover:bg-white hover:shadow-sm transition-all">
                <Icon name="chevron-right" size={16} className="mt-1 flex-shrink-0" />
                <span className="font-serif text-lg leading-snug">{item}</span>
            </li>
        ))}
    </ul>
);

export const ReportView = ({ report, hasAccess, removeReport, handleBetaSignup, email, setEmail, signupStatus }) => {
    const d = report.data;
    const [activeTab, setActiveTab] = useState('overview');

    if (!d) return <div className="p-8 text-center text-red-600 font-bold">Error: Invalid Report Data</div>;

    const analysisDate = new Date(report.id).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    // Transform quarterly data for the chart if available
    const salesChartData = (d.financials?.quarterly_revenue_data?.map(s => ({
        name: s.period,    // X-axis label
        revenue: s.revenue,
        unit: s.unit,
        growth: s.growth_yoy // YoY Growth %
    })) || []).sort((a, b) => {
        // Custom sort for "Qx YYYY"
        const [qA, yA] = a.name.split(' ');
        const [qB, yB] = b.name.split(' ');
        if (yA !== yB) return parseInt(yA) - parseInt(yB);
        return parseInt(qA.replace('Q', '')) - parseInt(qB.replace('Q', ''));
    });

    const isFinancialsAvailable = d.financials?.revenue_latest !== "Data Unavailable" && d.financials?.revenue_latest !== "Private Company";

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Layers size={18} /> },
        { id: 'marketing', label: 'Marketing 4Ps', icon: <Target size={18} /> },
        { id: 'swot', label: 'SWOT', icon: <Shield size={18} /> },
        { id: 'financials', label: 'Financials', icon: <DollarSign size={18} /> },
        { id: 'sources', label: 'Sources', icon: <ExternalLink size={18} /> },
    ];

    return (
        <div className="relative bg-white border-4 border-black p-0 brutal-shadow-lg print:shadow-none print:border-0 min-w-0 flex flex-col h-full animate-in fade-in duration-500">

            {/* --- HEADER --- */}
            <div className="bg-black text-white p-6 md:p-8 flex justify-between items-start print:bg-white print:text-black print:border-b-4 print:border-black">
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-[#FEC43D] text-black px-2 py-0.5 font-mono text-xs font-bold">REPORT #{report.id.toString().slice(-4)}</span>
                        <span className="text-gray-400 font-mono text-xs uppercase">{analysisDate}</span>
                    </div>
                    <div className="flex items-baseline gap-4 flex-wrap">
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{d.brand_name}</h2>
                        {d.ticker && d.ticker !== 'Private' && <span className="font-mono text-xl text-gray-400">{d.ticker}</span>}
                    </div>
                    <p className="font-serif italic text-lg opacity-80 max-w-2xl mt-2">{d.parent_company ? `Subsidiary of ${d.parent_company}` : `Market: ${report.country}`}</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <button onClick={() => removeReport(report.id)} className="text-gray-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full print:hidden">
                        <Icon name="x" size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <div className="font-black text-xl leading-none tracking-tighter">AIMLOW.AI</div>
                            <div className="font-mono text-[10px] text-[#FEC43D] uppercase tracking-widest">BETA Pro Analyst</div>
                        </div>
                        <img src="/logo.png" alt="AL" className="h-10 w-10 object-contain bg-white rounded-md border-2 border-white" />
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex overflow-x-auto border-b-4 border-black bg-gray-100 print:hidden sticky top-0 z-20 no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 font-black uppercase text-sm tracking-wider flex items-center gap-2 border-r-2 border-gray-300 transition-colors whitespace-nowrap
                            ${activeTab === tab.id ? 'bg-white text-blue-600 border-t-4 border-t-blue-600 -mt-1' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="p-6 md:p-10 min-h-[500px]">

                {/* TAB: OVERVIEW */}
                <div className={activeTab === 'overview' ? 'block' : 'hidden print:block'}>
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <SectionHeader title="Executive Summary" icon={<Zap />} />
                            <BulletList items={d.executive_summary} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <SectionHeader title="Target Persona" icon={<Users />} />
                                <div className="bg-blue-50 border-2 border-blue-900 p-6 space-y-4">
                                    <div>
                                        <h4 className="font-bold uppercase text-xs text-blue-500 mb-1">Demographics</h4>
                                        <p className="font-serif font-bold text-lg">{d.target_persona?.demographics}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold uppercase text-xs text-blue-500 mb-1">Psychographics</h4>
                                        <p className="font-serif text-lg">{d.target_persona?.psychographics}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold uppercase text-xs text-blue-500 mb-1">Job to be Done</h4>
                                        <p className="font-serif italic text-lg opacity-80">"{d.target_persona?.job_to_be_done}"</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <SectionHeader title="Core Competitors" icon={<Target />} />
                                <div className="grid gap-3">
                                    {d.competitors?.map((comp, i) => (
                                        <div key={i} className="bg-gray-50 p-4 border-2 border-gray-200">
                                            <h4 className="font-black uppercase">{comp.name}</h4>
                                            <p className="text-sm font-serif mt-1">{comp.differentiator}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB: MARKETING 4PS */}
                <div className={activeTab === 'marketing' ? 'block' : 'hidden print:block'}>
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {!hasAccess ? <LockedState email={email} setEmail={setEmail} handleBetaSignup={handleBetaSignup} signupStatus={signupStatus} /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="brutal-card bg-yellow-50 p-6">
                                    <h4 className="border-b-4 border-black pb-2 mb-4 font-black uppercase text-xl">Product</h4>
                                    <p className="font-serif text-lg">{d.marketing_4ps?.product}</p>
                                </div>
                                <div className="brutal-card bg-green-50 p-6">
                                    <h4 className="border-b-4 border-black pb-2 mb-4 font-black uppercase text-xl">Price</h4>
                                    <p className="font-serif text-lg">{d.marketing_4ps?.price}</p>
                                </div>
                                <div className="brutal-card bg-blue-50 p-6">
                                    <h4 className="border-b-4 border-black pb-2 mb-4 font-black uppercase text-xl">Place</h4>
                                    <p className="font-serif text-lg">{d.marketing_4ps?.place}</p>
                                </div>
                                <div className="brutal-card bg-red-50 p-6">
                                    <h4 className="border-b-4 border-black pb-2 mb-4 font-black uppercase text-xl">Promotion</h4>
                                    <p className="font-serif text-lg">{d.marketing_4ps?.promotion}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TAB: SWOT */}
                <div className={activeTab === 'swot' ? 'block' : 'hidden print:block'}>
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {!hasAccess ? <LockedState email={email} setEmail={setEmail} handleBetaSignup={handleBetaSignup} signupStatus={signupStatus} /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="flex items-center gap-2 font-black uppercase text-green-700 bg-green-100 p-3 border-2 border-green-700 mb-2"><Icon name="arrow-up" /> Strengths</h4>
                                    <ul className="list-disc pl-5 space-y-2 font-serif text-lg">
                                        {d.swot?.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="flex items-center gap-2 font-black uppercase text-red-700 bg-red-100 p-3 border-2 border-red-700 mb-2"><Icon name="arrow-down" /> Weaknesses</h4>
                                    <ul className="list-disc pl-5 space-y-2 font-serif text-lg">
                                        {d.swot?.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="flex items-center gap-2 font-black uppercase text-blue-700 bg-blue-100 p-3 border-2 border-blue-700 mb-2"><Icon name="zap" /> Opportunities</h4>
                                    <ul className="list-disc pl-5 space-y-2 font-serif text-lg">
                                        {d.swot?.opportunities.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="flex items-center gap-2 font-black uppercase text-orange-700 bg-orange-100 p-3 border-2 border-orange-700 mb-2"><Icon name="alert-triangle" /> Threats</h4>
                                    <ul className="list-disc pl-5 space-y-2 font-serif text-lg">
                                        {d.swot?.threats.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TAB: FINANCIALS */}
                <div className={activeTab === 'financials' ? 'block' : 'hidden print:block'}>
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {/* Always show high level metrics if available? Or also Gate? Let's gate it as per original design */}
                        {!hasAccess ? <LockedState email={email} setEmail={setEmail} handleBetaSignup={handleBetaSignup} signupStatus={signupStatus} /> : (
                            <>
                                {d.financials?.financial_note && (
                                    <div className="bg-yellow-100 p-4 border-l-4 border-yellow-500 mb-8 flex gap-3 text-sm font-bold">
                                        <AlertTriangle size={16} className="mt-0.5" />
                                        <span>NOTE: {d.financials.financial_note}</span>
                                    </div>
                                )}

                                {!isFinancialsAvailable && (
                                    <div className="p-12 mb-8 bg-gray-50 border-2 border-dashed border-gray-300 text-center font-mono text-gray-500">
                                        Limited financial data available for this entity.
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <StatCard label="Market Cap" value={d.financials?.market_cap} icon={<DollarSign size={16} />} />
                                    <StatCard label="Revenue (Latest)" value={d.financials?.revenue_latest} icon={<TrendingUp size={16} />} />
                                    <StatCard label="P/E Ratio" value={d.financials?.pe_ratio} icon={<BarChart3 size={16} />} />
                                    <StatCard label="Currency" value={d.financials?.currency} icon={<Globe size={16} />} />
                                </div>

                                {d.ticker && d.ticker !== 'Private' && (
                                    <TradingViewWidget ticker={d.ticker} />
                                )}

                                {salesChartData.length > 0 && (
                                    <SalesChart
                                        data={salesChartData}
                                        title="Reported Quarterly Revenue"
                                        unit={salesChartData[0]?.unit || 'B'}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* TAB: SOURCES */}
                <div className={activeTab === 'sources' ? 'block' : 'hidden print:block'}>
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <SectionHeader title="Data Sources" icon={<ExternalLink />} />
                        <ul className="space-y-2">
                            {d.sources?.map((source, i) => (
                                <li key={i} className="flex items-center gap-2 font-mono text-sm text-blue-600 hover:underline cursor-pointer">
                                    <ExternalLink size={14} />
                                    {source}
                                </li>
                            ))}
                            {(!d.sources || d.sources.length === 0) && <li className="text-gray-500 italic">No specific sources cited.</li>}
                        </ul>
                    </div>
                </div>

            </div>
            {/* PRINT FOOTER */}
            <div className="hidden print:flex justify-between items-center border-t-2 border-black mt-8 pt-4">
                <span className="font-mono text-xs text-gray-400">Generated by AimLow.ai • BETA Pro Analyst</span>
                <span className="font-black text-xl">AL.</span>
            </div>
        </div>
    );
};

const LockedState = ({ email, setEmail, handleBetaSignup, signupStatus }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12 print:!hidden">
        <div className="bg-black text-white p-4 rounded-full mb-4"><Lock size={32} /></div>
        <h3 className="text-3xl font-black uppercase mb-2">Pro Access Required</h3>
        <p className="font-serif text-lg mb-6 max-w-xs mx-auto">
            Unlock financial data, 4P strategy, and export capabilities.
        </p>
        <form onSubmit={handleBetaSignup} className="w-full flex flex-col gap-3">
            <input
                type="email"
                required
                placeholder="Enter email..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-black p-3 font-bold text-lg focus:outline-none focus:bg-yellow-50"
            />
            <button
                type="submit"
                disabled={signupStatus === 'loading'}
                className="w-full bg-[#FEC43D] text-black border-2 border-black py-3 font-black uppercase hover:bg-white hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex justify-center items-center gap-2"
            >
                {signupStatus === 'loading' ? "Unlocking..." : "UNLOCK REPORT"}
            </button>
        </form>
    </div>
);
