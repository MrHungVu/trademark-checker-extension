// Popup script

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const historyList = document.getElementById('historyList');
  const settingsLink = document.getElementById('settingsLink');
  const helpLink = document.getElementById('helpLink');
  
  // Load search history
  loadSearchHistory();
  
  // Search button click handler
  searchButton.addEventListener('click', performSearch);
  
  // Enter key handler for search input
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Settings link handler
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // Help link handler
  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    // TODO: Open help documentation
    alert('Help documentation coming soon!');
  });
});

// Perform trademark search
function performSearch() {
  const query = document.getElementById('searchInput').value.trim();
  
  if (!query) {
    alert('Please enter a trademark to search');
    return;
  }
  
  // Save to history
  saveToHistory(query);
  
  // Send search request to background script
  chrome.runtime.sendMessage({
    action: 'searchTrademark',
    query: query
  }, response => {
    if (response.success) {
      displayResults(response.results);
    } else {
      alert('Error: ' + response.error);
    }
  });
}

// Load search history from storage
function loadSearchHistory() {
  chrome.storage.local.get(['searchHistory'], (result) => {
    const history = result.searchHistory || [];
    displayHistory(history);
  });
}

// Save search query to history
function saveToHistory(query) {
  chrome.storage.local.get(['searchHistory'], (result) => {
    let history = result.searchHistory || [];
    
    // Remove duplicates and add to beginning
    history = history.filter(item => item !== query);
    history.unshift(query);
    
    // Keep only last 10 items
    history = history.slice(0, 10);
    
    chrome.storage.local.set({ searchHistory: history }, () => {
      displayHistory(history);
    });
  });
}

// Display search history
function displayHistory(history) {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  if (history.length === 0) {
    historyList.innerHTML = '<li style="color: #999;">No recent searches</li>';
    return;
  }
  
  history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    li.addEventListener('click', () => {
      document.getElementById('searchInput').value = item;
      performSearch();
    });
    historyList.appendChild(li);
  });
}

// Display search results
function displayResults(results) {
  // For now, just show an alert
  // TODO: Implement better results display
  if (results.length === 0) {
    alert('No trademark found');
  } else {
    const result = results[0];
    alert(`Trademark: ${result.name}\nStatus: ${result.status}\nOwner: ${result.owner}`);
  }
}