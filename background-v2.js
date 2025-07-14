const WORKER_URL = 'https://your-worker.workers.dev/check-trademark';

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
  
  // First check known trademarks
  if (KNOWN_TRADEMARKS[normalizedTerm]) {
    const trademark = KNOWN_TRADEMARKS[normalizedTerm];
    return {
      term: term,
      status: 'conflict',
      severity: trademark.severity,
      trademark: term.toUpperCase(),
      owner: trademark.owner,
      category: trademark.category,
      registrationNumber: generateMockRegistration(normalizedTerm)
    };
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
        note: 'Similar to registered trademark'
      };
    }
  }
  
  // If not found in known trademarks, check with API (or mock)
  if (WORKER_URL.includes('your-worker.workers.dev')) {
    // Mock response for unknown terms
    // Simulate that some random terms might have issues
    const randomCheck = Math.random();
    
    if (randomCheck < 0.05) { // 5% chance of being a trademark
      return {
        term: term,
        status: 'warning',
        severity: 'low',
        trademark: term.toUpperCase(),
        owner: 'Unknown Entity',
        category: 'general',
        registrationNumber: generateMockRegistration(term),
        note: 'Potential trademark'
      };
    }
  } else {
    // Real API call would go here
    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('API error for term:', term, error);
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
    registrationNumber: null
  };
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