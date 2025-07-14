// Test suite for Trademark Checker Extension

// Mock Chrome API
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

global.chrome = mockChrome;

// Test Data Extraction
describe('Data Extraction', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <h1 data-test-id="listing-page-title">Born To Read T-Shirt</h1>
      <div data-test-id="listing-page-tags">
        <a href="#">books</a>
        <a href="#">reading</a>
        <a href="#">literature</a>
      </div>
      <a href="/shop/BookLovers">BookLovers Shop</a>
    `;
  });

  test('extracts title correctly', () => {
    const data = extractListingData();
    expect(data.title).toBe('Born To Read T-Shirt');
  });

  test('extracts tags correctly', () => {
    const data = extractListingData();
    expect(data.tags).toEqual(['books', 'reading', 'literature']);
  });

  test('extracts shop name correctly', () => {
    const data = extractListingData();
    expect(data.shopName).toBe('BookLovers Shop');
  });

  test('includes current URL', () => {
    const data = extractListingData();
    expect(data.url).toBe(window.location.href);
  });
});

// Test Widget Creation
describe('Widget Creation', () => {
  test('creates widget with correct structure', () => {
    const data = {
      title: 'Test Product',
      tags: ['tag1', 'tag2'],
      url: 'https://etsy.com/listing/123',
      shopName: 'Test Shop'
    };

    const widget = createWidget(data);
    expect(widget).toContain('tm-checker-widget');
    expect(widget).toContain('Test Product');
    expect(widget).toContain('tag1, tag2');
    expect(widget).toContain('Check USPTO Trademark');
  });

  test('escapes HTML in user data', () => {
    const data = {
      title: '<script>alert("xss")</script>',
      tags: ['<img src=x onerror=alert("xss")>'],
      url: 'https://etsy.com/listing/123',
      shopName: 'Test Shop'
    };

    const widget = createWidget(data);
    expect(widget).not.toContain('<script>');
    expect(widget).not.toContain('<img');
    expect(widget).toContain('&lt;script&gt;');
  });
});

// Test API Communication
describe('API Communication', () => {
  beforeEach(() => {
    mockChrome.runtime.sendMessage.mockClear();
  });

  test('sends correct message format', async () => {
    const data = {
      title: 'Test Product',
      tags: ['tag1', 'tag2'],
      url: 'https://etsy.com/listing/123'
    };

    await checkTrademark(data);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'checkTrademark',
      data: {
        title: 'Test Product',
        tags: ['tag1', 'tag2'],
        url: 'https://etsy.com/listing/123'
      }
    });
  });

  test('handles API errors gracefully', async () => {
    mockChrome.runtime.sendMessage.mockImplementationOnce((msg, callback) => {
      callback({ error: 'Network error' });
    });

    const data = {
      title: 'Test Product',
      tags: ['tag1'],
      url: 'https://etsy.com/listing/123'
    };

    await checkTrademark(data);
    
    const errorDiv = document.getElementById('tm-results');
    expect(errorDiv.textContent).toContain('Error: Network error');
  });
});

// Test Results Display
describe('Results Display', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="tm-results"></div>';
  });

  test('displays clear status correctly', () => {
    const response = {
      status: 'clear',
      message: 'No trademark conflicts found',
      details: []
    };

    displayResults(response);
    
    const resultsDiv = document.getElementById('tm-results');
    expect(resultsDiv.innerHTML).toContain('✅');
    expect(resultsDiv.innerHTML).toContain('No trademark conflicts found');
    expect(resultsDiv.innerHTML).toContain('tm-status-clear');
  });

  test('displays warning status with details', () => {
    const response = {
      status: 'warning',
      message: 'Found 1 potential trademark issue',
      details: [{
        trademark: 'BORN 2 READ',
        status: 'PENDING',
        similarity: 'high',
        registration_number: '1234567'
      }]
    };

    displayResults(response);
    
    const resultsDiv = document.getElementById('tm-results');
    expect(resultsDiv.innerHTML).toContain('⚠️');
    expect(resultsDiv.innerHTML).toContain('BORN 2 READ');
    expect(resultsDiv.innerHTML).toContain('PENDING');
    expect(resultsDiv.innerHTML).toContain('Reg #1234567');
  });

  test('displays risk status correctly', () => {
    const response = {
      status: 'risk',
      message: 'Found 2 registered trademarks with high similarity',
      details: [
        {
          trademark: 'NIKE',
          status: 'REGISTERED',
          similarity: 'exact',
          registration_number: '0978952'
        },
        {
          trademark: 'NIKE AIR',
          status: 'REGISTERED',
          similarity: 'high',
          registration_number: '1234567'
        }
      ]
    };

    displayResults(response);
    
    const resultsDiv = document.getElementById('tm-results');
    expect(resultsDiv.innerHTML).toContain('❌');
    expect(resultsDiv.innerHTML).toContain('tm-status-risk');
    expect(resultsDiv.innerHTML).toContain('NIKE');
    expect(resultsDiv.innerHTML).toContain('NIKE AIR');
  });
});

// Test Worker Functions
describe('Cloudflare Worker', () => {
  test('extracts search terms correctly', () => {
    const terms = extractSearchTerms('Nike Air Force Shoes', ['sneakers', 'athletic', 'footwear']);
    expect(terms).toContain('nike');
    expect(terms).toContain('air');
    expect(terms).toContain('force');
    expect(terms).toContain('shoes');
    expect(terms).toContain('sneakers');
    expect(terms).toContain('nike air force shoes');
  });

  test('calculates similarity correctly', () => {
    expect(calculateSimilarity('nike', 'nike')).toBe('exact');
    expect(calculateSimilarity('nike air', 'nike')).toBe('high');
    expect(calculateSimilarity('nikes', 'nike')).toBe('high');
    expect(calculateSimilarity('book', 'boot')).toBe('high');
    expect(calculateSimilarity('apple', 'orange')).toBe('low');
  });

  test('analyzes results correctly', () => {
    const trademarkResults = [
      { trademark: 'NIKE', status: 'REGISTERED', similarity: 'exact', registration_number: '123' },
      { trademark: 'NIKEE', status: 'PENDING', similarity: 'high', registration_number: '456' },
      { trademark: 'NICKE', status: 'REGISTERED', similarity: 'medium', registration_number: '789' }
    ];

    const analysis = analyzeResults(trademarkResults, ['nike']);
    expect(analysis.status).toBe('risk');
    expect(analysis.details).toHaveLength(3);
  });
});

// Integration Tests
describe('Integration Tests', () => {
  test('Case 1: Clear trademark status', async () => {
    document.body.innerHTML = `
      <h1 data-test-id="listing-page-title">Handmade Ceramic Mug</h1>
      <div data-test-id="listing-page-tags">
        <a href="#">pottery</a>
        <a href="#">ceramic</a>
        <a href="#">handmade</a>
      </div>
    `;

    mockChrome.runtime.sendMessage.mockImplementationOnce((msg, callback) => {
      callback({
        status: 'clear',
        message: 'No trademark conflicts found',
        details: []
      });
    });

    injectWidget();
    await new Promise(resolve => setTimeout(resolve, 600));

    const widget = document.getElementById('tm-checker-widget');
    expect(widget).toBeTruthy();

    const button = document.getElementById('tm-check-btn');
    button.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const results = document.getElementById('tm-results');
    expect(results.innerHTML).toContain('✅');
    expect(results.innerHTML).toContain('No trademark conflicts found');
  });

  test('Case 2: Trademark conflict detected', async () => {
    document.body.innerHTML = `
      <h1 data-test-id="listing-page-title">Nike Air Force Design</h1>
      <div data-test-id="listing-page-tags">
        <a href="#">nike</a>
        <a href="#">sneakers</a>
      </div>
    `;

    mockChrome.runtime.sendMessage.mockImplementationOnce((msg, callback) => {
      callback({
        status: 'risk',
        message: 'Found 1 registered trademark with high similarity',
        details: [{
          trademark: 'NIKE',
          status: 'REGISTERED',
          similarity: 'exact',
          registration_number: '0978952'
        }]
      });
    });

    injectWidget();
    await new Promise(resolve => setTimeout(resolve, 600));

    const button = document.getElementById('tm-check-btn');
    button.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    const results = document.getElementById('tm-results');
    expect(results.innerHTML).toContain('❌');
    expect(results.innerHTML).toContain('Trademark conflict');
    expect(results.innerHTML).toContain('NIKE');
  });

  test('Case 3: API timeout handling', async () => {
    document.body.innerHTML = `
      <h1 data-test-id="listing-page-title">Test Product</h1>
    `;

    mockChrome.runtime.sendMessage.mockImplementationOnce((msg, callback) => {
      setTimeout(() => {
        callback({ error: 'Request timeout' });
      }, 100);
    });

    injectWidget();
    await new Promise(resolve => setTimeout(resolve, 600));

    const button = document.getElementById('tm-check-btn');
    expect(button.disabled).toBe(false);
    
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Checking...');

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('Check USPTO Trademark');
    
    const results = document.getElementById('tm-results');
    expect(results.innerHTML).toContain('Error');
    expect(results.innerHTML).toContain('Request timeout');
  });
});