// Background script for Trademark Checker Extension

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkTrademark",
    title: "Check Trademark: '%s'",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "checkTrademark" && info.selectionText) {
    // Send message to content script to check trademark
    chrome.tabs.sendMessage(tab.id, {
      action: "checkTrademark",
      text: info.selectionText
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "searchTrademark") {
    // TODO: Implement trademark API search
    performTrademarkSearch(request.query)
      .then(results => sendResponse({ success: true, results }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
});

// Placeholder function for trademark search
async function performTrademarkSearch(query) {
  // TODO: Implement actual API call to trademark database
  // For now, return mock data
  return {
    query: query,
    results: [
      {
        name: query,
        status: "Registered",
        owner: "Example Company",
        registrationDate: "2023-01-01"
      }
    ]
  };
}