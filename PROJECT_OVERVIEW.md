# Trademark Checker Chrome Extension

## Overview
A Chrome extension that helps print-on-demand sellers automatically check trademark status for their Etsy listings. The system prevents legal issues by monitoring USPTO trademark databases and alerting users to potential conflicts.

## Features
- **Automatic Detection**: Detects when user visits an Etsy product listing page
- **Smart Data Extraction**: Extracts product title, tags, and shop information
- **Real-time Verification**: Checks USPTO trademark database via Cloudflare Worker API
- **Visual Status Indicators**: Clear (✅), Warning (⚠️), or Risk (❌) status
- **Seamless Integration**: Widget matches Etsy's design for natural user experience
- **No Data Storage**: Stateless system, no user data collection

## File Structure
```
trademark-checker-extension/
├── manifest.json              # Chrome extension manifest (Manifest V3)
├── content-script.js          # DOM injection and data extraction
├── background.js              # Service worker for API communication
├── styles.css                 # Etsy-matching widget styles
├── icons/                     # Extension icons
│   ├── icon16.png            # 16x16 toolbar icon
│   ├── icon48.png            # 48x48 extension icon
│   └── icon128.png           # 128x128 store icon
├── cloudflare-worker/         # Backend API
│   └── worker.js             # USPTO API integration
├── test-extension.js          # Comprehensive test suite
└── PROJECT_OVERVIEW.md        # This file
```

## Installation

### Extension Setup
1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will automatically activate on Etsy listing pages

### Cloudflare Worker Setup
1. Create a new Cloudflare Worker
2. Copy the contents of `cloudflare-worker/worker.js`
3. Deploy the worker and note the URL
4. Update `WORKER_URL` in `background.js` with your worker URL

## How It Works

### 1. Content Script Injection
When visiting an Etsy listing page (`https://*.etsy.com/listing/*`), the content script:
- Waits for DOM to load
- Extracts product data using Etsy's data attributes
- Injects the trademark checker widget below the product title

### 2. Data Extraction
The extension extracts:
- **Title**: From `h1[data-test-id="listing-page-title"]`
- **Tags**: From `[data-test-id="listing-page-tags"] a`
- **Shop Name**: From shop links
- **URL**: Current page URL for reference

### 3. Trademark Checking
When user clicks "Check USPTO Trademark":
1. Extension sends extracted data to background script
2. Background script forwards request to Cloudflare Worker
3. Worker searches USPTO database for conflicts
4. Results returned and displayed in widget

### 4. Result Analysis
The system analyzes trademarks for:
- **Exact matches**: Identical trademarks (highest risk)
- **High similarity**: Contains or very similar to existing marks
- **Medium similarity**: Partial matches or related terms
- **Registration status**: REGISTERED vs PENDING marks

## API Specification

### Request Format
```json
POST https://your-worker.workers.dev/check-trademark
{
  "title": "Born To Read T-Shirt",
  "tags": ["books", "reading", "literature"],
  "url": "https://etsy.com/listing/1234567/born-to-read"
}
```

### Response Format
```json
{
  "status": "clear|warning|risk",
  "message": "Human-readable status message",
  "details": [
    {
      "trademark": "BORN 2 READ",
      "status": "REGISTERED",
      "similarity": "high",
      "registration_number": "1234567"
    }
  ]
}
```

## Testing

### Running Tests
```bash
# Install Jest if not already installed
npm install --save-dev jest

# Run test suite
npm test test-extension.js
```

### Test Coverage
- Data extraction from various Etsy page layouts
- Widget creation and HTML escaping
- API communication and error handling
- Result display for all status types
- Integration tests for common scenarios
- Worker functions (similarity calculation, analysis)

## Security Considerations

1. **Minimal Permissions**: Only requests access to Etsy domains
2. **No User Data**: No personal information collected or stored
3. **Stateless Design**: Each check is independent, no tracking
4. **XSS Protection**: All user data properly escaped
5. **CORS Enabled**: Worker allows cross-origin requests safely

## Development Guidelines

### Adding New Features
1. Check existing code patterns in content-script.js
2. Maintain Etsy design consistency in styles.css
3. Add corresponding tests to test-extension.js
4. Update this documentation

### Debugging
- Use Chrome DevTools on Etsy pages to debug content script
- Check background script logs in extension service worker
- Monitor Cloudflare Worker logs for API issues

## Common Issues & Solutions

### Widget Not Appearing
- Ensure you're on an Etsy listing page
- Check if Etsy updated their DOM structure
- Verify extension is enabled in Chrome

### API Errors
- Confirm Cloudflare Worker is deployed
- Check WORKER_URL in background.js
- Verify CORS headers in worker

### Styling Issues
- Etsy may have updated their design system
- Inspect element and update styles.css accordingly

## Future Enhancements
- Cache recent searches to reduce API calls
- Add support for other e-commerce platforms
- Implement bulk checking for multiple listings
- Add export functionality for trademark reports
- Create options page for user preferences