// Tests for storage utility functions

const {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  clearStorage,
  getStorageInfo
} = require('../src/utils/storage');

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('saveToStorage', () => {
    it('should save data to storage', async () => {
      chrome.storage.local.set.mockImplementation((items, callback) => {
        callback();
      });
      
      await saveToStorage('testKey', 'testValue');
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { testKey: 'testValue' },
        expect.any(Function)
      );
    });
    
    it('should handle errors', async () => {
      chrome.runtime.lastError = new Error('Storage error');
      chrome.storage.local.set.mockImplementation((items, callback) => {
        callback();
      });
      
      await expect(saveToStorage('testKey', 'testValue')).rejects.toThrow('Storage error');
      chrome.runtime.lastError = null;
    });
  });
  
  describe('getFromStorage', () => {
    it('should retrieve data from storage', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ testKey: 'testValue' });
      });
      
      const value = await getFromStorage('testKey');
      expect(value).toBe('testValue');
    });
    
    it('should return default value if key not found', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });
      
      const value = await getFromStorage('nonExistentKey', 'defaultValue');
      expect(value).toBe('defaultValue');
    });
  });
  
  describe('removeFromStorage', () => {
    it('should remove data from storage', async () => {
      chrome.storage.local.remove.mockImplementation((keys, callback) => {
        callback();
      });
      
      await removeFromStorage('testKey');
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(
        'testKey',
        expect.any(Function)
      );
    });
  });
  
  describe('clearStorage', () => {
    it('should clear all storage', async () => {
      chrome.storage.local.clear.mockImplementation((callback) => {
        callback();
      });
      
      await clearStorage();
      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });
  });
  
  describe('getStorageInfo', () => {
    it('should return storage usage info', async () => {
      chrome.storage.local.getBytesInUse.mockImplementation((keys, callback) => {
        callback(1000);
      });
      
      const info = await getStorageInfo();
      expect(info.bytesInUse).toBe(1000);
      expect(info.bytesAvailable).toBe(chrome.storage.local.QUOTA_BYTES - 1000);
    });
  });
});