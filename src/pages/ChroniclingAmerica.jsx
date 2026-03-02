import React, { useState } from 'react';
import { Search, Calendar, MapPin, Newspaper, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

// US States for dropdown
const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming", "District of Columbia", "Puerto Rico", "Virgin Islands"
];

export const ChroniclingAmerica = () => {
    const [query, setQuery] = useState('');
    const [isExactMatch, setIsExactMatch] = useState(false);
    const [state, setState] = useState('');
    const [startYear, setStartYear] = useState('1900');
    const [endYear, setEndYear] = useState('1920');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);
        setResults([]);
        setError(null);

        try {
            // Construct API URL
            // Docs: https://libraryofcongress.github.io/data-exploration/loc.gov%20JSON%20API/
            // 'q' is the robust search param. 'dq' or 'qs' can be flaky with facets.
            // We use client-side date filtering as server params can be unreliable on the collections endpoint.

            const params = new URLSearchParams({
                fo: 'json',
                dl: 'page', // Page level results
                q: isExactMatch ? `"${query}"` : query, // Use quotes for phrase if exact
                dates: `${startYear}/${endYear}` // Server-side date filtering (YYYY/YYYY)
            });

            // Fix: Use 'fa' facet for state filtering, and it must be lowercase
            if (state) {
                params.append('fa', `location_state:${state.toLowerCase()}`);
            }

            const url = `https://www.loc.gov/collections/chronicling-america/?${params.toString()}`;
            console.log("Fetching:", url);

            const res = await fetch(url);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json();

            // Helper for formatting location (Capitalize words)
            const formatLocation = (val) => {
                if (!val) return null;
                const str = Array.isArray(val) ? val[0] : val;
                if (typeof str !== 'string') return null;
                return str.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };

            const mapped = (data.results || [])
                .map(item => ({
                    id: item.id || Math.random().toString(),
                    title: item.title,
                    date: item.date,
                    city: formatLocation(item.location_city),
                    state: formatLocation(item.location_state),
                    image: item.image_url?.[0] || null, // Thumbnails often in image_url array
                    link: item.id // id is usually the URL to the item
                }));

            setResults(mapped);

        } catch (err) {
            console.error(err);
            setError("Failed to fetch newspapers. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-muted/30 border-b border-border py-12 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-background px-3 py-1 rounded-full text-xs font-medium mb-4 text-muted-foreground border border-border shadow-sm">
                        <Newspaper size={12} />
                        <span>Library of Congress API</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Chronicling America</h1>
                    <p className="text-lg text-muted-foreground font-light">
                        Search millions of historic American newspaper pages from 1777-1963.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Search Form */}
                <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm mb-12 max-w-4xl mx-auto -mt-16 relative z-10">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Keywords */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Keywords</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder="e.g. 'Suffrage', 'Titanic', 'Election'"
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="exactPhrase"
                                        checked={isExactMatch}
                                        onChange={e => setIsExactMatch(e.target.checked)}
                                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary cursor-pointer"
                                    />
                                    <label htmlFor="exactPhrase" className="text-sm text-muted-foreground cursor-pointer select-none">Search for exact phrase match</label>
                                </div>
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">State</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                    <select
                                        value={state}
                                        onChange={e => setState(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all appearance-none font-medium cursor-pointer"
                                    >
                                        <option value="">All States</option>
                                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Year Range</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={startYear}
                                            onChange={e => setStartYear(e.target.value)}
                                            min="1777" max="1963"
                                            className="w-full pl-4 pr-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-center"
                                        />
                                    </div>
                                    <span className="text-muted-foreground">-</span>
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={endYear}
                                            onChange={e => setEndYear(e.target.value)}
                                            min="1777" max="1963"
                                            className="w-full pl-4 pr-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-center"
                                        />
                                    </div>
                                    <Calendar className="text-muted-foreground ml-2" size={20} />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" size="lg" className="w-full font-bold h-12 text-lg" disabled={loading}>
                            {loading ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Searching...</span> : 'Search Archives'}
                        </Button>
                    </form>
                </div>

                {/* Results */}
                {searched && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status */}
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Search Results</h2>
                            <span className="text-sm text-muted-foreground">{results.length} pages found</span>
                        </div>

                        {error && (
                            <div className="p-8 text-center border border-red-200 bg-red-50 text-red-600 rounded-xl">
                                <p>{error}</p>
                            </div>
                        )}

                        {results.length === 0 && !loading && !error && (
                            <div className="p-12 text-center border border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">No matches found. Try widening your date range or keywords.</p>
                            </div>
                        )}

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {results.map(item => (
                                <a
                                    key={item.id}
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group block bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:ring-2 hover:ring-primary/50"
                                >
                                    {/* Image */}
                                    <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                <Newspaper size={40} opacity={0.2} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>

                                    {/* Details */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>
                                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0 mt-1" />
                                        </div>

                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p className="flex items-center gap-1">
                                                <Calendar size={10} /> {item.date}
                                            </p>
                                            {(item.city || item.state) && (
                                                <p className="flex items-center gap-1">
                                                    <MapPin size={10} />
                                                    {[item.city, item.state].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
