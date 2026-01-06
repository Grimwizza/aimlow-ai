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





    // TOOL 5A: FIND ME - DISAMBIGUATION (Quick Profile Search)
    if (type === 'find-me-disambiguate') {
      const { name, location, profession } = payload;

      // Get API keys
      const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
      const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const googleCseId = process.env.GOOGLE_CSE_ID;

      if (!braveApiKey && !googleApiKey) {
        return new Response(JSON.stringify({ error: 'No search API configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Helper function for Brave Search
      const searchBrave = async (query) => {
        if (!braveApiKey) return [];
        console.log('[Disambiguation] Brave search:', query);
        try {
          const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=15`, {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': braveApiKey
            }
          });
          if (!response.ok) {
            console.error('[Disambiguation] Brave error:', await response.text());
            return [];
          }
          const data = await response.json();
          return (data.web?.results || []).map(r => ({ ...r, source: 'brave' }));
        } catch (error) {
          console.error('[Disambiguation] Brave error:', error.message);
          return [];
        }
      };

      // Helper function for Google Custom Search
      const searchGoogle = async (query) => {
        if (!googleApiKey || !googleCseId) return [];
        console.log('[Disambiguation] Google search:', query);
        try {
          const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=10`;
          const response = await fetch(url);
          if (!response.ok) {
            console.error('[Disambiguation] Google error:', await response.text());
            return [];
          }
          const data = await response.json();
          // Transform Google results to match Brave format
          return (data.items || []).map(item => ({
            title: item.title,
            url: item.link,
            description: item.snippet,
            source: 'google'
          }));
        } catch (error) {
          console.error('[Disambiguation] Google error:', error.message);
          return [];
        }
      };

      // Rate limit helper
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      try {
        let allResults = [];

        // Strategy 1: LinkedIn search - Use GOOGLE first (better LinkedIn indexing), fallback to Brave
        const linkedinQuery = `"${name}" site:linkedin.com`;
        console.log('[Disambiguation] Strategy 1 - LinkedIn search');

        // Try Google first for LinkedIn (better indexing)
        const googleLinkedinResults = await searchGoogle(linkedinQuery);
        allResults = [...allResults, ...googleLinkedinResults];

        // Also try Brave for LinkedIn
        if (googleLinkedinResults.length < 3) {
          await sleep(1200);
          const braveLinkedinResults = await searchBrave(linkedinQuery);
          allResults = [...allResults, ...braveLinkedinResults];
        }

        // Strategy 2: Social media search (Brave is good for this)
        console.log('[Disambiguation] Strategy 2 - Social media search');
        await sleep(1200);
        const socialQuery = `"${name}" (site:facebook.com OR site:twitter.com OR site:youtube.com OR site:instagram.com)`;
        const socialResults = await searchBrave(socialQuery);
        allResults = [...allResults, ...socialResults];

        // Strategy 3: General professional search with Google
        console.log('[Disambiguation] Strategy 3 - General professional search');
        let professionalQuery = `"${name}"`;
        if (profession) professionalQuery += ` ${profession}`;
        if (location) professionalQuery += ` ${location.split(',')[0]}`;
        const googleProfessionalResults = await searchGoogle(professionalQuery);
        allResults = [...allResults, ...googleProfessionalResults];

        console.log('[Disambiguation] Total results collected:', allResults.length);

        // Deduplicate by URL
        const uniqueResults = [];
        const seenUrls = new Set();
        for (const r of allResults) {
          const normalizedUrl = r.url?.toLowerCase().replace(/\/$/, '');
          if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
            seenUrls.add(normalizedUrl);
            uniqueResults.push(r);
          }
        }
        let results = uniqueResults.slice(0, 20); // Cap at 20

        console.log('[Disambiguation] Unique results:', results.length);

        if (results.length === 0) {
          console.log('[Disambiguation] No results found at all');
          return new Response(JSON.stringify({ result: { candidates: [] } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Ask AI to extract candidate profiles from search results
        const systemPrompt = `You are a data extraction expert. Analyze the search results and extract distinct candidate profiles.

CRITICAL INSTRUCTIONS:
1. Extract ONLY distinct individuals (avoid duplicates)
2. Prioritize LinkedIn and professional profiles
3. Extract key identifying information EXACTLY as it appears in the search results
4. Return 3-8 most relevant candidates
5. **NEVER FABRICATE OR MAKE UP DATA** - If a field cannot be determined from the actual search results, use null
6. **DO NOT USE PLACEHOLDER DATA** - No "XYZ Corporation", "ABC Company", generic titles, or similar fake data
7. Only extract information that is explicitly stated in the search result titles, URLs, or descriptions
8. If you cannot find enough real information to create a useful candidate profile, DO NOT include that candidate

VALIDATION RULES:
- Company names must be real companies extracted from the search results
- Job titles must be actual titles mentioned in the results
- Locations must be specific cities/states mentioned in the results
- If a LinkedIn URL is present, extract the username from the URL path
- Profile URLs must be actual URLs from the search results

Return a SINGLE valid JSON object (no markdown):

{
  "candidates": [
    {
      "name": "Full name EXACTLY as shown in result",
      "title": "Actual job title from result or null",
      "company": "Real company name from result or null",
      "location": "Actual location from result or null",
      "profile_url": "Actual URL from search result or null",
      "source": "Platform name (LinkedIn, etc.) or null",
      "snippet": "Brief relevant context QUOTED from search result or null"
    }
  ]
}

EXAMPLE OF CORRECT EXTRACTION:
Search Result: "Ben Luebbert - Software Engineer at Google | LinkedIn"
URL: linkedin.com/in/benluebbert
Description: "Ben Luebbert is a Software Engineer at Google based in Mountain View, California..."

Correct Output:
{
  "name": "Ben Luebbert",
  "title": "Software Engineer",
  "company": "Google",
  "location": "Mountain View, California",
  "profile_url": "linkedin.com/in/benluebbert",
  "source": "LinkedIn",
  "snippet": "Software Engineer at Google based in Mountain View, California"
}

EXAMPLE OF INCORRECT (FABRICATED) OUTPUT - DO NOT DO THIS:
{
  "name": "Ben Luebbert",
  "title": "Marketing Manager",  // ❌ NOT in search results
  "company": "XYZ Corporation",  // ❌ Placeholder/fake company
  "location": "Minneapolis, Minnesota",  // ❌ NOT in search results
  ...
}`;

        const searchContext = `
Search Query: "${name}"

Search Results:
${results.slice(0, 10).map((r, i) => `
${i + 1}. ${r.title}
   URL: ${r.url}
   Description: ${r.description || 'No description'}
`).join('\n')}
        `.trim();

        console.log('[Disambiguation] Search context being sent to AI:');
        console.log(searchContext);
        console.log('[Disambiguation] Number of results:', results.length);

        const completion = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: searchContext }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const candidatesData = JSON.parse(completion.choices[0].message.content);

        return new Response(JSON.stringify({ result: candidatesData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('[Disambiguation] Error:', error);
        return new Response(JSON.stringify({ error: 'Disambiguation failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // TOOL 5B: FIND ME - Digital Footprint Analysis (Real Search)
    if (type === 'find-me') {
      const { name, email, location, profession, ageRange, selectedProfile } = payload;

      // Use selected profile info if available, otherwise use form data
      const searchName = selectedProfile?.name || name;
      const searchLocation = selectedProfile?.location || location;
      const searchCompany = selectedProfile?.company;
      const searchTitle = selectedProfile?.title;

      // Check for data breaches if email provided using XposedOrNot (free API)
      let breachData = null;
      let breachSummary = null;
      if (email) {
        try {
          console.log('[Find Me] Checking XposedOrNot for email breaches...');

          // Step 1: Check if email is in any breaches
          const xonResponse = await fetch(
            `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'AimLow-FindMe-Privacy-Tool'
              }
            }
          );

          if (xonResponse.ok) {
            const xonData = await xonResponse.json();

            // The API returns { breaches: [["BreachName1", "BreachName2", ...]] }
            const breachNamesList = xonData.breaches?.[0] || xonData.breaches || [];
            const breachNames = Array.isArray(breachNamesList) ? breachNamesList.flat() : [];

            console.log(`[Find Me] Email found in ${breachNames.length} breaches:`, breachNames.slice(0, 5).join(', '));

            if (breachNames.length > 0) {
              // Step 2: Fetch detailed breach information from the breaches database
              console.log('[Find Me] Fetching detailed breach information...');
              const breachDetailsResponse = await fetch(
                'https://api.xposedornot.com/v1/breaches',
                {
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'AimLow-FindMe-Privacy-Tool'
                  }
                }
              );

              let breachDatabase = [];
              if (breachDetailsResponse.ok) {
                const breachDbData = await breachDetailsResponse.json();
                breachDatabase = breachDbData.exposedBreaches || [];
                console.log(`[Find Me] Loaded ${breachDatabase.length} breaches from database`);
              }

              // Match the user's breaches with detailed info
              breachData = breachNames.map(breachName => {
                // Find matching breach in database (case-insensitive)
                const detailedBreach = breachDatabase.find(
                  b => b.breachID?.toLowerCase() === breachName.toLowerCase()
                );

                if (detailedBreach) {
                  return {
                    Name: detailedBreach.breachID || breachName,
                    BreachDate: detailedBreach.breachedDate ? new Date(detailedBreach.breachedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown',
                    DataClasses: detailedBreach.exposedData || ['Unknown'],
                    Domain: detailedBreach.domain || '',
                    Description: detailedBreach.exposureDescription || '',
                    Industry: detailedBreach.industry || 'Unknown',
                    ExposedRecords: detailedBreach.exposedRecords || 0,
                    PasswordRisk: detailedBreach.passwordRisk || 'unknown',
                    Logo: detailedBreach.logo || ''
                  };
                }

                // Fallback for breaches not in the database
                return {
                  Name: breachName,
                  BreachDate: 'Unknown',
                  DataClasses: ['Unknown'],
                  Domain: '',
                  Description: '',
                  Industry: 'Unknown',
                  ExposedRecords: 0,
                  PasswordRisk: 'unknown',
                  Logo: ''
                };
              });

              // Calculate severity score for each breach and sort
              breachData = breachData.map(b => {
                let severityScore = 0;

                // Password risk is highest priority
                if (b.PasswordRisk === 'plaintext') severityScore += 50;
                else if (b.PasswordRisk === 'easytocrack') severityScore += 30;
                else if (b.PasswordRisk === 'hardtocrack') severityScore += 10;

                // Check for sensitive data types
                const dataClasses = b.DataClasses?.map(d => d.toLowerCase()) || [];
                if (dataClasses.some(d => d.includes('password'))) severityScore += 20;
                if (dataClasses.some(d => d.includes('credit') || d.includes('card') || d.includes('payment'))) severityScore += 25;
                if (dataClasses.some(d => d.includes('ssn') || d.includes('social security'))) severityScore += 30;
                if (dataClasses.some(d => d.includes('phone') || d.includes('address') || d.includes('date of birth'))) severityScore += 10;
                if (dataClasses.some(d => d.includes('email'))) severityScore += 5;

                // Records affected adds to severity (logarithmic scale)
                if (b.ExposedRecords > 0) {
                  severityScore += Math.min(10, Math.log10(b.ExposedRecords));
                }

                // More data types = more severe
                severityScore += Math.min(5, dataClasses.length);

                return { ...b, SeverityScore: severityScore };
              });

              // Sort by severity score descending
              breachData.sort((a, b) => b.SeverityScore - a.SeverityScore);

              console.log(`[Find Me] Top 5 most severe breaches:`, breachData.slice(0, 5).map(b => `${b.Name} (score: ${b.SeverityScore})`));

              // Create breach summary stats
              const totalRecords = breachData.reduce((sum, b) => sum + (b.ExposedRecords || 0), 0);
              const industries = [...new Set(breachData.map(b => b.Industry).filter(i => i && i !== 'Unknown'))];
              const passwordsExposed = breachData.some(b =>
                b.DataClasses?.some(d => d.toLowerCase().includes('password'))
              );

              breachSummary = {
                totalBreaches: breachData.length,
                totalRecordsExposed: totalRecords,
                industriesAffected: industries,
                passwordsExposed: passwordsExposed,
                highRiskBreaches: breachData.filter(b => b.PasswordRisk === 'plaintext' || b.PasswordRisk === 'easytocrack').length
              };

              console.log(`[Find Me] Matched ${breachData.filter(b => b.Description).length}/${breachData.length} breaches with detailed info`);
              console.log('[Find Me] Breach summary:', breachSummary);
            } else {
              console.log('[Find Me] No breaches found for this email');
              breachData = [];
            }
          } else if (xonResponse.status === 404) {
            console.log('[Find Me] No breaches found for email (404)');
            breachData = [];
          } else {
            console.error('[Find Me] XposedOrNot error:', xonResponse.status);
            breachData = null;
          }
        } catch (error) {
          console.error('[Find Me] XposedOrNot check failed:', error.message);
          breachData = null;
        }
      }

      // Perform multiple targeted web searches
      const searches = [];

      // General web search - more specific, exclude social aggregators
      let generalQuery = `"${searchName}"`;
      if (searchLocation) generalQuery += ` "${searchLocation}"`;
      if (profession || searchTitle) generalQuery += ` "${searchTitle || profession}"`;
      generalQuery += ` -site:facebook.com -site:twitter.com`; // Exclude social on general search
      searches.push({ type: 'general', query: generalQuery });

      // LinkedIn-specific search (most reliable for professional info)
      let linkedinQuery = `site:linkedin.com/in "${searchName}"`;
      if (searchLocation) linkedinQuery += ` "${searchLocation}"`;
      if (searchCompany) linkedinQuery += ` "${searchCompany}"`;
      searches.push({ type: 'linkedin', query: linkedinQuery });

      // News search
      let newsQuery = `"${searchName}"`;
      if (searchLocation) newsQuery += ` "${searchLocation}"`;
      newsQuery += ` (news OR article OR press)`;
      searches.push({ type: 'news', query: newsQuery });

      // Social media search - targeted platforms
      let socialQuery = `"${searchName}" (site:twitter.com OR site:instagram.com OR site:facebook.com)`;
      if (searchLocation) socialQuery += ` "${searchLocation}"`;
      searches.push({ type: 'social', query: socialQuery });

      // Professional search
      if (profession || searchTitle) {
        let professionalQuery = `"${searchName}" "${searchTitle || profession}" (portfolio OR GitHub OR profile)`;
        if (searchCompany) professionalQuery += ` "${searchCompany}"`;
        searches.push({ type: 'professional', query: professionalQuery });
      }

      // Execute searches using both Brave and Google APIs
      const searchResults = [];
      const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
      const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const googleCseId = process.env.GOOGLE_CSE_ID;

      console.log('[Find Me] Brave API Key available:', !!braveApiKey);
      console.log('[Find Me] Google API Key available:', !!googleApiKey);

      // Helper function to add delay between requests (rate limiting)
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Helper for Brave search
      const searchWithBrave = async (query, count = 5) => {
        if (!braveApiKey) return [];
        try {
          const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`, {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': braveApiKey
            }
          });
          if (response.ok) {
            const data = await response.json();
            return (data.web?.results || []).map(r => ({ ...r, searchSource: 'brave' }));
          }
          console.error('[Find Me] Brave error:', await response.text());
          return [];
        } catch (error) {
          console.error('[Find Me] Brave error:', error.message);
          return [];
        }
      };

      // Helper for Google search
      const searchWithGoogle = async (query, count = 5) => {
        if (!googleApiKey || !googleCseId) return [];
        try {
          const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&num=${count}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            return (data.items || []).map(item => ({
              title: item.title,
              url: item.link,
              description: item.snippet,
              searchSource: 'google'
            }));
          }
          console.error('[Find Me] Google error:', await response.text());
          return [];
        } catch (error) {
          console.error('[Find Me] Google error:', error.message);
          return [];
        }
      };

      for (let i = 0; i < searches.length; i++) {
        const search = searches[i];

        // Add delay between requests
        if (i > 0) {
          console.log(`[Find Me] Rate limiting: waiting 1.1s before next request...`);
          await sleep(1100);
        }

        console.log(`[Find Me] Executing ${search.type} search:`, search.query);

        let results = [];

        // Use Google for LinkedIn searches (better indexing)
        if (search.type === 'linkedin' || search.type === 'professional') {
          results = await searchWithGoogle(search.query, 5);
          // Also add Brave results for coverage
          if (results.length < 3) {
            await sleep(1100);
            const braveResults = await searchWithBrave(search.query, 5);
            results = [...results, ...braveResults];
          }
        } else {
          // Use Brave for general, news, social searches
          results = await searchWithBrave(search.query, 5);
        }

        console.log(`[Find Me] ${search.type} results count:`, results.length);

        if (results.length > 0) {
          searchResults.push({
            type: search.type,
            query: search.query,
            results: results
          });
        }
      }

      console.log(`[Find Me] Total search results collected:`, searchResults.length);
      console.log(`[Find Me] Results summary:`, searchResults.map(sr => `${sr.type}: ${sr.results.length} results`));

      // Format breach data for context (include detailed info for AI analysis)
      const breachContext = breachData !== null ? `
DATA BREACH CHECK:
${email ? `Email checked: ${email}` : 'No email provided'}
${breachData && breachData.length > 0 ? `
⚠️ FOUND IN ${breachData.length} DATA BREACH(ES):
${breachSummary ? `
BREACH SUMMARY:
- Total breaches: ${breachSummary.totalBreaches}
- Total records exposed across all breaches: ${breachSummary.totalRecordsExposed.toLocaleString()}
- Industries affected: ${breachSummary.industriesAffected.join(', ') || 'Various'}
- Passwords potentially exposed: ${breachSummary.passwordsExposed ? 'YES - HIGH RISK' : 'No'}
- High-risk breaches (plaintext/easy passwords): ${breachSummary.highRiskBreaches}
` : ''}
DETAILED BREACHES:
${breachData.slice(0, 15).map(b => `
- ${b.Name}:
  Date: ${b.BreachDate}
  Domain: ${b.Domain || 'Unknown'}
  Industry: ${b.Industry || 'Unknown'}
  Data Exposed: ${b.DataClasses?.join(', ') || 'Unknown'}
  Records Affected: ${b.ExposedRecords ? b.ExposedRecords.toLocaleString() : 'Unknown'}
  Password Risk: ${b.PasswordRisk || 'Unknown'}
  ${b.Description ? `Description: ${b.Description.substring(0, 200)}...` : ''}
`).join('\n')}
${breachData.length > 15 ? `\n... and ${breachData.length - 15} more breaches` : ''}
` : breachData !== null ? '✓ No breaches found for this email' : ''}
` : '';

      // Format search results for AI analysis
      const searchContext = `
Person Information:
- Name: ${name}
${email ? `- Email: ${email}` : ''}
${location ? `- Location: ${location}` : ''}
${profession ? `- Profession: ${profession}` : ''}
${ageRange ? `- Age Range: ${ageRange}` : ''}

${breachContext}

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
8. FILTER OUT false positives: exclude results that clearly don't match (wrong location, different profession, obituaries of different people, historical figures)
9. PRIORITIZE high-confidence matches: results from LinkedIn, professional profiles, or sources that include multiple matching details
10. If multiple people with the same name appear, focus on the one that best matches the provided details

CONFIDENCE SCORING:
- High confidence: Multiple matching details (name + location + profession/company)
- Medium confidence: Name + one other matching detail
- Low confidence: Name only, or conflicting details
- Only include results with medium or high confidence

Return a SINGLE valid JSON object (no markdown formatting):

{
  "person_name": "String",
  "search_parameters": {
    "location": "String or null",
    "profession": "String or null",
    "age_range": "String or null"
  },
  "match_quality": "High/Medium/Low - overall confidence that results match the intended person",
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
    "risk_score": 5,
    "vulnerabilities": [
      "Specific vulnerability based on actual findings",
      "Another actual concern"
    ],
    "positive_factors": [
      "Actual positive privacy practice observed",
      "Another positive factor"
    ]
  },
  "data_breaches": {
    "checked": "true or false",
    "email_checked": "email if provided or null",
    "breach_count": 0,
    "breaches": [
      {
        "name": "Breach name from XposedOrNot data",
        "date": "Breach date",
        "data_exposed": ["Types of data exposed"],
        "severity": "High/Medium/Low based on data types"
      }
    ],
    "summary": "Brief summary of breach exposure and recommended actions"
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

      // Parse AI result and merge with raw breach data for accurate display
      const aiResult = JSON.parse(completion.choices[0].message.content);

      // Override AI's breach data with actual API data for accuracy
      if (breachData !== null) {
        aiResult.data_breaches = {
          checked: true,
          email_checked: email,
          breach_count: breachData.length,
          breaches: breachData.map(b => ({
            name: b.Name,
            date: b.BreachDate,
            domain: b.Domain,
            industry: b.Industry,
            data_exposed: b.DataClasses,
            records_affected: b.ExposedRecords,
            password_risk: b.PasswordRisk,
            logo: b.Logo,
            description: b.Description,
            severity_score: b.SeverityScore || 0
          })),
          summary: breachSummary ? `Your email was found in ${breachSummary.totalBreaches} data breaches, affecting ${breachSummary.totalRecordsExposed.toLocaleString()} total records across industries including ${breachSummary.industriesAffected.slice(0, 3).join(', ')}. ${breachSummary.passwordsExposed ? 'CRITICAL: Passwords were exposed in some breaches - change these passwords immediately!' : ''}` : aiResult.data_breaches?.summary || ''
        };
      } else if (email) {
        aiResult.data_breaches = {
          checked: true,
          email_checked: email,
          breach_count: 0,
          breaches: [],
          summary: 'No breaches found for this email address.'
        };
      }

      return new Response(JSON.stringify({ result: aiResult }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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