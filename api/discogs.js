// Discogs API Proxy — Vercel Serverless Function
// Keeps your Personal Access Token secret on the server side.
// Usage:
//   GET /api/discogs?action=collection&page=1&per_page=50
//   GET /api/discogs?action=release&id=12345

const DISCOGS_BASE = 'https://api.discogs.com';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.DISCOGS_TOKEN;
    const username = process.env.DISCOGS_USERNAME;

    if (!token || !username) {
        return res.status(500).json({
            error: 'Discogs credentials not configured. Set DISCOGS_TOKEN and DISCOGS_USERNAME in .env'
        });
    }

    // Parse query params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action') || req.query?.action;
    const page = url.searchParams.get('page') || req.query?.page || '1';
    const perPage = url.searchParams.get('per_page') || req.query?.per_page || '100';
    const releaseId = url.searchParams.get('id') || req.query?.id;
    const sort = url.searchParams.get('sort') || req.query?.sort || 'artist';
    const sortOrder = url.searchParams.get('sort_order') || req.query?.sort_order || 'asc';

    const headers = {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'NowSpinning/1.0 +https://aimlow.ai',
        'Accept': 'application/json',
    };

    try {
        let apiUrl;

        switch (action) {
            case 'collection':
                apiUrl = `${DISCOGS_BASE}/users/${username}/collection/folders/0/releases?page=${page}&per_page=${perPage}&sort=${sort}&sort_order=${sortOrder}`;
                break;

            case 'release':
                if (!releaseId) {
                    return res.status(400).json({ error: 'Missing release id parameter' });
                }
                apiUrl = `${DISCOGS_BASE}/releases/${releaseId}`;
                break;

            case 'profile':
                apiUrl = `${DISCOGS_BASE}/users/${username}`;
                break;

            case 'artist':
                if (!releaseId) {
                    return res.status(400).json({ error: 'Missing artist id parameter' });
                }
                apiUrl = `${DISCOGS_BASE}/artists/${releaseId}`;
                break;

            default:
                return res.status(400).json({
                    error: 'Invalid action. Use: collection, release, artist, or profile'
                });
        }

        console.log(`[Discogs API] Fetching: ${apiUrl}`);

        // For artist endpoint, use token as query param (Discogs requires this for some public endpoints)
        const fetchHeaders = action === 'artist'
            ? { 'User-Agent': headers['User-Agent'], 'Accept': 'application/json' }
            : headers;
        const fetchUrl = action === 'artist'
            ? `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}token=${token}`
            : apiUrl;

        const response = await fetch(fetchUrl, { headers: fetchHeaders });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Discogs API] Error ${response.status}: ${errorText}`);
            return res.status(response.status).json({
                error: `Discogs API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();

        // Cache collection responses for 5 minutes
        if (action === 'collection') {
            res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        }

        return res.status(200).json(data);

    } catch (err) {
        console.error('[Discogs API] Fetch failed:', err);
        return res.status(500).json({ error: 'Failed to fetch from Discogs', details: err.message });
    }
}
