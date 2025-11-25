import React, { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';

export const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');

        // AIM LOW HACK: We use a hidden iframe or simple fetch to post to ConvertKit/Mailchimp
        // For now, we simulate success so you can see the UI state.
        // Later, you simply replace the 'setTimeout' with a real fetch call.
        
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1500);
    };

    return (
        <div className="w-full bg-[#FEC43D] border-t-4 border-b-4 border-black py-16 px-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                
                {/* Left: The Pitch */}
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-4xl font-black uppercase mb-4">
                        Don't Miss <br/> The Next Experiment.
                    </h2>
                    <p className="font-mono font-bold text-lg">
                        Join the Aim Low army. Get the latest AI tools and shortcuts delivered to your inbox. No spam, just leverage.
                    </p>
                </div>

                {/* Right: The Form */}
                <div className="flex-1 w-full max-w-md">
                    {status === 'success' ? (
                        <div className="bg-black text-white p-8 border-2 border-black text-center brutal-shadow">
                            <Check size={48} className="mx-auto mb-4 text-[#FEC43D]" />
                            <h3 className="text-2xl font-black uppercase">You're In.</h3>
                            <p className="font-mono mt-2">Welcome to the resistance.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-white p-6 border-2 border-black brutal-shadow relative">
                            <label className="font-mono text-xs font-bold text-gray-500 uppercase mb-2 block">Email Address</label>
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-black font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-colors"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={status === 'loading'}
                                    className="bg-black text-white py-3 px-6 font-black uppercase hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {status === 'loading' ? <Loader2 className="animate-spin" /> : "SUBSCRIBE"}
                                </button>
                            </div>
                            {/* Decorational 'Screw' heads for brutalist look */}
                            <div className="absolute top-2 left-2 w-2 h-2 bg-gray-300 rounded-full border border-black"></div>
                            <div className="absolute top-2 right-2 w-2 h-2 bg-gray-300 rounded-full border border-black"></div>
                            <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-300 rounded-full border border-black"></div>
                            <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-300 rounded-full border border-black"></div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};