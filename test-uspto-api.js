// Test script for USPTO API integration
// Run this in Node.js to test the API endpoints

const USPTO_API_BASE = 'https://uspto-trademark.p.rapidapi.com';
const API_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; // Replace with your actual API key

// Test trademark availability check
async function testAvailability(keyword) {
  console.log(`\nChecking availability for: "${keyword}"`);
  
  try {
    const response = await fetch(`${USPTO_API_BASE}/v1/trademarkAvailable/${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'uspto-trademark.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Result:', data);
    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test trademark search
async function testSearch(keyword) {
  console.log(`\nSearching for trademarks matching: "${keyword}"`);
  
  try {
    const response = await fetch(`${USPTO_API_BASE}/v1/trademarkSearch/${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'uspto-trademark.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Results found:', Array.isArray(data) ? data.length : 1);
    if (data[0]) {
      console.log('First result:', {
        wordmark: data[0].wordmark,
        owner: data[0].owner,
        status: data[0].status,
        serialNumber: data[0].serialNumber
      });
    }
    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('USPTO API Integration Test');
  console.log('==========================');
  
  if (API_KEY === 'YOUR_RAPIDAPI_KEY_HERE') {
    console.error('\n⚠️  Please set your RapidAPI key in the API_KEY variable before running tests!');
    console.log('Get your API key from: https://rapidapi.com/pentium10/api/uspto-trademark');
    return;
  }
  
  // Test known trademarks
  await testAvailability('amazon');
  await testAvailability('google');
  
  // Test likely available terms
  await testAvailability('myuniquecompanyname123');
  
  // Test search
  await testSearch('nike');
  await testSearch('apple');
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testAvailability, testSearch };