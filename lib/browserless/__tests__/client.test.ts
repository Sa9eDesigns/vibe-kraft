/**
 * Browserless Client Tests
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BrowserlessClient } from '../client';
import { BrowserlessValidationError, BrowserlessAuthenticationError } from '../errors';

// Mock fetch globally
global.fetch = vi.fn();

describe('BrowserlessClient', () => {
  let client: BrowserlessClient;
  const mockFetch = fetch as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new BrowserlessClient({
      token: 'test-token',
      baseUrl: 'https://test.browserless.io',
      timeout: 5000,
    });
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(BrowserlessClient);
      expect(client.getConfig().token).toBe('test-token');
      expect(client.getConfig().baseUrl).toBe('https://test.browserless.io');
    });

    it('should throw validation error for invalid config', () => {
      expect(() => {
        new BrowserlessClient({
          token: '',
          baseUrl: 'invalid-url',
        });
      }).toThrow(BrowserlessValidationError);
    });

    it('should apply default values', () => {
      const defaultClient = new BrowserlessClient({
        token: 'test-token',
        baseUrl: 'https://test.browserless.io',
      });
      
      const config = defaultClient.getConfig();
      expect(config.timeout).toBe(30000);
      expect(config.defaultBrowser).toBe('chrome');
    });
  });

  describe('generatePDF', () => {
    it('should generate PDF successfully', async () => {
      const mockPdfBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/pdf']]),
        arrayBuffer: () => Promise.resolve(mockPdfBuffer),
      });

      const result = await client.generatePDF({
        url: 'https://example.com',
        options: { format: 'A4' },
      });

      expect(result).toBe(mockPdfBuffer);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.browserless.io/chrome/pdf',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({
            url: 'https://example.com',
            options: { format: 'A4' },
          }),
        })
      );
    });

    it('should throw validation error for invalid options', async () => {
      await expect(
        client.generatePDF({
          // Missing url and html
          options: { format: 'A4' },
        } as any)
      ).rejects.toThrow(BrowserlessValidationError);
    });

    it('should handle authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid token'),
      });

      await expect(
        client.generatePDF({ url: 'https://example.com' })
      ).rejects.toThrow(BrowserlessAuthenticationError);
    });
  });

  describe('takeScreenshot', () => {
    it('should take screenshot successfully', async () => {
      const mockImageBuffer = new ArrayBuffer(2048);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/png']]),
        arrayBuffer: () => Promise.resolve(mockImageBuffer),
      });

      const result = await client.takeScreenshot({
        url: 'https://example.com',
        type: 'png',
        fullPage: true,
      });

      expect(result).toBe(mockImageBuffer);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.browserless.io/chrome/screenshot',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com',
            type: 'png',
            fullPage: true,
          }),
        })
      );
    });

    it('should validate screenshot options', async () => {
      await expect(
        client.takeScreenshot({
          // Missing url and html
          type: 'png',
        } as any)
      ).rejects.toThrow(BrowserlessValidationError);
    });
  });

  describe('getContent', () => {
    it('should extract content successfully', async () => {
      const mockContent = { data: '<html><body>Test</body></html>' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockContent),
      });

      const result = await client.getContent({
        url: 'https://example.com',
        blockAds: true,
      });

      expect(result).toEqual(mockContent);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.browserless.io/chrome/content',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com',
            blockAds: true,
          }),
        })
      );
    });
  });

  describe('executeFunction', () => {
    it('should execute function successfully', async () => {
      const mockResult = { data: { title: 'Test Page' }, type: 'object' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResult),
      });

      const result = await client.executeFunction({
        code: 'async ({ page }) => ({ title: await page.title() })',
        context: { url: 'https://example.com' },
      });

      expect(result).toEqual(mockResult);
    });

    it('should validate function options', async () => {
      await expect(
        client.executeFunction({
          // Missing code
          context: {},
        } as any)
      ).rejects.toThrow(BrowserlessValidationError);
    });
  });

  describe('getWebSocketUrl', () => {
    it('should generate WebSocket URL for Puppeteer', () => {
      const url = client.getWebSocketUrl({
        browser: 'chrome',
        playwright: false,
      });

      expect(url).toBe('wss://test.browserless.io/chrome?token=test-token');
    });

    it('should generate WebSocket URL for Playwright', () => {
      const url = client.getWebSocketUrl({
        browser: 'firefox',
        playwright: true,
      });

      expect(url).toBe('wss://test.browserless.io/firefox/playwright?token=test-token');
    });

    it('should use default browser when not specified', () => {
      const url = client.getWebSocketUrl();
      expect(url).toBe('wss://test.browserless.io/chrome?token=test-token');
    });
  });

  describe('getHealth', () => {
    it('should get health status', async () => {
      const mockHealth = { status: 'ok', version: '1.0.0' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockHealth),
      });

      const result = await client.getHealth();

      expect(result).toEqual(mockHealth);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.browserless.io/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      client.updateConfig({
        timeout: 60000,
        defaultBrowser: 'firefox',
      });

      const config = client.getConfig();
      expect(config.timeout).toBe(60000);
      expect(config.defaultBrowser).toBe('firefox');
      expect(config.token).toBe('test-token'); // Should preserve existing values
    });

    it('should validate updated configuration', () => {
      expect(() => {
        client.updateConfig({
          token: '', // Invalid token
        });
      }).toThrow(BrowserlessValidationError);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        client.generatePDF({ url: 'https://example.com' })
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      // Mock AbortController
      const mockAbortController = {
        signal: { aborted: false },
        abort: vi.fn(),
      };
      global.AbortController = vi.fn(() => mockAbortController) as any;

      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('AbortError');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      await expect(
        client.generatePDF({ url: 'https://example.com' })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle different response content types', async () => {
      // Test text response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve('Plain text response'),
      });

      const textResult = await client.getContent({
        url: 'https://example.com',
      });

      expect(typeof textResult).toBe('string');
    });
  });

  describe('browser parameter', () => {
    it('should use specified browser in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/pdf']]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      });

      await client.generatePDF(
        { url: 'https://example.com' },
        'firefox'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.browserless.io/firefox/pdf',
        expect.any(Object)
      );
    });
  });
});
