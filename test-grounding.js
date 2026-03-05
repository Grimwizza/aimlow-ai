import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const body = {
    "contents": [{ "parts": [{ "text": 'Find current price and MSRP for:\nProduct: Philips HUE Bridge NAM\nModel #: 458471\nRetailer: Amazon\nKnown MSRP/MAP: $65.99\nSearch Google for: "Philips HUE Bridge NAM" 458471 site:amazon.com' }] }],
    "tools": [{ "google_search": {} }],
    "generationConfig": { "temperature": 0, "maxOutputTokens": 1024, "thinkingConfig": { "thinkingBudget": 0 } }
};

async function run() {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    const candidate = data.candidates?.[0];
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    console.log("Chunks:", JSON.stringify(chunks, null, 2));
}

run();
