/**
 * Browserless WebSocket Connection Helper
 * For Puppeteer and Playwright integration
 */

import { BrowserlessClient } from './client';
import { WebSocketOptions, BrowserType } from './types';
import { BrowserlessError, createBrowserlessError } from './errors';

export interface PuppeteerConnectionOptions extends WebSocketOptions {
  /** Additional Puppeteer launch options */
  puppeteerOptions?: {
    headless?: boolean;
    devtools?: boolean;
    slowMo?: number;
    args?: string[];
    ignoreDefaultArgs?: boolean | string[];
    handleSIGINT?: boolean;
    handleSIGTERM?: boolean;
    handleSIGHUP?: boolean;
    dumpio?: boolean;
    env?: Record<string, string>;
    pipe?: boolean;
  };
}

export interface PlaywrightConnectionOptions extends WebSocketOptions {
  /** Additional Playwright launch options */
  playwrightOptions?: {
    headless?: boolean;
    devtools?: boolean;
    slowMo?: number;
    args?: string[];
    ignoreDefaultArgs?: boolean | string[];
    proxy?: {
      server: string;
      bypass?: string;
      username?: string;
      password?: string;
    };
    downloadsPath?: string;
    chromiumSandbox?: boolean;
    firefoxUserPrefs?: Record<string, any>;
  };
}

export class BrowserlessWebSocket {
  private client: BrowserlessClient;

  constructor(client: BrowserlessClient) {
    this.client = client;
  }

  /**
   * Get WebSocket URL for Puppeteer connection
   */
  getPuppeteerUrl(options: PuppeteerConnectionOptions = {}): string {
    const { browser, timeout, puppeteerOptions, ...wsOptions } = options;
    
    const baseUrl = this.client.getWebSocketUrl({
      browser,
      timeout,
      playwright: false,
      ...wsOptions,
    });

    // Add Puppeteer-specific query parameters if provided
    if (puppeteerOptions && Object.keys(puppeteerOptions).length > 0) {
      const url = new URL(baseUrl);
      
      // Add launch options as query parameters
      if (puppeteerOptions.headless !== undefined) {
        url.searchParams.set('headless', String(puppeteerOptions.headless));
      }
      if (puppeteerOptions.devtools !== undefined) {
        url.searchParams.set('devtools', String(puppeteerOptions.devtools));
      }
      if (puppeteerOptions.slowMo !== undefined) {
        url.searchParams.set('slowMo', String(puppeteerOptions.slowMo));
      }
      if (puppeteerOptions.args) {
        url.searchParams.set('args', JSON.stringify(puppeteerOptions.args));
      }
      if (puppeteerOptions.ignoreDefaultArgs !== undefined) {
        url.searchParams.set('ignoreDefaultArgs', JSON.stringify(puppeteerOptions.ignoreDefaultArgs));
      }
      
      return url.toString();
    }

    return baseUrl;
  }

  /**
   * Get WebSocket URL for Playwright connection
   */
  getPlaywrightUrl(options: PlaywrightConnectionOptions = {}): string {
    const { browser, timeout, playwrightOptions, ...wsOptions } = options;
    
    const baseUrl = this.client.getWebSocketUrl({
      browser,
      timeout,
      playwright: true,
      ...wsOptions,
    });

    // Add Playwright-specific query parameters if provided
    if (playwrightOptions && Object.keys(playwrightOptions).length > 0) {
      const url = new URL(baseUrl);
      
      // Add launch options as query parameters
      if (playwrightOptions.headless !== undefined) {
        url.searchParams.set('headless', String(playwrightOptions.headless));
      }
      if (playwrightOptions.devtools !== undefined) {
        url.searchParams.set('devtools', String(playwrightOptions.devtools));
      }
      if (playwrightOptions.slowMo !== undefined) {
        url.searchParams.set('slowMo', String(playwrightOptions.slowMo));
      }
      if (playwrightOptions.args) {
        url.searchParams.set('args', JSON.stringify(playwrightOptions.args));
      }
      if (playwrightOptions.proxy) {
        url.searchParams.set('proxy', JSON.stringify(playwrightOptions.proxy));
      }
      if (playwrightOptions.chromiumSandbox !== undefined) {
        url.searchParams.set('chromiumSandbox', String(playwrightOptions.chromiumSandbox));
      }
      
      return url.toString();
    }

    return baseUrl;
  }

  /**
   * Create Puppeteer connection helper
   */
  async connectPuppeteer(options: PuppeteerConnectionOptions = {}): Promise<{
    browserWSEndpoint: string;
    connect: () => Promise<any>;
  }> {
    const browserWSEndpoint = this.getPuppeteerUrl(options);
    
    return {
      browserWSEndpoint,
      connect: async () => {
        // This would require puppeteer to be installed
        // Return connection helper that can be used with puppeteer.connect()
        try {
          // Dynamic import to avoid requiring puppeteer as a dependency
          const puppeteer = await import('puppeteer-core');
          return await puppeteer.connect({ browserWSEndpoint });
        } catch (error) {
          throw new BrowserlessError(
            'Puppeteer not found. Please install puppeteer or puppeteer-core to use this method.',
            0,
            'PUPPETEER_NOT_FOUND'
          );
        }
      },
    };
  }

  /**
   * Create Playwright connection helper
   */
  async connectPlaywright(
    browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium',
    options: PlaywrightConnectionOptions = {}
  ): Promise<{
    wsEndpoint: string;
    connect: () => Promise<any>;
  }> {
    // Map browser types
    const browserMap: Record<string, BrowserType> = {
      chromium: 'chrome',
      firefox: 'firefox',
      webkit: 'webkit',
    };

    const wsEndpoint = this.getPlaywrightUrl({
      ...options,
      browser: browserMap[browserType] || 'chrome',
    });
    
    return {
      wsEndpoint,
      connect: async () => {
        try {
          // Dynamic import to avoid requiring playwright as a dependency
          const playwright = await import('playwright-core');
          return await playwright[browserType].connect(wsEndpoint);
        } catch (error) {
          throw new BrowserlessError(
            'Playwright not found. Please install playwright or playwright-core to use this method.',
            0,
            'PLAYWRIGHT_NOT_FOUND'
          );
        }
      },
    };
  }

  /**
   * Test WebSocket connection
   */
  async testConnection(options: WebSocketOptions = {}): Promise<boolean> {
    const wsUrl = this.client.getWebSocketUrl(options);
    
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 10000;
      let ws: WebSocket;
      
      const timeoutId = setTimeout(() => {
        if (ws) {
          ws.close();
        }
        reject(createBrowserlessError('WebSocket connection timeout', 408));
      }, timeout);

      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          clearTimeout(timeoutId);
          ws.close();
          resolve(true);
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeoutId);
          reject(createBrowserlessError('WebSocket connection failed', 0));
        };
        
        ws.onclose = (event) => {
          clearTimeout(timeoutId);
          if (event.code !== 1000) {
            reject(createBrowserlessError(`WebSocket closed with code ${event.code}`, event.code));
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        reject(createBrowserlessError('Failed to create WebSocket connection', 0));
      }
    });
  }

  /**
   * Get connection info for debugging
   */
  getConnectionInfo(options: WebSocketOptions = {}): {
    puppeteerUrl: string;
    playwrightUrl: string;
    browser: BrowserType;
    config: any;
  } {
    const browser = options.browser || this.client.getConfig().defaultBrowser || 'chrome';
    
    return {
      puppeteerUrl: this.getPuppeteerUrl(options),
      playwrightUrl: this.getPlaywrightUrl(options),
      browser,
      config: this.client.getConfig(),
    };
  }
}

/**
 * Helper function to create WebSocket instance
 */
export function createWebSocketHelper(client: BrowserlessClient): BrowserlessWebSocket {
  return new BrowserlessWebSocket(client);
}

/**
 * Utility function to validate WebSocket URL format
 */
export function isValidWebSocketUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:';
  } catch {
    return false;
  }
}

/**
 * Extract browser type from WebSocket URL
 */
export function extractBrowserFromUrl(url: string): BrowserType | null {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    
    const browserSegment = pathSegments[0];
    if (['chrome', 'firefox', 'webkit', 'edge'].includes(browserSegment)) {
      return browserSegment as BrowserType;
    }
    
    return null;
  } catch {
    return null;
  }
}
