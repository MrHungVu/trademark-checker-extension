// API utility functions for trademark searches

// Get API settings from storage
async function getApiSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'searchRegion'], (settings) => {
      resolve({
        apiKey: settings.apiKey || '',
        apiEndpoint: settings.apiEndpoint || 'https://api.example.com/trademark',
        searchRegion: settings.searchRegion || 'us'
      });
    });
  });
}

// Search trademark using API
async function searchTrademark(query) {
  const settings = await getApiSettings();
  
  if (!settings.apiKey) {
    throw new Error('API key not configured. Please set up in extension settings.');
  }
  
  try {
    const response = await fetch(`${settings.apiEndpoint}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        query: query,
        region: settings.searchRegion
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Trademark search error:', error);
    throw error;
  }
}

// Format trademark results for display
function formatTrademarkResults(results) {
  return results.map(result => ({
    name: result.name || 'Unknown',
    status: result.status || 'Unknown',
    owner: result.owner || 'Unknown',
    registrationDate: result.registrationDate ? 
      new Date(result.registrationDate).toLocaleDateString() : 'Unknown',
    registrationNumber: result.registrationNumber || 'N/A',
    classes: result.classes || [],
    description: result.description || ''
  }));
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getApiSettings,
    searchTrademark,
    formatTrademarkResults
  };
}