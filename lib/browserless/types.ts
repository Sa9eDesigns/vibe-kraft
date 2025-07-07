/**
 * Browserless API Types and Interfaces
 * Based on Browserless.io REST API documentation
 */

export type BrowserType = 'chrome' | 'firefox' | 'webkit' | 'edge';

export interface BrowserlessConfig {
  /** Browserless API token */
  token: string;
  /** Base URL for Browserless instance (e.g., 'https://production-sfo.browserless.io') */
  baseUrl: string;
  /** Default timeout for requests in milliseconds */
  timeout?: number;
  /** Default browser type */
  defaultBrowser?: BrowserType;
}

export interface BrowserlessError {
  message: string;
  code?: string;
  statusCode?: number;
}

// PDF API Types
export interface PDFOptions {
  /** URL to generate PDF from */
  url?: string;
  /** HTML content to generate PDF from */
  html?: string;
  /** PDF format options */
  options?: {
    format?: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'Legal' | 'Letter' | 'Tabloid';
    width?: string;
    height?: string;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    printBackground?: boolean;
    landscape?: boolean;
    scale?: number;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    preferCSSPageSize?: boolean;
  };
  /** Wait conditions */
  waitFor?: {
    timeout?: number;
    selector?: string;
    function?: string;
  };
  /** Viewport settings */
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
  };
  /** Authentication */
  authenticate?: {
    username: string;
    password: string;
  };
  /** Custom headers */
  setExtraHTTPHeaders?: Record<string, string>;
  /** Cookies to set */
  setCookie?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  /** User agent */
  userAgent?: string;
  /** Emulate media type */
  emulateMediaType?: 'screen' | 'print';
  /** Block resources */
  blockAds?: boolean;
  blockImages?: boolean;
  blockFonts?: boolean;
}

// Screenshot API Types
export interface ScreenshotOptions {
  /** URL to take screenshot of */
  url?: string;
  /** HTML content to take screenshot of */
  html?: string;
  /** Screenshot type */
  type?: 'png' | 'jpeg' | 'webp';
  /** Image quality (0-100, only for jpeg/webp) */
  quality?: number;
  /** Full page screenshot */
  fullPage?: boolean;
  /** Clip area */
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Omit background */
  omitBackground?: boolean;
  /** Element selector to screenshot */
  selector?: string;
  /** Wait conditions */
  waitFor?: {
    timeout?: number;
    selector?: string;
    function?: string;
  };
  /** Viewport settings */
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
  };
  /** Authentication */
  authenticate?: {
    username: string;
    password: string;
  };
  /** Custom headers */
  setExtraHTTPHeaders?: Record<string, string>;
  /** Cookies to set */
  setCookie?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  /** User agent */
  userAgent?: string;
  /** Block resources */
  blockAds?: boolean;
  blockImages?: boolean;
  blockFonts?: boolean;
}

// Content API Types
export interface ContentOptions {
  /** URL to extract content from */
  url: string;
  /** Wait conditions */
  waitFor?: {
    timeout?: number;
    selector?: string;
    function?: string;
  };
  /** Viewport settings */
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
  };
  /** Authentication */
  authenticate?: {
    username: string;
    password: string;
  };
  /** Custom headers */
  setExtraHTTPHeaders?: Record<string, string>;
  /** Cookies to set */
  setCookie?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  /** User agent */
  userAgent?: string;
  /** Block resources */
  blockAds?: boolean;
  blockImages?: boolean;
  blockFonts?: boolean;
}

export interface ContentResponse {
  data: string;
}

// Function API Types
export interface FunctionOptions {
  /** JavaScript code to execute */
  code: string;
  /** Context data to pass to the function */
  context?: Record<string, any>;
  /** Detached mode (don't wait for response) */
  detached?: boolean;
  /** Timeout for function execution */
  timeout?: number;
}

export interface FunctionResponse {
  data: any;
  type: string;
}

// WebSocket Connection Types
export interface WebSocketOptions {
  /** Browser type for WebSocket connection */
  browser?: BrowserType;
  /** Playwright specific options */
  playwright?: boolean;
  /** Launch options */
  launch?: Record<string, any>;
  /** Timeout for connection */
  timeout?: number;
}

// Download API Types
export interface DownloadOptions {
  /** URL to download files from */
  url: string;
  /** Wait conditions */
  waitFor?: {
    timeout?: number;
    selector?: string;
    function?: string;
  };
  /** Custom headers */
  setExtraHTTPHeaders?: Record<string, string>;
  /** Cookies to set */
  setCookie?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  /** User agent */
  userAgent?: string;
}

// Export API Types
export interface ExportOptions {
  /** URL to export data from */
  url: string;
  /** Export format */
  format?: 'json' | 'csv' | 'xml';
  /** Wait conditions */
  waitFor?: {
    timeout?: number;
    selector?: string;
    function?: string;
  };
  /** Custom headers */
  setExtraHTTPHeaders?: Record<string, string>;
  /** User agent */
  userAgent?: string;
}

export interface ExportResponse {
  data: any;
  format: string;
}

// Health Check Types
export interface HealthResponse {
  status: 'ok' | 'error';
  version?: string;
  chrome?: string;
  firefox?: string;
  webkit?: string;
  edge?: string;
}

// Stats Types
export interface StatsResponse {
  date: string;
  successful: number;
  error: number;
  queued: number;
  memory: number;
  cpu: number;
}
