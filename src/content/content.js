// Content script for Trademark Checker Extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkTrademark") {
    handleTrademarkCheck(request.text);
  }
});

// Handle trademark checking
function handleTrademarkCheck(text) {
  // Show loading indicator
  showLoadingIndicator();
  
  // Send request to background script
  chrome.runtime.sendMessage({
    action: "searchTrademark",
    query: text
  }, response => {
    hideLoadingIndicator();
    
    if (response.success) {
      displayTrademarkResults(response.results);
    } else {
      showError(response.error);
    }
  });
}

// Show loading indicator
function showLoadingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'trademark-loading';
  indicator.className = 'trademark-checker-loading';
  indicator.textContent = 'Checking trademark...';
  document.body.appendChild(indicator);
}

// Hide loading indicator
function hideLoadingIndicator() {
  const indicator = document.getElementById('trademark-loading');
  if (indicator) {
    indicator.remove();
  }
}

// Display trademark results
function displayTrademarkResults(results) {
  // Create results popup
  const popup = document.createElement('div');
  popup.id = 'trademark-results';
  popup.className = 'trademark-checker-popup';
  
  let content = '<h3>Trademark Search Results</h3>';
  
  if (results.length === 0) {
    content += '<p>No trademark found.</p>';
  } else {
    results.forEach(result => {
      content += `
        <div class="trademark-result">
          <h4>${result.name}</h4>
          <p>Status: ${result.status}</p>
          <p>Owner: ${result.owner}</p>
          <p>Registration Date: ${result.registrationDate}</p>
        </div>
      `;
    });
  }
  
  content += '<button onclick="this.parentElement.remove()">Close</button>';
  popup.innerHTML = content;
  
  document.body.appendChild(popup);
}

// Show error message
function showError(error) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'trademark-checker-error';
  errorDiv.textContent = `Error: ${error}`;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => errorDiv.remove(), 5000);
}