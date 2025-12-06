const MarketShareChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="h-64 w-full mb-8">
            <h4 className="font-black uppercase text-sm text-gray-500 mb-2">Estimated Market Share</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px 0px #000' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const SalesChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="h-64 w-full mb-8">
            <h4 className="font-black uppercase text-sm text-gray-500 mb-2">Estimated Annual Sales (Billions)</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis dataKey="year" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ border: '2px solid black', boxShadow: '4px 4px 0px 0px #000' }} />
                    <Bar dataKey="revenue" fill="#2563EB" stroke="black" strokeWidth={2} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const DeepDive = ({ onBack }) => {
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

    const runAnalysis = async (brandName, contextBrand = null) => {
        if (!brandName) return;
        setIsGenerating(true);
        try {
            const payload = { brand: brandName, context: contextBrand };
            const response = await fetch('/api/generate', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ type: 'deep-dive', payload }) 
            });
            const data = await response.json(); 
            
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            
            if (data.result) {
                let shareData = [];
                let salesData = [];
                let cleanContent = data.result;

                // Robust JSON Extraction
                const jsonMatch = data.result.match(JSON_REGEX);
                if (jsonMatch && jsonMatch[1]) {
                    try {
                        const jsonData = JSON.parse(jsonMatch[1]);
                        if (jsonData.market_share) shareData = jsonData.market_share;
                        if (jsonData.annual_sales) salesData = jsonData.annual_sales;
                        // Clean the JSON block out of the text
                        cleanContent = data.result.replace(jsonMatch[0], '');
                    } catch (e) { console.error("Chart parse error", e); }
                }

                setReports(prev => [...prev, { id: Date.now(), brand: brandName, content: cleanContent, shareData, salesData }]);
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

    const handlePrint = () => {
        window.print();
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
                    const parts = report.content.split(splitMarker);
                    const freeContent = parts[0];
                    const proContent = parts.length > 1 ? parts[1] : "";

                    const markdownComponents = {
                        h3: ({node, ...props}) => <h3 className="text-2xl font-black uppercase mt-8 mb-4 border-b-2 border-gray-200 pb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="grid grid-cols-1 gap-2 list-none pl-0" {...props} />,
                        li: ({node, ...props}) => <li className="bg-gray-50 p-3 border-l-4 border-black text-sm" {...props} />,
                        a: ({node, href, children, ...props}) => {
                            if (href && href.startsWith('analyze:')) {
                                const compName = href.replace('analyze:', '');
                                // Pass current brand as context
                                return (
                                    <button 
                                        onClick={() => runAnalysis(compName, report.brand)} 
                                        className="text-[#2563EB] hover:bg-blue-100 px-1 rounded font-bold underline decoration-2 cursor-pointer text-left"
                                        title={`Run Strategy vs ${report.brand}`}
                                    >
                                        {children} ↗
                                    </button>
                                );
                            }
                            return <a href={href} className="text-[#2563EB] font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                        }
                    };

                    return (
                        <div key={report.id} className="relative bg-white border-2 border-black p-8 brutal-shadow print:shadow-none print:border-0 min-w-0">
                            <button onClick={() => removeReport(report.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 print:hidden"><Icon name="close" size={24} /></button>
                            
                            {/* Report Header */}
                            <div className="border-b-4 border-black pb-4 mb-8 pr-8 flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black uppercase">{report.brand}</h2>
                                    <p className="font-mono text-gray-500 text-sm">Strategic Audit • {new Date().toLocaleDateString()}</p>
                                </div>
                                <img src="/logo.jpg" alt="AimLow" className="h-12 w-auto object-contain opacity-80" />
                            </div>

                            {/* Free Content */}
                            <div className="prose prose-lg font-serif max-w-none mb-8">
                                <ReactMarkdown components={markdownComponents}>
                                    {freeContent}
                                </ReactMarkdown>
                            </div>

                            {/* Pro/Gated Content */}
                            <div className={`relative ${!hasAccess ? 'h-[300px] overflow-hidden' : ''}`}>
                                <div className={!hasAccess ? 'filter blur-sm select-none opacity-40' : ''}>
                                    
                                    {/* CHARTS SECTION */}
                                    {hasAccess && (
                                        <div className="grid grid-cols-1 gap-8 mb-8">
                                            {report.shareData && <MarketShareChart data={report.shareData} />}
                                            {report.salesData && <SalesChart data={report.salesData} />}
                                        </div>
                                    )}

                                    <ReactMarkdown components={markdownComponents} children={proContent} />
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