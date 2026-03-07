import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const args = process.argv.slice(2);
const inputArg = args.findIndex(a => a === "--input" || a === "-i");
const outputArg = args.findIndex(a => a === "--output" || a === "-o");

if (inputArg === -1 || !args[inputArg + 1]) {
    console.error("Usage: node price-tracker-cron.js --input <file.xlsx> [--output <dir>]");
    process.exit(1);
}

const inputPath = path.resolve(args[inputArg + 1]);
const outputDir = outputArg !== -1 && args[outputArg + 1] ? path.resolve(args[outputArg + 1]) : path.dirname(inputPath);

if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const BESTBUY_API_KEY = process.env.VITE_BESTBUY_API_KEY || "";
const EBAY_CLIENT_ID = process.env.VITE_EBAY_CLIENT_ID || "";
const EBAY_CLIENT_SECRET = process.env.VITE_EBAY_CLIENT_SECRET || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

// ─── Retailer Map ─────────────────────────────────────────────────────────
const RETAILER_MAP = {
    Amazon: { domain: "amazon.com" },
    Walmart: { domain: "walmart.com" },
    Target: { domain: "target.com" },
    "Best Buy": { domain: "bestbuy.com" },
    "Home Depot": { domain: "homedepot.com" },
    "Lowe's": { domain: "lowes.com" },
    eBay: { domain: "ebay.com" },
    Newegg: { domain: "newegg.com" },
    Wayfair: { domain: "wayfair.com" },
    Overstock: { domain: "overstock.com" },
    Chewy: { domain: "chewy.com" },
    Petco: { domain: "petco.com" },
};

const SELECTED_RETAILERS = ["Amazon", "Walmart", "Target", "Best Buy", "Home Depot", "Lowe's"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseGeminiResponse(data) {
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts.find((p) => p.text && !p.thought)?.text;
    if (!text) throw new Error("No text in Gemini response");
    const clean = text.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { const m = clean.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); else throw new Error("Could not parse Gemini response"); }
    return parsed;
}

// ─── Best Buy API ─────────────────────────────────────────────────────────
async function lookupBestBuyPrice(product) {
    if (!BESTBUY_API_KEY) throw new Error("No Best Buy API key");
    const query = encodeURIComponent([product.sku, product.model, product.name].filter(Boolean).join(" ").trim());
    const fields = "sku,name,salePrice,regularPrice,onSale,url,onlineAvailability,onSaleEndDate";
    const url = `https://api.bestbuy.com/v1/products(search=${query})?apiKey=${BESTBUY_API_KEY}&show=${fields}&format=json&pageSize=3&sort=relevanceScore.dsc`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Best Buy API ${resp.status}`);
    const data = await resp.json();
    const p = data.products?.[0];
    if (!p) return { error: "Not found", productName: product.name, retailer: "Best Buy" };
    const currentPrice = p.salePrice ?? p.regularPrice ?? null;
    const msrp = p.regularPrice ?? null;
    const discountPercent = (msrp && currentPrice && msrp > currentPrice)
        ? Math.round((msrp - currentPrice) / msrp * 1000) / 10
        : (msrp && currentPrice ? 0 : null);
    return {
        productName: p.name,
        retailer: "Best Buy",
        currentPrice,
        msrp,
        discountPercent,
        resultUrl: p.url || `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`,
        inStock: p.onlineAvailability ?? null,
        notes: p.onSale ? "On sale" : "",
        _via: "bestbuy-api",
    };
}

// ─── eBay Browse API ───────────────────────────────────────────────────────
let _ebayToken = null;
async function _getEbayToken() {
    if (_ebayToken && _ebayToken.expires > Date.now()) return _ebayToken.token;
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) throw new Error("No eBay credentials");
    const creds = btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`);
    const resp = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
        method: "POST",
        headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    });
    if (!resp.ok) throw new Error(`eBay token error ${resp.status}`);
    const d = await resp.json();
    _ebayToken = { token: d.access_token, expires: Date.now() + (d.expires_in - 60) * 1000 };
    return _ebayToken.token;
}

async function lookupEbayPrice(product) {
    const token = await _getEbayToken();
    const query = encodeURIComponent([product.sku, product.model, product.name].filter(Boolean).join(" ").trim());
    const resp = await fetch(
        `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&filter=buyingOptions:{FIXED_PRICE}&sort=price&limit=5`,
        { headers: { "Authorization": `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" } }
    );
    if (!resp.ok) throw new Error(`eBay search error ${resp.status}`);
    const data = await resp.json();
    const items = data.itemSummaries || [];
    if (!items.length) return { error: "Not found", productName: product.name, retailer: "eBay" };
    const item = items[0];
    const currentPrice = parseFloat(item.price?.value ?? 0) || null;
    return {
        productName: item.title,
        retailer: "eBay",
        currentPrice,
        msrp: product.msrp ?? null,
        discountPercent: (product.msrp && currentPrice)
            ? Math.round((product.msrp - currentPrice) / product.msrp * 1000) / 10
            : null,
        resultUrl: item.itemWebUrl,
        inStock: true,
        notes: item.condition || "",
        _via: "ebay-api",
    };
}

// ─── Gemini fallback ────────────────────────────────────────────────────────
async function lookupWithGemini(product) {
    const searchUrl = !product.url ? `site:${RETAILER_MAP[product.retailer]?.domain || product.retailer}` : null;

    const userPrompt = product.url
        ? `Find current price and MSRP at this exact product page: ${product.url}\nRetailer: ${product.retailer || "detect from URL"}`
        : `Find the official Product Details Page (PDP) URL, current price, and MSRP for:\nProduct: ${product.name || "Unknown"}${product.sku ? `\nCustomer Retailer SKU: ${product.sku}` : ""}${product.model ? `\nModel # (6NC): ${product.model}` : ""}${product.upc ? `\nUPC/Barcode: ${product.upc}` : ""}\nRetailer: ${product.retailer}${product.msrp ? `\nKnown MSRP/MAP: $${product.msrp}` : ""}\nHint: You can start by searching here: ${searchUrl}`;

    const prompt = `You are a strict product price and URL extractor. Your absolute first priority is to use Google Search to find the OFFICIAL Product Details Page (PDP) URL for the exact product at ${product.retailer}.
You MUST return the specific product page URL in the \`resultUrl\` field (NOT a search results page). 
CRITICAL: ${product.retailer} often hides active prices in basic search snippets. You MUST hunt for the true active numerical price. Check Google Shopping tabs, carousel results, or competitor listings for the exact same UPC/Model to find the prevailing current price. DO NOT leave currentPrice blank unless the item simply does not exist.

Respond ONLY with valid JSON — no markdown. The JSON must exactly follow this structure:
{"resultUrl":"https://www.target.com/p/full-product-name/-/A-123456","productName":"full name","retailer":"${product.retailer}","currentPrice":99.99,"msrp":129.99,"discountPercent":23.1,"inStock":true,"notes":""}

Rules:
1. resultUrl = The exact, direct product page URL (PDP). DO NOT return a search query URL. This is critical.
2. currentPrice/msrp = numbers or null.
3. discountPercent = ((msrp-currentPrice)/msrp*100) rounded 1 decimal.
4. inStock: true/false/null. If out of stock, STILL return the price if visible.
5. If you absolutely cannot find the product page, return: {"error":"Not found","productName":"${product.name || ""}","retailer":"${product.retailer}"}

${userPrompt}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
    };
    const doFetch = () => fetch(GEMINI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let resp = await doFetch();
    if (!resp.ok) {
        if (resp.status === 429) { await sleep(15000); resp = await doFetch(); }
        if (!resp.ok) { const t = await resp.text().catch(() => ""); throw new Error(`Gemini error ${resp.status}: ${t.slice(0, 200)}`); }
    }
    const parsed = parseGeminiResponse(await resp.json());

    if (product.url) parsed.resultUrl = product.url;
    parsed._via = "gemini";
    return parsed;
}

async function lookupProductPrice(product) {
    if (product.retailer === "Best Buy" && BESTBUY_API_KEY) {
        try { return await lookupBestBuyPrice(product); } catch (e) { console.warn("[Best Buy API]", e.message); }
    }
    if (product.retailer === "eBay" && EBAY_CLIENT_ID && EBAY_CLIENT_SECRET) {
        try { return await lookupEbayPrice(product); } catch (e) { console.warn("[eBay API]", e.message); }
    }
    return lookupWithGemini(product);
}

// ─── Main Execution ─────────────────────────────────────────────────────────
async function main() {
    console.log(`Loading input from: ${inputPath}`);
    const wb = XLSX.readFile(inputPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    const get = (row, ...keys) => {
        for (const k of keys) {
            const match = Object.keys(row).find(
                (rk) => rk.toLowerCase().replace(/[\s_\-]/g, "") === k.toLowerCase().replace(/[\s_\-]/g, "")
            );
            if (match && row[match]) return row[match].toString().trim();
        }
        return "";
    };

    const parsed = rows.filter((r) => Object.values(r).some((v) => String(v).trim())).map((r, i) => {
        const brand = get(r, "brand", "manufacturer", "mfg");
        const rawName = get(r, "producttitle", "productname", "product", "name", "description", "item", "vendormaterialdescription", "materialdescription", "desc", "title");
        return {
            id: i,
            name: brand && rawName ? `${brand} ${rawName}` : rawName || brand,
            model: (() => { const m = get(r, "productid", "6nc", "model", "modelnumber", "modelno", "partnumber", "part"); return m.replace(/\.0$/, ""); })(),
            sku: get(r, "customersku#", "customersku", "sku", "retailersku", "itemno", "asin"),
            upc: get(r, "upc", "ean", "barcode", "gtin"),
            url: get(r, "url", "link", "producturl"),
            retailer: get(r, "account", "retailer", "store", "vendor"),
            msrp: parseFloat(get(r, "msrp", "map", "mapprice", "retailprice", "suggestedretailprice", "srp")) || null,
            status: "pending",
        };
    });

    const expanded = [];
    for (const job of parsed) {
        if (job.url || job.retailer) { expanded.push({ ...job, retailer: job.retailer || "detect" }); }
        else { for (const r of SELECTED_RETAILERS) expanded.push({ ...job, id: `${job.id}-${r}`, retailer: r }); }
    }

    const results = [];
    console.log(`Starting run for ${expanded.length} jobs...`);

    for (let i = 0; i < expanded.length; i++) {
        const job = expanded[i];
        console.log(`[${i + 1}/${expanded.length}] Checking ${job.name || job.model} at ${job.retailer}...`);
        try {
            const data = await lookupProductPrice(job);
            results.push({
                ...job,
                status: data.error ? "error" : "done",
                productName: data.productName || job.name,
                retailer: data.retailer || job.retailer,
                currentPrice: data.currentPrice,
                msrp: data.msrp ?? job.msrp,
                discountPercent: data.discountPercent,
                resultUrl: data.resultUrl || data.url || job.url,
                inStock: data.inStock,
                notes: data.notes || data.error || "",
                _via: data._via,
            });
        } catch (err) {
            console.error(`Error on ${job.name}: ${err.message}`);
            results.push({ ...job, status: "error", notes: err.message });
        }
        if (i < expanded.length - 1) await sleep(2000); // Rate limit protection
    }

    const outFile = path.join(outputDir, `price-tracker-results-${new Date().toISOString().slice(0, 10)}.xlsx`);
    console.log(`Writing output to: ${outFile}`);

    const outRows = results.map((r) => ({
        Status: r.status,
        Product: r.productName || r.name,
        "Model / SKU": [r.model, r.sku, r.upc].filter(Boolean).join(" · "),
        Retailer: r.retailer,
        Price: r.currentPrice ? `$${r.currentPrice.toFixed(2)}` : "—",
        MSRP: r.msrp ? `$${r.msrp.toFixed(2)}` : "—",
        "Deviation %": r.discountPercent ? `${r.discountPercent}%` : "—",
        "In Stock": r.inStock === true ? "Yes" : r.inStock === false ? "No" : "—",
        Link: r.resultUrl,
        Notes: r.notes,
    }));

    const wsOut = XLSX.utils.json_to_sheet(outRows);
    const wbOut = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbOut, wsOut, "Results");
    XLSX.writeFile(wbOut, outFile);

    console.log("Done!");
}

main().catch(console.error);
