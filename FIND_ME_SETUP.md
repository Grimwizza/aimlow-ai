# Find Me Tool - Quick Setup Guide

## Issue: No Search Results

If you're not seeing search results (like LinkedIn, Facebook, YouTube profiles), it's because the **Brave Search API key** is not configured.

## Quick Fix (5 minutes)

### Step 1: Get Free Brave Search API Key

1. Visit: **https://brave.com/search/api/**
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Go to your dashboard
5. Copy your API key

### Step 2: Add to .env File

Open your `.env` file and add this line:

```
BRAVE_SEARCH_API_KEY=your_actual_api_key_here
```

**Example**:
```
OPENAI_API_KEY=sk-proj-...
BRAVE_SEARCH_API_KEY=BSA1234567890abcdef...
```

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Again

Search for "Ben Luebbert" again - you should now see:
- LinkedIn profile
- Facebook account
- YouTube channel
- Other social media accounts
- Real web search results

## Free Tier Limits

- **2,000 queries per month** (free)
- Each Find Me analysis uses 3-4 queries
- = ~500-600 searches per month

## Without API Key

If you don't add the key:
- Tool will still work
- But will return limited/generic results
- AI will provide general privacy recommendations
- No real search data will be shown

---

**Need help?** The API key setup takes less than 5 minutes and is completely free!
