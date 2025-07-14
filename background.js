const WORKER_URL = 'https://your-worker.workers.dev/check-trademark';

console.log('🔍 Trademark Checker Extension: Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔍 Background: Received message:', request);
  
  if (request.action === 'checkTrademark') {
    console.log('🔍 Background: Processing trademark check for:', request.data);
    
    checkTrademarkAPI(request.data)
      .then(response => {
        console.log('🔍 Background: API response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('🔍 Background: API error:', error);
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate async response
    return true;
  }
});

async function checkTrademarkAPI(data) {
  console.log('🔍 Background: Making API request to:', WORKER_URL);
  
  try {
    // For testing, if worker URL is not set, return mock data
    if (WORKER_URL.includes('your-worker.workers.dev')) {
      console.log('🔍 Background: Using mock data (worker URL not configured)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for common trademark terms
      const riskTerms = ['nike', 'adidas', 'disney', 'marvel', 'coca cola', 'pepsi'];
      const titleLower = data.title.toLowerCase();
      
      const hasRisk = riskTerms.some(term => titleLower.includes(term));
      
      if (hasRisk) {
        return {
          status: 'risk',
          message: 'Found registered trademark with high similarity',
          details: [{
            trademark: 'TRADEMARK FOUND',
            status: 'REGISTERED',
            similarity: 'high',
            registration_number: '1234567'
          }]
        };
      }
      
      return {
        status: 'clear',
        message: 'No trademark conflicts found',
        details: []
      };
    }
    
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('🔍 Background: Trademark check error:', error);
    throw error;
  }
}