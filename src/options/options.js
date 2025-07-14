// Options page script

// Default settings
const defaultSettings = {
  rapidApiKey: '',
  autoSearch: false,
  showNotifications: true,
  resultsLimit: 10,
  darkMode: false
};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Save button handler
document.getElementById('saveButton').addEventListener('click', saveSettings);

// Reset button handler
document.getElementById('resetButton').addEventListener('click', resetSettings);

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    if (settings.rapidApiKey) {
      document.getElementById('rapidApiKey').value = settings.rapidApiKey;
      updateApiStatus(settings.rapidApiKey);
    }
    document.getElementById('autoSearch').checked = settings.autoSearch;
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('resultsLimit').value = settings.resultsLimit;
    document.getElementById('darkMode').checked = settings.darkMode;
  });
}

// Save settings to storage
async function saveSettings() {
  const settings = {
    rapidApiKey: document.getElementById('rapidApiKey').value,
    autoSearch: document.getElementById('autoSearch').checked,
    showNotifications: document.getElementById('showNotifications').checked,
    resultsLimit: parseInt(document.getElementById('resultsLimit').value),
    darkMode: document.getElementById('darkMode').checked
  };
  
  // Test API key if provided
  if (settings.rapidApiKey) {
    showStatus('Testing API key...', 'info');
    const isValid = await testApiKey(settings.rapidApiKey);
    if (!isValid) {
      showStatus('Invalid API key. Please check and try again.', 'error');
      return;
    }
  }
  
  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved successfully!', 'success');
    updateApiStatus(settings.rapidApiKey);
  });
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showStatus('Settings reset to defaults', 'success');
    });
  }
}

// Show status message
function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusElement.className = 'status-message';
  }, 3000);
}

// Test API key validity
async function testApiKey(apiKey) {
  try {
    const response = await fetch('https://uspto-trademark.p.rapidapi.com/v1/trademarkAvailable/test', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'uspto-trademark.p.rapidapi.com'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('API key test error:', error);
    return false;
  }
}

// Update API status display
function updateApiStatus(apiKey) {
  const statusElement = document.getElementById('apiStatus');
  if (apiKey) {
    statusElement.textContent = 'Configured';
    statusElement.style.color = '#4CAF50';
  } else {
    statusElement.textContent = 'Not configured';
    statusElement.style.color = '#f44336';
  }
}