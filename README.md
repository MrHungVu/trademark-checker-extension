# Trademark Checker for Etsy v2.0

Real-time trademark analysis with intelligent inline highlighting for Etsy product listings. Helps print-on-demand sellers avoid legal issues with automatic detection of trademarked terms and phrases.

## 🚀 What's New in v2.0

- **Inline Highlighting** - Trademarked words/phrases are highlighted directly in the listing
- **Intelligent Analysis** - Checks individual words AND meaningful phrases
- **Real-time Checking** - Automatic analysis on page load, no button clicks needed
- **Smart Detection** - Recognizes brand names, slogans, and trademark combinations
- **Enhanced UI** - Floating status widget with detailed trademark analysis view

## Quick Start

1. **Install the Extension**
   - Download or clone this repository
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

2. **Deploy the API** (Optional)
   - Extension works with built-in trademark database
   - For live USPTO data: Deploy `cloudflare-worker/worker.js`
   - Update the URL in `background-v2.js`

3. **Use the Extension**
   - Visit any Etsy product listing
   - Extension automatically analyzes the page
   - Look for highlighted terms in title/description
   - Click the floating widget (bottom-right) for details

## Features

### 🎯 Intelligent Detection
- **Word Analysis** - Checks individual significant words (skips common words)
- **Phrase Recognition** - Detects "Just Do It", "Star Wars", etc.
- **Smart Combinations** - Finds "Nike Air", "Apple Watch" patterns
- **Context Aware** - Different severity levels based on trademark strength

### 🎨 Visual Feedback
- 🔴 **Red Highlight** - Active registered trademarks (high risk)
- 🟡 **Yellow Highlight** - Pending marks or warnings (medium risk)
- 🔵 **Blue Highlight** - Informational or dead marks (low risk)
- 📊 **Status Widget** - Shows real-time analysis progress
- 📋 **Detailed View** - Complete list of found trademarks with ownership info

### ⚡ Performance
- **Batch Processing** - Checks multiple terms in one API call
- **Smart Caching** - Remembers results for 1 hour
- **Efficient Analysis** - Skips common words and duplicates
- **Debounced Updates** - Handles dynamic content smoothly

## How It Works

1. **Text Extraction** - Grabs title, description, tags from the listing
2. **Smart Analysis** - Breaks down text into checkable terms and phrases
3. **Trademark Checking** - Compares against known trademark database
4. **Inline Highlighting** - Marks problematic terms directly on the page
5. **Risk Assessment** - Calculates overall risk level for the listing

## Examples

For a listing titled "Nike Birthday Girl T-Shirt":
- ❌ "Nike" → Highlighted in red (registered trademark)
- ✅ "Birthday" → Not highlighted (common word)
- ✅ "Girl" → Not highlighted (common word)
- ✅ "T-Shirt" → Not highlighted (generic term)

## Support

For detailed documentation, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## License

MIT License - See LICENSE file for details