import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

const CATEGORIES = ["All", "LLMs", "Creative AI", "Robotics", "Hardware", "Regulation", "Business"];

export const FilterBar = ({
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeSource,
    setActiveSource,
    sources
}) => {
    return (
        <div className="mb-12 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search intel..."
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

            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                    <Button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        size="sm"
                        variant={activeCategory === cat ? 'primary' : 'secondary'}
                        className={activeCategory === cat ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] translate-x-[-2px] translate-y-[-2px]' : 'border-gray-300 shadow-none hover:border-black'}
                    >
                        {cat}
                    </Button>
                ))}
            </div>
        </div>
    );
};
