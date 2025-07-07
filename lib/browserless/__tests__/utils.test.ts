/**
 * Browserless Utils Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBrowserlessConfig,
  getBrowserlessCloudUrl,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  getMimeType,
  isValidUrl,
  buildQueryString,
  isSupportedBrowser,
  formatBytes,
  generateId,
  deepMerge,
  wait,
} from '../utils';

describe('Utils', () => {
  describe('createBrowserlessConfig', () => {
    it('should create config with defaults', () => {
      const config = createBrowserlessConfig('token', 'https://example.com');
      
      expect(config).toEqual({
        token: 'token',
        baseUrl: 'https://example.com',
        timeout: 30000,
        defaultBrowser: 'chrome',
      });
    });

    it('should override defaults with options', () => {
      const config = createBrowserlessConfig('token', 'https://example.com', {
        timeout: 60000,
        defaultBrowser: 'firefox',
      });
      
      expect(config.timeout).toBe(60000);
      expect(config.defaultBrowser).toBe('firefox');
    });

    it('should remove trailing slash from baseUrl', () => {
      const config = createBrowserlessConfig('token', 'https://example.com/');
      expect(config.baseUrl).toBe('https://example.com');
    });
  });

  describe('getBrowserlessCloudUrl', () => {
    it('should return US URL by default', () => {
      expect(getBrowserlessCloudUrl()).toBe('https://production-sfo.browserless.io');
    });

    it('should return correct regional URLs', () => {
      expect(getBrowserlessCloudUrl('us')).toBe('https://production-sfo.browserless.io');
      expect(getBrowserlessCloudUrl('eu')).toBe('https://production-lon.browserless.io');
      expect(getBrowserlessCloudUrl('asia')).toBe('https://production-sin.browserless.io');
    });
  });

  describe('arrayBufferToBase64 and base64ToArrayBuffer', () => {
    it('should convert ArrayBuffer to base64 and back', () => {
      const originalData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const arrayBuffer = originalData.buffer;
      
      const base64 = arrayBufferToBase64(arrayBuffer);
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
      
      const convertedBack = base64ToArrayBuffer(base64);
      const convertedArray = new Uint8Array(convertedBack);
      
      expect(convertedArray).toEqual(originalData);
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types', () => {
      expect(getMimeType('pdf')).toBe('application/pdf');
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('jpg')).toBe('image/jpeg');
      expect(getMimeType('jpeg')).toBe('image/jpeg');
      expect(getMimeType('webp')).toBe('image/webp');
      expect(getMimeType('html')).toBe('text/html');
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('csv')).toBe('text/csv');
      expect(getMimeType('xml')).toBe('application/xml');
      expect(getMimeType('zip')).toBe('application/zip');
    });

    it('should return default MIME type for unknown extensions', () => {
      expect(getMimeType('unknown')).toBe('application/octet-stream');
    });

    it('should handle case insensitive extensions', () => {
      expect(getMimeType('PDF')).toBe('application/pdf');
      expect(getMimeType('PNG')).toBe('image/png');
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
      expect(isValidUrl('ftp://example.com')).toBe(true);
      
      expect(isValidUrl('invalid-url')).toBe(false);
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const params = {
        foo: 'bar',
        baz: 123,
        bool: true,
      };
      
      const queryString = buildQueryString(params);
      expect(queryString).toBe('?foo=bar&baz=123&bool=true');
    });

    it('should handle empty object', () => {
      expect(buildQueryString({})).toBe('');
    });

    it('should skip undefined and null values', () => {
      const params = {
        foo: 'bar',
        undefined: undefined,
        null: null,
        zero: 0,
        empty: '',
      };
      
      const queryString = buildQueryString(params);
      expect(queryString).toBe('?foo=bar&zero=0&empty=');
    });
  });

  describe('isSupportedBrowser', () => {
    it('should identify supported browsers', () => {
      expect(isSupportedBrowser('chrome')).toBe(true);
      expect(isSupportedBrowser('firefox')).toBe(true);
      expect(isSupportedBrowser('webkit')).toBe(true);
      expect(isSupportedBrowser('edge')).toBe(true);
      
      expect(isSupportedBrowser('safari')).toBe(false);
      expect(isSupportedBrowser('opera')).toBe(false);
      expect(isSupportedBrowser('invalid')).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('generateId', () => {
    it('should generate ID of specified length', () => {
      const id8 = generateId(8);
      const id16 = generateId(16);
      
      expect(id8).toHaveLength(8);
      expect(id16).toHaveLength(16);
    });

    it('should generate different IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
    });

    it('should use default length', () => {
      const id = generateId();
      expect(id).toHaveLength(8);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
        e: [1, 2, 3],
      };
      
      const source = {
        b: {
          d: 4,
          f: 5,
        },
        g: 6,
      };
      
      const result = deepMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 4,
          f: 5,
        },
        e: [1, 2, 3],
        g: 6,
      });
    });

    it('should not mutate original objects', () => {
      const target = { a: { b: 1 } };
      const source = { a: { c: 2 } };
      
      const result = deepMerge(target, source);
      
      expect(target.a).not.toHaveProperty('c');
      expect(result.a).toHaveProperty('c', 2);
    });

    it('should handle arrays correctly', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5, 6] };
      
      const result = deepMerge(target, source);
      
      expect(result.arr).toEqual([4, 5, 6]);
    });
  });

  describe('wait', () => {
    it('should wait for specified time', async () => {
      const start = Date.now();
      await wait(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });
});
