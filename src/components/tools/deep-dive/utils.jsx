import React from 'react';


export const COLORS = ['#000000', '#FEC43D', '#2563EB', '#999999', '#555555'];

// Matches ```json ... ``` or just ``` ... ``` blocks
// Using hex code \x60 for backticks to prevent file truncation/issues
export const JSON_REGEX = new RegExp('\x60\x60\x60(?:json)?\\s*([\\s\\S]*?)\x60\x60\x60', 'g');

export const cleanReportContent = (content) => {
    let shareData = [];
    let salesData = [];
    let ticker = null;
    let salesTitle = "Estimated Annual Sales (Billions)";
    let cleanText = content;

    const jsonMatch = JSON_REGEX.exec(content);

    if (jsonMatch && jsonMatch[1]) {
        try {
            const jsonData = JSON.parse(jsonMatch[1]);
            if (jsonData.market_share) shareData = jsonData.market_share;
            if (jsonData.annual_sales) salesData = jsonData.annual_sales;
            if (jsonData.ticker) ticker = jsonData.ticker;
            if (jsonData.sales_chart_title) salesTitle = jsonData.sales_chart_title;

            // Clean the JSON block out of the text
            cleanText = content.replace(jsonMatch[0], '');
        } catch (e) {
            console.error("Chart parse error", e);
        }
    }

    // FIX: The AI sometimes generates markdown links with spaces in the URL (e.g. [Brand](analyze:Brand Name))
    // Standard markdown breaks on spaces in URLs. We need to encode them.
    cleanText = cleanText.replace(/\[([^\]]+)\]\((analyze:[^)]+)\)/g, (match, text, url) => {
        return `[${text}](${url.replace(/ /g, '%20')})`;
    });

    return {
        cleanText,
        shareData,
        salesData,
        ticker,
        salesTitle
    };
};

export const getMarkdownComponents = (runAnalysis, currentBrand) => ({
    h1: ({ node, ...props }) => <h1 className="text-4xl font-black uppercase mt-8 mb-6 border-b-4 border-black pb-2" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-3xl font-black uppercase mt-8 mb-4 border-b-2 border-gray-200 pb-2 flex items-center gap-2" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl font-bold uppercase mt-6 mb-3 text-gray-800 bg-yellow-50 inline-block px-2 border-l-4 border-black" {...props} />,
    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed font-serif text-lg text-gray-800" {...props} />,
    ul: ({ node, ...props }) => <ul className="grid grid-cols-1 gap-2 list-none pl-0 mb-6" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 font-bold space-y-2" {...props} />,
    li: ({ node, ...props }) => <li className="bg-gray-50 p-3 border-l-4 border-gray-300 text-sm hover:border-black transition-colors" {...props} />,
    blockquote: ({ node, ...props }) => <blockquote className="border-l-8 border-[#FEC43D] bg-gray-50 p-4 my-6 italic font-serif text-xl" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-black text-black bg-yellow-100 px-1" {...props} />,
    code: ({ node, inline, ...props }) => inline
        ? <code className="bg-gray-200 px-1 font-mono text-sm text-red-600 font-bold" {...props} />
        : <pre className="bg-black text-white p-4 overflow-x-auto font-mono text-sm my-4 rounded-none"><code {...props} /></pre>,
    a: ({ node, href, children, ...props }) => {
        if (href && href.startsWith('analyze:')) {
            const compName = href.replace('analyze:', '');
            return (
                <button
                    onClick={() => runAnalysis(compName, currentBrand)}
                    className="text-[#2563EB] hover:bg-blue-100 px-1 rounded font-bold underline decoration-2 cursor-pointer text-left inline-flex items-center gap-1"
                    title={`Run Strategy vs ${currentBrand}`}
                >
                    {children} ↗
                </button>
            );
        }
        return <a href={href} className="text-[#2563EB] font-bold hover:underline decoration-2" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    }
});
