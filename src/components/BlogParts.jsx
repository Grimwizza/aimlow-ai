import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { client, urlFor } from '../client';
import { PortableText } from '@portabletext/react';
import { SEO } from '../seo-tools/SEOTags';
import { Icon } from './Layout';

// --- Rich Text Styling ---
export const ptComponents = {
    types: { image: ({ value }) => value?.asset?._ref ? <img src={urlFor(value).width(800).fit('max').url()} alt={value.alt || ' '} className="my-8 w-full border-2 border-black brutal-shadow" /> : null },
    block: {
        h1: ({children}) => <h1 className="text-4xl font-black uppercase mt-12 mb-6">{children}</h1>,
        h2: ({children}) => <h2 className="text-3xl font-bold uppercase mt-10 mb-4 border-b-2 border-black pb-2 inline-block">{children}</h2>,
        h3: ({children}) => <h3 className="text-2xl font-bold mt-8 mb-3">{children}</h3>,
        normal: ({children}) => <p className="mb-6 leading-relaxed text-lg">{children}</p>,
        blockquote: ({children}) => <blockquote className="border-l-4 border-black pl-4 italic my-8 bg-yellow-100 p-6 font-serif text-xl">{children}</blockquote>,
    },
    list: { bullet: ({children}) => <ul className="list-disc ml-6 mb-6 space-y-2 text-lg">{children}</ul>, number: ({children}) => <ol className="list-decimal ml-6 mb-6 space-y-2 text-lg">{children}</ol> }
}

// --- Sub-Components ---
export const ShareBar = ({ title }) => {
    const location = useLocation();
    const currentUrl = `https://aimlow.ai${location.pathname}`;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title || "Check this out");
    return (
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <p className="font-mono text-xs font-bold text-gray-500 uppercase mb-4">Share this Log</p>
            <div className="flex gap-4">
                <a href={`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold hover:bg-blue-400 hover:text-black transition-colors"><Icon name="twitter" size={18} /> <span className="text-sm">Post</span></a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold hover:bg-blue-700 hover:text-white transition-colors"><Icon name="linkedin" size={18} /> <span className="text-sm">Share</span></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold hover:bg-blue-600 hover:text-white transition-colors"><Icon name="facebook" size={18} /> <span className="text-sm">Share</span></a>
            </div>
        </div>
    );
};

export const AuthorBio = ({ author }) => {
    if (!author) return null;
    const avatarUrl = author.image ? urlFor(author.image).width(200).height(200).url() : "https://via.placeholder.com/100";
    return (
        <div className="mt-16 border-t-4 border-black pt-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-white border-2 border-black p-6 brutal-shadow">
                <img src={avatarUrl} alt={author.name} className="w-20 h-20 rounded-full border-2 border-black object-cover"/>
                <div className="text-center sm:text-left">
                    <p className="font-mono text-xs font-bold text-gray-500 uppercase mb-1">Written By</p>
                    <h3 className="text-2xl font-black uppercase mb-2">{author.name}</h3>
                    {author.bio && <div className="prose prose-sm font-serif"><PortableText value={author.bio} /></div>}
                </div>
            </div>
        </div>
    );
};

// --- Main Components ---

export const BlogCard = ({ post }) => {
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(800).url() : 'https://via.placeholder.com/800x400?text=No+Image';
    const dateString = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : (post._createdAt ? new Date(post._createdAt).toLocaleDateString() : 'Draft');
    const slug = post.slug?.current || '#';
    return (
        <Link to={`/post/${slug}`} className="brutal-card bg-white flex flex-col h-full brutal-shadow cursor-pointer hover:-translate-y-1 transition-transform">
            <div className="h-48 overflow-hidden border-b-3 border-black relative group"><div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity z-10"></div><img src={imageUrl} alt={post.title} className="w-full h-full object-cover" /><div className="absolute top-4 right-4 bg-yellow-300 border-2 border-black px-3 py-1 font-mono text-xs font-bold z-20">LOG</div></div>
            <div className="p-6 flex-1 flex flex-col"><div className="font-mono text-xs text-gray-500 mb-2">{dateString}</div><h3 className="text-2xl font-black leading-tight mb-4 uppercase">{post.title}</h3><p className="font-serif text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p><div className="flex items-center gap-2 font-bold text-sm mt-auto group">Read Post <Icon name="arrow-right" size={16} /></div></div>
        </Link>
    );
};

// This was the missing component!
export const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            const query = `*[_type == "post" && slug.current == $slug][0] { 
                title, publishedAt, _createdAt, mainImage, 
                "excerpt": pt::text(body)[0...150] + "...", 
                body, 
                author->{name, image, bio} 
            }`;
            const data = await client.fetch(query, { slug });
            setPost(data); 
            setLoading(false);
        };
        fetchPost();
    }, [slug]);

    if (loading) return <div className="py-20 text-center"><Icon name="loader" className="animate-spin mx-auto" /></div>;
    if (!post) return <div className="py-20 text-center font-bold">Post not found.</div>;

    const dateString = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : (post._createdAt ? new Date(post._createdAt).toLocaleDateString() : 'Draft');
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).url() : null;

    return (
        <article className="max-w-3xl mx-auto px-4 py-12">
            <SEO title={post.title} description={post.excerpt} image={imageUrl} />
            <Link to="/blog" className="flex items-center gap-2 font-mono font-bold mb-8 hover:text-blue-600"><Icon name="arrow-left" size={20} /> Back to Log</Link>
            {imageUrl && <div className="w-full aspect-video bg-gray-200 border-2 border-black mb-8 overflow-hidden rounded-none"><img src={imageUrl} className="w-full h-full object-cover" alt={post.title} /></div>}
            <div className="flex items-center gap-4 mb-6 font-mono text-sm"><span className="px-3 py-1 border-2 border-black font-bold bg-yellow-300">Log</span><span className="text-gray-500">{dateString}</span></div>
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-none mb-8">{post.title}</h1>
            <div className="prose prose-lg font-serif border-l-4 border-[#FEC43D] pl-6 text-lg"><PortableText value={post.body} components={ptComponents} /></div>
            <ShareBar title={post.title} />
            <AuthorBio author={post.author} />
        </article>
    );
};

export const LabCard = ({ item }) => (
    <div className={`brutal-card p-6 ${item.color} brutal-shadow flex flex-col`}>
        <div className="flex justify-between items-start mb-4"><h3 className="text-2xl font-black uppercase">{item.title}</h3><span className="bg-black text-white text-xs px-2 py-1 font-mono">{item.status}</span></div>
        <p className="font-bold mb-6 border-t-2 border-black pt-4 flex-1">{item.desc}</p>
        <Link to={`/lab/${item.slug}`} className="w-full bg-black text-white border-2 border-black py-2 font-bold hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"><Icon name="flask-conical" size={18} /> LAUNCH TOOL</Link>
    </div>
);