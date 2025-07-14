let widgetInjected = false;

function extractListingData() {
  const data = {
    title: '',
    tags: [],
    url: window.location.href,
    shopName: ''
  };

  const titleElement = document.querySelector('h1[data-test-id="listing-page-title"], h1');
  if (titleElement) {
    data.title = titleElement.textContent.trim();
  }

  const tagElements = document.querySelectorAll('[data-test-id="listing-page-tags"] a, .tag-list a, .wt-tag a');
  tagElements.forEach(tag => {
    const tagText = tag.textContent.trim();
    if (tagText && !data.tags.includes(tagText)) {
      data.tags.push(tagText);
    }
  });

  const shopElement = document.querySelector('[data-test-id="shop-name"], .shop-name a, a[href*="/shop/"]');
  if (shopElement) {
    data.shopName = shopElement.textContent.trim();
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
  if (widgetInjected) return;

  const titleElement = document.querySelector('h1[data-test-id="listing-page-title"], h1');
  if (!titleElement) {
    setTimeout(injectWidget, 1000);
    return;
  }

  const data = extractListingData();
  const widgetHTML = createWidget(data);

  const container = titleElement.closest('div') || titleElement.parentElement;
  container.insertAdjacentHTML('afterend', widgetHTML);
  widgetInjected = true;

  const checkButton = document.getElementById('tm-check-btn');
  checkButton.addEventListener('click', () => checkTrademark(data));
}

async function checkTrademark(data) {
  const button = document.getElementById('tm-check-btn');
  const resultsDiv = document.getElementById('tm-results');
  
  button.disabled = true;
  button.textContent = 'Checking...';
  resultsDiv.style.display = 'none';
  resultsDiv.innerHTML = '';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'checkTrademark',
      data: {
        title: data.title,
        tags: data.tags,
        url: data.url
      }
    });

    if (response.error) {
      throw new Error(response.error);
    }

    displayResults(response);
  } catch (error) {
    displayError(error.message);
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
  if (window.location.pathname.includes('/listing/')) {
    setTimeout(injectWidget, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForListingPage);
} else {
  waitForListingPage();
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    widgetInjected = false;
    if (url.includes('/listing/')) {
      setTimeout(injectWidget, 500);
    }
  }
}).observe(document, { subtree: true, childList: true });