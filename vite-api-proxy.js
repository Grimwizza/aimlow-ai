
import generateHandler from './api/generate.js';
import newsHandler from './api/news.js';
import updatesHandler from './api/updates.js';
import toolsHandler from './api/tools.js';

// Helper to mock Vercel/Express 'res' object for Serverless Functions
const mockResponse = (resolve, res) => {
    const mock = {
        statusCode: 200,
        headers: {},
        status: (code) => {
            mock.statusCode = code;
            return mock;
        },
        setHeader: (key, value) => {
            mock.headers[key] = value;
            return mock;
        },
        json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            Object.entries(mock.headers).forEach(([k, v]) => res.setHeader(k, v));
            res.statusCode = mock.statusCode;
            res.end(JSON.stringify(data));
            resolve();
            return mock;
        },
        send: (data) => {
            res.statusCode = mock.statusCode;
            res.end(data);
            resolve();
            return mock;
        }
    };
    return mock;
};

import fs from 'fs';
import path from 'path';

// ... imports ...

export const apiMiddleware = () => ({
    name: 'api-middleware',
    configureServer(server) {
        server.middlewares.use('/api', async (req, res, next) => {
            const url = req.url.split('?')[0];

            // FORCE LOAD ENV
            try {
                const envPath = path.resolve(process.cwd(), '.env');
                if (fs.existsSync(envPath)) {
                    const envConfig = fs.readFileSync(envPath, 'utf8');
                    const keyMatch = envConfig.match(/^OPENAI_API_KEY=(.*)$/m);
                    if (keyMatch && keyMatch[1]) {
                        process.env.OPENAI_API_KEY = keyMatch[1].trim();
                        console.log('[API Proxy] Reloaded API Key from .env');
                    }
                }
            } catch (e) {
                console.error('[API Proxy] Failed to reload .env', e);
            }

            // ... route handling ...

            // --- ROUTE: /api/generate (Edge Runtime / Web Standard) ---
            if (url === '/generate' && req.method === 'POST') {
                const buffers = [];
                for await (const chunk of req) {
                    buffers.push(chunk);
                }
                const data = Buffer.concat(buffers).toString();

                const webReq = {
                    method: req.method,
                    json: async () => JSON.parse(data || '{}'),
                };

                try {
                    const webRes = await generateHandler(webReq);
                    const resData = await webRes.json();

                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = webRes.status || 200;
                    res.end(JSON.stringify(resData));
                } catch (err) {
                    console.error('API Error (Generate):', err);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err.message }));
                }
                return;
            }

            // --- ROUTE: /api/news, /api/updates, /api/tools (Serverless / Express Style) ---
            let handler = null;
            if (url === '/news') handler = newsHandler;
            if (url === '/updates') handler = updatesHandler;
            if (url === '/tools') handler = toolsHandler;

            if (handler) {
                try {
                    await new Promise(async (resolve, reject) => {
                        const mockedRes = mockResponse(resolve, res);
                        req.query = {};
                        try {
                            // CRITICAL: Await the handler since it's async
                            await handler(req, mockedRes);
                        } catch (handlerErr) {
                            reject(handlerErr);
                        }
                    });
                } catch (err) {
                    console.error(`API Error (${url}):`, err);
                    if (!res.writableEnded) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    }
                }
                return;
            }

            next();
        });
    }
});

