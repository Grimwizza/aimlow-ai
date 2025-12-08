import React, { useState } from 'react';
import { SEO } from '../../seo-tools/SEOTags';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export const HeadlineGenerator = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [results, setResults] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic) return;
        setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'headline', payload: { topic } })
            });
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResults(data.result);
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.message || "Failed to generate."}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Headline Generator" description="Turn boring topics into viral clickbait." />

            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600 transition-colors">
                <Icon name="arrow-left" size={20} /> Back to Lab
            </button>

            <Card className="mb-8 bg-blue-300">
                <h1 className="text-4xl font-black uppercase mb-2">Headline Generator</h1>
                <p className="font-mono font-bold mb-6">Turn boring topics into clickbait gold.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4 flex gap-2 flex-col sm:flex-row shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex-1">
                        <Input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Walking dogs..."
                            name="topic"
                            id="headline-topic"
                            className="h-full border-0 focus:bg-transparent" // Override input styles slightly for this composite layout if needed, or just use Input directly
                        // Actually, standard Input is better
                        />
                    </div>
                    <Button type="submit" isLoading={isGenerating} size="md" icon="sparkles">
                        GENERATE
                    </Button>
                </form>
            </Card>

            <div className="space-y-4">
                {results.map((title, idx) => (
                    <Card key={idx} noShadow className="flex justify-between items-center hover:translate-x-1 transition-transform cursor-pointer border-2 hover:border-blue-600 group" onClick={() => { navigator.clipboard.writeText(title); setCopiedIndex(idx) }}>
                        <span className="font-bold text-lg">{title}</span>
                        <div className="text-gray-400 group-hover:text-blue-600">
                            {copiedIndex === idx ? <Icon name="check" color="green" /> : <Icon name="copy" />}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
