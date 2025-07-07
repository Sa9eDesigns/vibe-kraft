/**
 * Browserless WebSocket Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserlessClient } from '../client';
import { BrowserlessWebSocket, isValidWebSocketUrl, extractBrowserFromUrl } from '../websocket';

describe('BrowserlessWebSocket', () => {
  let client: BrowserlessClient;
  let wsHelper: BrowserlessWebSocket;

  beforeEach(() => {
    client = new BrowserlessClient({
      token: 'test-token',
      baseUrl: 'https://test.browserless.io',
    });
    wsHelper = new BrowserlessWebSocket(client);
  });

  describe('getPuppeteerUrl', () => {
    it('should generate Puppeteer WebSocket URL', () => {
      const url = wsHelper.getPuppeteerUrl({
        browser: 'chrome',
        timeout: 30000,
      });

      expect(url).toBe('wss://test.browserless.io/chrome?token=test-token');
    });

    it('should add Puppeteer options as query parameters', () => {
      const url = wsHelper.getPuppeteerUrl({
        browser: 'chrome',
        puppeteerOptions: {
          headless: false,
          devtools: true,
          slowMo: 100,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get('headless')).toBe('false');
      expect(parsedUrl.searchParams.get('devtools')).toBe('true');
      expect(parsedUrl.searchParams.get('slowMo')).toBe('100');
      expect(parsedUrl.searchParams.get('args')).toBe(
        JSON.stringify(['--no-sandbox', '--disable-setuid-sandbox'])
      );
    });

    it('should use default browser when not specified', () => {
      const url = wsHelper.getPuppeteerUrl();
      expect(url).toContain('/chrome?');
    });
  });

  describe('getPlaywrightUrl', () => {
    it('should generate Playwright WebSocket URL', () => {
      const url = wsHelper.getPlaywrightUrl({
        browser: 'firefox',
        timeout: 30000,
      });

      expect(url).toBe('wss://test.browserless.io/firefox/playwright?token=test-token');
    });

    it('should add Playwright options as query parameters', () => {
      const url = wsHelper.getPlaywrightUrl({
        browser: 'chrome',
        playwrightOptions: {
          headless: false,
          devtools: true,
          slowMo: 50,
          proxy: {
            server: 'http://proxy.example.com:8080',
            username: 'user',
            password: 'pass',
          },
          chromiumSandbox: false,
        },
      });

      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get('headless')).toBe('false');
      expect(parsedUrl.searchParams.get('devtools')).toBe('true');
      expect(parsedUrl.searchParams.get('slowMo')).toBe('50');
      expect(parsedUrl.searchParams.get('chromiumSandbox')).toBe('false');
      
      const proxyParam = parsedUrl.searchParams.get('proxy');
      expect(proxyParam).toBeTruthy();
      const proxy = JSON.parse(proxyParam!);
      expect(proxy.server).toBe('http://proxy.example.com:8080');
    });
  });

  describe('connectPuppeteer', () => {
    it('should return connection helper', async () => {
      const connection = await wsHelper.connectPuppeteer({
        browser: 'chrome',
        puppeteerOptions: {
          headless: true,
        },
      });

      expect(connection).toHaveProperty('browserWSEndpoint');
      expect(connection).toHaveProperty('connect');
      expect(typeof connection.connect).toBe('function');
      expect(connection.browserWSEndpoint).toContain('wss://');
    });

    it('should handle missing puppeteer dependency', async () => {
      const connection = await wsHelper.connectPuppeteer();
      
      // Mock dynamic import failure
      vi.doMock('puppeteer-core', () => {
        throw new Error('Module not found');
      });

      await expect(connection.connect()).rejects.toThrow('Puppeteer not found');
    });
  });

  describe('connectPlaywright', () => {
    it('should return connection helper for chromium', async () => {
      const connection = await wsHelper.connectPlaywright('chromium', {
        browser: 'chrome',
      });

      expect(connection).toHaveProperty('wsEndpoint');
      expect(connection).toHaveProperty('connect');
      expect(typeof connection.connect).toBe('function');
      expect(connection.wsEndpoint).toContain('wss://');
      expect(connection.wsEndpoint).toContain('/chrome/playwright');
    });

    it('should map browser types correctly', async () => {
      const firefoxConnection = await wsHelper.connectPlaywright('firefox');
      expect(firefoxConnection.wsEndpoint).toContain('/firefox/playwright');

      const webkitConnection = await wsHelper.connectPlaywright('webkit');
      expect(webkitConnection.wsEndpoint).toContain('/webkit/playwright');
    });

    it('should handle missing playwright dependency', async () => {
      const connection = await wsHelper.connectPlaywright('chromium');
      
      // Mock dynamic import failure
      vi.doMock('playwright-core', () => {
        throw new Error('Module not found');
      });

      await expect(connection.connect()).rejects.toThrow('Playwright not found');
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection information', () => {
      const info = wsHelper.getConnectionInfo({
        browser: 'firefox',
        timeout: 15000,
      });

      expect(info).toHaveProperty('puppeteerUrl');
      expect(info).toHaveProperty('playwrightUrl');
      expect(info).toHaveProperty('browser');
      expect(info).toHaveProperty('config');

      expect(info.browser).toBe('firefox');
      expect(info.puppeteerUrl).toContain('/firefox?');
      expect(info.playwrightUrl).toContain('/firefox/playwright?');
    });

    it('should use default browser when not specified', () => {
      const info = wsHelper.getConnectionInfo();
      expect(info.browser).toBe('chrome');
    });
  });
});

describe('WebSocket Utilities', () => {
  describe('isValidWebSocketUrl', () => {
    it('should validate WebSocket URLs', () => {
      expect(isValidWebSocketUrl('ws://localhost:3000')).toBe(true);
      expect(isValidWebSocketUrl('wss://example.com/path')).toBe(true);
      
      expect(isValidWebSocketUrl('http://example.com')).toBe(false);
      expect(isValidWebSocketUrl('https://example.com')).toBe(false);
      expect(isValidWebSocketUrl('invalid-url')).toBe(false);
      expect(isValidWebSocketUrl('')).toBe(false);
    });
  });

  describe('extractBrowserFromUrl', () => {
    it('should extract browser type from WebSocket URL', () => {
      expect(extractBrowserFromUrl('wss://example.com/chrome?token=abc')).toBe('chrome');
      expect(extractBrowserFromUrl('ws://localhost:3000/firefox/playwright')).toBe('firefox');
      expect(extractBrowserFromUrl('wss://example.com/webkit')).toBe('webkit');
      expect(extractBrowserFromUrl('wss://example.com/edge/some/path')).toBe('edge');
    });

    it('should return null for invalid URLs or unsupported browsers', () => {
      expect(extractBrowserFromUrl('wss://example.com/safari')).toBe(null);
      expect(extractBrowserFromUrl('wss://example.com/')).toBe(null);
      expect(extractBrowserFromUrl('invalid-url')).toBe(null);
      expect(extractBrowserFromUrl('')).toBe(null);
    });
  });
});
