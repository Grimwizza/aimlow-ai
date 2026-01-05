import React, { useState } from 'react';
import { SEO } from '../seo-tools/SEOTags';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AlertTriangle, Shield, Eye, Globe, Newspaper, Users, Briefcase, CheckCircle2, XCircle } from 'lucide-react';

const steps = {
    INPUT: 'input',
    LOADING: 'loading',
    REPORT: 'report'
};

const RiskBadge = ({ level }) => {
    const colors = {
        High: 'bg-red-500/10 text-red-600 border-red-500/20',
        Medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        Low: 'bg-green-500/10 text-green-600 border-green-500/20'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || colors.Medium}`}>
            {level} Risk
        </span>
    );
};

const RiskScore = ({ score }) => {
    const percentage = (score / 10) * 100;
    const color = score >= 7 ? 'bg-red-500' : score >= 4 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Privacy Risk Score</span>
                <span className="text-2xl font-bold">{score}/10</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

export const FindMe = () => {
    const [step, setStep] = useState(steps.INPUT);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        profession: '',
        ageRange: ''
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !agreedToTerms) return;

        setStep(steps.LOADING);
        setError(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'find-me',
                    payload: {
                        name: formData.name,
                        location: formData.location || null,
                        profession: formData.profession || null,
                        ageRange: formData.ageRange || null
                    }
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Analysis failed');
            }

            setReport(data.result);
            setStep(steps.REPORT);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Something went wrong. Please try again.');
            setStep(steps.INPUT);
        }
    };

    const resetForm = () => {
        setStep(steps.INPUT);
        setFormData({ name: '', location: '', profession: '', ageRange: '' });
        setAgreedToTerms(false);
        setReport(null);
        setError(null);
        setActiveTab('summary');
    };

    const tabs = [
        { id: 'summary', label: 'Summary', icon: Eye },
        { id: 'web', label: 'Web Presence', icon: Globe },
        { id: 'news', label: 'News & Media', icon: Newspaper },
        { id: 'social', label: 'Social Media', icon: Users },
        { id: 'professional', label: 'Professional', icon: Briefcase },
        { id: 'privacy', label: 'Privacy Assessment', icon: Shield },
        { id: 'recommendations', label: 'Action Items', icon: CheckCircle2 }
    ];

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen">
            <SEO title="Find Me: Digital Footprint | AimLow" description="Discover your digital footprint and learn how to protect your privacy." />

            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 border border-indigo-500/20">
                    <Shield size={14} /> Privacy Tool
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                    Find Me: <span className="text-primary">Digital Footprint</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Discover what information about you is publicly available online and learn how to protect your privacy.
                </p>
            </div>

            {/* Input Form */}
            {step === steps.INPUT && (
                <Card className="max-w-2xl mx-auto p-8 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Full Name *</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. John Smith"
                                required
                                className="text-lg"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Location (Optional)</label>
                                <Input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g. New York, NY"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Profession (Optional)</label>
                                <Input
                                    name="profession"
                                    value={formData.profession}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Age Range (Optional)</label>
                            <select
                                name="ageRange"
                                value={formData.ageRange}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="">Select age range</option>
                                <option value="18-25">18-25</option>
                                <option value="26-35">26-35</option>
                                <option value="36-45">36-45</option>
                                <option value="46-55">46-55</option>
                                <option value="56+">56+</option>
                            </select>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg border border-border">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1"
                                />
                                <label htmlFor="terms" className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Privacy Notice:</strong> This tool performs real web searches of publicly available information (web pages, news, social media).
                                    No private databases or paid data broker services are accessed. Results are based on actual search findings and analyzed by AI to provide privacy recommendations.
                                    Your search query is not stored.
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-destructive flex-shrink-0" size={20} />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={!formData.name.trim() || !agreedToTerms}
                            size="lg"
                            className="w-full font-bold"
                        >
                            Analyze My Digital Footprint
                        </Button>
                    </form>
                </Card>
            )}

            {/* Loading State */}
            {step === steps.LOADING && (
                <Card className="max-w-2xl mx-auto p-12 text-center shadow-lg">
                    <Icon name="loader" className="animate-spin mx-auto mb-4 text-primary" size={48} />
                    <h2 className="text-2xl font-bold mb-2">Analyzing Your Digital Footprint</h2>
                    <p className="text-muted-foreground">Searching across web, news, social media, and professional listings...</p>
                </Card>
            )}

            {/* Report View */}
            {step === steps.REPORT && report && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">{report.person_name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {[report.search_parameters?.location, report.search_parameters?.profession]
                                    .filter(Boolean)
                                    .join(' • ') || 'Digital Footprint Analysis'}
                            </p>
                        </div>
                        <Button onClick={resetForm} variant="outline">
                            <Icon name="arrow-left" size={16} className="mr-2" /> New Search
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-border">
                        <div className="grid grid-cols-7 gap-0">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-2 py-3 font-medium text-xs md:text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 border-b-2 transition-colors ${activeTab === tab.id
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                        title={tab.label}
                                    >
                                        <IconComponent size={16} className="flex-shrink-0" />
                                        <span className="hidden md:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <Card className="p-6 shadow-lg">
                        {activeTab === 'summary' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Eye size={20} /> Executive Summary
                                    </h3>
                                    <ul className="space-y-2">
                                        {report.executive_summary?.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle2 size={18} className="text-primary flex-shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'web' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Globe size={20} /> Web Presence
                                </h3>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">Overall Visibility</span>
                                        <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                                            {report.web_presence?.overall_visibility}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{report.web_presence?.description}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3">Key Findings</h4>
                                    <ul className="space-y-2">
                                        {report.web_presence?.key_findings?.map((finding, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                <span className="text-sm">{finding}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {report.web_presence?.sources?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3">Sources</h4>
                                        <div className="space-y-2">
                                            {report.web_presence.sources.map((source, idx) => (
                                                <a
                                                    key={idx}
                                                    href={source.url.startsWith('http') ? source.url : `https://${source.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                                                >
                                                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{source.title}</span>
                                                    <Icon name="external-link" size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'news' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Newspaper size={20} /> News & Media Mentions
                                </h3>
                                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Mentions Found</span>
                                        <span className="text-2xl font-bold text-primary">{report.news_media?.mentions_found}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{report.news_media?.description}</p>
                                </div>
                                {report.news_media?.notable_mentions?.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold">Notable Mentions</h4>
                                        {report.news_media.notable_mentions.map((mention, idx) => (
                                            <div key={idx} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-sm">{mention.source}</span>
                                                    <a
                                                        href={`https://${mention.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        View →
                                                    </a>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{mention.context}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'social' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Users size={20} /> Social Media Footprint
                                </h3>
                                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-muted-foreground">{report.social_media?.description}</p>
                                </div>

                                {report.social_media?.profiles?.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <h4 className="font-semibold mb-3">Social Media Accounts</h4>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-4 font-semibold text-sm">Platform</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-sm">Handle/Username</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-sm">Visibility</th>
                                                    <th className="text-left py-3 px-4 font-semibold text-sm">Link</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.social_media.profiles.map((profile, idx) => (
                                                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <span className="font-medium">{profile.platform}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-sm text-muted-foreground font-mono">
                                                                {profile.handle || profile.username || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${profile.visibility === 'Public' ? 'bg-red-500/10 text-red-600' :
                                                                profile.visibility === 'Limited' ? 'bg-yellow-500/10 text-yellow-600' :
                                                                    'bg-green-500/10 text-green-600'
                                                                }`}>
                                                                {profile.visibility}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {profile.url ? (
                                                                <a
                                                                    href={profile.url.startsWith('http') ? profile.url : `https://${profile.url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                                >
                                                                    View Profile <Icon name="external-link" size={12} />
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">Not found</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {report.social_media.profiles.some(p => p.details) && (
                                            <div className="mt-4 space-y-2">
                                                <h5 className="font-semibold text-sm">Additional Details</h5>
                                                {report.social_media.profiles.filter(p => p.details).map((profile, idx) => (
                                                    <div key={idx} className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                                        <strong className="text-foreground">{profile.platform}:</strong> {profile.details}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'professional' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Briefcase size={20} /> Professional Listings
                                </h3>
                                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {report.professional_listings?.found ? (
                                            <CheckCircle2 size={18} className="text-green-600" />
                                        ) : (
                                            <XCircle size={18} className="text-muted-foreground" />
                                        )}
                                        <span className="font-semibold">
                                            {report.professional_listings?.found ? 'Listings Found' : 'No Listings Found'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{report.professional_listings?.description}</p>
                                </div>
                                {report.professional_listings?.listings?.length > 0 && (
                                    <div className="space-y-3">
                                        {report.professional_listings.listings.map((listing, idx) => (
                                            <div key={idx} className="border border-border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold">{listing.source}</span>
                                                    {listing.url && (
                                                        <a
                                                            href={listing.url.startsWith('http') ? listing.url : `https://${listing.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            View <Icon name="external-link" size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{listing.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Shield size={20} /> Privacy Assessment
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted/50 p-6 rounded-lg">
                                        <RiskBadge level={report.privacy_assessment?.risk_level} />
                                        <div className="mt-4">
                                            <RiskScore score={report.privacy_assessment?.risk_score || 5} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                                            <AlertTriangle size={18} /> Vulnerabilities
                                        </h4>
                                        <ul className="space-y-2">
                                            {report.privacy_assessment?.vulnerabilities?.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                                            <CheckCircle2 size={18} /> Positive Factors
                                        </h4>
                                        <ul className="space-y-2">
                                            {report.privacy_assessment?.positive_factors?.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'recommendations' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={20} /> Recommended Actions
                                </h3>

                                <div className="space-y-4">
                                    {report.recommendations?.map((rec, idx) => (
                                        <div key={idx} className="border border-border rounded-lg p-5 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="font-bold text-lg">{rec.action}</h4>
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${rec.priority === 'High' ? 'bg-red-500/10 text-red-600' :
                                                    rec.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-600' :
                                                        'bg-blue-500/10 text-blue-600'
                                                    }`}>
                                                    {rec.priority} Priority
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                                            <div className="bg-muted/50 p-3 rounded-lg">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase">How To:</span>
                                                <p className="text-sm mt-1">{rec.how_to}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {report.data_removal_resources?.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="font-semibold mb-4">Data Removal Resources</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {report.data_removal_resources.map((resource, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`https://${resource.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors block"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-semibold text-sm">{resource.service}</span>
                                                        <Icon name="external-link" size={14} className="text-primary" />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{resource.purpose}</p>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default FindMe;
