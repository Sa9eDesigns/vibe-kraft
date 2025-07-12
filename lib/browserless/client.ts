/**
 * Browserless Client
 * Main client class for interacting with Browserless API
 */

import {
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
  ScrapeOptions,
  ScrapeResponse,
  PerformanceOptions,
  PerformanceResponse,
  UnblockOptions,
  SessionOptions,
  SessionResponse,
  MetricsResponse,
  ConfigResponse,
} from './types';
import {
  BrowserlessConfigSchema,
  PDFOptionsSchema,
  ScreenshotOptionsSchema,
  ContentOptionsSchema,
  FunctionOptionsSchema,
  WebSocketOptionsSchema,
  DownloadOptionsSchema,
  ExportOptionsSchema,
  ScrapeOptionsSchema,
  PerformanceOptionsSchema,
  UnblockOptionsSchema,
  SessionOptionsSchema,
} from './validation';
import {
  BrowserlessError,
  createBrowserlessError,
  BrowserlessValidationError,
} from './errors';

export class BrowserlessClient {
  private config: BrowserlessConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: BrowserlessConfig) {
    // Validate configuration
    const validationResult = BrowserlessConfigSchema.safeParse(config);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid configuration: ${validationResult.error.message}`
      );
    }

    this.config = {
      timeout: 30000,
      defaultBrowser: 'chrome',
      ...validationResult.data,
    };

    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.token}`,
    };
  }

  /**
   * Make HTTP request to Browserless API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    browser?: BrowserType
  ): Promise<T> {
    const url = this.buildUrl(endpoint, browser);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.baseHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw createBrowserlessError(
          errorText || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          undefined,
          response
        );
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('application/pdf') || 
                 contentType?.includes('image/')) {
        return response.arrayBuffer() as T;
      } else {
        return response.text() as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof BrowserlessError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw createBrowserlessError('Request timeout', 408);
        }
        throw createBrowserlessError(error.message, 0);
      }
      
      throw createBrowserlessError('Unknown error occurred', 0);
    }
  }

  /**
   * Build URL for API endpoint
   */
  private buildUrl(endpoint: string, browser?: BrowserType): string {
    const browserType = browser || this.config.defaultBrowser;
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    
    // Handle different endpoint patterns
    if (endpoint.startsWith('/')) {
      return `${baseUrl}${endpoint}`;
    }
    
    return `${baseUrl}/${browserType}/${endpoint}`;
  }

  /**
   * Generate PDF from URL or HTML
   */
  async generatePDF(options: PDFOptions, browser?: BrowserType): Promise<ArrayBuffer> {
    const validationResult = PDFOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid PDF options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ArrayBuffer>('/pdf', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Take screenshot of URL or HTML
   */
  async takeScreenshot(options: ScreenshotOptions, browser?: BrowserType): Promise<ArrayBuffer> {
    const validationResult = ScreenshotOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid screenshot options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ArrayBuffer>('/screenshot', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Extract content from URL
   */
  async getContent(options: ContentOptions, browser?: BrowserType): Promise<ContentResponse> {
    const validationResult = ContentOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid content options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ContentResponse>('/content', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Execute custom JavaScript function
   */
  async executeFunction(options: FunctionOptions, browser?: BrowserType): Promise<FunctionResponse> {
    const validationResult = FunctionOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid function options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<FunctionResponse>('/function', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Download files from URL
   */
  async downloadFiles(options: DownloadOptions, browser?: BrowserType): Promise<ArrayBuffer> {
    const validationResult = DownloadOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid download options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ArrayBuffer>('/download', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Export data from URL
   */
  async exportData(options: ExportOptions, browser?: BrowserType): Promise<ExportResponse> {
    const validationResult = ExportOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid export options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ExportResponse>('/export', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Get WebSocket URL for Puppeteer/Playwright connections
   */
  getWebSocketUrl(options: WebSocketOptions = {}): string {
    const validationResult = WebSocketOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid WebSocket options: ${validationResult.error.message}`
      );
    }

    const { browser = this.config.defaultBrowser, playwright = false } = validationResult.data;
    const wsUrl = this.config.baseUrl.replace(/^https?:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
    
    if (playwright) {
      return `${wsUrl}/${browser}/playwright?token=${this.config.token}`;
    }
    
    return `${wsUrl}/${browser}?token=${this.config.token}`;
  }

  /**
   * Check health status
   */
  async getHealth(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health', {
      method: 'GET',
    });
  }

  /**
   * Get usage statistics
   */
  async getStats(): Promise<StatsResponse> {
    return this.makeRequest<StatsResponse>('/stats', {
      method: 'GET',
    });
  }

  /**
   * Scrape data from URL
   */
  async scrapeData(options: ScrapeOptions, browser?: BrowserType): Promise<ScrapeResponse> {
    const validationResult = ScrapeOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid scrape options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ScrapeResponse>('/scrape', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Run performance analysis (Lighthouse)
   */
  async analyzePerformance(options: PerformanceOptions, browser?: BrowserType): Promise<PerformanceResponse> {
    const validationResult = PerformanceOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid performance options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<PerformanceResponse>('/performance', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Unblock and access protected content
   */
  async unblockContent(options: UnblockOptions, browser?: BrowserType): Promise<ContentResponse> {
    const validationResult = UnblockOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid unblock options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<ContentResponse>('/unblock', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    }, browser);
  }

  /**
   * Create a new browser session
   */
  async createSession(options: SessionOptions = {}): Promise<SessionResponse> {
    const validationResult = SessionOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid session options: ${validationResult.error.message}`
      );
    }

    return this.makeRequest<SessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(validationResult.data),
    });
  }

  /**
   * Get session information
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    return this.makeRequest<SessionResponse>(`/sessions/${sessionId}`, {
      method: 'GET',
    });
  }

  /**
   * Close a browser session
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.makeRequest<void>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get metrics and usage information
   */
  async getMetrics(): Promise<MetricsResponse> {
    return this.makeRequest<MetricsResponse>('/metrics', {
      method: 'GET',
    });
  }

  /**
   * Get server configuration information
   */
  async getServerConfig(): Promise<ConfigResponse> {
    return this.makeRequest<ConfigResponse>('/config', {
      method: 'GET',
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BrowserlessConfig>): void {
    const mergedConfig = { ...this.config, ...newConfig };
    const validationResult = BrowserlessConfigSchema.safeParse(mergedConfig);
    
    if (!validationResult.success) {
      throw new BrowserlessValidationError(
        `Invalid configuration: ${validationResult.error.message}`
      );
    }

    this.config = validationResult.data;
    this.baseHeaders['Authorization'] = `Bearer ${this.config.token}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<BrowserlessConfig> {
    return { ...this.config };
  }
}
