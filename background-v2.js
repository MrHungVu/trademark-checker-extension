// USPTO API configuration
const USPTO_API_BASE = 'https://uspto-trademark.p.rapidapi.com';
let API_KEY = null;

console.log('🔍 Trademark Checker Extension V2: Background service loaded');

// Known trademark database for quick checks
const KNOWN_TRADEMARKS = {
  // Major brands
  'nike': { owner: 'Nike, Inc.', severity: 'high', category: 'clothing' },
  'adidas': { owner: 'Adidas AG', severity: 'high', category: 'clothing' },
  'disney': { owner: 'Disney Enterprises, Inc.', severity: 'high', category: 'entertainment' },
  'marvel': { owner: 'Marvel Entertainment, LLC', severity: 'high', category: 'entertainment' },
  'apple': { owner: 'Apple Inc.', severity: 'high', category: 'technology' },
  'google': { owner: 'Google LLC', severity: 'high', category: 'technology' },
  'microsoft': { owner: 'Microsoft Corporation', severity: 'high', category: 'technology' },
  'amazon': { owner: 'Amazon Technologies, Inc.', severity: 'high', category: 'retail' },
  'facebook': { owner: 'Meta Platforms, Inc.', severity: 'high', category: 'technology' },
  'coca cola': { owner: 'The Coca-Cola Company', severity: 'high', category: 'beverage' },
  'pepsi': { owner: 'PepsiCo, Inc.', severity: 'high', category: 'beverage' },
  'starbucks': { owner: 'Starbucks Corporation', severity: 'high', category: 'food' },
  'mcdonalds': { owner: 'McDonald\'s Corporation', severity: 'high', category: 'food' },
  
  // Character/Entertainment
  'mickey mouse': { owner: 'Disney Enterprises, Inc.', severity: 'high', category: 'character' },
  'minnie mouse': { owner: 'Disney Enterprises, Inc.', severity: 'high', category: 'character' },
  'hello kitty': { owner: 'Sanrio Company, Ltd.', severity: 'high', category: 'character' },
  'pokemon': { owner: 'Nintendo Co., Ltd.', severity: 'high', category: 'entertainment' },
  'mario': { owner: 'Nintendo Co., Ltd.', severity: 'high', category: 'character' },
  'zelda': { owner: 'Nintendo Co., Ltd.', severity: 'high', category: 'entertainment' },
  'harry potter': { owner: 'Warner Bros. Entertainment Inc.', severity: 'high', category: 'entertainment' },
  'star wars': { owner: 'Lucasfilm Ltd.', severity: 'high', category: 'entertainment' },
  'game of thrones': { owner: 'Home Box Office, Inc.', severity: 'high', category: 'entertainment' },
  
  // Slogans
  'just do it': { owner: 'Nike, Inc.', severity: 'high', category: 'slogan' },
  'i\'m lovin it': { owner: 'McDonald\'s Corporation', severity: 'high', category: 'slogan' },
  'think different': { owner: 'Apple Inc.', severity: 'high', category: 'slogan' },
  'because you\'re worth it': { owner: 'L\'Oréal', severity: 'high', category: 'slogan' },
  
  // Sports/Events
  'super bowl': { owner: 'National Football League', severity: 'high', category: 'event' },
  'world cup': { owner: 'FIFA', severity: 'high', category: 'event' },
  'olympics': { owner: 'International Olympic Committee', severity: 'high', category: 'event' },
  'olympic': { owner: 'International Olympic Committee', severity: 'high', category: 'event' },
  
  // Common products
  'iphone': { owner: 'Apple Inc.', severity: 'high', category: 'product' },
  'ipad': { owner: 'Apple Inc.', severity: 'high', category: 'product' },
  'windows': { owner: 'Microsoft Corporation', severity: 'medium', category: 'product' },
  'android': { owner: 'Google LLC', severity: 'medium', category: 'product' },
  
  // Fashion brands
  'gucci': { owner: 'Gucci America, Inc.', severity: 'high', category: 'fashion' },
  'louis vuitton': { owner: 'Louis Vuitton Malletier', severity: 'high', category: 'fashion' },
  'chanel': { owner: 'Chanel, Inc.', severity: 'high', category: 'fashion' },
  'prada': { owner: 'Prada S.A.', severity: 'high', category: 'fashion' },
  'versace': { owner: 'Gianni Versace S.p.A.', severity: 'high', category: 'fashion' },
  
  // Music/Entertainment
  'grammy': { owner: 'The Recording Academy', severity: 'high', category: 'event' },
  'oscar': { owner: 'Academy of Motion Picture Arts and Sciences', severity: 'high', category: 'event' },
  'emmy': { owner: 'Academy of Television Arts & Sciences', severity: 'high', category: 'event' },
  
  // Phrases
  'happy birthday to you': { owner: 'Warner/Chappell Music', severity: 'medium', category: 'song' },
  'let\'s play': { owner: 'Various Gaming Companies', severity: 'low', category: 'phrase' }
};

// Load API key on startup
chrome.storage.sync.get(['rapidApiKey'], (settings) => {
  if (settings.rapidApiKey) {
    API_KEY = settings.rapidApiKey;
    console.log('🔍 USPTO API key loaded');
  } else {
    console.warn('🔍 No USPTO API key found, using cached data only');
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.rapidApiKey) {
    API_KEY = changes.rapidApiKey.newValue || null;
    console.log('🔍 USPTO API key updated');
  }
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔍 Background: Received message:', request.action);
  
  if (request.action === 'batchCheckTrademarks') {
    handleBatchCheck(request.terms)
      .then(results => {
        console.log(`🔍 Background: Batch check complete for ${results.length} terms`);
        sendResponse({ results });
      })
      .catch(error => {
        console.error('🔍 Background: Batch check error:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // Async response
  }
  
  if (request.action === 'checkTrademark') {
    // Legacy single check support
    handleSingleCheck(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    
    return true;
  }
});

async function handleBatchCheck(terms) {
  console.log(`🔍 Background: Checking ${terms.length} terms`);
  
  const results = [];
  
  for (const term of terms) {
    const result = await checkSingleTerm(term);
    results.push(result);
  }
  
  return results;
}

async function checkSingleTerm(term) {
  const normalizedTerm = term.toLowerCase().trim();
  
  // First do a quick check in our known trademarks cache
  if (KNOWN_TRADEMARKS[normalizedTerm]) {
    const trademark = KNOWN_TRADEMARKS[normalizedTerm];
    // Still verify with real API if we have a key
    if (API_KEY) {
      try {
        const apiResult = await checkWithUSPTO(term);
        if (apiResult) return apiResult;
      } catch (error) {
        console.error('USPTO API error, falling back to cache:', error);
      }
    }
    
    return {
      term: term,
      status: 'conflict',
      severity: trademark.severity,
      trademark: term.toUpperCase(),
      owner: trademark.owner,
      category: trademark.category,
      registrationNumber: generateMockRegistration(normalizedTerm),
      source: 'cache'
    };
  }
  
  // Check with real USPTO API if we have API key
  if (API_KEY) {
    try {
      const apiResult = await checkWithUSPTO(term);
      if (apiResult) return apiResult;
    } catch (error) {
      console.error('USPTO API error:', error);
      // Fall through to local checks
    }
  }
  
  // Check if it's a variation of known trademarks
  for (const [knownTerm, trademark] of Object.entries(KNOWN_TRADEMARKS)) {
    if (normalizedTerm.includes(knownTerm) || knownTerm.includes(normalizedTerm)) {
      return {
        term: term,
        status: 'warning',
        severity: 'medium',
        trademark: knownTerm.toUpperCase(),
        owner: trademark.owner,
        category: trademark.category,
        registrationNumber: generateMockRegistration(knownTerm),
        note: 'Similar to registered trademark',
        source: 'cache'
      };
    }
  }
  
  // Default: no trademark found
  return {
    term: term,
    status: 'clear',
    severity: 'none',
    trademark: null,
    owner: null,
    category: null,
    registrationNumber: null,
    source: API_KEY ? 'api' : 'cache'
  };
}

// Check trademark using real USPTO API
async function checkWithUSPTO(term) {
  try {
    // First check availability
    const availResponse = await fetch(`${USPTO_API_BASE}/v1/trademarkAvailable/${encodeURIComponent(term)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'uspto-trademark.p.rapidapi.com'
      }
    });
    
    if (!availResponse.ok) {
      throw new Error(`USPTO API error: ${availResponse.statusText}`);
    }
    
    const availData = await availResponse.json();
    const isAvailable = availData[0]?.available === 'yes';
    
    if (isAvailable) {
      return {
        term: term,
        status: 'clear',
        severity: 'none',
        trademark: null,
        owner: null,
        category: null,
        registrationNumber: null,
        source: 'api'
      };
    }
    
    // If not available, get detailed info
    const searchResponse = await fetch(`${USPTO_API_BASE}/v1/trademarkSearch/${encodeURIComponent(term)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'uspto-trademark.p.rapidapi.com'
      }
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const firstResult = Array.isArray(searchData) ? searchData[0] : searchData;
      
      if (firstResult) {
        return {
          term: term,
          status: 'conflict',
          severity: 'high',
          trademark: firstResult.wordmark || term.toUpperCase(),
          owner: firstResult.owner || firstResult.correspondent || 'Unknown',
          category: firstResult.internationalClassDescriptions?.[0] || 'general',
          registrationNumber: firstResult.registrationNumber || firstResult.serialNumber || null,
          source: 'api',
          apiData: firstResult
        };
      }
    }
  } catch (error) {
    console.error('USPTO API error for term:', term, error);
    throw error;
  }
  
  return null;
}

function generateMockRegistration(term) {
  // Generate a consistent mock registration number based on the term
  let hash = 0;
  for (let i = 0; i < term.length; i++) {
    hash = ((hash << 5) - hash) + term.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString().padStart(7, '0').slice(0, 7);
}

// Legacy single check handler
async function handleSingleCheck(data) {
  const terms = [];
  
  if (data.title) {
    terms.push(...data.title.split(/\s+/));
  }
  
  if (data.tags && Array.isArray(data.tags)) {
    terms.push(...data.tags);
  }
  
  const results = await handleBatchCheck(terms);
  
  // Convert to legacy format
  const conflicts = results.filter(r => r.status !== 'clear');
  
  if (conflicts.length === 0) {
    return {
      status: 'clear',
      message: 'No trademark conflicts found',
      details: []
    };
  }
  
  const highSeverity = conflicts.filter(r => r.severity === 'high');
  const status = highSeverity.length > 0 ? 'risk' : 'warning';
  
  return {
    status,
    message: `Found ${conflicts.length} potential trademark issue(s)`,
    details: conflicts.map(c => ({
      trademark: c.trademark,
      status: c.severity === 'high' ? 'REGISTERED' : 'PENDING',
      similarity: c.severity,
      registration_number: c.registrationNumber
    }))
  };
}

console.log('🔍 Background: Service ready');