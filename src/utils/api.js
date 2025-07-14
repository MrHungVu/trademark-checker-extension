// API utility functions for trademark searches

// USPTO API configuration via RapidAPI
const USPTO_API_BASE = 'https://uspto-trademark.p.rapidapi.com';

// Get API settings from storage
async function getApiSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rapidApiKey'], (settings) => {
      resolve({
        rapidApiKey: settings.rapidApiKey || '',
        apiHost: 'uspto-trademark.p.rapidapi.com'
      });
    });
  });
}

// Check if a trademark is available using USPTO API
async function checkTrademarkAvailable(keyword) {
  const settings = await getApiSettings();
  
  if (!settings.rapidApiKey) {
    throw new Error('RapidAPI key not configured. Please set up in extension settings.');
  }
  
  try {
    const response = await fetch(`${USPTO_API_BASE}/v1/trademarkAvailable/${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': settings.rapidApiKey,
        'X-RapidAPI-Host': settings.apiHost
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data[0]; // Returns {keyword: string, available: 'yes'|'no'}
  } catch (error) {
    console.error('Trademark availability check error:', error);
    throw error;
  }
}

// Search trademarks by keyword using USPTO API
async function searchTrademark(keyword) {
  const settings = await getApiSettings();
  
  if (!settings.rapidApiKey) {
    throw new Error('RapidAPI key not configured. Please set up in extension settings.');
  }
  
  try {
    const response = await fetch(`${USPTO_API_BASE}/v1/trademarkSearch/${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': settings.rapidApiKey,
        'X-RapidAPI-Host': settings.apiHost
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Trademark search error:', error);
    throw error;
  }
}

// Get detailed trademark info by serial number
async function getTrademarkBySerial(serialNumber) {
  const settings = await getApiSettings();
  
  if (!settings.rapidApiKey) {
    throw new Error('RapidAPI key not configured. Please set up in extension settings.');
  }
  
  try {
    const response = await fetch(`${USPTO_API_BASE}/v1/trademarkBySerialNumber/${serialNumber}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': settings.rapidApiKey,
        'X-RapidAPI-Host': settings.apiHost
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Trademark serial lookup error:', error);
    throw error;
  }
}

// Format trademark results for display
function formatTrademarkResults(results) {
  if (!Array.isArray(results)) {
    results = [results];
  }
  
  return results.map(result => ({
    keyword: result.keyword || result.wordmark || 'Unknown',
    status: result.status || result.statusCode || 'Unknown',
    owner: result.owner || result.correspondent || 'Unknown',
    registrationDate: result.registrationDate || result.filingDate ? 
      new Date(result.registrationDate || result.filingDate).toLocaleDateString() : 'Unknown',
    registrationNumber: result.registrationNumber || 'N/A',
    serialNumber: result.serialNumber || 'N/A',
    classes: result.classes || result.internationalClassDescriptions || [],
    description: result.description || result.goodsAndServices || '',
    available: result.available || 'unknown'
  }));
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getApiSettings,
    checkTrademarkAvailable,
    searchTrademark,
    getTrademarkBySerial,
    formatTrademarkResults
  };
}