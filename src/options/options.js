// Options page script

// Default settings
const defaultSettings = {
  apiKey: '',
  apiEndpoint: 'https://api.example.com/trademark',
  autoSearch: false,
  showNotifications: true,
  searchRegion: 'us',
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
    document.getElementById('apiKey').value = settings.apiKey;
    document.getElementById('apiEndpoint').value = settings.apiEndpoint;
    document.getElementById('autoSearch').checked = settings.autoSearch;
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('searchRegion').value = settings.searchRegion;
    document.getElementById('resultsLimit').value = settings.resultsLimit;
    document.getElementById('darkMode').checked = settings.darkMode;
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    apiKey: document.getElementById('apiKey').value,
    apiEndpoint: document.getElementById('apiEndpoint').value,
    autoSearch: document.getElementById('autoSearch').checked,
    showNotifications: document.getElementById('showNotifications').checked,
    searchRegion: document.getElementById('searchRegion').value,
    resultsLimit: parseInt(document.getElementById('resultsLimit').value),
    darkMode: document.getElementById('darkMode').checked
  };
  
  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved successfully!', 'success');
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