import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY || '';
  console.log('API Key being used:', key.substring(0, 7) + '...');
  return new OpenAI({
    apiKey: key,
  });
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { type, payload } = await req.json();

    // TOOL 1: HEADLINE GENERATOR
    if (type === 'headline') {
      const { topic } = payload;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.85,
        messages: [
          { role: "system", content: "You are a viral marketing expert. Return exactly 3 distinct clickbait/viral headlines. Use these angles: 1. Negative/Warning. 2. How-To/Benefit. 3. Bizarre/Curiosity. Separate with new lines. No numbers." },
          { role: "user", content: `Topic: ${topic}` },
        ],
      });
      const headlines = completion.choices[0].message.content.split('\n').filter(line => line.trim() !== '');
      return new Response(JSON.stringify({ result: headlines }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 2: ALT-TEXT FIXER
    if (type === 'alt-text') {
      const { image } = payload;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          { role: "user", content: [{ type: "text", text: "Write a concise, descriptive SEO alt-text for this image." }, { type: "image_url", image_url: { url: image } }] },
        ],
      });
      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 3: JARGON DESTROYER
    if (type === 'jargon-destroyer') {
      const { text } = payload;
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Translate corporate jargon to plain, direct English. Remove fluff." },
          { role: "user", content: `Translate: "${text}"` },
        ],
      });
      return new Response(JSON.stringify({ result: completion.choices[0].message.content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // TOOL 4: DEEP DIVE (Structured JSON Logic)
    if (type === 'deep-dive') {
      const { brand, context, country = "Global" } = payload;

      const currentDate = new Date().toDateString();
      const systemPrompt = `You are a Senior Brand Strategist. Your goal is to provide a comprehensive, fact-based audit of the brand "${brand}" for the market: ${country}.
      Current Date for context: ${currentDate}.

      CRITICAL DATA INTEGRITY RULES:
      1. **LATEST DATA REQUIRED**: Use proven real-world data where possible. HOWEVER, if your training data lags behind the current date (${currentDate}), you MUST provide **High Confidence Estimates** or **Prospective Data** for 2024 and 2025 to ensure the report is current. Do NOT return old data (e.g. stopping at 2023). Label estimated revenues as such in the notes if needed.
      2. **PARENT COMPANY**: If the brand is a subsidiary (e.g., Old Spice -> P&G), you MAY use Parent Company financial data but MUST explicitly label it as such in the 'financial_note' field.
      3. **SOURCES**: You MUST list the sources used for financial and market data in the 'sources' array.

      RESPONSE FORMAT:
      Return a SINGLE valid JSON object. Do not include markdown formatting like \`\`\`json.
      
      JSON Schema:
      {
        "brand_name": "String",
        "ticker": "String (e.g. 'NYSE: NKE') or 'Private'",
        "parent_company": "String (or null)",
        "logo_url": "String (optional)",
        "executive_summary": ["Key Point 1", "Key Point 2", "Key Point 3"],
        "target_persona": {
          "demographics": "String",
          "psychographics": "String",
          "job_to_be_done": "String"
        },
        "marketing_4ps": {
          "product": "String (Core products & value prop)",
          "price": "String (Pricing strategy e.g. Premium, Value)",
          "place": "String (Distribution channels)",
          "promotion": "String (Marketing mix & key campaigns)"
        },
        "swot": {
          "strengths": ["Point 1", "Point 2", ...],
          "weaknesses": ["Point 1", "Point 2", ...],
          "opportunities": ["Point 1", "Point 2", ...],
          "threats": ["Point 1", "Point 2", ...]
        },
        "financials": {
          "financial_note": "String (e.g. 'Figures reflect Parent Company X')",
          "currency": "String (e.g. USD, EUR)",
          "market_cap": "String (e.g. $140B) or 'N/A'",
          "pe_ratio": "String or 'N/A'",
          "revenue_latest": "String (e.g. $12.4B Q3 2025)",
          "quarterly_revenue_data": [
            {"period": "Q1 2025", "revenue": 12.8, "unit": "B", "growth_yoy": 1.1},
            {"period": "Q4 2024", "revenue": 13.2, "unit": "B", "growth_yoy": -2.3}
            // Include last 4-6 quarters. You MUST include 2024/2025 data (Est/Projected is acceptable if actuals missing).
          ]
        },
        "competitors": [
           {"name": "Competitor 1", "differentiator": "Analysis..."},
           {"name": "Competitor 2", "differentiator": "Analysis..."}
        ],
        "recommendations": ["Strategy 1", "Strategy 2", "Strategy 3"],
        "sources": ["Source 1 (e.g. SEC Filings)", "Source 2 (e.g. Investor Relations)"]
      }`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze Brand: "${brand}". ${context ? `Context: Compare against ${context}.` : ''}` }
      ];

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" }, // Enforce JSON mode
        temperature: 0.7,
      });

      return new Response(JSON.stringify({ result: JSON.parse(completion.choices[0].message.content) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }





    // TOOL 5: FIND ME - Digital Footprint Analysis (Real Search)
    if (type === 'find-me') {
      const { name, location, profession, ageRange } = payload;

      // Perform multiple targeted web searches
      const searches = [];

      // General web search
      const generalQuery = `"${name}"${location ? ` ${location}` : ''}`;
      searches.push({ type: 'general', query: generalQuery });

      // News search
      const newsQuery = `"${name}"${location ? ` ${location}` : ''} news OR article`;
      searches.push({ type: 'news', query: newsQuery });

      // Social media search
      const socialQuery = `"${name}" (LinkedIn OR Twitter OR Facebook OR Instagram)${location ? ` ${location}` : ''}`;
      searches.push({ type: 'social', query: socialQuery });

      // Professional search
      if (profession) {
        const professionalQuery = `"${name}" ${profession} (profile OR portfolio OR GitHub)`;
        searches.push({ type: 'professional', query: professionalQuery });
      }

      // Execute searches using Brave Search API (free tier available)
      // Note: You'll need to add BRAVE_SEARCH_API_KEY to your .env file
      const searchResults = [];
      const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;

      console.log('[Find Me] Brave API Key available:', !!braveApiKey);
      console.log('[Find Me] Brave API Key prefix:', braveApiKey ? braveApiKey.substring(0, 10) + '...' : 'MISSING');

      // Helper function to add delay between requests (rate limiting)
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < searches.length; i++) {
        const search = searches[i];

        // Add delay between requests (Brave Free tier: 1 query/second)
        if (i > 0) {
          console.log(`[Find Me] Rate limiting: waiting 1.1s before next request...`);
          await sleep(1100); // 1.1 seconds to be safe
        }

        try {
          console.log(`[Find Me] Executing ${search.type} search:`, search.query);
          const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(search.query)}&count=5`, {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': braveApiKey || ''
            }
          });

          console.log(`[Find Me] ${search.type} response status:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(`[Find Me] ${search.type} results count:`, data.web?.results?.length || 0);
            searchResults.push({
              type: search.type,
              query: search.query,
              results: data.web?.results || []
            });
          } else {
            const errorText = await response.text();
            console.error(`[Find Me] ${search.type} API error (${response.status}):`, errorText);
          }
        } catch (error) {
          console.error(`[Find Me] Search failed for ${search.type}:`, error);
          // Continue with other searches even if one fails
        }
      }

      console.log(`[Find Me] Total search results collected:`, searchResults.length);
      console.log(`[Find Me] Results summary:`, searchResults.map(sr => `${sr.type}: ${sr.results.length} results`));

      // Format search results for AI analysis
      const searchContext = `
Person Information:
- Name: ${name}
${location ? `- Location: ${location}` : ''}
${profession ? `- Profession: ${profession}` : ''}
${ageRange ? `- Age Range: ${ageRange}` : ''}

Search Results:

${searchResults.map(sr => `
${sr.type.toUpperCase()} SEARCH (Query: "${sr.query}"):
${sr.results.length > 0 ? sr.results.map((r, i) => `
${i + 1}. ${r.title}
   URL: ${r.url}
   Description: ${r.description || 'No description'}
`).join('\n') : 'No results found'}
`).join('\n')}
      `.trim();

      const systemPrompt = `You are a privacy and digital security expert. Analyze the REAL search results provided and generate a comprehensive digital footprint report.

CRITICAL INSTRUCTIONS:
1. Base your analysis ONLY on the actual search results provided
2. Include REAL URLs from the search results in your findings
3. Extract social media handles/usernames from URLs and titles (e.g., linkedin.com/in/johndoe → handle: "johndoe", twitter.com/jsmith → handle: "@jsmith")
4. For social media, check all major platforms: LinkedIn, Twitter/X, Facebook, Instagram, Threads, YouTube, TikTok, GitHub
5. If search results are limited or empty, acknowledge this honestly
6. Provide specific, actionable privacy recommendations based on what was actually found
7. Do NOT make up information that isn't in the search results

Return a SINGLE valid JSON object (no markdown formatting):

{
  "person_name": "String",
  "search_parameters": {
    "location": "String or null",
    "profession": "String or null",
    "age_range": "String or null"
  },
  "executive_summary": [
    "Key finding 1 based on actual search results",
    "Key finding 2 about what was/wasn't found",
    "Key finding 3 about privacy implications"
  ],
  "web_presence": {
    "overall_visibility": "High/Medium/Low (based on number and type of results)",
    "description": "Summary based on actual findings",
    "key_findings": ["Actual finding 1 with specifics", "Actual finding 2", "Actual finding 3"],
    "sources": [{"title": "Source title", "url": "actual URL from results"}]
  },
  "news_media": {
    "mentions_found": "Actual number or 'None'",
    "description": "Summary of actual news results",
    "notable_mentions": [
      {"source": "Actual publication name", "context": "Actual context from result", "url": "actual URL"}
    ]
  },
  "social_media": {
    "platforms_detected": ["Only platforms actually found in results"],
    "description": "Summary of actual social media findings",
    "profiles": [
      {
        "platform": "Platform name (LinkedIn, Twitter/X, Facebook, Instagram, Threads, YouTube, TikTok, etc.)",
        "handle": "Username/handle (e.g., @username)",
        "username": "Display name or account name",
        "visibility": "Public/Limited based on result",
        "details": "Actual details from search",
        "url": "actual URL to profile"
      }
    ]
  },
  "professional_listings": {
    "found": true/false (based on actual results),
    "description": "Summary of actual professional presence",
    "listings": [
      {"source": "Actual source name", "details": "Actual details from result", "url": "actual URL"}
    ]
  },
  "privacy_assessment": {
    "risk_level": "High/Medium/Low (based on actual exposure)",
    "risk_score": 1-10 (based on amount and sensitivity of actual findings),
    "vulnerabilities": [
      "Specific vulnerability based on actual findings",
      "Another actual concern"
    ],
    "positive_factors": [
      "Actual positive privacy practice observed",
      "Another positive factor"
    ]
  },
  "recommendations": [
    {
      "priority": "High/Medium/Low",
      "action": "Specific action based on actual findings",
      "reason": "Why this matters based on what was found",
      "how_to": "Step-by-step guidance"
    }
  ],
  "data_removal_resources": [
    {
      "service": "DeleteMe OR Privacy Bee OR similar",
      "purpose": "Remove personal info from data brokers",
      "url": "joindeleteme.com"
    },
    {
      "service": "Google Removal Request",
      "purpose": "Request removal of personal info from Google",
      "url": "support.google.com/websearch/answer/9673730"
    }
  ]
}

IMPORTANT: If search results are minimal or empty, be honest about limited findings and focus recommendations on general privacy best practices.`;

      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: searchContext }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more factual analysis
      });

      return new Response(JSON.stringify({ result: JSON.parse(completion.choices[0].message.content) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid tool type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("GENERATE API ERROR DETAILED:", error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    }
    return new Response(JSON.stringify({ error: error.message || 'AI generation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}