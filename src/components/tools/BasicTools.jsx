import React, { useState, useRef } from 'react';
import { SEO } from '../../seo-tools/SEOTags';
import { Icon } from '../Layout';
// Removed unused Link import since we use buttons for navigation here

export const HeadlineGenerator = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [results, setResults] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const handleGenerate = async (e) => {
        e.preventDefault(); if (!topic) return; setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        try {
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'headline', payload: { topic } }) });
            const data = await response.json(); 
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResults(data.result);
        } catch (err) { console.error(err); alert(`Error: ${err.message || "Failed to generate."}`); } finally { setIsGenerating(false); }
    };
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Headline Generator" description="Turn boring topics into viral clickbait." />
            {/* FIXED TAG: Changed </Link> to </button> */}
            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
            <div className="brutal-card p-8 bg-blue-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Headline Generator</h1>
                <p className="font-mono font-bold mb-6">Turn boring topics into clickbait gold.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4 flex gap-2 flex-col sm:flex-row">
                    <input value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1 font-bold text-lg p-2 focus:outline-none" placeholder="e.g. Walking dogs..." name="topic" id="headline-topic" />
                    <button type="submit" disabled={isGenerating} className="bg-black text-white px-6 py-3 font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : <Icon name="sparkles" />} GENERATE</button>
                </form>
            </div>
            <div className="space-y-4">{results.map((title, idx) => (<div key={idx} className="bg-white border-2 border-black p-4 flex justify-between items-center hover:translate-x-1 transition-transform"><span className="font-bold text-lg">{title}</span><button onClick={() => {navigator.clipboard.writeText(title); setCopiedIndex(idx)}} className="hover:text-blue-600">{copiedIndex === idx ? <Icon name="check" color="green" /> : <Icon name="copy" />}</button></div>))}</div>
        </div>
    );
};

export const AltTextFixer = ({ onBack }) => {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setImage(reader.result); setResult(''); }; reader.readAsDataURL(file); } };
    const handleGenerate = async () => {
        if (!image) return; setIsGenerating(true);
        try {
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'alt-text', payload: { image } }) });
            const data = await response.json(); 
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResult(data.result);
        } catch (err) { console.error(err); alert(`Error: ${err.message}`); } finally { setIsGenerating(false); }
    };
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Alt-Text Fixer" description="Generate SEO-friendly image descriptions." />
            {/* FIXED TAG: Changed </Link> to </button> */}
            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
            <div className="brutal-card p-8 bg-red-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Alt-Text Fixer</h1>
                <p className="font-mono font-bold mb-6">Upload an image. Get perfect SEO descriptions.</p>
                <div className="bg-white border-2 border-black p-8 text-center border-dashed border-4 border-gray-200 hover:border-black transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" name="image-upload" id="alt-text-upload" />
                    {image ? <img src={image} className="max-h-64 mx-auto border-2 border-black" alt="Preview" /> : <div className="flex flex-col items-center text-gray-400"><Icon name="upload" size={48} /><p className="font-bold mt-2">Click to Upload Image</p></div>}
                </div>
                {image && <button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4 bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors flex justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : "ANALYZE IMAGE"}</button>}
            </div>
            {result && (<div className="bg-white border-2 border-black p-6 brutal-shadow"><h3 className="font-black uppercase text-sm text-gray-500 mb-2">Generated Alt-Text:</h3><p className="font-mono text-xl font-bold">{result}</p><button onClick={() => navigator.clipboard.writeText(result)} className="mt-4 text-sm font-bold hover:text-blue-600 flex items-center gap-2"><Icon name="copy" size={16} /> Copy to Clipboard</button></div>)}
        </div>
    );
};

export const JargonDestroyer = ({ onBack }) => {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const handleGenerate = async (e) => {
        e.preventDefault(); if (!text) return; setIsGenerating(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        try {
            const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'jargon-destroyer', payload: { text } }) });
            const data = await response.json(); 
            if (!response.ok || data.error) throw new Error(data.error || "Server Error");
            if (data.result) setResult(data.result);
        } catch (err) { console.error(err); alert(`Error: ${err.message}`); } finally { setIsGenerating(false); }
    };
    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <SEO title="Jargon Destroyer" description="Translate corporate speak into plain English." />
            {/* FIXED TAG: Changed </Link> to </button> */}
            <button onClick={onBack} className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Lab</button>
            <div className="brutal-card p-8 bg-gray-300 brutal-shadow mb-8">
                <h1 className="text-4xl font-black uppercase mb-2">Jargon Destroyer</h1>
                <p className="font-mono font-bold mb-6">Paste corporate fluff. Get the truth.</p>
                <form onSubmit={handleGenerate} className="bg-white border-2 border-black p-4">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-32 font-bold text-lg p-2 focus:outline-none resize-none" placeholder="e.g. We need to leverage our synergies to facilitate a paradigm shift..." name="jargon-text" id="jargon-input"></textarea>
                    <button type="submit" disabled={isGenerating} className="w-full mt-4 bg-black text-white py-3 font-bold hover:bg-red-600 transition-colors flex justify-center gap-2">{isGenerating ? <Icon name="loader" className="animate-spin" /> : <><Icon name="zap" /> DESTROY JARGON</>}</button>
                </form>
            </div>
            {result && (<div className="bg-white border-2 border-black p-6 brutal-shadow"><h3 className="font-black uppercase text-sm text-gray-500 mb-2">Plain English Translation:</h3><p className="font-mono text-xl font-bold">{result}</p><button onClick={() => navigator.clipboard.writeText(result)} className="mt-4 text-sm font-bold hover:text-blue-600 flex items-center gap-2"><Icon name="copy" size={16} /> Copy to Clipboard</button></div>)}
        </div>
    );
};