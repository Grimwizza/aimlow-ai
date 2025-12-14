import React, { useEffect, useRef } from 'react';

export const TradingViewWidget = ({ ticker }) => {
    const container = useRef();

    useEffect(() => {
        // Basic cleanup of ticker for TradingView symbol format (e.g. "NYSE: NKE" -> "NYSE:NKE")
        const symbol = ticker.replace(/\s/g, '').toUpperCase();

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${symbol}",
        "interval": "W",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "hide_top_toolbar": true,
        "allow_symbol_change": false,
        "save_image": false,
        "calendar": false,
        "hide_volume": true,
        "support_host": "https://www.tradingview.com"
      }`;
        container.current.innerHTML = ""; // Clear existing
        container.current.appendChild(script);
    }, [ticker]);

    return (
        <div className="h-[400px] w-full border-4 border-black brutal-shadow mb-8 bg-white break-inside-avoid" ref={container}>
            <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
            </div>
        </div>
    );
};
