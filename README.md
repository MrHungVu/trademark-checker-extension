# Trademark Checker for Etsy

A Chrome extension that automatically checks trademark status for Etsy product listings, helping print-on-demand sellers avoid legal issues.

## Quick Start

1. **Install the Extension**
   - Download or clone this repository
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder

2. **Deploy the API**
   - Create a Cloudflare Worker account
   - Copy `cloudflare-worker/worker.js` to a new worker
   - Deploy and copy the worker URL
   - Update the URL in `background.js`

3. **Use the Extension**
   - Visit any Etsy product listing
   - Look for the Trademark Checker widget below the title
   - Click "Check USPTO Trademark" to verify

## Features

✅ **Automatic Detection** - Works on all Etsy listing pages  
🔍 **Smart Extraction** - Gets product title and tags automatically  
⚡ **Real-time Checking** - Instant USPTO database verification  
🎨 **Seamless Design** - Matches Etsy's UI perfectly  
🔒 **Privacy First** - No data storage or tracking

## Status Indicators

- ✅ **Clear** - No trademark conflicts found
- ⚠️ **Warning** - Potential issues to review  
- ❌ **Risk** - High similarity to registered trademarks

## Support

For issues or questions, please check the [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for detailed documentation.

## License

MIT License - See LICENSE file for details