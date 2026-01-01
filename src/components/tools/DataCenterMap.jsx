import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Server, MapPin, BarChart3, Globe, Network, Filter, X, Loader2, Activity, Building2, Search, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import L from 'leaflet';
import { REAL_DATA_CENTERS, DATA_CENTER_METADATA } from '../../data/realDataCenters';
import Fuse from 'fuse.js';
// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map view
function MapUpdater({ center, zoom, bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
        } else if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, bounds, map]);
    return null;
}

// Helper functions for stats and flags
const getCountryFlag = (country) => {
    const flags = {
        'USA': '🇺🇸',
        'United States': '🇺🇸',
        'Netherlands': '🇳🇱',
        'Japan': '🇯🇵',
        'Sweden': '🇸🇪',
        'Germany': '🇩🇪',
        'Singapore': '🇸🇬',
        'Australia': '🇦🇺',
        'UK': '🇬🇧',
        'United Kingdom': '🇬🇧',
        'China': '🇨🇳',
        'Ireland': '🇮🇪',
        'Canada': '🇨🇦',
        'France': '🇫🇷',
        'India': '🇮🇳',
        'Brazil': '🇧🇷',
        'Chile': '🇨🇱',
        'South Africa': '🇿🇦',
        'Kenya': '🇰🇪',
        'Indonesia': '🇮🇩',
        'UAE': '🇦🇪',
        'Saudi Arabia': '🇸🇦',
        'South Korea': '🇰🇷',
        'Taiwan': '🇹🇼'
    };
    return flags[country] || '🌐';
};

// Maps provider to their headquarters country
const getProviderCountry = (provider) => {
    const providerCountries = {
        'Microsoft Azure': 'USA',
        'Google Cloud': 'USA',
        'AWS': 'USA',
        'Meta': 'USA',
        'Oracle Cloud': 'USA',
        'xAI': 'USA',
        'CoreWeave': 'USA',
        'Tesla': 'USA',
        'Alibaba Cloud': 'China',
        'Yotta': 'India',
        'SoftBank': 'Japan'
    };
    return providerCountries[provider] || 'USA';
};

// Provider colors for custom markers
const providerColors = {
    'Microsoft Azure': '#0078d4',
    'Google Cloud': '#4285f4',
    'AWS': '#ff9900',
    'Meta': '#1877f2',
    'Oracle Cloud': '#f80000',
    'xAI': '#000000',
    'CoreWeave': '#6366f1',
    'Tesla': '#cc0000',
    'Alibaba Cloud': '#ff6a00',
    'Yotta': '#00a651',
    'SoftBank': '#c8102e'
};

// Create custom colored marker icon
const createProviderIcon = (provider) => {
    const color = providerColors[provider] || '#6366f1';
    const initial = provider.charAt(0).toUpperCase();

    return L.divIcon({
        className: 'custom-provider-marker',
        html: `<div style="
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            background: ${color};
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
        ">
            <span style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 12px;
                font-family: system-ui;
            ">${initial}</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28]
    });
};

const parsePower = (powerStr) => {
    if (!powerStr) return 0;
    const match = powerStr.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (match) {
        return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
};

const parseCost = (costStr) => {
    if (!costStr || costStr === 'Unknown') return 0;
    const s = costStr.toLowerCase();
    const match = s.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (!match) return 0;
    let val = parseFloat(match[0].replace(/,/g, ''));

    // Scale to Billions
    if (s.includes('trillion')) val *= 1000;
    else if (s.includes('billion')) val *= 1;
    else if (s.includes('million')) val *= 0.001;

    // Currency conversion to USD
    if (costStr.includes('€')) val *= 1.08;
    else if (costStr.includes('£')) val *= 1.27;
    else if (costStr.includes('¥')) val *= 0.0064;
    else if (costStr.includes('kr')) val *= 0.096; // SEK

    return val;
};

// Estimation formulas for missing data
const estimatePower = (dc) => {
    // Base power by type (in MW)
    const typePower = {
        'Training Hub': 150,
        'Supercomputer': 100,
        'AI Factory': 80,
        'Inference Node': 40,
        'AI Campus': 120,
        'HPC Center': 60,
        'Cloud Region': 50
    };

    // Location multiplier (energy costs/cooling needs)
    const locationMultiplier = {
        'USA': 1.0,
        'Sweden': 0.9, // Cool climate
        'Ireland': 0.85,
        'Singapore': 1.2, // Tropical
        'India': 1.1,
        'China': 1.0,
        'Japan': 1.0,
        'Brazil': 1.15,
        'Kenya': 1.1,
        'South Africa': 1.0
    };

    const basePower = typePower[dc.type] || 50;
    const multiplier = locationMultiplier[dc.country] || 1.0;

    return Math.round(basePower * multiplier);
};

const estimateCost = (dc, estimatedPower) => {
    // Cost estimation: ~$15-25M per MW for AI-focused facilities
    // Training hubs are more expensive ($25M/MW), inference nodes cheaper ($15M/MW)
    const costPerMW = {
        'Training Hub': 25,
        'Supercomputer': 22,
        'AI Factory': 20,
        'Inference Node': 15,
        'AI Campus': 20,
        'HPC Center': 18,
        'Cloud Region': 16
    };

    const rate = costPerMW[dc.type] || 18;
    const power = estimatedPower || estimatePower(dc);

    // Cost in millions, convert to billions
    return (power * rate) / 1000;
};

// Get display values with estimation flag
const getDisplayValues = (dc) => {
    const hasPower = dc.size_mw && parsePower(dc.size_mw) > 0;
    const hasCost = dc.cost_estimate && parseCost(dc.cost_estimate) > 0;

    let power, cost, powerEstimated = false, costEstimated = false;

    if (hasPower) {
        power = parsePower(dc.size_mw);
    } else {
        power = estimatePower(dc);
        powerEstimated = true;
    }

    if (hasCost) {
        cost = parseCost(dc.cost_estimate);
    } else {
        cost = estimateCost(dc, power);
        costEstimated = true;
    }

    return {
        power,
        powerStr: hasPower ? dc.size_mw : `~${power} MW`,
        powerEstimated,
        cost,
        costStr: hasCost ? dc.cost_estimate : `~$${cost.toFixed(1)}B`,
        costEstimated
    };
};

export const DataCenterMap = ({ onBack }) => {
    const [mapView, setMapView] = useState({ center: [39.8283, -98.5795], zoom: 3 });
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedOrigin, setSelectedOrigin] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMethodology, setShowMethodology] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [compareSelection, setCompareSelection] = useState([]);
    const [showComparison, setShowComparison] = useState(false);
    const mapContainerRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Toggle comparison selection (max 3)
    const toggleCompare = (dc) => {
        setCompareSelection(prev => {
            if (prev.find(d => d.id === dc.id)) {
                return prev.filter(d => d.id !== dc.id);
            }
            if (prev.length >= 3) return prev;
            return [...prev, dc];
        });
    };

    // Simulate Live Data Fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            setDataPoints(REAL_DATA_CENTERS);
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    // Parse URL params on initial load
    useEffect(() => {
        const origin = searchParams.get('origin');
        const provider = searchParams.get('provider');
        const model = searchParams.get('model');
        if (origin) setSelectedOrigin(origin);
        if (provider) setSelectedProvider(provider);
        if (model) setSelectedModel(model);
    }, []);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedOrigin) params.set('origin', selectedOrigin);
        if (selectedProvider) params.set('provider', selectedProvider);
        if (selectedModel) params.set('model', selectedModel);
        setSearchParams(params, { replace: true });
    }, [selectedOrigin, selectedProvider, selectedModel]);

    // Copy link handler
    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Fuse.js search instance
    const fuse = useMemo(() => {
        return new Fuse(dataPoints, {
            keys: ['name', 'provider', 'location_text', 'country', 'models'],
            threshold: 0.3,
            includeScore: true
        });
    }, [dataPoints]);

    // Search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return fuse.search(searchQuery).slice(0, 8);
    }, [searchQuery, fuse]);

    // Extract unique models
    const allModels = useMemo(() => {
        const models = new Set();
        dataPoints.forEach(dc => dc.models.forEach(m => models.add(m)));
        return Array.from(models).sort();
    }, [dataPoints]);

    // Extract unique providers
    const allProviders = useMemo(() => {
        return Array.from(new Set(dataPoints.map(dc => dc.provider))).sort();
    }, [dataPoints]);

    // Extract unique provider origin countries
    const allOrigins = useMemo(() => {
        const origins = new Set(dataPoints.map(dc => getProviderCountry(dc.provider)));
        return Array.from(origins).sort();
    }, [dataPoints]);

    // Filter Logic
    const filteredCenters = useMemo(() => {
        return dataPoints.filter(dc => {
            const matchModel = selectedModel ? dc.models.includes(selectedModel) : true;
            const matchProvider = selectedProvider ? dc.provider === selectedProvider : true;
            const matchOrigin = selectedOrigin ? getProviderCountry(dc.provider) === selectedOrigin : true;
            return matchModel && matchProvider && matchOrigin;
        });
    }, [selectedModel, selectedProvider, selectedOrigin, dataPoints]);

    // Calculate Real-time Stats (includes estimates)
    const stats = useMemo(() => {
        let totalCost = 0;
        let totalPower = 0;

        filteredCenters.forEach(dc => {
            const displayValues = getDisplayValues(dc);
            totalCost += displayValues.cost;
            totalPower += displayValues.power;
        });

        return {
            cost: totalCost.toFixed(1),
            power: (totalPower / 1000).toFixed(2), // Convert MW to GW
            count: filteredCenters.length
        };
    }, [filteredCenters]);

    // Calculate Statistics for Sidebar
    const countryStats = useMemo(() => {
        const stats = {};
        dataPoints.forEach(dc => {
            stats[dc.country] = (stats[dc.country] || 0) + 1;
        });
        return Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
    }, [dataPoints]);

    const handleCountryClick = (country) => {
        setSelectedCountry(country);
        setSelectedModel(null);
        setSelectedProvider(null);

        const dcInCountry = dataPoints.find(dc => dc.country === country);
        if (dcInCountry) {
            let zoom = 5;
            if (country === 'Singapore') zoom = 11;
            if (country === 'Ireland') zoom = 7;
            if (country === 'Germany') zoom = 6;
            if (country === 'China') zoom = 4;
            setMapView({ center: [dcInCountry.lat, dcInCountry.lng], zoom });
        }
    };

    const handleModelClick = (model) => {
        if (selectedModel === model) {
            setSelectedModel(null);
            setMapView({ center: [39.8283, -98.5795], zoom: 3 });
        } else {
            setSelectedModel(model);
            setSelectedProvider(null);
            setSelectedCountry(null);
        }
    };

    const handleProviderClick = (provider) => {
        if (selectedProvider === provider) {
            setSelectedProvider(null);
            setMapView({ center: [39.8283, -98.5795], zoom: 3 });
        } else {
            setSelectedProvider(provider);
            setSelectedModel(null);
            setSelectedCountry(null);
            setSelectedOrigin(null);
        }
    };

    const handleOriginClick = (origin) => {
        if (selectedOrigin === origin) {
            setSelectedOrigin(null);
            setMapView({ center: [39.8283, -98.5795], zoom: 3 });
        } else {
            setSelectedOrigin(origin);
            setSelectedModel(null);
            setSelectedProvider(null);
            setSelectedCountry(null);
        }
    };

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            mapContainerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Listen for fullscreen exit
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Calculate bounds
    const mapBounds = useMemo(() => {
        if ((selectedModel || selectedProvider || selectedOrigin) && filteredCenters.length > 0) {
            return filteredCenters.map(dc => [dc.lat, dc.lng]);
        }
        return null;
    }, [selectedModel, selectedProvider, filteredCenters]);

    return (
        <section ref={mapContainerRef} className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <div className="border-b border-border bg-card p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Globe className="text-primary" size={20} />
                                AI Hyperscale Map
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                A fully dynamic & interactive map of global AI data centers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row relative">
                {/* Left Panel: Filters & Stats */}
                <div className="lg:w-96 w-full bg-card border-r border-border flex flex-col z-10 shadow-lg lg:shadow-none h-[calc(100vh-80px)]">

                    {/* Search Bar */}
                    <div className="p-4 border-b border-border flex-none">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search data centers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 mt-2 mx-4 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                {searchResults.map(({ item: dc }) => (
                                    <button
                                        key={dc.name}
                                        onClick={() => {
                                            setSearchQuery('');
                                            setMapView({ center: [dc.lat, dc.lng], zoom: 10 });
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{getCountryFlag(dc.country)}</span>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{dc.name}</p>
                                                <p className="text-xs text-muted-foreground">{dc.provider} • {dc.location_text}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Country of Origin Filter - Primary Filter */}
                    <div className="p-6 border-b border-border flex-none">
                        <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Globe size={16} /> Country of Origin</span>
                            {selectedOrigin && (
                                <button onClick={() => setSelectedOrigin(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                    <X size={12} /> Clear
                                </button>
                            )}
                        </h2>
                        {isLoading ? (
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 w-20 bg-muted/50 rounded-lg animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {allOrigins.map((origin) => {
                                    const count = dataPoints.filter(dc => getProviderCountry(dc.provider) === origin).length;
                                    return (
                                        <button
                                            key={origin}
                                            onClick={() => handleOriginClick(origin)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedOrigin === origin
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-secondary/50 border-transparent hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="text-lg">{getCountryFlag(origin)}</span>
                                            <span className="text-xs font-medium">{origin}</span>
                                            <span className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded-full">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Provider Filter Section */}
                    <div className="p-6 border-b border-border flex-none">
                        <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Building2 size={16} /> Provider</span>
                            {selectedProvider && (
                                <button onClick={() => setSelectedProvider(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                    <X size={12} /> Clear
                                </button>
                            )}
                        </h2>
                        {isLoading ? (
                            <div className="py-2 flex justify-center text-muted-foreground animate-pulse">
                                <span className="text-xs">Loading providers...</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {allProviders.map(provider => (
                                    <button
                                        key={provider}
                                        onClick={() => handleProviderClick(provider)}
                                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${selectedProvider === provider
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-secondary/50 text-secondary-foreground border-transparent hover:border-primary/50'
                                            }`}
                                    >
                                        {provider}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Model Filter Section */}
                    <div className="p-6 border-b border-border flex-1 overflow-y-auto">
                        <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Network size={16} /> AI Models</span>
                            {selectedModel && (
                                <button onClick={() => setSelectedModel(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                    <X size={12} /> Clear
                                </button>
                            )}
                        </h2>
                        {isLoading ? (
                            <div className="py-6 flex justify-center text-muted-foreground animate-pulse">
                                <span className="text-xs">Updating model registry...</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {allModels.map(model => (
                                    <button
                                        key={model}
                                        onClick={() => handleModelClick(model)}
                                        className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${selectedModel === model
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-secondary/50 text-secondary-foreground border-transparent hover:border-primary/50'
                                            }`}
                                    >
                                        {model}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="flex-1 bg-muted/50 relative min-h-[500px]">
                    <MapContainer
                        center={mapView.center}
                        zoom={mapView.zoom}
                        className="w-full h-full z-0"
                        style={{ background: '#1c1c1c' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        <MapUpdater center={mapView.center} zoom={mapView.zoom} bounds={mapBounds} />

                        {(selectedModel || selectedProvider || selectedOrigin) && filteredCenters.length > 1 && (
                            <Polyline
                                positions={filteredCenters.map(dc => [dc.lat, dc.lng])}
                                pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.6, dashArray: '5, 10' }}
                            />
                        )}

                        {filteredCenters.map(dc => (
                            <Marker key={dc.id} position={[dc.lat, dc.lng]} icon={createProviderIcon(dc.provider)}>
                                <Popup className="custom-popup min-w-[320px]">
                                    <div className="p-3 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start gap-3 border-b border-border/50 pb-3">
                                            <div className="relative">
                                                <img
                                                    src={dc.logo}
                                                    alt={dc.provider}
                                                    className="w-12 h-12 rounded-lg bg-white p-1 object-contain border shadow-sm"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNiAyMlYxMkg0YTIgMiAwIDAgMS0yLTJWNGEyIDIgMCAwIDEgMi0yaDE2YTIgMiAwIDAgMSAyIDJ2OGEyIDIgMCAwIDEtMiAyaC0ydjEwIj48L3BhdGg+PHBhdGggZD0iTTYgMTJoMTIiPjwvcGF0aD48cGF0aCBkPSJNMTAgMTJ2MTAiPjwvcGF0aD48cGF0aCBkPSJNMTQgMTJ2MTAiPjwvcGF0aD48cGF0aCBkPSJNNCA4aDJ2MCI+PC9wYXRoPjxwYXRoIGQ9Ik04IDhoMnYwIj48L3BhdGg+PHBhdGggZD0iTTEyIDhoMnYwIj48L3BhdGg+PHBhdGggZD0iTTE2IDhoMnYwIj48L3BhdGg+PC9zdmc+';
                                                    }}
                                                />
                                                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-bold text-sm leading-tight text-foreground">{dc.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        {dc.activation_date && (
                                                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                                Active {dc.activation_date}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleCompare(dc);
                                                            }}
                                                            className={`p-1.5 rounded border transition-colors ${compareSelection.find(d => d.id === dc.id)
                                                                ? 'bg-primary border-primary text-primary-foreground'
                                                                : 'border-border hover:border-primary hover:bg-muted'
                                                                }`}
                                                            title={compareSelection.find(d => d.id === dc.id) ? 'Remove from comparison' : 'Add to comparison'}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={!!compareSelection.find(d => d.id === dc.id)}
                                                                onChange={() => { }}
                                                                className="pointer-events-none"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Dual Flag Display */}
                                                <div className="flex items-center gap-3 mt-2 text-xs">
                                                    <div className="flex items-center gap-1" title="Data Center Location">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">📍</span>
                                                        <span className="text-base">{getCountryFlag(dc.country)}</span>
                                                        <span className="text-muted-foreground">{dc.location_text?.split(',').pop()?.trim() || dc.country}</span>
                                                    </div>
                                                    <span className="text-muted-foreground/50">|</span>
                                                    <div className="flex items-center gap-1" title="Provider Origin">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">🏢</span>
                                                        <span className="text-base">{getCountryFlag(getProviderCountry(dc.provider))}</span>
                                                        <span className="text-muted-foreground">{getProviderCountry(dc.provider)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-200 font-semibold">
                                                        {dc.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Key Metrics Grid */}
                                        {(() => {
                                            const displayValues = getDisplayValues(dc);
                                            return (
                                                <div className="grid grid-cols-2 gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                                            <Activity size={10} /> Power
                                                            {displayValues.powerEstimated && (
                                                                <span className="text-[8px] px-1 py-0.5 bg-amber-500/20 text-amber-600 rounded" title="Estimated based on facility type and location">Est.</span>
                                                            )}
                                                        </span>
                                                        <p className={`text-xs font-mono font-medium ${displayValues.powerEstimated ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                                            {displayValues.powerStr}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                                            $ Cost
                                                            {displayValues.costEstimated && (
                                                                <span className="text-[8px] px-1 py-0.5 bg-amber-500/20 text-amber-600 rounded" title="Estimated at ~$15-25M per MW based on facility type">Est.</span>
                                                            )}
                                                        </span>
                                                        <p className={`text-xs font-mono font-medium truncate ${displayValues.costEstimated ? 'text-muted-foreground italic' : 'text-foreground'}`} title={displayValues.costStr}>
                                                            {displayValues.costStr}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                                            Employees
                                                        </span>
                                                        <p className="text-xs font-mono font-medium text-foreground">
                                                            {dc.employee_count || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                                            AI Compute
                                                        </span>
                                                        <p className="text-xs font-mono font-medium text-foreground truncate" title={dc.ai_hardware}>
                                                            {dc.ai_hardware || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Models */}
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                                <span>Hosted Models</span>
                                                <span className="bg-muted px-1.5 rounded-full text-[9px]">{dc.models.length} Active</span>
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {dc.models.map((m, i) => (
                                                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md border shadow-sm transition-all ${selectedModel === m
                                                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-md ring-1 ring-primary/20'
                                                        : 'bg-background text-secondary-foreground border-border hover:border-primary/30'
                                                        }`}>
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-muted-foreground uppercase font-semibold">Coordinates</span>
                                                <code className="text-[10px] text-foreground font-mono">
                                                    {dc.lat.toFixed(4)}, {dc.lng.toFixed(4)}
                                                </code>
                                            </div>
                                            <a
                                                href={dc.satellite_url || `https://www.google.com/maps/search/?api=1&query=${dc.lat},${dc.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-600 hover:bg-blue-700 !text-white px-3 py-1.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                                                style={{ color: '#ffffff' }}
                                            >
                                                <Globe size={11} className="text-white" /> <span className="text-white">Satellite View</span>
                                            </a>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Stats Dashboard Overlay */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-[400] w-max max-w-full px-4">
                        <div className="bg-background/90 backdrop-blur-md border border-border shadow-lg rounded-xl flex overflow-hidden">
                            <div className="px-4 py-2 border-r border-border/50">
                                <span className="block text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Total Investment</span>
                                <span className="block text-sm font-mono font-bold text-foreground">
                                    {isLoading ? '...' : `$${stats.cost}B`}
                                </span>
                            </div>
                            <div className="px-4 py-2 border-r border-border/50">
                                <span className="block text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Est. Power</span>
                                <span className="block text-sm font-mono font-bold text-foreground">
                                    {isLoading ? '...' : `${stats.power} GW`}
                                </span>
                            </div>
                            <div className="px-4 py-2">
                                <span className="block text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Active Nodes</span>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="block text-sm font-mono font-bold text-foreground">
                                        {isLoading ? '...' : stats.count}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[500] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <div className="relative">
                                    <Globe className="text-primary animate-pulse" size={64} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-foreground" size={24} />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-lg font-bold">Establishing Satellite Connection...</h3>
                                    <p className="text-sm text-muted-foreground">Synchronizing global infrastructure data</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Overlay Title for Map */}
                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-4 py-2 rounded-lg border border-border shadow-sm z-[400] text-xs font-mono hidden md:flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Activity size={12} className={isLoading ? 'text-muted-foreground' : 'text-green-500 animate-pulse'} />
                                {isLoading ? 'PINGING...' : `LIVE MAP V${DATA_CENTER_METADATA.version} • ${filteredCenters.length} NODES ${selectedModel ? `• HOSTING ${selectedModel.toUpperCase()}` : ''} ${selectedProvider ? `• ${selectedProvider.toUpperCase()} NETWORK` : ''}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Data updated: {DATA_CENTER_METADATA.lastUpdated}
                            </div>
                        </div>
                        <button
                            onClick={copyShareLink}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title={copied ? 'Link copied!' : 'Copy share link'}
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>

                    {/* Asterisk Footnote */}
                    <div className="absolute bottom-4 left-4 z-[400]">
                        <button
                            onClick={() => setShowMethodology(true)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                            <span className="text-amber-500">*</span> Some values are estimated
                        </button>
                    </div>

                    {/* Floating Comparison Bar */}
                    {compareSelection.length >= 2 && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={20} className="text-primary" />
                                <span className="font-semibold">{compareSelection.length} selected</span>
                            </div>
                            <button
                                onClick={() => setShowComparison(true)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                Compare
                            </button>
                            <button
                                onClick={() => setCompareSelection([])}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="Clear selection"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* Comparison Modal */}
                    {showComparison && compareSelection.length >= 2 && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setShowComparison(false)}>
                            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={24} className="text-primary" />
                                        <h3 className="font-bold text-xl">Data Center Comparison</h3>
                                    </div>
                                    <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-muted rounded-lg">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Metric</th>
                                                    {compareSelection.map(dc => (
                                                        <th key={dc.id} className="text-left py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <img src={dc.logo} alt={dc.provider} className="w-8 h-8 rounded object-contain bg-white p-1" />
                                                                <div>
                                                                    <div className="font-bold text-sm">{dc.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{dc.provider}</div>
                                                                </div>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Location */}
                                                <tr className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">Location</td>
                                                    {compareSelection.map(dc => (
                                                        <td key={dc.id} className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span>{getCountryFlag(dc.country)}</span>
                                                                <span>{dc.location_text}</span>
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                                {/* Type */}
                                                <tr className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">Type</td>
                                                    {compareSelection.map(dc => (
                                                        <td key={dc.id} className="py-3 px-4">{dc.type}</td>
                                                    ))}
                                                </tr>
                                                {/* Power */}
                                                <tr className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">Power</td>
                                                    {compareSelection.map(dc => {
                                                        const values = getDisplayValues(dc);
                                                        return (
                                                            <td key={dc.id} className="py-3 px-4">
                                                                <span className={values.powerEstimated ? 'italic text-amber-600' : ''}>
                                                                    {values.powerStr}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                {/* Cost */}
                                                <tr className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">Investment</td>
                                                    {compareSelection.map(dc => {
                                                        const values = getDisplayValues(dc);
                                                        return (
                                                            <td key={dc.id} className="py-3 px-4">
                                                                <span className={values.costEstimated ? 'italic text-amber-600' : ''}>
                                                                    {values.costStr}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                {/* Employees */}
                                                <tr className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">Employees</td>
                                                    {compareSelection.map(dc => (
                                                        <td key={dc.id} className="py-3 px-4">{dc.employees || 'N/A'}</td>
                                                    ))}
                                                </tr>
                                                {/* AI Models */}
                                                <tr className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">AI Models</td>
                                                    {compareSelection.map(dc => (
                                                        <td key={dc.id} className="py-3 px-4">
                                                            {dc.models && dc.models.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {dc.models.map((model, idx) => (
                                                                        <span key={idx} className="text-xs bg-secondary px-2 py-0.5 rounded">
                                                                            {model}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : 'N/A'}
                                                        </td>
                                                    ))}
                                                </tr>
                                                {/* Activation Date */}
                                                <tr>
                                                    <td className="py-3 px-4 font-medium">Activated</td>
                                                    {compareSelection.map(dc => (
                                                        <td key={dc.id} className="py-3 px-4">{dc.activation_date || 'N/A'}</td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Methodology Modal */}
                    {showMethodology && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setShowMethodology(false)}>
                            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-border flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Estimation Methodology</h3>
                                    <button onClick={() => setShowMethodology(false)} className="p-1 hover:bg-muted rounded">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6 text-sm">
                                    <p className="text-muted-foreground">
                                        When official data is unavailable, we estimate Power and Cost based on industry benchmarks.
                                        Estimated values are marked with an amber <span className="text-amber-500 font-semibold">Est.</span> badge.
                                    </p>

                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">⚡ Power Estimation</h4>
                                        <p className="text-muted-foreground mb-2">Base power by facility type, adjusted for location:</p>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-1 font-medium">Facility Type</th>
                                                    <th className="text-right py-1 font-medium">Base Power</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-muted-foreground">
                                                <tr><td className="py-1">Training Hub</td><td className="text-right">150 MW</td></tr>
                                                <tr><td className="py-1">AI Campus</td><td className="text-right">120 MW</td></tr>
                                                <tr><td className="py-1">Supercomputer</td><td className="text-right">100 MW</td></tr>
                                                <tr><td className="py-1">AI Factory</td><td className="text-right">80 MW</td></tr>
                                                <tr><td className="py-1">HPC Center</td><td className="text-right">60 MW</td></tr>
                                                <tr><td className="py-1">Inference Node</td><td className="text-right">40 MW</td></tr>
                                            </tbody>
                                        </table>
                                        <p className="text-[10px] text-muted-foreground mt-2">
                                            <em>Location multipliers: Tropical +15-20%, Cool climates -10-15%</em>
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">💰 Cost Estimation</h4>
                                        <p className="text-muted-foreground mb-2">Cost calculated at ~$15-25M per MW:</p>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-1 font-medium">Facility Type</th>
                                                    <th className="text-right py-1 font-medium">Cost/MW</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-muted-foreground">
                                                <tr><td className="py-1">Training Hub</td><td className="text-right">$25M</td></tr>
                                                <tr><td className="py-1">Supercomputer</td><td className="text-right">$22M</td></tr>
                                                <tr><td className="py-1">AI Factory / Campus</td><td className="text-right">$20M</td></tr>
                                                <tr><td className="py-1">HPC Center</td><td className="text-right">$18M</td></tr>
                                                <tr><td className="py-1">Inference Node</td><td className="text-right">$15M</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground border-t border-border pt-4">
                                        Sources: Industry reports, public filings, and infrastructure benchmarks.
                                        Actual values may vary. Data updated {DATA_CENTER_METADATA.lastUpdated}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
