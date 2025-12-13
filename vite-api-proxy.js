import handler from './api/generate.js';

export const apiMiddleware = () => ({
    name: 'api-middleware',
    configureServer(server) {
        server.middlewares.use('/api/generate', async (req, res, next) => {
            if (req.method !== 'POST') return next();

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
                const webRes = await handler(webReq);
                const resData = await webRes.json();

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = webRes.status || 200;
                res.end(JSON.stringify(resData));
            } catch (err) {
                console.error('Middleware Error:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    }
});
