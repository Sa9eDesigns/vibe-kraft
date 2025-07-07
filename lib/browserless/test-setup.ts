/**
 * Test setup for Browserless library
 */

import { vi } from 'vitest';

// Mock global fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock WebSocket if not available
if (!global.WebSocket) {
  global.WebSocket = vi.fn().mockImplementation(() => ({
    onopen: null,
    onerror: null,
    onclose: null,
    onmessage: null,
    close: vi.fn(),
    send: vi.fn(),
    readyState: 1,
  }));
}

// Mock AbortController if not available
if (!global.AbortController) {
  global.AbortController = vi.fn().mockImplementation(() => ({
    signal: { aborted: false },
    abort: vi.fn(),
  }));
}

// Mock URL if not available
if (!global.URL) {
  global.URL = class URL {
    protocol: string;
    hostname: string;
    pathname: string;
    searchParams: URLSearchParams;

    constructor(url: string) {
      const parts = url.split('://');
      this.protocol = parts[0] + ':';
      const remaining = parts[1] || '';
      const pathIndex = remaining.indexOf('/');
      
      if (pathIndex === -1) {
        this.hostname = remaining;
        this.pathname = '/';
      } else {
        this.hostname = remaining.substring(0, pathIndex);
        this.pathname = remaining.substring(pathIndex);
      }
      
      this.searchParams = new URLSearchParams();
    }

    toString() {
      return `${this.protocol}//${this.hostname}${this.pathname}`;
    }
  } as any;
}

// Mock URLSearchParams if not available
if (!global.URLSearchParams) {
  global.URLSearchParams = class URLSearchParams {
    private params: Map<string, string> = new Map();

    append(name: string, value: string) {
      this.params.set(name, value);
    }

    set(name: string, value: string) {
      this.params.set(name, value);
    }

    get(name: string) {
      return this.params.get(name) || null;
    }

    toString() {
      const pairs: string[] = [];
      this.params.forEach((value, key) => {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
      return pairs.join('&');
    }
  } as any;
}

// Mock btoa and atob for base64 operations
if (!global.btoa) {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

if (!global.atob) {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// Mock document for browser-specific functions
if (!global.document) {
  global.document = {
    createElement: vi.fn().mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  } as any;
}

// Mock window for browser detection
if (!global.window) {
  global.window = {} as any;
}
