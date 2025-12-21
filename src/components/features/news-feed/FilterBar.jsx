import React from 'react';
import { Search, X, Filter, Keyboard } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

const CATEGORIES = ["All", "Models", "Image & Video", "Agents", "Research", "Companies", "Policy", "Hardware"];

export const FilterBar = ({
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeSource,
    setActiveSource,
    sources,
    categoryCounts = {} // New prop for article counts per category
}) => {
    return (
        <div className="mb-8 space-y-4 sticky top-0 z-40 bg-white py-4 -mx-4 px-4 border-b-2 border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search intel... (use j/k to navigate)"
                        icon="search"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-black"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="relative min-w-[200px]">
                    <select
                        value={activeSource}
                        onChange={(e) => setActiveSource(e.target.value)}
                        className="w-full h-full appearance-none border-2 border-black bg-white pl-4 pr-10 py-3 font-bold text-lg focus:outline-none focus:bg-yellow-50 cursor-pointer"
                    >
                        <option value="All Sources">All Sources</option>
                        {sources.map(source => (
                            <option key={source} value={source}>{source}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Filter size={20} />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                {CATEGORIES.map(cat => {
                    const count = categoryCounts[cat] || 0;
                    return (
                        <Button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            size="sm"
                            variant={activeCategory === cat ? 'primary' : 'secondary'}
                            className={activeCategory === cat ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] translate-x-[-2px] translate-y-[-2px]' : 'border-gray-300 shadow-none hover:border-black'}
                        >
                            {cat}
                            {cat !== 'All' && count > 0 && (
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {count}
                                </span>
                            )}
                        </Button>
                    );
                })}

                {/* Keyboard shortcuts hint */}
                <div className="hidden md:flex items-center gap-1 ml-auto text-xs text-gray-400 font-mono">
                    <Keyboard size={14} />
                    <span>j/k nav • Enter open • b bookmark</span>
                </div>
            </div>
        </div>
    );
};
