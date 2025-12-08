import React, { useState } from 'react';
import { SEO } from '../../seo-tools/SEOTags';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const JargonDestroyer = ({ onBack }) => {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!text) return;
        setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'jargon-destroyer', payload: { text } })
            });
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResult(data.result);
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Jargon Destroyer" description="Translate corporate speak into plain English." />

            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600 transition-colors">
                <Icon name="arrow-left" size={20} /> Back to Lab
            </button>

            <Card className="mb-8 bg-gray-300">
                <h1 className="text-4xl font-black uppercase mb-2">Jargon Destroyer</h1>
                <p className="font-mono font-bold mb-6">Paste corporate fluff. Get the truth.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-32 font-bold text-lg p-2 focus:outline-none resize-none border-2 border-transparent focus:bg-yellow-50"
                        placeholder="e.g. We need to leverage our synergies to facilitate a paradigm shift..."
                        name="jargon-text"
                        id="jargon-input"
                    ></textarea>
                    <Button
                        type="submit"
                        isLoading={isGenerating}
                        className="w-full mt-4 hover:bg-red-600 border-2 border-transparent"
                        icon="zap"
                    >
                        DESTROY JARGON
                    </Button>
                </form>
            </Card>

            {result && (
                <Card>
                    <h3 className="font-black uppercase text-sm text-gray-500 mb-2">Plain English Translation:</h3>
                    <p className="font-mono text-xl font-bold">{result}</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 pl-0 hover:bg-transparent"
                        onClick={() => navigator.clipboard.writeText(result)}
                        icon="copy"
                    >
                        Copy to Clipboard
                    </Button>
                </Card>
            )}
        </div>
    );
};
