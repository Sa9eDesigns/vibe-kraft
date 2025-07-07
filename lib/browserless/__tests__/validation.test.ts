/**
 * Browserless Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  BrowserlessConfigSchema,
  PDFOptionsSchema,
  ScreenshotOptionsSchema,
  ContentOptionsSchema,
  FunctionOptionsSchema,
  WebSocketOptionsSchema,
  DownloadOptionsSchema,
  ExportOptionsSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('BrowserlessConfigSchema', () => {
    it('should validate valid config', () => {
      const validConfig = {
        token: 'test-token',
        baseUrl: 'https://example.com',
        timeout: 30000,
        defaultBrowser: 'chrome' as const,
      };

      const result = BrowserlessConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid config', () => {
      const invalidConfig = {
        token: '', // Empty token
        baseUrl: 'invalid-url', // Invalid URL
        timeout: 500, // Too short timeout
      };

      const result = BrowserlessConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should apply defaults', () => {
      const minimalConfig = {
        token: 'test-token',
        baseUrl: 'https://example.com',
      };

      const result = BrowserlessConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('PDFOptionsSchema', () => {
    it('should validate PDF options with URL', () => {
      const validOptions = {
        url: 'https://example.com',
        options: {
          format: 'A4' as const,
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm',
          },
        },
        viewport: {
          width: 1920,
          height: 1080,
        },
      };

      const result = PDFOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should validate PDF options with HTML', () => {
      const validOptions = {
        html: '<h1>Test</h1>',
        options: {
          format: 'Letter' as const,
          landscape: true,
        },
      };

      const result = PDFOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should reject options without URL or HTML', () => {
      const invalidOptions = {
        options: {
          format: 'A4' as const,
        },
      };

      const result = PDFOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });

    it('should validate viewport dimensions', () => {
      const invalidOptions = {
        url: 'https://example.com',
        viewport: {
          width: 0, // Invalid width
          height: 1080,
        },
      };

      const result = PDFOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });

    it('should validate scale range', () => {
      const invalidOptions = {
        url: 'https://example.com',
        options: {
          scale: 3, // Too high scale
        },
      };

      const result = PDFOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('ScreenshotOptionsSchema', () => {
    it('should validate screenshot options', () => {
      const validOptions = {
        url: 'https://example.com',
        type: 'png' as const,
        quality: 90,
        fullPage: true,
        clip: {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        },
        viewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 2,
        },
      };

      const result = ScreenshotOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should validate quality range', () => {
      const invalidOptions = {
        url: 'https://example.com',
        type: 'jpeg' as const,
        quality: 150, // Invalid quality
      };

      const result = ScreenshotOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });

    it('should validate clip dimensions', () => {
      const invalidOptions = {
        url: 'https://example.com',
        clip: {
          x: 0,
          y: 0,
          width: 0, // Invalid width
          height: 600,
        },
      };

      const result = ScreenshotOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('ContentOptionsSchema', () => {
    it('should validate content options', () => {
      const validOptions = {
        url: 'https://example.com',
        waitFor: {
          timeout: 10000,
          selector: '.content',
        },
        blockAds: true,
        blockImages: true,
      };

      const result = ContentOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should require URL', () => {
      const invalidOptions = {
        blockAds: true,
      };

      const result = ContentOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });

    it('should validate timeout range', () => {
      const invalidOptions = {
        url: 'https://example.com',
        waitFor: {
          timeout: 400000, // Too long timeout
        },
      };

      const result = ContentOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('FunctionOptionsSchema', () => {
    it('should validate function options', () => {
      const validOptions = {
        code: 'async ({ page }) => { return await page.title(); }',
        context: {
          url: 'https://example.com',
          data: { test: true },
        },
        timeout: 30000,
      };

      const result = FunctionOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should require code', () => {
      const invalidOptions = {
        context: {},
      };

      const result = FunctionOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });

    it('should reject empty code', () => {
      const invalidOptions = {
        code: '',
      };

      const result = FunctionOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('WebSocketOptionsSchema', () => {
    it('should validate WebSocket options', () => {
      const validOptions = {
        browser: 'firefox' as const,
        playwright: true,
        launch: {
          headless: true,
          args: ['--no-sandbox'],
        },
        timeout: 15000,
      };

      const result = WebSocketOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should validate browser type', () => {
      const invalidOptions = {
        browser: 'safari' as any, // Invalid browser
      };

      const result = WebSocketOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('DownloadOptionsSchema', () => {
    it('should validate download options', () => {
      const validOptions = {
        url: 'https://example.com/download',
        waitFor: {
          timeout: 20000,
        },
        userAgent: 'Custom User Agent',
      };

      const result = DownloadOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should require URL', () => {
      const invalidOptions = {
        userAgent: 'Custom User Agent',
      };

      const result = DownloadOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportOptionsSchema', () => {
    it('should validate export options', () => {
      const validOptions = {
        url: 'https://example.com/data',
        format: 'json' as const,
        waitFor: {
          selector: '.data-loaded',
        },
      };

      const result = ExportOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should validate format', () => {
      const invalidOptions = {
        url: 'https://example.com',
        format: 'yaml' as any, // Invalid format
      };

      const result = ExportOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('Cookie validation', () => {
    it('should validate cookies in PDF options', () => {
      const validOptions = {
        url: 'https://example.com',
        setCookie: [
          {
            name: 'session',
            value: 'abc123',
            domain: 'example.com',
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Strict' as const,
          },
        ],
      };

      const result = PDFOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should reject invalid cookie sameSite', () => {
      const invalidOptions = {
        url: 'https://example.com',
        setCookie: [
          {
            name: 'session',
            value: 'abc123',
            sameSite: 'Invalid' as any,
          },
        ],
      };

      const result = PDFOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });
});
