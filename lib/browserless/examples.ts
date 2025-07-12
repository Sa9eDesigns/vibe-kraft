/**
 * Browserless Usage Examples
 * Common use cases and example code for the Browserless library
 */

import {
  BrowserlessClient,
  createCloudClient,
  createBrowserlessConfig,
  BrowserlessWebSocket,
  createWebSocketHelper,
  saveArrayBufferAsFile,
  getMimeType,
} from './index';

/**
 * Example 1: Basic PDF Generation
 */
export async function generatePDFExample() {
  // Create client with cloud configuration
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Generate PDF from URL
    const pdfBuffer = await client.generatePDF({
      url: 'https://example.com',
      options: {
        format: 'A4',
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
    });

    // Save PDF file (browser environment)
    if (typeof window !== 'undefined') {
      saveArrayBufferAsFile(pdfBuffer, 'example.pdf', getMimeType('pdf'));
    }

    console.log('PDF generated successfully');
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}

/**
 * Example 2: Screenshot Capture
 */
export async function takeScreenshotExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Take full page screenshot
    const screenshotBuffer = await client.takeScreenshot({
      url: 'https://example.com',
      type: 'png',
      fullPage: true,
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      },
      waitFor: {
        timeout: 5000,
        selector: 'img',
      },
    });

    // Save screenshot
    if (typeof window !== 'undefined') {
      saveArrayBufferAsFile(screenshotBuffer, 'screenshot.png', getMimeType('png'));
    }

    console.log('Screenshot captured successfully');
    return screenshotBuffer;
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
}

/**
 * Example 3: Content Extraction
 */
export async function extractContentExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Extract page content
    const content = await client.getContent({
      url: 'https://example.com',
      waitFor: {
        timeout: 10000,
        selector: '.main-content',
      },
      blockAds: true,
      blockImages: true,
    });

    console.log('Content extracted:', content.data);
    return content;
  } catch (error) {
    console.error('Content extraction failed:', error);
    throw error;
  }
}

/**
 * Example 4: Custom Function Execution
 */
export async function executeFunctionExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Execute custom JavaScript
    const result = await client.executeFunction({
      code: `
        async ({ page, context }) => {
          await page.goto(context.url);
          await page.waitForSelector('h1');
          
          const title = await page.title();
          const headings = await page.$$eval('h1, h2, h3', 
            elements => elements.map(el => ({
              tag: el.tagName,
              text: el.textContent.trim()
            }))
          );
          
          return {
            title,
            headings,
            timestamp: new Date().toISOString()
          };
        }
      `,
      context: {
        url: 'https://example.com',
      },
      timeout: 30000,
    });

    console.log('Function result:', result.data);
    return result;
  } catch (error) {
    console.error('Function execution failed:', error);
    throw error;
  }
}

/**
 * Example 5: Puppeteer Integration
 */
export async function puppeteerIntegrationExample() {
  const client = createCloudClient('your-api-token', 'us');
  const wsHelper = createWebSocketHelper(client);

  try {
    // Get Puppeteer connection
    const connection = await wsHelper.connectPuppeteer({
      browser: 'chrome',
      puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    // Connect with Puppeteer
    const browser = await connection.connect();
    const page = await browser.newPage();

    // Use Puppeteer normally
    await page.goto('https://example.com');
    await page.waitForSelector('h1');
    
    const title = await page.title();
    console.log('Page title:', title);

    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    
    await browser.close();
    
    return { title, screenshot };
  } catch (error) {
    console.error('Puppeteer integration failed:', error);
    throw error;
  }
}

/**
 * Example 6: Playwright Integration
 */
export async function playwrightIntegrationExample() {
  const client = createCloudClient('your-api-token', 'us');
  const wsHelper = createWebSocketHelper(client);

  try {
    // Get Playwright connection
    const connection = await wsHelper.connectPlaywright('chromium', {
      browser: 'chrome',
      playwrightOptions: {
        headless: true,
        args: ['--no-sandbox'],
      },
    });

    // Connect with Playwright
    const browser = await connection.connect();
    const page = await browser.newPage();

    // Use Playwright normally
    await page.goto('https://example.com');
    await page.waitForSelector('h1');
    
    const title = await page.title();
    console.log('Page title:', title);

    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    
    await browser.close();
    
    return { title, screenshot };
  } catch (error) {
    console.error('Playwright integration failed:', error);
    throw error;
  }
}

/**
 * Example 7: Self-hosted Browserless
 */
export async function selfHostedExample() {
  // Create client for self-hosted instance
  const config = createBrowserlessConfig(
    'your-api-token',
    'http://localhost:3000', // Your self-hosted instance
    {
      timeout: 60000,
      defaultBrowser: 'chrome',
    }
  );
  
  const client = new BrowserlessClient(config);

  try {
    // Check health
    const health = await client.getHealth();
    console.log('Health status:', health);

    // Generate PDF
    const pdfBuffer = await client.generatePDF({
      html: '<h1>Hello from self-hosted Browserless!</h1>',
      options: {
        format: 'A4',
        printBackground: true,
      },
    });

    console.log('PDF generated from self-hosted instance');
    return pdfBuffer;
  } catch (error) {
    console.error('Self-hosted example failed:', error);
    throw error;
  }
}

/**
 * Example 8: Error Handling and Retry
 */
export async function errorHandlingExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Attempt operation with retry logic
    const result = await retryOperation(async () => {
      return await client.takeScreenshot({
        url: 'https://example.com',
        type: 'png',
        waitFor: {
          timeout: 5000,
        },
      });
    }, 3);

    console.log('Operation succeeded after retry');
    return result;
  } catch (error) {
    console.error('Operation failed after all retries:', error);
    throw error;
  }
}

/**
 * Helper function for retry logic
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError!;
}

/**
 * Example 9: Web Scraping
 */
export async function webScrapingExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Scrape specific elements from a page
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
        {
          selector: '.price',
          attribute: 'textContent',
        },
      ],
      waitFor: {
        timeout: 10000,
        selector: '.content-loaded',
      },
      blockAds: true,
    });

    console.log('Scraped data:', scrapeResult.data);
    return scrapeResult;
  } catch (error) {
    console.error('Web scraping failed:', error);
    throw error;
  }
}

/**
 * Example 10: Performance Analysis
 */
export async function performanceAnalysisExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Run Lighthouse performance analysis
    const performanceResult = await client.analyzePerformance({
      url: 'https://example.com',
      budget: {
        performance: 0.9,
        accessibility: 0.8,
        'best-practices': 0.9,
        seo: 0.8,
      },
      viewport: {
        width: 1920,
        height: 1080,
        isMobile: false,
      },
    });

    console.log('Performance scores:', performanceResult.lhr.categories);
    return performanceResult;
  } catch (error) {
    console.error('Performance analysis failed:', error);
    throw error;
  }
}

/**
 * Example 11: Unblock Protected Content
 */
export async function unblockContentExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Access content that might be blocked by anti-bot measures
    const unblockResult = await client.unblockContent({
      url: 'https://protected-site.com',
      stealth: true,
      proxy: {
        server: 'http://proxy.example.com:8080',
        username: 'proxy-user',
        password: 'proxy-pass',
      },
      waitFor: {
        timeout: 15000,
        selector: '.protected-content',
      },
    });

    console.log('Unblocked content:', unblockResult.data);
    return unblockResult;
  } catch (error) {
    console.error('Content unblocking failed:', error);
    throw error;
  }
}

/**
 * Example 12: Session Management
 */
export async function sessionManagementExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Create a persistent browser session
    const session = await client.createSession({
      browser: 'chrome',
      timeout: 300000, // 5 minutes
      launch: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    console.log('Session created:', session.id);

    // Use the session for multiple operations
    // ... perform operations using the session ...

    // Get session info
    const sessionInfo = await client.getSession(session.id);
    console.log('Session status:', sessionInfo.status);

    // Close the session when done
    await client.closeSession(session.id);
    console.log('Session closed');

    return session;
  } catch (error) {
    console.error('Session management failed:', error);
    throw error;
  }
}

/**
 * Example 13: Monitoring and Metrics
 */
export async function monitoringExample() {
  const client = createCloudClient('your-api-token', 'us');

  try {
    // Get current metrics
    const metrics = await client.getMetrics();
    console.log('Current metrics:', {
      sessions: metrics.sessions,
      memory: `${metrics.memory.percentage}% used`,
      cpu: `${metrics.cpu.usage}% usage`,
      requestRate: `${metrics.requests.rate} req/min`,
    });

    // Get server configuration
    const config = await client.getServerConfig();
    console.log('Server config:', {
      version: config.version,
      browsers: config.browsers,
      limits: config.limits,
    });

    // Get health status
    const health = await client.getHealth();
    console.log('Health status:', health.status);

    return { metrics, config, health };
  } catch (error) {
    console.error('Monitoring failed:', error);
    throw error;
  }
}

/**
 * Example 14: Batch Operations
 */
export async function batchOperationsExample() {
  const client = createCloudClient('your-api-token', 'us');

  const urls = [
    'https://example.com',
    'https://google.com',
    'https://github.com',
  ];

  try {
    // Process multiple URLs concurrently
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const screenshot = await client.takeScreenshot({
          url,
          type: 'png',
          viewport: { width: 1200, height: 800 },
        });

        return { url, screenshot };
      })
    );

    // Process results
    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    console.log(`Batch completed: ${successful.length} successful, ${failed.length} failed`);

    return { successful, failed };
  } catch (error) {
    console.error('Batch operations failed:', error);
    throw error;
  }
}
