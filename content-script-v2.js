console.log('🔍 Trademark Checker Extension V2: Initializing...');

// Configuration
const CONFIG = {
  skipWords: new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'if', 'then', 'than', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'as', 'so', 'not']),
  
  knownPhrases: [
    // Slogans
    'just do it', 'think different', "i'm lovin it", 'because you\'re worth it',
    'the happiest place on earth', 'melts in your mouth not in your hands',
    
    // Character combinations
    'mickey mouse', 'minnie mouse', 'hello kitty', 'winnie the pooh',
    'harry potter', 'star wars', 'game of thrones', 'lord of the rings',
    
    // Brand + Product combinations
    'nike air', 'air jordan', 'air force', 'apple watch', 'google maps',
    'coca cola', 'pepsi cola', 'red bull', 'monster energy',
    
    // Common trademark phrases
    'super bowl', 'world cup', 'olympic games', 'grammy awards',
    'happy birthday to you', 'let\'s play'
  ],
  
  // Minimum word length to check
  minWordLength: 3,
  
  // Cache duration in milliseconds (1 hour)
  cacheDuration: 60 * 60 * 1000
};

// Cache for API results
const trademarkCache = new Map();

class TrademarkAnalyzer {
  constructor() {
    this.results = new Map();
    this.highlightedElements = new WeakSet();
  }

  analyzeText(text) {
    if (!text || text.length < CONFIG.minWordLength) return [];
    
    const checks = new Set();
    const normalizedText = text.toLowerCase();
    
    // 1. Check known trademark phrases first
    CONFIG.knownPhrases.forEach(phrase => {
      if (normalizedText.includes(phrase)) {
        checks.add(phrase);
      }
    });
    
    // 2. Extract individual words
    const words = text.match(/\b[\w'-]+\b/g) || [];
    const filteredWords = words.filter(word => 
      word.length >= CONFIG.minWordLength && 
      !CONFIG.skipWords.has(word.toLowerCase())
    );
    
    filteredWords.forEach(word => {
      checks.add(word);
    });
    
    // 3. Generate 2-3 word combinations
    for (let i = 0; i < filteredWords.length - 1; i++) {
      // 2-word phrases
      const twoWord = `${filteredWords[i]} ${filteredWords[i + 1]}`;
      checks.add(twoWord.toLowerCase());
      
      // 3-word phrases
      if (i < filteredWords.length - 2) {
        const threeWord = `${filteredWords[i]} ${filteredWords[i + 1]} ${filteredWords[i + 2]}`;
        checks.add(threeWord.toLowerCase());
      }
    }
    
    return Array.from(checks);
  }

  async checkTrademarks(terms) {
    console.log(`🔍 Checking ${terms.length} terms for trademarks...`);
    
    const uncachedTerms = [];
    const results = [];
    
    // Check cache first
    terms.forEach(term => {
      const cached = this.getCachedResult(term);
      if (cached) {
        results.push(cached);
      } else {
        uncachedTerms.push(term);
      }
    });
    
    if (uncachedTerms.length > 0) {
      // Batch check uncached terms
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'batchCheckTrademarks',
          terms: uncachedTerms
        });
        
        if (response && response.results) {
          response.results.forEach(result => {
            this.cacheResult(result.term, result);
            results.push(result);
            // Store in results map for detailed view
            this.results.set(result.term.toLowerCase(), result);
          });
        }
      } catch (error) {
        console.error('🔍 Error checking trademarks:', error);
      }
    }
    
    // Store cached results too
    results.forEach(result => {
      this.results.set(result.term.toLowerCase(), result);
    });
    
    return results;
  }

  getCachedResult(term) {
    const cached = trademarkCache.get(term.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CONFIG.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  cacheResult(term, result) {
    trademarkCache.set(term.toLowerCase(), {
      data: result,
      timestamp: Date.now()
    });
  }

  highlightElement(element, trademarkResults) {
    if (this.highlightedElements.has(element)) return;
    
    const text = element.textContent;
    if (!text) return;
    
    // Sort by length (longest first) to avoid partial replacements
    const sortedResults = trademarkResults
      .filter(r => r.status !== 'clear')
      .sort((a, b) => b.term.length - a.term.length);
    
    if (sortedResults.length === 0) return;
    
    let html = text;
    const replacements = [];
    
    sortedResults.forEach(result => {
      const regex = new RegExp(`\\b${this.escapeRegex(result.term)}\\b`, 'gi');
      const matches = [...text.matchAll(regex)];
      
      matches.forEach(match => {
        const index = match.index;
        replacements.push({
          start: index,
          end: index + match[0].length,
          result: result,
          original: match[0]
        });
      });
    });
    
    // Sort replacements by position (reverse order for replacement)
    replacements.sort((a, b) => b.start - a.start);
    
    // Apply replacements
    replacements.forEach(rep => {
      const className = this.getHighlightClass(rep.result);
      const tooltip = this.getTooltip(rep.result);
      
      html = html.substring(0, rep.start) +
        `<span class="${className}" data-tm-tooltip="${tooltip}">${rep.original}</span>` +
        html.substring(rep.end);
    });
    
    // Only update if we made changes
    if (html !== text) {
      element.innerHTML = html;
      this.highlightedElements.add(element);
      console.log(`🔍 Highlighted ${replacements.length} trademark(s) in element`);
    }
  }

  getHighlightClass(result) {
    switch (result.severity) {
      case 'high': return 'tm-highlight-danger';
      case 'medium': return 'tm-highlight-warning';
      case 'low': return 'tm-highlight-info';
      default: return 'tm-highlight-caution';
    }
  }

  getTooltip(result) {
    return `${result.trademark} - ${result.status} (Owner: ${result.owner || 'Unknown'})`;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Main extension class
class TrademarkCheckerExtension {
  constructor() {
    this.analyzer = new TrademarkAnalyzer();
    this.processedElements = new WeakSet();
    this.observer = null;
    this.statusWidget = null;
  }

  async init() {
    console.log('🔍 Initializing Trademark Checker...');
    
    // Wait for page to stabilize
    await this.waitForPageLoad();
    
    // Create status widget
    this.createStatusWidget();
    
    // Process initial content
    await this.processPage();
    
    // Set up mutation observer for dynamic content
    this.setupObserver();
    
    console.log('🔍 Trademark Checker initialized successfully');
  }

  async waitForPageLoad() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  createStatusWidget() {
    const widget = document.createElement('div');
    widget.id = 'tm-status-widget';
    widget.className = 'tm-status-widget';
    widget.innerHTML = `
      <div class="tm-status-icon">🔍</div>
      <div class="tm-status-text">Checking trademarks...</div>
      <div class="tm-status-details"></div>
    `;
    
    // Add click handler to show detailed view
    widget.addEventListener('click', () => this.toggleDetailedView());
    
    document.body.appendChild(widget);
    this.statusWidget = widget;
    
    // Create detailed view widget
    this.createDetailedWidget();
  }

  createDetailedWidget() {
    const detailed = document.createElement('div');
    detailed.id = 'tm-checker-enhanced';
    detailed.className = 'tm-checker-enhanced';
    detailed.innerHTML = `
      <div class="tm-enhanced-header">
        <div class="tm-enhanced-title">
          <span>🔍</span>
          <span>Trademark Analysis</span>
        </div>
        <button class="tm-enhanced-close" aria-label="Close">×</button>
      </div>
      <div class="tm-enhanced-content">
        <div class="tm-summary">
          <div class="tm-summary-row">
            <span class="tm-summary-label">Total Terms Checked:</span>
            <span class="tm-summary-value" id="tm-total-checked">0</span>
          </div>
          <div class="tm-summary-row">
            <span class="tm-summary-label">Conflicts Found:</span>
            <span class="tm-summary-value" id="tm-conflicts-found">0</span>
          </div>
          <div class="tm-summary-row">
            <span class="tm-summary-label">Risk Level:</span>
            <span class="tm-summary-value" id="tm-risk-level">Analyzing...</span>
          </div>
        </div>
        <div class="tm-conflict-list" id="tm-conflict-list"></div>
      </div>
    `;
    
    // Add close handler
    detailed.querySelector('.tm-enhanced-close').addEventListener('click', () => {
      this.hideDetailedView();
    });
    
    document.body.appendChild(detailed);
    this.detailedWidget = detailed;
  }

  toggleDetailedView() {
    if (this.detailedWidget.classList.contains('tm-show')) {
      this.hideDetailedView();
    } else {
      this.showDetailedView();
    }
  }

  showDetailedView() {
    this.detailedWidget.classList.add('tm-show');
    this.updateDetailedView();
  }

  hideDetailedView() {
    this.detailedWidget.classList.remove('tm-show');
  }

  updateDetailedView() {
    const allResults = Array.from(this.analyzer.results.values());
    const conflicts = allResults.filter(r => r.status !== 'clear');
    
    // Update summary
    document.getElementById('tm-total-checked').textContent = allResults.length;
    document.getElementById('tm-conflicts-found').textContent = conflicts.length;
    
    // Calculate risk level
    const highRisk = conflicts.filter(c => c.severity === 'high').length;
    const mediumRisk = conflicts.filter(c => c.severity === 'medium').length;
    
    let riskLevel = 'Low';
    let riskColor = '#34C759';
    
    if (highRisk > 0) {
      riskLevel = 'High';
      riskColor = '#FF3B30';
    } else if (mediumRisk > 0) {
      riskLevel = 'Medium';
      riskColor = '#FFCC00';
    }
    
    const riskElement = document.getElementById('tm-risk-level');
    riskElement.textContent = riskLevel;
    riskElement.style.color = riskColor;
    
    // Update conflict list
    const conflictList = document.getElementById('tm-conflict-list');
    conflictList.innerHTML = '';
    
    if (conflicts.length === 0) {
      conflictList.innerHTML = '<div style="text-align: center; color: #595959; padding: 20px;">No trademark conflicts found!</div>';
    } else {
      conflicts.forEach(conflict => {
        const item = document.createElement('div');
        item.className = `tm-conflict-item tm-severity-${conflict.severity}`;
        item.innerHTML = `
          <div class="tm-conflict-term">${this.escapeHtml(conflict.term)}</div>
          <div class="tm-conflict-details">
            <div class="tm-conflict-detail">
              <span>Owner:</span>
              <strong>${this.escapeHtml(conflict.owner || 'Unknown')}</strong>
            </div>
            <div class="tm-conflict-detail">
              <span>Category:</span>
              <strong>${this.escapeHtml(conflict.category || 'General')}</strong>
            </div>
            <div class="tm-conflict-detail">
              <span>Reg #:</span>
              <strong>${this.escapeHtml(conflict.registrationNumber || 'N/A')}</strong>
            </div>
          </div>
        `;
        conflictList.appendChild(item);
      });
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateStatus(status, details = '') {
    if (!this.statusWidget) return;
    
    const statusText = this.statusWidget.querySelector('.tm-status-text');
    const statusDetails = this.statusWidget.querySelector('.tm-status-details');
    
    statusText.textContent = status;
    statusDetails.textContent = details;
    
    // Auto-hide after 5 seconds if showing results
    if (details) {
      setTimeout(() => {
        this.statusWidget.classList.add('tm-status-minimized');
      }, 5000);
    }
  }

  async processPage() {
    console.log('🔍 Processing page content...');
    
    // Find all relevant elements
    const elements = this.findTrademarkElements();
    console.log(`🔍 Found ${elements.length} elements to check`);
    
    if (elements.length === 0) {
      this.updateStatus('No product content found');
      return;
    }
    
    // Extract all text and analyze
    const allTerms = new Set();
    const elementTermsMap = new Map();
    
    elements.forEach(element => {
      if (this.processedElements.has(element)) return;
      
      const text = element.textContent;
      const terms = this.analyzer.analyzeText(text);
      
      elementTermsMap.set(element, terms);
      terms.forEach(term => allTerms.add(term));
    });
    
    console.log(`🔍 Extracted ${allTerms.size} unique terms to check`);
    
    // Batch check all terms
    this.updateStatus('Checking trademarks...', `Analyzing ${allTerms.size} terms`);
    const results = await this.analyzer.checkTrademarks(Array.from(allTerms));
    
    // Create a map for quick lookup
    const resultsMap = new Map();
    results.forEach(result => {
      resultsMap.set(result.term.toLowerCase(), result);
    });
    
    // Apply highlights to each element
    let highlightCount = 0;
    elementTermsMap.forEach((terms, element) => {
      const elementResults = terms
        .map(term => resultsMap.get(term.toLowerCase()))
        .filter(Boolean);
      
      if (elementResults.length > 0) {
        this.analyzer.highlightElement(element, elementResults);
        highlightCount += elementResults.filter(r => r.status !== 'clear').length;
      }
      
      this.processedElements.add(element);
    });
    
    // Update status
    if (highlightCount > 0) {
      this.updateStatus('Trademark check complete', `Found ${highlightCount} potential conflicts`);
    } else {
      this.updateStatus('Trademark check complete', 'No conflicts found');
    }
  }

  findTrademarkElements() {
    const selectors = [
      // Title
      'h1[data-test-id="listing-page-title"]',
      'h1.wt-text-heading-01',
      'h1',
      
      // Description
      '[data-test-id="description-text"]',
      '.wt-text-body-01',
      '.listing-page-description',
      
      // Tags
      '[data-test-id="listing-page-tags"]',
      '.tag-list',
      
      // Product details
      '.variation-selector-title',
      '.product-personalization-title'
    ];
    
    const elements = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!this.processedElements.has(el) && el.textContent.trim()) {
          elements.push(el);
        }
      });
    });
    
    return elements;
  }

  setupObserver() {
    this.observer = new MutationObserver(mutations => {
      // Debounce processing
      clearTimeout(this.observerTimeout);
      this.observerTimeout = setTimeout(() => {
        this.processPage();
      }, 500);
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.statusWidget) {
      this.statusWidget.remove();
    }
  }
}

// Initialize extension when on listing page
if (window.location.pathname.includes('/listing/')) {
  const extension = new TrademarkCheckerExtension();
  extension.init();
  
  // Handle navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (!url.includes('/listing/')) {
        extension.destroy();
      }
    }
  }).observe(document, { subtree: true, childList: true });
}

// Add CSS for tooltips
const style = document.createElement('style');
style.textContent = `
  .tm-highlight-danger:hover::after,
  .tm-highlight-warning:hover::after,
  .tm-highlight-info:hover::after,
  .tm-highlight-caution:hover::after {
    content: attr(data-tm-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10000;
    pointer-events: none;
  }
`;
document.head.appendChild(style);