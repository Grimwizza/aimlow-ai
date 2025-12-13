import React, { useState, useEffect } from 'react';
import { SEO } from '../../seo-tools/SEOTags';
import { Icon } from '../ui/Icon';
import { ChevronDown, Printer } from 'lucide-react';
import { ReportView } from './deep-dive/ReportView';

const SkeletonLoader = () => (
    <div className="bg-white border-4 border-black p-0 brutal-shadow-lg h-[600px] flex flex-col animate-pulse">
        <div className="h-48 bg-gray-200 border-b-4 border-black p-8">
            <div className="h-12 w-2/3 bg-gray-300 mb-4 rounded"></div>
            <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
        </div>
        <div className="p-8 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
    </div>
);

export const DeepDive = ({ onBack }) => {
    const [inputBrand, setInputBrand] = useState('');
    const [country, setCountry] = useState('Global');
    const [reports, setReports] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [email, setEmail] = useState('');
    const [signupStatus, setSignupStatus] = useState('idle');

    useEffect(() => {
        const access = localStorage.getItem('aimlow_beta_access');
        if (access === 'granted') setHasAccess(true);
    }, []);

    const [error, setError] = useState(null);

    const runAnalysis = async (brandName, contextBrand = null) => {
        if (!brandName) return;
        setIsGenerating(true);
        setError(null);
        setReports([]); // Clear previous results

        // 70s Client-Side Timeout (slightly longer than server's 60s to allow for network latency)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 70000);

        try {
            const payload = { brand: brandName, context: contextBrand, country: country };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'deep-dive', payload }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            let data;
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("JSON Parse Error:", text);
                throw new Error(`Server Error: Received Invalid JSON. (Response likely HTML or empty). Preview: ${text.substring(0, 50)}...`);
            }

            if (!response.ok || data.error) throw new Error(data.error || "Server Error");

            if (data.result) {
                const reportData = data.result;

                setReports([{
                    id: Date.now(),
                    brand: brandName,
                    data: reportData, // Store the structured JSON directly
                    country
                }]);
            }
        } catch (err) {
            console.error(err);
            let errorMessage = err.message;
            if (err.name === 'AbortError') {
                errorMessage = "Network Timeout: The report took too long to generate (over 70s). Please try again with a better connection.";
            }
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
            clearTimeout(timeoutId);
        }
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

    const handlePrint = () => {
        window.print();
    };

    const removeReport = (id) => {
        setReports(reports.filter(r => r.id !== id));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <SEO title="The Deep Dive" description="BETA Pro Brand Analyst. 4P & SWOT Reports." />
            <div className="print:hidden">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
                    {reports.length > 0 && (
                        <button onClick={handlePrint} className="flex items-center gap-2 font-mono font-bold bg-white border-2 border-black px-4 py-2 hover:bg-gray-100 brutal-shadow">
                            <Printer size={18} /> PRINT REPORT
                        </button>
                    )}
                </div>

                <div className="brutal-card p-8 bg-yellow-300 brutal-shadow mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl md:text-5xl font-black uppercase">The Deep Dive</h1>
                                <span className="bg-black text-white px-2 py-1 font-mono font-bold text-xs uppercase -rotate-2">BETA Pro Analyst</span>
                            </div>
                            <p className="font-mono font-bold mt-2">Instant strategic audits. Enter a brand to starting mining.</p>
                        </div>
                    </div>

                    <form onSubmit={handleFormSubmit} className="bg-white border-4 border-black p-2 flex flex-col md:flex-row gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        {/* COUNTRY DROPDOWN */}
                        <div className="relative min-w-[140px] border-b-2 md:border-b-0 md:border-r-2 border-gray-200">
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full h-full appearance-none bg-transparent pl-4 pr-10 py-3 font-bold text-lg focus:outline-none cursor-pointer hover:bg-gray-50 uppercase"
                            >
                                <option value="Global">Global</option>
                                <option value="United States">USA</option>
                                <option value="United Kingdom">UK</option>
                                <option value="Canada">Canada</option>
                                <option value="Europe">Europe</option>
                                <option value="Asia">Asia</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                <ChevronDown size={20} strokeWidth={3} />
                            </div>
                        </div>

                        <input
                            value={inputBrand}
                            onChange={(e) => setInputBrand(e.target.value)}
                            className="flex-grow font-bold text-xl p-3 focus:outline-none placeholder:text-gray-300 uppercase"
                            placeholder="ENTER BRAND (E.G. NIKE)..."
                            name="brand"
                            autoComplete="off"
                        />

                        <button type="submit" disabled={isGenerating || !inputBrand} className="bg-black text-white px-8 py-3 font-black text-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400">
                            {isGenerating ? <Icon name="loader" className="animate-spin" /> : "ANALYZE"}
                        </button>
                    </form>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border-4 border-red-600 p-6 mb-12 flex items-start gap-4">
                    <Icon name="alert-triangle" className="text-red-600 flex-shrink-0" size={32} />
                    <div>
                        <h3 className="font-black text-xl uppercase text-red-700">Analysis Failed</h3>
                        <p className="font-bold font-mono text-red-800 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-12">
                {reports.map((report) => (
                    <ReportView
                        key={report.id}
                        report={report}
                        hasAccess={hasAccess}
                        runAnalysis={runAnalysis}
                        removeReport={removeReport}
                        handleBetaSignup={handleBetaSignup}
                        email={email}
                        setEmail={setEmail}
                        signupStatus={signupStatus}
                    />
                ))}
                {isGenerating && <SkeletonLoader />}
            </div>
        </div>
    );
};