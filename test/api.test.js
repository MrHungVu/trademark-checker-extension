// Tests for API utility functions

// Mock fetch for testing
global.fetch = jest.fn();

// Import functions to test
const { getApiSettings, searchTrademark, formatTrademarkResults } = require('../src/utils/api');

describe('API Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getApiSettings', () => {
    it('should retrieve API settings from storage', async () => {
      const mockSettings = {
        apiKey: 'test-key',
        apiEndpoint: 'https://test.api.com',
        searchRegion: 'us'
      };
      
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(mockSettings);
      });
      
      const settings = await getApiSettings();
      expect(settings).toEqual(mockSettings);
    });
    
    it('should return default values if settings not found', async () => {
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });
      
      const settings = await getApiSettings();
      expect(settings.apiKey).toBe('');
      expect(settings.apiEndpoint).toBe('https://api.example.com/trademark');
      expect(settings.searchRegion).toBe('us');
    });
  });
  
  describe('formatTrademarkResults', () => {
    it('should format results correctly', () => {
      const rawResults = [
        {
          name: 'Test Brand',
          status: 'Registered',
          owner: 'Test Company',
          registrationDate: '2023-01-01',
          registrationNumber: '123456',
          classes: [9, 42],
          description: 'Software and services'
        }
      ];
      
      const formatted = formatTrademarkResults(rawResults);
      expect(formatted[0].name).toBe('Test Brand');
      expect(formatted[0].status).toBe('Registered');
      expect(formatted[0].registrationDate).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
    
    it('should handle missing fields gracefully', () => {
      const rawResults = [{}];
      const formatted = formatTrademarkResults(rawResults);
      
      expect(formatted[0].name).toBe('Unknown');
      expect(formatted[0].status).toBe('Unknown');
      expect(formatted[0].owner).toBe('Unknown');
      expect(formatted[0].registrationDate).toBe('Unknown');
      expect(formatted[0].registrationNumber).toBe('N/A');
      expect(formatted[0].classes).toEqual([]);
      expect(formatted[0].description).toBe('');
    });
  });
});