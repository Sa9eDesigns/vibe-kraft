# Browserless Library

A comprehensive TypeScript library for interacting with [Browserless.io](https://browserless.io) - a headless browser automation service that provides REST APIs and WebSocket connections for browser automation tasks.

## Features

- 🚀 **Full REST API Support** - PDF generation, screenshots, content extraction, web scraping, performance analysis, and more
- 🔌 **WebSocket Integration** - Seamless Puppeteer and Playwright connections
- 🛡️ **Type Safety** - Complete TypeScript types and validation with Zod
- 🔄 **Error Handling** - Comprehensive error classes and retry mechanisms
- 🌍 **Multi-region Support** - Built-in support for Browserless cloud regions
- 🏠 **Self-hosted Support** - Works with self-hosted Browserless instances
- 🕷️ **Advanced Scraping** - Built-in support for stealth mode and bot detection bypass
- 📊 **Performance Monitoring** - Lighthouse integration and real-time metrics
- 🎯 **Session Management** - Persistent browser sessions for complex workflows
- 📦 **Zero Dependencies** - Minimal footprint with optional peer dependencies

## Installation

```bash
# Using pnpm (recommended)
pnpm add @your-org/browserless

# Using npm
npm install @your-org/browserless

# Using yarn
yarn add @your-org/browserless
```

### Optional Peer Dependencies

For WebSocket integration, install the browser automation library you prefer:

```bash
# For Puppeteer
pnpm add puppeteer-core

# For Playwright
pnpm add playwright-core
```

## Quick Start

### Basic Usage

```typescript
import { createCloudClient } from '@your-org/browserless';

// Create client for Browserless cloud
const client = createCloudClient('your-api-token', 'us');

// Generate PDF
const pdfBuffer = await client.generatePDF({
  url: 'https://example.com',
  options: {
    format: 'A4',
    printBackground: true,
  },
});

// Take screenshot
const screenshotBuffer = await client.takeScreenshot({
  url: 'https://example.com',
  type: 'png',
  fullPage: true,
});
```

### Self-hosted Instance

```typescript
import { BrowserlessClient, createBrowserlessConfig } from '@your-org/browserless';

const config = createBrowserlessConfig(
  'your-api-token',
  'http://localhost:3000'
);

const client = new BrowserlessClient(config);
```

## API Reference

### REST APIs

#### PDF Generation

```typescript
const pdfBuffer = await client.generatePDF({
  url: 'https://example.com',
  options: {
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm',
    },
  },
  waitFor: {
    timeout: 10000,
    selector: '.content-loaded',
  },
  viewport: {
    width: 1920,
    height: 1080,
  },
});
```

#### Screenshots

```typescript
const screenshotBuffer = await client.takeScreenshot({
  url: 'https://example.com',
  type: 'png', // 'png' | 'jpeg' | 'webp'
  quality: 90, // For jpeg/webp
  fullPage: true,
  clip: {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  },
  selector: '.specific-element', // Screenshot specific element
});
```

#### Content Extraction

```typescript
const content = await client.getContent({
  url: 'https://example.com',
  waitFor: {
    timeout: 10000,
    selector: '.main-content',
  },
  blockAds: true,
  blockImages: true,
});

console.log(content.data); // HTML content
```

#### Custom Function Execution

```typescript
const result = await client.executeFunction({
  code: `
    async ({ page, context }) => {
      await page.goto(context.url);
      const title = await page.title();
      const links = await page.$$eval('a', 
        links => links.map(link => ({
          text: link.textContent,
          href: link.href
        }))
      );
      return { title, links };
    }
  `,
  context: {
    url: 'https://example.com',
  },
  timeout: 30000,
});
```

#### Web Scraping

```typescript
const scrapeResult = await client.scrapeData({
  url: 'https://example.com',
  elements: [
    {
      selector: 'h1',
      attribute: 'textContent',
    },
    {
      selector: 'a',
      attribute: 'href',
    },
  ],
  waitFor: {
    timeout: 10000,
    selector: '.content-loaded',
  },
  blockAds: true,
});

console.log(scrapeResult.data); // Scraped elements
```

#### Performance Analysis

```typescript
const performanceResult = await client.analyzePerformance({
  url: 'https://example.com',
  budget: {
    performance: 0.9,
    accessibility: 0.8,
    'best-practices': 0.9,
    seo: 0.8,
  },
});

console.log(performanceResult.lhr.categories); // Lighthouse scores
```

#### Unblock Protected Content

```typescript
const unblockResult = await client.unblockContent({
  url: 'https://protected-site.com',
  stealth: true,
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass',
  },
});

console.log(unblockResult.data); // Unblocked content
```

#### Session Management

```typescript
// Create persistent session
const session = await client.createSession({
  browser: 'chrome',
  timeout: 300000, // 5 minutes
});

// Use session for multiple operations
// ... perform operations ...

// Close session
await client.closeSession(session.id);
```

#### Monitoring and Metrics

```typescript
// Get current metrics
const metrics = await client.getMetrics();
console.log('Sessions:', metrics.sessions.running);
console.log('Memory usage:', metrics.memory.percentage + '%');

// Get server configuration
const config = await client.getServerConfig();
console.log('Available browsers:', config.browsers);
```

### WebSocket Integration

#### Puppeteer

```typescript
import { createWebSocketHelper } from '@your-org/browserless';

const wsHelper = createWebSocketHelper(client);

// Get connection details
const connection = await wsHelper.connectPuppeteer({
  browser: 'chrome',
  puppeteerOptions: {
    headless: true,
    args: ['--no-sandbox'],
  },
});

// Use with Puppeteer
const browser = await connection.connect();
const page = await browser.newPage();
await page.goto('https://example.com');
```

#### Playwright

```typescript
const connection = await wsHelper.connectPlaywright('chromium', {
  browser: 'chrome',
  playwrightOptions: {
    headless: true,
    args: ['--no-sandbox'],
  },
});

// Use with Playwright
const browser = await connection.connect();
const page = await browser.newPage();
await page.goto('https://example.com');
```

## Configuration

### Client Configuration

```typescript
import { BrowserlessClient, createBrowserlessConfig } from '@your-org/browserless';

const config = createBrowserlessConfig(
  'your-api-token',
  'https://production-sfo.browserless.io',
  {
    timeout: 60000, // Request timeout in ms
    defaultBrowser: 'chrome', // Default browser type
  }
);

const client = new BrowserlessClient(config);
```

### Cloud Regions

```typescript
import { createCloudClient, getBrowserlessCloudUrl } from '@your-org/browserless';

// Available regions: 'us', 'eu', 'asia'
const client = createCloudClient('your-token', 'eu');

// Or get URL manually
const euUrl = getBrowserlessCloudUrl('eu');
// Returns: 'https://production-lon.browserless.io'
```

## Error Handling

The library provides specific error types for different scenarios:

```typescript
import {
  BrowserlessError,
  BrowserlessAuthenticationError,
  BrowserlessTimeoutError,
  BrowserlessRateLimitError,
  BrowserlessValidationError,
} from '@your-org/browserless';

try {
  const result = await client.generatePDF(options);
} catch (error) {
  if (error instanceof BrowserlessAuthenticationError) {
    console.error('Invalid API token');
  } else if (error instanceof BrowserlessTimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof BrowserlessRateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof BrowserlessValidationError) {
    console.error('Invalid options:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Utilities

### File Handling

```typescript
import { saveArrayBufferAsFile, getMimeType } from '@your-org/browserless';

// Save PDF in browser
const pdfBuffer = await client.generatePDF(options);
saveArrayBufferAsFile(pdfBuffer, 'document.pdf', getMimeType('pdf'));

// Convert to base64
import { arrayBufferToBase64 } from '@your-org/browserless';
const base64 = arrayBufferToBase64(pdfBuffer);
```

### Retry Logic

```typescript
import { retryWithBackoff } from '@your-org/browserless';

const result = await retryWithBackoff(
  () => client.takeScreenshot(options),
  3, // max retries
  1000 // base delay in ms
);
```

## Examples

See the [examples file](./examples.ts) for comprehensive usage examples including:

- Basic PDF and screenshot generation
- Content extraction and scraping
- Custom function execution
- Puppeteer and Playwright integration
- Error handling and retry logic
- Batch operations
- Self-hosted instance usage

## Browser Support

The library supports all browsers available in Browserless:

- **Chrome** (default) - Most stable and feature-complete
- **Firefox** - Good for specific use cases
- **Webkit** - Safari engine, useful for iOS testing
- **Edge** - Microsoft Edge engine

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

- [Browserless Documentation](https://docs.browserless.io/)
- [GitHub Issues](https://github.com/your-org/browserless/issues)
- [Browserless Support](https://browserless.io/contact)
