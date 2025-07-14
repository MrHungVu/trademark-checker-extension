console.log('🔍 Trademark Checker Extension: Content script loaded');

let widgetInjected = false;

function extractListingData() {
  console.log('🔍 Extracting listing data...');
  
  const data = {
    title: '',
    tags: [],
    url: window.location.href,
    shopName: ''
  };

  // Try multiple selectors for title
  const titleSelectors = [
    'h1[data-test-id="listing-page-title"]',
    'h1.wt-text-body-01',
    'h1.wt-text-heading-01',
    'h1[class*="listing-page-title"]',
    'h1'
  ];
  
  let titleElement = null;
  for (const selector of titleSelectors) {
    titleElement = document.querySelector(selector);
    if (titleElement) {
      console.log(`🔍 Found title with selector: ${selector}`);
      break;
    }
  }
  
  if (titleElement) {
    data.title = titleElement.textContent.trim();
    console.log(`🔍 Title extracted: "${data.title}"`);
  } else {
    console.log('🔍 No title element found');
  }

  // Try multiple selectors for tags
  const tagSelectors = [
    '[data-test-id="listing-page-tags"] a',
    '.tag-list a',
    '.wt-tag a',
    'a[href*="/search?q="]',
    '.listing-tag a'
  ];
  
  let tagElements = [];
  for (const selector of tagSelectors) {
    tagElements = document.querySelectorAll(selector);
    if (tagElements.length > 0) {
      console.log(`🔍 Found tags with selector: ${selector} (${tagElements.length} tags)`);
      break;
    }
  }
  
  tagElements.forEach(tag => {
    const tagText = tag.textContent.trim();
    if (tagText && !data.tags.includes(tagText)) {
      data.tags.push(tagText);
    }
  });
  console.log(`🔍 Tags extracted: ${data.tags.join(', ') || 'none'}`);

  // Try multiple selectors for shop name
  const shopSelectors = [
    '[data-test-id="shop-name"]',
    '.shop-name a',
    'a[href*="/shop/"]',
    '.wt-text-link-no-underline[href*="/shop/"]'
  ];
  
  let shopElement = null;
  for (const selector of shopSelectors) {
    shopElement = document.querySelector(selector);
    if (shopElement) {
      console.log(`🔍 Found shop with selector: ${selector}`);
      break;
    }
  }
  
  if (shopElement) {
    data.shopName = shopElement.textContent.trim();
    console.log(`🔍 Shop name extracted: "${data.shopName}"`);
  }

  return data;
}

function createWidget(data) {
  const widgetHTML = `
    <div id="tm-checker-widget" class="tm-checker-widget">
      <div class="tm-header">
        <span class="tm-icon">🔍</span>
        <span class="tm-title">Trademark Checker</span>
      </div>
      <div class="tm-data">
        <div class="tm-data-row">
          <strong>Title:</strong> <span id="tm-title">${escapeHtml(data.title)}</span>
        </div>
        <div class="tm-data-row">
          <strong>Tags:</strong> <span id="tm-tags">${escapeHtml(data.tags.join(', ')) || 'No tags found'}</span>
        </div>
      </div>
      <button id="tm-check-btn" class="tm-check-btn">Check USPTO Trademark</button>
      <div id="tm-results" class="tm-results" style="display: none;"></div>
    </div>
  `;

  return widgetHTML;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function injectWidget() {
  console.log('🔍 Attempting to inject widget...');
  
  if (widgetInjected) {
    console.log('🔍 Widget already injected, skipping');
    return;
  }

  // Try multiple selectors for title element
  const titleSelectors = [
    'h1[data-test-id="listing-page-title"]',
    'h1.wt-text-body-01',
    'h1.wt-text-heading-01', 
    'h1[class*="listing-page-title"]',
    'h1'
  ];
  
  let titleElement = null;
  for (const selector of titleSelectors) {
    titleElement = document.querySelector(selector);
    if (titleElement) {
      console.log(`🔍 Found title element for widget injection with selector: ${selector}`);
      break;
    }
  }
  
  if (!titleElement) {
    console.log('🔍 No title element found, retrying in 1 second...');
    setTimeout(injectWidget, 1000);
    return;
  }

  const data = extractListingData();
  const widgetHTML = createWidget(data);

  // Find the best container for injection
  let container = titleElement.parentElement;
  
  // Try to find a better container that's not too narrow
  while (container && container.parentElement && 
         (container.offsetWidth < 300 || container.tagName === 'H1')) {
    container = container.parentElement;
  }
  
  console.log(`🔍 Injecting widget after element: ${container.tagName}.${container.className}`);
  
  try {
    container.insertAdjacentHTML('afterend', widgetHTML);
    widgetInjected = true;
    console.log('🔍 Widget injected successfully!');

    const checkButton = document.getElementById('tm-check-btn');
    if (checkButton) {
      checkButton.addEventListener('click', () => checkTrademark(data));
      console.log('🔍 Click handler attached to button');
    } else {
      console.error('🔍 Check button not found after injection');
    }
  } catch (error) {
    console.error('🔍 Error injecting widget:', error);
  }
}

async function checkTrademark(data) {
  console.log('🔍 Checking trademark for:', data);
  
  const button = document.getElementById('tm-check-btn');
  const resultsDiv = document.getElementById('tm-results');
  
  button.disabled = true;
  button.textContent = 'Checking...';
  resultsDiv.style.display = 'none';
  resultsDiv.innerHTML = '';

  try {
    console.log('🔍 Sending message to background script...');
    
    const response = await chrome.runtime.sendMessage({
      action: 'checkTrademark',
      data: {
        title: data.title,
        tags: data.tags,
        url: data.url
      }
    });

    console.log('🔍 Received response:', response);

    if (response && response.error) {
      throw new Error(response.error);
    }

    if (!response) {
      throw new Error('No response from background script');
    }

    displayResults(response);
  } catch (error) {
    console.error('🔍 Error checking trademark:', error);
    displayError(error.message || 'Unknown error occurred');
  } finally {
    button.disabled = false;
    button.textContent = 'Check USPTO Trademark';
  }
}

function displayResults(response) {
  const resultsDiv = document.getElementById('tm-results');
  let statusIcon = '';
  let statusClass = '';

  switch (response.status) {
    case 'clear':
      statusIcon = '✅';
      statusClass = 'tm-status-clear';
      break;
    case 'warning':
      statusIcon = '⚠️';
      statusClass = 'tm-status-warning';
      break;
    case 'risk':
      statusIcon = '❌';
      statusClass = 'tm-status-risk';
      break;
  }

  let html = `
    <div class="tm-status ${statusClass}">
      <span class="tm-status-icon">${statusIcon}</span>
      <span class="tm-status-message">${escapeHtml(response.message)}</span>
    </div>
  `;

  if (response.details && response.details.length > 0) {
    html += '<div class="tm-details">';
    response.details.forEach(detail => {
      html += `
        <div class="tm-detail-item">
          <div class="tm-detail-trademark">${escapeHtml(detail.trademark)}</div>
          <div class="tm-detail-info">
            <span class="tm-detail-status">${escapeHtml(detail.status)}</span>
            <span class="tm-detail-similarity">Similarity: ${escapeHtml(detail.similarity)}</span>
            <span class="tm-detail-registration">Reg #${escapeHtml(detail.registration_number)}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  resultsDiv.innerHTML = html;
  resultsDiv.style.display = 'block';
}

function displayError(message) {
  const resultsDiv = document.getElementById('tm-results');
  resultsDiv.innerHTML = `
    <div class="tm-error">
      <span class="tm-error-icon">⚠️</span>
      <span class="tm-error-message">Error: ${escapeHtml(message)}</span>
    </div>
  `;
  resultsDiv.style.display = 'block';
}

function waitForListingPage() {
  console.log('🔍 Checking if on listing page...');
  console.log('🔍 Current URL:', window.location.href);
  console.log('🔍 Pathname:', window.location.pathname);
  
  if (window.location.pathname.includes('/listing/')) {
    console.log('🔍 On listing page, waiting 500ms before injection');
    setTimeout(injectWidget, 500);
  } else {
    console.log('🔍 Not on a listing page');
  }
}

// Initialize the extension
console.log('🔍 Document ready state:', document.readyState);

if (document.readyState === 'loading') {
  console.log('🔍 Document still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', waitForListingPage);
} else {
  console.log('🔍 Document already loaded, checking page immediately');
  waitForListingPage();
}

// Watch for URL changes (Etsy uses client-side routing)
let lastUrl = location.href;
console.log('🔍 Setting up URL change observer');

new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    console.log('🔍 URL changed from', lastUrl, 'to', url);
    lastUrl = url;
    widgetInjected = false;
    
    if (url.includes('/listing/')) {
      console.log('🔍 New URL is a listing page, re-injecting widget');
      setTimeout(injectWidget, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });