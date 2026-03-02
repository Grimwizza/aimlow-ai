
import React, { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { Search, Database, ExternalLink, Book, Tv, Bitcoin, LandPlot, AlertCircle, TrendingUp, Rocket, Palette, Activity, Code, Globe, Library, Music, Gamepad2, Ghost } from 'lucide-react';
import { Button } from '../components/ui/Button';

// --- API PROVIDER LOGIC ---
const PROVIDERS = {
    // --- GOVERNMENT ---
    socrata: {
        id: 'socrata',
        name: 'Socrata Discovery',
        description: 'US Government Open Data Network.',
        category: 'government',
        icon: Database,
        placeholder: "Search datasets (e.g., 'budget', 'crime')...",
        search: async (q) => {
            const url = `https://api.us.socrata.com/api/catalog/v1?limit=25&q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.results || []).map(item => ({
                id: item.resource.id,
                title: item.resource.name,
                subtitle: item.metadata.domain,
                description: item.resource.description,
                meta: item.resource.type || 'Dataset',
                link: item.link
            }));
        }
    },
    loc: {
        id: 'loc',
        name: 'Library of Congress',
        description: 'Historical artifacts, photos, and legislative data.',
        category: 'government',
        icon: Library,
        placeholder: "Search history (e.g., 'civil war', 'lincoln')...",
        search: async (q) => {
            const url = `https://www.loc.gov/search/?q=${encodeURIComponent(q)}&fo=json`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.results || []).slice(0, 10).map(item => ({
                id: item.id || Math.random().toString(),
                title: item.title,
                subtitle: item.date,
                description: item.description?.[0] || 'No description.',
                meta: item.original_format?.[0] || 'Item',
                link: item.id
            }));
        }
    },
    worldbank: {
        id: 'worldbank',
        name: 'USA Spending',
        description: 'Federal spending and agency data.',
        category: 'government',
        icon: Globe,
        placeholder: "Search agencies (e.g., 'education', 'defense')...",
        search: async (q) => {
            const url = `https://api.usaspending.gov/api/v2/references/toptier_agencies/?sort=agency_name&order=asc&limit=10&filter=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.results || []).map(item => ({
                id: item.agency_id,
                title: item.agency_name,
                subtitle: item.abbreviation,
                description: `Congress Justification: ${item.congressional_justification_url || 'N/A'}`,
                meta: 'Agency',
                link: item.website || 'https://www.usaspending.gov'
            }));
        }
    },

    // --- FINANCE ---
    coincap: {
        id: 'coincap',
        name: 'CoinCap',
        description: 'Real-time cryptocurrency market data.',
        category: 'finance',
        icon: Bitcoin,
        placeholder: "Search assets (e.g., 'bitcoin', 'ethereum')...",
        search: async (q) => {
            const url = `https://api.coincap.io/v2/assets?search=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.data || []).map(c => ({
                id: c.id,
                title: `${c.name} (${c.symbol})`,
                subtitle: `$${parseFloat(c.priceUsd).toFixed(2)}`,
                description: `Market Cap: $${(parseFloat(c.marketCapUsd) / 1e9).toFixed(2)}B | 24h Change: ${parseFloat(c.changePercent24Hr).toFixed(2)}%`,
                meta: 'Crypto',
                link: `https://coincap.io/assets/${c.id}`
            }));
        }
    },
    frankfurter: {
        id: 'frankfurter',
        name: 'Frankfurter',
        description: 'Foreign exchange rates and currency data.',
        category: 'finance',
        icon: TrendingUp,
        placeholder: "Search base currency (e.g., 'USD', 'EUR')...",
        search: async (q) => {
            try {
                const code = q.toUpperCase().substring(0, 3);
                const url = `https://api.frankfurter.app/latest?from=${code}`;
                const res = await fetch(url);
                if (!res.ok) return [];
                const data = await res.json();
                return Object.entries(data.rates).slice(0, 10).map(([curr, rate]) => ({
                    id: curr,
                    title: `${code} → ${curr}`,
                    subtitle: `Rate: ${rate}`,
                    description: `Exchange rate from ${code} to ${curr} as of ${data.date}`,
                    meta: 'Forex',
                    link: 'https://www.frankfurter.app'
                }));
            } catch (e) { return []; }
        }
    },
    coingecko: {
        id: 'coingecko',
        name: 'CoinGecko',
        description: 'Crypto market data (Alternative).',
        category: 'finance',
        icon: Bitcoin,
        placeholder: "Search coins (e.g., 'dogecoin')...",
        search: async (q) => {
            const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.coins || []).slice(0, 10).map(c => ({
                id: c.id,
                title: c.name,
                subtitle: c.symbol,
                description: `Rank #${c.market_cap_rank || '?'}`,
                meta: 'Crypto',
                link: `https://www.coingecko.com/en/coins/${c.id}`
            }));
        }
    },

    // --- CULTURE ---
    openlibrary: {
        id: 'openlibrary',
        name: 'Open Library',
        description: 'Books and classic literature.',
        category: 'culture',
        icon: Book,
        placeholder: "Search books (e.g., 'dune', 'asimov')...",
        search: async (q) => {
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.docs || []).map(b => ({
                id: b.key,
                title: b.title,
                subtitle: b.author_name ? b.author_name.join(', ') : 'Unknown Author',
                description: b.first_publish_year ? `First published: ${b.first_publish_year}` : '',
                meta: 'Book',
                link: `https://openlibrary.org${b.key}`
            }));
        }
    },
    gutendex: {
        id: 'gutendex',
        name: 'Project Gutenberg',
        description: 'Free public domain ebooks.',
        category: 'culture',
        icon: Library,
        placeholder: "Search classics (e.g., 'pride and prejudice')...",
        search: async (q) => {
            const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.results || []).slice(0, 10).map(item => ({
                id: item.id,
                title: item.title,
                subtitle: item.authors?.[0]?.name || 'Unknown',
                description: `Downloads: ${item.download_count}`,
                meta: 'E-Book',
                link: `https://www.gutenberg.org/ebooks/${item.id}`
            }));
        }
    },
    poetry: {
        id: 'poetry',
        name: 'PoetryDB',
        description: 'The world\'s first API for internet poetry.',
        category: 'culture',
        icon: Book,
        placeholder: "Search authors (e.g., 'Shakespeare')...",
        search: async (q) => {
            const url = `https://poetrydb.org/author/${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            if (data.status === 404) return [];
            return (data || []).slice(0, 10).map(item => ({
                id: item.title,
                title: item.title,
                subtitle: item.author,
                description: item.lines?.slice(0, 2).join(' ') + '...',
                meta: 'Poem',
                link: `https://poetrydb.org/title/${encodeURIComponent(item.title)}`
            }));
        }
    },

    // --- MUSIC ---
    musicbrainz: {
        id: 'musicbrainz',
        name: 'MusicBrainz',
        description: 'Open music encyclopedia.',
        category: 'music',
        icon: Music,
        placeholder: "Search artists (e.g., 'Daft Punk')...",
        search: async (q) => {
            const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(q)}&fmt=json&limit=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.artists || []).map(item => ({
                id: item.id,
                title: item.name,
                subtitle: item.country || 'Unknown',
                description: item.disambiguation || 'Artist',
                meta: 'Artist',
                link: `https://musicbrainz.org/artist/${item.id}`
            }));
        }
    },
    openopus: {
        id: 'openopus',
        name: 'Open Opus',
        description: 'Classical music composers.',
        category: 'music',
        icon: Library,
        placeholder: "Search composers (e.g., 'Mozart')...",
        search: async (q) => {
            if (q.length < 3) return [];
            const url = `https://api.openopus.org/composer/list/search/${encodeURIComponent(q.substring(0, 20))}.json`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            if (data.status?.error) return [];
            return (data.composers || []).slice(0, 10).map(item => ({
                id: item.id,
                title: item.name,
                subtitle: `${item.birth} - ${item.death}`,
                description: `Era: ${item.epoch}`,
                meta: 'Composer',
                link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.name)}`
            }));
        }
    },
    itunes: {
        id: 'itunes',
        name: 'iTunes Search',
        description: 'Music, movies, podcasts from Apple.',
        category: 'music',
        icon: Music,
        placeholder: "Search iTunes (e.g., 'taylor swift')...",
        search: async (q) => {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.results || []).map(item => ({
                id: item.trackId || item.collectionId,
                title: item.trackName || item.collectionName,
                subtitle: item.artistName,
                description: `${item.kind} | ${item.primaryGenreName}`,
                meta: 'iTunes',
                link: item.trackViewUrl || item.collectionViewUrl
            }));
        }
    },

    // --- ENTERTAINMENT ---
    tvmaze: {
        id: 'tvmaze',
        name: 'TV Maze',
        description: 'TV show info and episodes.',
        category: 'entertainment',
        icon: Tv,
        placeholder: "Search TV (e.g., 'Breaking Bad')...",
        search: async (q) => {
            const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return data.map(item => ({
                id: item.show.id,
                title: item.show.name,
                subtitle: item.show.network?.name || 'Unknown',
                description: item.show.summary?.replace(/<[^>]*>/g, '') || '',
                meta: item.show.status,
                link: item.show.url
            }));
        }
    },
    jikan: {
        id: 'jikan',
        name: 'Jikan (Anime)',
        description: 'Anime and manga database.',
        category: 'entertainment',
        icon: Ghost,
        placeholder: "Search anime (e.g., 'Naruto')...",
        search: async (q) => {
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.data || []).map(item => ({
                id: item.mal_id,
                title: item.title,
                subtitle: item.type,
                description: item.synopsis ? (item.synopsis.substring(0, 100) + '...') : '',
                meta: 'Anime',
                link: item.url
            }));
        }
    },
    pokeapi: {
        id: 'pokeapi',
        name: 'PokéAPI',
        description: 'Pokémon stats and data.',
        category: 'entertainment',
        icon: Gamepad2,
        placeholder: "Search Pokémon (e.g., 'pikachu')...",
        search: async (q) => {
            try {
                const url = `https://pokeapi.co/api/v2/pokemon/${q.toLowerCase().trim()}`;
                const res = await fetch(url);
                if (!res.ok) return [];
                const data = await res.json();
                return [{
                    id: data.id,
                    title: data.name.charAt(0).toUpperCase() + data.name.slice(1),
                    subtitle: `National Dex #${data.id}`,
                    description: `Type: ${data.types?.[0]?.type?.name}`,
                    meta: 'Pokémon',
                    link: `https://www.pokemon.com/us/pokedex/${data.name}`
                }];
            } catch (e) { return []; }
        }
    },

    // --- SCIENCE ---
    nasa: {
        id: 'nasa',
        name: 'NASA Images',
        description: 'Space photography.',
        category: 'science',
        icon: Rocket,
        placeholder: "Search space (e.g., 'mars')...",
        search: async (q) => {
            const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.collection?.items || []).slice(0, 10).map(item => {
                const d = item.data?.[0] || {};
                return {
                    id: d.nasa_id,
                    title: d.title,
                    subtitle: d.center,
                    description: d.description,
                    meta: 'Media',
                    link: `https://images.nasa.gov/details/${d.nasa_id}`
                };
            });
        }
    },
    spacex: {
        id: 'spacex',
        name: 'SpaceX',
        description: 'Launches, rockets, missions.',
        category: 'science',
        icon: Rocket,
        placeholder: "Search launches (e.g., 'starlink')...",
        search: async (q) => {
            const url = 'https://api.spacexdata.com/v4/launches/past';
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            const term = q.toLowerCase();
            return data.filter(l => l.name.toLowerCase().includes(term)).slice(0, 10).map(item => ({
                id: item.id,
                title: item.name,
                subtitle: new Date(item.date_utc).toLocaleDateString(),
                description: item.details || 'No details.',
                meta: 'Launch',
                link: item.links.webcast
            }));
        }
    },
    arxiv: {
        id: 'arxiv',
        name: 'ArXiv',
        description: 'Scientific papers (Physics, CS).',
        category: 'science',
        icon: Book,
        placeholder: "Search papers (e.g., 'quantum')...",
        search: async (q) => {
            // ArXiv returns XML, need to parse manually or find JSON proxy.
            // Using a hack for now: simple fetch and regex or just skip XML text for this demo?
            // Actually, let's use OpenAlex for better JSON! Or stick to simpler one.
            // Semantic Scholar is better but key required.
            // Let's us PLOS API? 
            const url = `https://api.plos.org/search?q=title:${encodeURIComponent(q)}&wt=json`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.response?.docs || []).slice(0, 10).map(item => ({
                id: item.id,
                title: item.title_display,
                subtitle: item.journal,
                description: item.abstract?.[0] || 'No abstract.',
                meta: 'Paper',
                link: `https://journals.plos.org/plosone/article?id=${item.id}`
            }));
        }
    },

    // --- HEALTH ---
    openfda: {
        id: 'openfda',
        name: 'OpenFDA',
        description: 'Drug labels and recalls.',
        category: 'health',
        icon: Activity,
        placeholder: "Search drugs (e.g., 'aspirin')...",
        search: async (q) => {
            const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.results || []).map(item => ({
                id: item.id || Math.random().toString(),
                title: item.openfda?.brand_name?.[0] || 'Unknown',
                subtitle: item.openfda?.manufacturer_name?.[0],
                description: item.purpose?.[0] || 'No description.',
                meta: 'Drug',
                link: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(item.openfda?.brand_name?.[0] || '')}`
            }));
        }
    },
    openfood: {
        id: 'openfood',
        name: 'Open Food Facts',
        description: 'Global food items database.',
        category: 'health',
        icon: Activity,
        placeholder: "Search food (e.g., 'nutella')...",
        search: async (q) => {
            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.products || []).slice(0, 10).map(item => ({
                id: item.code,
                title: item.product_name || 'Unknown',
                subtitle: item.brands,
                description: `Calories: ${item.nutriments?.['energy-kcal_100g'] || '?'}`,
                meta: 'Food',
                link: `https://world.openfoodfacts.org/product/${item.code}`
            }));
        }
    },
    makeup: {
        id: 'makeup',
        name: 'Makeup API',
        description: 'Cosmetic products and brands.',
        category: 'health',
        icon: Palette,
        placeholder: "Search brands (e.g., 'maybelline')...",
        search: async (q) => {
            const url = `https://makeup-api.herokuapp.com/api/v1/products.json?brand=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return data.slice(0, 10).map(item => ({
                id: item.id,
                title: item.name,
                subtitle: item.brand,
                description: `$${item.price}`,
                meta: 'Cosmetic',
                link: item.product_link
            }));
        }
    },

    // --- TECH ---
    npm: {
        id: 'npm',
        name: 'NPM',
        description: 'JavaScript packages.',
        category: 'tech',
        icon: Code,
        placeholder: "Search packages (e.g., 'react')...",
        search: async (q) => {
            const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.objects || []).map(item => ({
                id: item.package.name,
                title: item.package.name,
                subtitle: item.package.version,
                description: item.package.description,
                meta: 'Package',
                link: item.package.links.npm
            }));
        }
    },
    hackernews: {
        id: 'hackernews',
        name: 'Hacker News',
        description: 'Tech news discussions.',
        category: 'tech',
        icon: Code,
        placeholder: "Search news (e.g., 'ai')...",
        search: async (q) => {
            const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=10`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.hits || []).map(item => ({
                id: item.objectID,
                title: item.title,
                subtitle: `By ${item.author}`,
                description: `${item.points} points`,
                meta: 'Story',
                link: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`
            }));
        }
    },
    github: {
        id: 'github',
        name: 'GitHub',
        description: 'Public repositories.',
        category: 'tech',
        icon: Code,
        placeholder: "Search repos (e.g., 'linux')...",
        search: async (q) => {
            const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=10`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.items || []).map(item => ({
                id: item.id,
                title: item.full_name,
                subtitle: item.language,
                description: item.description,
                meta: 'Repo',
                link: item.html_url
            }));
        }
    },

    // --- KNOWLEDGE ---
    wikipedia: {
        id: 'wikipedia',
        name: 'Wikipedia',
        description: 'The free encyclopedia.',
        category: 'knowledge',
        icon: Globe,
        placeholder: "Search topics...",
        search: async (q) => {
            const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.query?.search || []).map(item => ({
                id: item.pageid,
                title: item.title,
                subtitle: new Date(item.timestamp).toLocaleDateString(),
                description: item.snippet.replace(/<[^>]*>/g, ''),
                meta: 'Article',
                link: `https://en.wikipedia.org/?curid=${item.pageid}`
            }));
        }
    },
    countries: {
        id: 'countries',
        name: 'Rest Countries',
        description: 'Country demographics.',
        category: 'knowledge',
        icon: Globe,
        placeholder: "Search countries (e.g., 'france')...",
        search: async (q) => {
            const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data || []).slice(0, 5).map(item => ({
                id: item.cca3,
                title: item.name.common,
                subtitle: item.region,
                description: `Pop: ${item.population.toLocaleString()}`,
                meta: 'Country',
                link: item.maps.googleMaps
            }));
        }
    },
    dictionary: {
        id: 'dictionary',
        name: 'Free Dictionary',
        description: 'Definitions & phonetics.',
        category: 'knowledge',
        icon: Book,
        placeholder: "Define word...",
        search: async (q) => {
            const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data || []).flatMap(entry =>
                (entry.meanings || []).map(m => ({
                    id: Math.random().toString(),
                    title: entry.word,
                    subtitle: m.partOfSpeech,
                    description: m.definitions?.[0]?.definition,
                    meta: 'Def',
                    link: entry.sourceUrls?.[0]
                }))
            ).slice(0, 5);
        }
    },

    // --- ART ---
    artic: {
        id: 'artic',
        name: 'Art Institute Chicago',
        description: 'Historical artwork.',
        category: 'art',
        icon: Palette,
        placeholder: "Search art...",
        search: async (q) => {
            const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&fields=id,title,artist_display,date_display,image_id&limit=10`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            return (data.data || []).map(item => ({
                id: item.id,
                title: item.title,
                subtitle: item.artist_display,
                description: item.date_display,
                meta: 'Artwork',
                link: `https://www.artic.edu/artworks/${item.id}`
            }));
        }
    },
    met: {
        id: 'met',
        name: 'The Met',
        description: 'Metropolitan Museum of Art.',
        category: 'art',
        icon: Palette,
        placeholder: "Search collection...",
        search: async (q) => {
            const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(q)}&hasImages=true`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            const ids = (data.objectIDs || []).slice(0, 5);
            const objects = await Promise.all(ids.map(async id => {
                const r = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
                return r.json();
            }));
            return objects.map(item => ({
                id: item.objectID,
                title: item.title,
                subtitle: item.artistDisplayName,
                description: item.objectDate,
                meta: 'Met Art',
                link: item.objectURL
            }));
        }
    },
    harvard: {
        id: 'harvard',
        name: 'Cleveland Museum of Art',
        description: 'Open access collection.',
        category: 'art',
        icon: Palette,
        placeholder: "Search masters...",
        search: async (q) => {
            const url = `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.data || []).map(item => ({
                id: item.id,
                title: item.title,
                subtitle: item.creators?.[0]?.description,
                description: item.creation_date,
                meta: 'Art',
                link: item.url
            }));
        }
    }
};

const CATEGORIES = [
    { id: 'government', label: 'Government', icon: LandPlot },
    { id: 'finance', label: 'Finance', icon: TrendingUp },
    { id: 'culture', label: 'Culture', icon: Book },
    { id: 'entertainment', label: 'Entertainment', icon: Tv },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'science', label: 'Science', icon: Rocket },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'tech', label: 'Tech', icon: Code },
    { id: 'knowledge', label: 'Knowledge', icon: Globe },
    { id: 'art', label: 'Art', icon: Palette },
];

export const DataHub = () => {
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeProviderId, setActiveProviderId] = useState(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const activeProvider = activeProviderId ? PROVIDERS[activeProviderId] : null;

    // Filter providers by active category
    const availableProviders = activeCategory
        ? Object.values(PROVIDERS).filter(p => p.category === activeCategory)
        : [];

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim() || !activeProvider) return;

        setLoading(true);
        setHasSearched(true);
        setResults([]);
        try {
            const data = await activeProvider.search(query);
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="border-b border-border bg-card/30 pt-24 pb-12 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-xs font-medium mb-6 text-muted-foreground border border-border">
                        <Database size={12} />
                        <span>Open Research Hub</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-foreground">
                        Data Research Hub
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                        Access millions of public records across government, finance, and culture.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">

                {/* 1. Category Selection */}
                <div className="mb-12">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">1. Select a Topic</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCategory(cat.id); setActiveProviderId(null); setResults([]); setHasSearched(false); setQuery(''); }}
                                className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all ${activeCategory === cat.id
                                    ? 'bg-foreground text-background border-foreground shadow-lg scale-105'
                                    : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted'
                                    }`}
                            >
                                <cat.icon size={20} />
                                <span className="font-bold text-lg">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Provider Selection */}
                {activeCategory && (
                    <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">2. Choose a Source</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {availableProviders.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setActiveProviderId(p.id); setResults([]); setHasSearched(false); setQuery(''); }}
                                    className={`text-left p-6 rounded-xl border transition-all ${activeProviderId === p.id
                                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                                        : 'bg-card border-border hover:shadow-md hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${activeProviderId === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                            <p.icon size={20} />
                                        </div>
                                        <h4 className="font-bold text-lg">{p.name}</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{p.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Search & Results */}
                {activeProvider && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 text-center">3. Search {activeProvider.name}</h3>

                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16 flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={activeProvider.placeholder}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary shadow-sm text-lg"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" size="lg" className="h-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground">
                                {loading ? <Icon name="loader" className="animate-spin" /> : 'Search'}
                            </Button>
                        </form>

                        <div className="space-y-4 max-w-3xl mx-auto">
                            {hasSearched && results.length === 0 && !loading && (
                                <div className="text-center p-12 border border-dashed rounded-xl border-muted-foreground/30">
                                    <p className="text-muted-foreground">No results found for "{query}".</p>
                                </div>
                            )}

                            {results.map(item => (
                                <div key={item.id} className="bg-card border border-border p-6 rounded-xl hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                                                <span>{item.meta}</span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-muted-foreground">{item.subtitle}</span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                                        </div>
                                        <a href={item.link} target="_blank" rel="noreferrer" className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                                            <ExternalLink size={20} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
