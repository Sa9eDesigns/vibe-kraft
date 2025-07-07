/**
 * Browserless Library
 * Main entry point for the Browserless API client
 */

import { BrowserlessClient } from './client';
import { BrowserlessConfig } from './types';
import { createBrowserlessConfig, getBrowserlessCloudUrl } from './utils';

// Core exports
export { BrowserlessClient } from './client';
export { BrowserlessWebSocket, createWebSocketHelper } from './websocket';

// Type exports
export type {
  BrowserlessConfig,
  BrowserType,
  PDFOptions,
  ScreenshotOptions,
  ContentOptions,
  ContentResponse,
  FunctionOptions,
  FunctionResponse,
  WebSocketOptions,
  DownloadOptions,
  ExportOptions,
  ExportResponse,
  HealthResponse,
  StatsResponse,
  BrowserlessError as BrowserlessErrorType,
} from './types';

export type {
  PuppeteerConnectionOptions,
  PlaywrightConnectionOptions,
} from './websocket';

// Error exports
export {
  BrowserlessError,
  BrowserlessAuthenticationError,
  BrowserlessTimeoutError,
  BrowserlessRateLimitError,
  BrowserlessValidationError,
  BrowserlessNetworkError,
  BrowserlessServerError,
  createBrowserlessError,
} from './errors';

// Validation exports
export {
  BrowserlessConfigSchema,
  PDFOptionsSchema,
  ScreenshotOptionsSchema,
  ContentOptionsSchema,
  FunctionOptionsSchema,
  WebSocketOptionsSchema,
  DownloadOptionsSchema,
  ExportOptionsSchema,
} from './validation';

export type {
  BrowserlessConfigInput,
  PDFOptionsInput,
  ScreenshotOptionsInput,
  ContentOptionsInput,
  FunctionOptionsInput,
  WebSocketOptionsInput,
  DownloadOptionsInput,
  ExportOptionsInput,
} from './validation';

// Utility exports
export {
  createBrowserlessConfig,
  getBrowserlessCloudUrl,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  saveArrayBufferAsFile,
  getMimeType,
  isValidUrl,
  buildQueryString,
  retryWithBackoff,
  isSupportedBrowser,
  formatBytes,
  generateId,
  deepMerge,
  wait,
  createTimeoutPromise,
} from './utils';

export {
  isValidWebSocketUrl,
  extractBrowserFromUrl,
} from './websocket';

/**
 * Create a new Browserless client instance
 */
export function createBrowserlessClient(config: BrowserlessConfig): BrowserlessClient {
  return new BrowserlessClient(config);
}

/**
 * Create a Browserless client with cloud configuration
 */
export function createCloudClient(
  token: string,
  region: 'us' | 'eu' | 'asia' = 'us',
  options: Partial<BrowserlessConfig> = {}
): BrowserlessClient {
  const baseUrl = getBrowserlessCloudUrl(region);
  const config = createBrowserlessConfig(token, baseUrl, options);
  return new BrowserlessClient(config);
}

/**
 * Default export - BrowserlessClient class
 */
export default BrowserlessClient;
