/**
 * Browserless API Validation Schemas
 */

import * as z from 'zod';

// Base schemas
const ViewportSchema = z.object({
  width: z.number().min(1).max(4096),
  height: z.number().min(1).max(4096),
  deviceScaleFactor: z.number().min(0.1).max(3).optional(),
  isMobile: z.boolean().optional(),
  hasTouch: z.boolean().optional(),
  isLandscape: z.boolean().optional(),
});

const AuthenticateSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const CookieSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  domain: z.string().optional(),
  path: z.string().optional(),
  expires: z.number().optional(),
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.enum(['Strict', 'Lax', 'None']).optional(),
});

const WaitForSchema = z.object({
  timeout: z.number().min(0).max(300000).optional(), // Max 5 minutes
  selector: z.string().optional(),
  function: z.string().optional(),
});

const ClipSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
});

const MarginSchema = z.object({
  top: z.string().optional(),
  right: z.string().optional(),
  bottom: z.string().optional(),
  left: z.string().optional(),
});

// Configuration schema
export const BrowserlessConfigSchema = z.object({
  token: z.string().min(1, 'API token is required'),
  baseUrl: z.string().url('Valid base URL is required'),
  timeout: z.number().min(1000).max(300000).optional(), // 1s to 5min
  defaultBrowser: z.enum(['chrome', 'firefox', 'webkit', 'edge']).optional(),
});

// PDF API schema
export const PDFOptionsSchema = z.object({
  url: z.string().url().optional(),
  html: z.string().optional(),
  options: z.object({
    format: z.enum(['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Tabloid']).optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    margin: MarginSchema.optional(),
    printBackground: z.boolean().optional(),
    landscape: z.boolean().optional(),
    scale: z.number().min(0.1).max(2).optional(),
    displayHeaderFooter: z.boolean().optional(),
    headerTemplate: z.string().optional(),
    footerTemplate: z.string().optional(),
    preferCSSPageSize: z.boolean().optional(),
  }).optional(),
  waitFor: WaitForSchema.optional(),
  viewport: ViewportSchema.optional(),
  authenticate: AuthenticateSchema.optional(),
  setExtraHTTPHeaders: z.record(z.string()).optional(),
  setCookie: z.array(CookieSchema).optional(),
  userAgent: z.string().optional(),
  emulateMediaType: z.enum(['screen', 'print']).optional(),
  blockAds: z.boolean().optional(),
  blockImages: z.boolean().optional(),
  blockFonts: z.boolean().optional(),
}).refine(
  (data) => data.url || data.html,
  {
    message: "Either 'url' or 'html' must be provided",
    path: ['url'],
  }
);

// Screenshot API schema
export const ScreenshotOptionsSchema = z.object({
  url: z.string().url().optional(),
  html: z.string().optional(),
  type: z.enum(['png', 'jpeg', 'webp']).optional(),
  quality: z.number().min(0).max(100).optional(),
  fullPage: z.boolean().optional(),
  clip: ClipSchema.optional(),
  omitBackground: z.boolean().optional(),
  selector: z.string().optional(),
  waitFor: WaitForSchema.optional(),
  viewport: ViewportSchema.optional(),
  authenticate: AuthenticateSchema.optional(),
  setExtraHTTPHeaders: z.record(z.string()).optional(),
  setCookie: z.array(CookieSchema).optional(),
  userAgent: z.string().optional(),
  blockAds: z.boolean().optional(),
  blockImages: z.boolean().optional(),
  blockFonts: z.boolean().optional(),
}).refine(
  (data) => data.url || data.html,
  {
    message: "Either 'url' or 'html' must be provided",
    path: ['url'],
  }
);

// Content API schema
export const ContentOptionsSchema = z.object({
  url: z.string().url('Valid URL is required'),
  waitFor: WaitForSchema.optional(),
  viewport: ViewportSchema.optional(),
  authenticate: AuthenticateSchema.optional(),
  setExtraHTTPHeaders: z.record(z.string()).optional(),
  setCookie: z.array(CookieSchema).optional(),
  userAgent: z.string().optional(),
  blockAds: z.boolean().optional(),
  blockImages: z.boolean().optional(),
  blockFonts: z.boolean().optional(),
});

// Function API schema
export const FunctionOptionsSchema = z.object({
  code: z.string().min(1, 'JavaScript code is required'),
  context: z.record(z.any()).optional(),
  detached: z.boolean().optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

// WebSocket options schema
export const WebSocketOptionsSchema = z.object({
  browser: z.enum(['chrome', 'firefox', 'webkit', 'edge']).optional(),
  playwright: z.boolean().optional(),
  launch: z.record(z.any()).optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

// Download API schema
export const DownloadOptionsSchema = z.object({
  url: z.string().url('Valid URL is required'),
  waitFor: WaitForSchema.optional(),
  setExtraHTTPHeaders: z.record(z.string()).optional(),
  setCookie: z.array(CookieSchema).optional(),
  userAgent: z.string().optional(),
});

// Export API schema
export const ExportOptionsSchema = z.object({
  url: z.string().url('Valid URL is required'),
  format: z.enum(['json', 'csv', 'xml']).optional(),
  waitFor: WaitForSchema.optional(),
  setExtraHTTPHeaders: z.record(z.string()).optional(),
  userAgent: z.string().optional(),
});

// Type exports for use in the client
export type BrowserlessConfigInput = z.input<typeof BrowserlessConfigSchema>;
export type PDFOptionsInput = z.input<typeof PDFOptionsSchema>;
export type ScreenshotOptionsInput = z.input<typeof ScreenshotOptionsSchema>;
export type ContentOptionsInput = z.input<typeof ContentOptionsSchema>;
export type FunctionOptionsInput = z.input<typeof FunctionOptionsSchema>;
export type WebSocketOptionsInput = z.input<typeof WebSocketOptionsSchema>;
export type DownloadOptionsInput = z.input<typeof DownloadOptionsSchema>;
export type ExportOptionsInput = z.input<typeof ExportOptionsSchema>;
