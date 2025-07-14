const WORKER_URL = 'https://your-worker.workers.dev/check-trademark';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkTrademark') {
    checkTrademarkAPI(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function checkTrademarkAPI(data) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Trademark check error:', error);
    throw error;
  }
}